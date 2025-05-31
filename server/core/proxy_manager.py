from typing import Dict, Optional, Union, List, Tuple, Any
import aiohttp
import asyncio
import logging
import uuid
from datetime import datetime
from camoufox.utils import Proxy, public_ip, valid_ipv4, valid_ipv6
from camoufox.locale import geoip_allowed, get_geolocation

# Configure logger
logger = logging.getLogger("camoufox.proxies")

class ProxyManager:
    def __init__(self):
        self.proxy_pool: Dict[str, dict] = {}
        self.profile_proxies: Dict[str, str] = {}  # Maps profile_id to proxy_id
        self.proxy_metrics: Dict[str, dict] = {}
        self.geolocation_cache: Dict[str, dict] = {}
        logger.info("ProxyManager initialized")

    async def add_proxy(
        self,
        proxy_id: str,
        proxy_config: dict,
        verify_geolocation: bool = True
    ) -> None:
        """
        Add proxy to pool with enhanced verification and geolocation support

        Args:
            proxy_id: Unique identifier for the proxy
            proxy_config: Proxy configuration dictionary
            verify_geolocation: Whether to verify and cache geolocation data
        """
        # Create proxy string
        auth_part = ""
        if proxy_config.get('username') and proxy_config.get('password'):
            auth_part = f"{proxy_config['username']}:{proxy_config['password']}@"

        host = proxy_config['host']
        port = proxy_config['port']

        # Create proxy URL in the format expected by Camoufox
        proxy_url = f"{auth_part}{host}:{port}"

        # Create Proxy object
        try:
            proxy_obj = Proxy(proxy_url)
            logger.info(f"Created Proxy object: {proxy_obj}")
        except Exception as e:
            logger.error(f"Error creating Proxy object: {e}")
            # Fallback to a simple string
            proxy_obj = proxy_url
            logger.info(f"Using simple string as proxy: {proxy_obj}")

        proxy_info = {
            'config': proxy_config,
            'status': 'pending',
            'last_check': asyncio.get_event_loop().time(),
            'failure_count': 0,
            'success_count': 0,
            'average_response_time': 0,
            'proxy_string': proxy_obj.as_string()
        }

        if verify_geolocation and geoip_allowed():
            try:
                ip = await self._get_public_ip(proxy_obj)
                if ip:
                    geolocation = get_geolocation(ip)
                    proxy_info['geolocation'] = geolocation.as_config()
                    proxy_info['ip'] = ip
                    proxy_info['status'] = 'active'
            except Exception as e:
                proxy_info['status'] = 'error'
                proxy_info['last_error'] = str(e)

        self.proxy_pool[proxy_id] = proxy_info

    async def get_proxy(
        self,
        profile_id: str,
        required_country: Optional[str] = None,
        assign_if_missing: bool = True
    ) -> Optional[Dict[str, Union[str, dict]]]:
        """
        Get dedicated proxy for profile

        Args:
            profile_id: Profile identifier
            required_country: ISO country code if geolocation requirement exists
            assign_if_missing: Whether to assign a new proxy if none is assigned
        """
        # Check if profile already has an assigned proxy
        if profile_id in self.profile_proxies:
            proxy_id = self.profile_proxies[profile_id]
            if proxy_id in self.proxy_pool and self.proxy_pool[proxy_id]['status'] == 'active':
                return self._prepare_proxy_config(proxy_id)
            elif not assign_if_missing:
                # If proxy is not active and we're not assigning a new one, return None
                return None

        # If we get here, either the profile has no proxy or its proxy is inactive
        # and assign_if_missing is True
        if not assign_if_missing:
            return None

        # Filter available proxies
        available_proxies = [
            proxy_id for proxy_id, info in self.proxy_pool.items()
            if (info['status'] == 'active' and
                info['failure_count'] < 3 and
                (not required_country or
                 info.get('geolocation', {}).get('country') == required_country) and
                proxy_id not in self.profile_proxies.values())  # Only use unassigned proxies
        ]

        if not available_proxies:
            logger.warning(f"No available proxies for profile {profile_id}")
            return None

        # Select best proxy based on metrics
        selected_proxy = await self._select_best_proxy(available_proxies)

        if selected_proxy:
            self.profile_proxies[profile_id] = selected_proxy
            logger.info(f"Assigned proxy {selected_proxy} to profile {profile_id}")
            return self._prepare_proxy_config(selected_proxy)

        return None

    async def check_proxy_health(self, proxy_id: str) -> bool:
        """
        Enhanced proxy health check with metrics
        """
        proxy_info = self.proxy_pool[proxy_id]
        proxy_config = proxy_info['config']
        start_time = asyncio.get_event_loop().time()

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    'https://api.ipify.org?format=json',
                    proxy=proxy_info['proxy_string'],
                    timeout=10
                ) as response:
                    response_time = asyncio.get_event_loop().time() - start_time

                    if response.status == 200:
                        data = await response.json()
                        detected_ip = data.get('ip')

                        # Update metrics
                        proxy_info['status'] = 'active'
                        proxy_info['failure_count'] = 0
                        proxy_info['success_count'] += 1
                        proxy_info['last_check'] = start_time
                        proxy_info['average_response_time'] = (
                            (proxy_info.get('average_response_time', 0) *
                             (proxy_info['success_count'] - 1) + response_time) /
                            proxy_info['success_count']
                        )

                        # Update geolocation if IP changed
                        if (detected_ip and
                            detected_ip != proxy_info.get('ip') and
                            geoip_allowed()):
                            geolocation = get_geolocation(detected_ip)
                            proxy_info['geolocation'] = geolocation.as_config()
                            proxy_info['ip'] = detected_ip

                        return True
                    else:
                        self._handle_proxy_failure(proxy_id)
                        return False

        except Exception as e:
            self._handle_proxy_failure(proxy_id, str(e))
            return False

    def _handle_proxy_failure(self, proxy_id: str, error: Optional[str] = None) -> None:
        """Handle proxy failure and update metrics"""
        proxy_info = self.proxy_pool[proxy_id]
        proxy_info['failure_count'] += 1
        proxy_info['last_error'] = error
        proxy_info['last_failure'] = asyncio.get_event_loop().time()

        if proxy_info['failure_count'] >= 3:
            proxy_info['status'] = 'inactive'

    async def _get_public_ip(self, proxy: Proxy) -> Optional[str]:
        """Get public IP address using the proxy"""
        try:
            return await asyncio.get_event_loop().run_in_executor(
                None, public_ip, proxy.as_string()
            )
        except Exception:
            return None

    async def _select_best_proxy(self, proxy_ids: List[str]) -> Optional[str]:
        """Select the best proxy based on metrics"""
        if not proxy_ids:
            return None

        return min(
            proxy_ids,
            key=lambda x: (
                self.proxy_pool[x]['failure_count'],
                len([p for p in self.profile_proxies.values() if p == x]),
                self.proxy_pool[x].get('average_response_time', float('inf'))
            )
        )

    def _prepare_proxy_config(self, proxy_id: str) -> Dict[str, Union[str, dict]]:
        """Prepare proxy configuration for Camoufox"""
        proxy_info = self.proxy_pool[proxy_id]
        proxy_config = proxy_info['config']

        # Use separate authentication fields for better compatibility
        # This prevents 407 Proxy Authentication Required errors
        proxy_server = f"http://{proxy_config['host']}:{proxy_config['port']}"

        # Create proxy configuration with separate auth fields
        prepared_proxy = {
            'server': proxy_server
        }

        # Add authentication if available as separate fields
        if proxy_config.get('username') and proxy_config.get('password'):
            prepared_proxy['username'] = proxy_config['username']
            prepared_proxy['password'] = proxy_config['password']

        return {
            'proxy': prepared_proxy,
            'geolocation': proxy_info.get('geolocation'),
            'ip': proxy_info.get('ip')
        }

    async def reassign_profile_proxy(self, profile_id: str, required_country: Optional[str] = None) -> bool:
        """
        Reassign a proxy to a profile

        Args:
            profile_id: Profile identifier
            required_country: ISO country code if geolocation requirement exists

        Returns:
            True if reassignment was successful, False otherwise
        """
        # Remove current assignment if exists
        if profile_id in self.profile_proxies:
            del self.profile_proxies[profile_id]

        # Get a new proxy
        new_proxy = await self.get_proxy(profile_id, required_country=required_country)
        return bool(new_proxy)

    async def list_proxies(self) -> List[Dict[str, Any]]:
        """
        List all proxies with their status and assignments

        Returns:
            List of proxy information dictionaries
        """
        result = []
        for proxy_id, proxy_info in self.proxy_pool.items():
            # Find profiles using this proxy
            assigned_profiles = [
                profile_id for profile_id, assigned_proxy_id in self.profile_proxies.items()
                if assigned_proxy_id == proxy_id
            ]

            proxy_data = {
                'id': proxy_id,
                'status': proxy_info['status'],
                'host': proxy_info['config']['host'],
                'port': proxy_info['config']['port'],
                'protocol': proxy_info['config'].get('protocol', 'http'),
                'username': proxy_info['config'].get('username'),
                'failure_count': proxy_info['failure_count'],
                'success_count': proxy_info['success_count'],
                'average_response_time': proxy_info.get('average_response_time', 0),
                'assigned_profiles': assigned_profiles,
                'geolocation': proxy_info.get('geolocation'),
                'ip': proxy_info.get('ip')
            }
            result.append(proxy_data)

        return result

# Create a singleton instance of ProxyManager
proxy_manager = ProxyManager()
