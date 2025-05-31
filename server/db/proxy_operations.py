"""
Proxy database operations module.

This module serves as a bridge/sync layer between ProxyManager (operational) and database storage.
It provides:
- Automatic synchronization between ProxyManager and database
- Enhanced database features (search, filtering, analytics)
- Unified data flow through ProxyManager as source of truth
- Database-powered proxy management and assignment tracking

The database serves as an enhancement layer while ProxyManager handles all operational tasks.
"""

from typing import Dict, List, Optional, Any, Union
import logging
import uuid
from datetime import datetime
import json
import os
from pathlib import Path
import asyncio

# Configure logger
logger = logging.getLogger("camoufox.db.proxies")

# Import ProxyManager singleton
from core.proxy_manager import proxy_manager

# Import Supabase client
try:
    from supabase import create_client, Client
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    else:
        logger.warning("Supabase credentials not found in environment variables")
        supabase = None
except ImportError:
    logger.warning("Supabase Python client not installed")
    supabase = None

class ProxyOperations:
    """
    Bridge/sync layer between ProxyManager and database.

    This class provides unified proxy operations by:
    - Using ProxyManager as the source of truth for operational data
    - Automatically syncing all changes to the database
    - Providing enhanced database features (search, filtering, analytics)
    - Maintaining data consistency between ProxyManager and database
    """

    def __init__(self):
        """Initialize the proxy database bridge."""
        self.supabase = supabase
        self.proxy_manager = proxy_manager
        # Initialize sync on startup (will be called when event loop is available)
        self._sync_initialized = False

    async def _ensure_sync_initialized(self):
        """Ensure synchronization is initialized (called on first use)."""
        if not self._sync_initialized and self.supabase:
            try:
                logger.info("Initializing proxy synchronization...")
                await self.sync_all_proxies()
                self._sync_initialized = True
                logger.info("Proxy synchronization initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing proxy sync: {str(e)}")

    async def sync_proxy_to_db(self, proxy_data: Dict[str, Any]) -> bool:
        """
        Sync a ProxyManager proxy to the database.

        Args:
            proxy_data: Proxy data dictionary from ProxyManager

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase:
            return False

        try:
            # Convert ProxyManager data to database format
            db_proxy = {
                'id': proxy_data['id'],
                'host': proxy_data['host'],
                'port': proxy_data['port'],
                'protocol': proxy_data['protocol'],
                'username': proxy_data.get('username'),
                'status': proxy_data['status'],
                'failure_count': proxy_data['failure_count'],
                'success_count': proxy_data['success_count'],
                'average_response_time': proxy_data['average_response_time'],
                'assigned_profiles': proxy_data['assigned_profiles'],
                'geolocation': proxy_data.get('geolocation'),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }

            # Try to update first, then insert if not exists
            response = self.supabase.table('proxies').upsert(db_proxy).execute()

            if response.data:
                logger.debug(f"Synced proxy {proxy_data['id']} to database")
                return True
            return False
        except Exception as e:
            logger.error(f"Error syncing proxy {proxy_data['id']} to database: {str(e)}")
            return False

    async def sync_proxy_from_db(self, proxy_id: str) -> Optional[Dict[str, Any]]:
        """
        Get enhanced proxy data from database.

        Args:
            proxy_id: Proxy ID to get database data for

        Returns:
            Database proxy data or None if not found
        """
        if not self.supabase:
            return None

        try:
            response = self.supabase.table('proxies').select('*').eq('id', proxy_id).single().execute()
            return response.data
        except Exception as e:
            logger.debug(f"Proxy {proxy_id} not found in database: {str(e)}")
            return None

    async def sync_all_proxies(self):
        """Sync all ProxyManager proxies to database."""
        if not self.supabase:
            return

        try:
            # Get all proxies from ProxyManager
            proxies = await self.proxy_manager.list_proxies()

            for proxy in proxies:
                await self.sync_proxy_to_db(proxy)

            logger.info(f"Synced {len(proxies)} proxies to database")
        except Exception as e:
            logger.error(f"Error syncing all proxies: {str(e)}")

    async def list_proxies(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get all proxies with enhanced database features and filtering.

        Uses ProxyManager as source of truth, enhanced with database metadata.

        Args:
            filters: Optional dictionary of filters to apply
                - search: Search string for proxy host
                - protocol: Filter by protocol
                - country: Filter by country
                - sort_by: Field to sort by
                - sort_order: 'asc' or 'desc'

        Returns:
            List of enhanced proxy dictionaries
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Get all proxies from ProxyManager (source of truth)
            pm_proxies = await self.proxy_manager.list_proxies()

            # Convert to enhanced format with database data
            enhanced_proxies = []
            for proxy in pm_proxies:
                # Start with ProxyManager data
                enhanced_proxy = proxy.copy()

                # Enhance with database metadata if available
                db_data = await self.sync_proxy_from_db(proxy['id'])
                if db_data:
                    # Add database-specific fields
                    enhanced_proxy.update({
                        'created_at': db_data.get('created_at'),
                        'updated_at': db_data.get('updated_at'),
                        'country': db_data.get('country'),
                        'is_working': db_data.get('is_working'),
                        'last_checked': db_data.get('last_checked')
                    })

                enhanced_proxies.append(enhanced_proxy)

            # Apply filters if provided
            if filters:
                filtered_proxies = []
                for proxy in enhanced_proxies:
                    # Search filter
                    if 'search' in filters and filters['search']:
                        search_term = filters['search'].lower()
                        if search_term not in proxy['host'].lower():
                            continue

                    # Protocol filter
                    if 'protocol' in filters and filters['protocol']:
                        if proxy['protocol'] != filters['protocol']:
                            continue

                    # Country filter
                    if 'country' in filters and filters['country']:
                        proxy_country = proxy.get('country') or (proxy.get('geolocation', {}).get('country'))
                        if proxy_country != filters['country']:
                            continue

                    filtered_proxies.append(proxy)

                enhanced_proxies = filtered_proxies

            # Apply sorting
            if filters and 'sort_by' in filters and filters['sort_by']:
                sort_field = filters['sort_by']
                reverse = filters.get('sort_order', 'asc') == 'desc'

                def get_sort_value(proxy):
                    return proxy.get(sort_field, '')

                enhanced_proxies.sort(key=get_sort_value, reverse=reverse)
            else:
                # Default sort by status (active first) then by success rate
                enhanced_proxies.sort(
                    key=lambda p: (
                        p['status'] != 'active',  # Active proxies first
                        -p.get('success_count', 0)  # Higher success count first
                    )
                )

            return enhanced_proxies

        except Exception as e:
            logger.error(f"Error listing enhanced proxies: {str(e)}")
            return []

    async def get_proxy(self, proxy_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single proxy by ID with enhanced database metadata.

        Uses ProxyManager as source of truth, enhanced with database data.

        Args:
            proxy_id: The ID of the proxy to retrieve

        Returns:
            Enhanced proxy dictionary or None if not found
        """
        try:
            # Get all proxies from ProxyManager (source of truth)
            pm_proxies = await self.proxy_manager.list_proxies()

            # Find the specific proxy
            pm_proxy = next((p for p in pm_proxies if p['id'] == proxy_id), None)
            if not pm_proxy:
                return None

            # Start with ProxyManager data
            enhanced_proxy = pm_proxy.copy()

            # Enhance with database metadata if available
            db_data = await self.sync_proxy_from_db(proxy_id)
            if db_data:
                # Add database-specific fields
                enhanced_proxy.update({
                    'created_at': db_data.get('created_at'),
                    'updated_at': db_data.get('updated_at'),
                    'country': db_data.get('country'),
                    'is_working': db_data.get('is_working'),
                    'last_checked': db_data.get('last_checked')
                })

            return enhanced_proxy

        except Exception as e:
            logger.error(f"Error getting enhanced proxy {proxy_id}: {str(e)}")
            return None

    async def create_proxy(self, proxy: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new proxy using ProxyManager and sync to database.

        Uses ProxyManager as source of truth, then syncs to database.

        Args:
            proxy: Proxy data dictionary with:
                - id: Optional proxy ID (generated if not provided)
                - host: Proxy host
                - port: Proxy port
                - protocol: Proxy protocol (http, https, socks4, socks5)
                - username: Optional username for authentication
                - password: Optional password for authentication
                - country: Optional country code

        Returns:
            Created enhanced proxy dictionary or None if creation failed
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Generate proxy ID if not provided
            proxy_id = proxy.get('id') or str(uuid.uuid4())

            # Prepare proxy config for ProxyManager
            proxy_config = {
                'host': proxy.get('host', ''),
                'port': proxy.get('port', 8080),
                'protocol': proxy.get('protocol', 'http'),
            }

            # Add authentication if provided
            if proxy.get('username'):
                proxy_config['username'] = proxy['username']
            if proxy.get('password'):
                proxy_config['password'] = proxy['password']

            # Add proxy to ProxyManager (source of truth)
            await self.proxy_manager.add_proxy(
                proxy_id=proxy_id,
                proxy_config=proxy_config,
                verify_geolocation=proxy.get('verify', True)
            )

            # Get the created proxy from ProxyManager
            pm_proxies = await self.proxy_manager.list_proxies()
            created_proxy = next((p for p in pm_proxies if p['id'] == proxy_id), None)

            if not created_proxy:
                logger.error(f"Failed to create proxy {proxy_id} in ProxyManager")
                return None

            # Sync to database
            await self.sync_proxy_to_db(created_proxy)

            # Return enhanced proxy data
            return await self.get_proxy(proxy_id)

        except Exception as e:
            logger.error(f"Error creating proxy: {str(e)}")
            return None

    async def update_proxy(self, proxy_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing proxy in the database.

        Args:
            proxy_id: ID of the proxy to update
            updates: Dictionary of updates to apply

        Returns:
            Updated proxy dictionary or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Update the proxy
            response = self.supabase.table('proxies').update(updates).eq('id', proxy_id).execute()

            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating proxy {proxy_id} in database: {str(e)}")
            return None

    async def delete_proxy(self, proxy_id: str) -> bool:
        """
        Delete a proxy using ProxyManager and remove from database.

        Uses ProxyManager as source of truth, then removes from database.

        Args:
            proxy_id: ID of the proxy to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            # Remove proxy from ProxyManager (source of truth)
            if proxy_id in self.proxy_manager.proxy_pool:
                del self.proxy_manager.proxy_pool[proxy_id]

                # Remove any profile assignments
                profiles_to_remove = [
                    profile_id for profile_id, assigned_proxy_id in self.proxy_manager.profile_proxies.items()
                    if assigned_proxy_id == proxy_id
                ]
                for profile_id in profiles_to_remove:
                    del self.proxy_manager.profile_proxies[profile_id]

                logger.info(f"Removed proxy {proxy_id} from ProxyManager")
            else:
                logger.warning(f"Proxy {proxy_id} not found in ProxyManager")
                return False

            # Remove from database
            if self.supabase:
                try:
                    response = self.supabase.table('proxies').delete().eq('id', proxy_id).execute()
                    logger.debug(f"Removed proxy {proxy_id} from database")
                except Exception as e:
                    logger.warning(f"Failed to remove proxy {proxy_id} from database: {str(e)}")
                    # Don't fail the operation if database removal fails

            return True

        except Exception as e:
            logger.error(f"Error deleting proxy {proxy_id}: {str(e)}")
            return False

    async def assign_proxy_to_profile(self, profile_id: str, proxy_id: str) -> bool:
        """
        Assign a proxy to a profile using ProxyManager.

        Uses ProxyManager for assignment logic, syncs to database.

        Args:
            profile_id: ID of the profile
            proxy_id: ID of the proxy to assign

        Returns:
            True if assignment was successful, False otherwise
        """
        try:
            # Check if proxy exists in ProxyManager
            pm_proxies = await self.proxy_manager.list_proxies()
            proxy_exists = any(p['id'] == proxy_id for p in pm_proxies)

            if not proxy_exists:
                logger.error(f"Proxy {proxy_id} not found in ProxyManager")
                return False

            # Assign proxy using ProxyManager (source of truth)
            self.proxy_manager.profile_proxies[profile_id] = proxy_id

            # Get proxy config for database sync
            proxy_config = await self.proxy_manager.get_proxy(profile_id)

            if proxy_config and self.supabase:
                try:
                    # Update profile in database with proxy assignment
                    # This is for database consistency, but ProxyManager is the source of truth
                    profile_response = self.supabase.table('profiles').select('*').eq('id', profile_id).single().execute()
                    if profile_response.data:
                        profile = profile_response.data
                        config = profile.get('config', {})

                        # Create proxy config for database
                        proxy_data = proxy_config.get('proxy', {})
                        if proxy_data:
                            config['proxy'] = {
                                'id': proxy_id,
                                'server': proxy_data.get('proxy_string', f"{proxy_data.get('host', '')}:{proxy_data.get('port', '')}")
                            }

                            # Update the profile in database
                            self.supabase.table('profiles').update({
                                'config': config
                            }).eq('id', profile_id).execute()

                            logger.debug(f"Synced proxy assignment to database for profile {profile_id}")
                except Exception as e:
                    logger.warning(f"Failed to sync proxy assignment to database: {str(e)}")
                    # Don't fail the operation if database sync fails

            logger.info(f"Assigned proxy {proxy_id} to profile {profile_id}")
            return True

        except Exception as e:
            logger.error(f"Error assigning proxy {proxy_id} to profile {profile_id}: {str(e)}")
            return False

    async def remove_proxy_from_profile(self, profile_id: str) -> bool:
        """
        Remove proxy assignment from a profile.

        Args:
            profile_id: ID of the profile

        Returns:
            True if removal was successful, False otherwise
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return False

        try:
            # Get the profile from the profiles table
            profile_response = self.supabase.table('profiles').select('*').eq('id', profile_id).single().execute()
            if not profile_response.data:
                logger.error(f"Profile {profile_id} not found for proxy removal")
                return False

            profile = profile_response.data

            # Update the profile's config to remove proxy
            config = profile.get('config', {})

            # Remove proxy from config
            if 'proxy' in config:
                config['proxy'] = None

            # Update the profile
            update_response = self.supabase.table('profiles').update({
                'config': config
            }).eq('id', profile_id).execute()

            return len(update_response.data) > 0
        except Exception as e:
            logger.error(f"Error removing proxy from profile {profile_id} in database: {str(e)}")
            return False

    async def update_proxy_status(self, proxy_id: str, is_working: bool) -> bool:
        """
        Update proxy status (working/not working).

        Args:
            proxy_id: ID of the proxy to update
            is_working: Whether the proxy is working

        Returns:
            True if update was successful, False otherwise
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return False

        try:
            # Update the proxy status
            response = self.supabase.table('proxies').update({
                'is_working': is_working,
                'last_checked': datetime.utcnow().isoformat()
            }).eq('id', proxy_id).execute()

            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error updating proxy status {proxy_id} in database: {str(e)}")
            return False

    async def test_proxy(self, proxy_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test a proxy connection using ProxyManager capabilities.

        Pass-through to ProxyManager for operational functionality.

        Args:
            proxy_config: Proxy configuration with:
                - host: Proxy host
                - port: Proxy port
                - protocol: Proxy protocol
                - username: Optional username
                - password: Optional password

        Returns:
            Dictionary with test results:
                - success: Whether the test was successful
                - error: Error message if test failed
                - latency: Connection latency in milliseconds
        """
        try:
            # Create a temporary proxy for testing
            temp_proxy_id = f"temp_test_{uuid.uuid4()}"

            # Add proxy temporarily to ProxyManager for testing
            await self.proxy_manager.add_proxy(
                proxy_id=temp_proxy_id,
                proxy_config=proxy_config,
                verify_geolocation=True
            )

            # Test the proxy health
            is_healthy = await self.proxy_manager.check_proxy_health(temp_proxy_id)

            # Get proxy info for additional details
            pm_proxies = await self.proxy_manager.list_proxies()
            proxy_info = next((p for p in pm_proxies if p['id'] == temp_proxy_id), None)

            # Clean up temporary proxy
            if temp_proxy_id in self.proxy_manager.proxy_pool:
                del self.proxy_manager.proxy_pool[temp_proxy_id]

            if is_healthy and proxy_info:
                return {
                    'success': True,
                    'latency': proxy_info.get('average_response_time', 0),
                    'ip': proxy_info.get('ip'),
                    'country': proxy_info.get('geolocation', {}).get('country'),
                    'geolocation': proxy_info.get('geolocation')
                }
            else:
                return {
                    'success': False,
                    'error': 'Proxy health check failed'
                }

        except Exception as e:
            logger.error(f"Error testing proxy: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    # ===== OPERATIONAL METHODS (Pass-through to ProxyManager) =====

    async def check_proxy_health(self, proxy_id: str) -> bool:
        """
        Check proxy health using ProxyManager.

        Pass-through to ProxyManager for operational functionality.
        """
        try:
            result = await self.proxy_manager.check_proxy_health(proxy_id)

            # Update database status if available
            if self.supabase:
                try:
                    await self.update_proxy_status(proxy_id, result)
                except Exception as e:
                    logger.warning(f"Failed to update proxy status in database: {str(e)}")

            return result
        except Exception as e:
            logger.error(f"Error checking proxy health for {proxy_id}: {str(e)}")
            return False

    async def get_proxy_for_profile(self, profile_id: str, required_country: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get or assign a proxy for a profile.

        Pass-through to ProxyManager for operational functionality.
        """
        try:
            proxy_config = await self.proxy_manager.get_proxy(
                profile_id=profile_id,
                required_country=required_country,
                assign_if_missing=True
            )

            if proxy_config:
                # Sync assignment to database if available
                assigned_proxy_id = self.proxy_manager.profile_proxies.get(profile_id)
                if assigned_proxy_id and self.supabase:
                    try:
                        await self.assign_proxy_to_profile(profile_id, assigned_proxy_id)
                    except Exception as e:
                        logger.warning(f"Failed to sync proxy assignment to database: {str(e)}")

            return proxy_config
        except Exception as e:
            logger.error(f"Error getting proxy for profile {profile_id}: {str(e)}")
            return None

    async def reassign_profile_proxy(self, profile_id: str, required_country: Optional[str] = None) -> bool:
        """
        Reassign a proxy to a profile.

        Pass-through to ProxyManager for operational functionality.
        """
        try:
            result = await self.proxy_manager.reassign_profile_proxy(profile_id, required_country)

            # Sync to database if successful
            if result and self.supabase:
                try:
                    assigned_proxy_id = self.proxy_manager.profile_proxies.get(profile_id)
                    if assigned_proxy_id:
                        await self.assign_proxy_to_profile(profile_id, assigned_proxy_id)
                except Exception as e:
                    logger.warning(f"Failed to sync proxy reassignment to database: {str(e)}")

            return result
        except Exception as e:
            logger.error(f"Error reassigning proxy for profile {profile_id}: {str(e)}")
            return False

# Create a singleton instance
proxy_operations = ProxyOperations()
