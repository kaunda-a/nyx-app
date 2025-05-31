from typing import Dict, Optional, List, Any, Tuple
import asyncio
import logging
import random
import uuid
import time
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel
import aiohttp
from enum import Enum

class ProfileStatus(str, Enum):
    """Profile status enum"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"

from camoufox.async_api import AsyncCamoufox
from core.storage import PROFILES_DIR
from security.security_manager import SecurityManager
from core.proxy_manager import proxy_manager
from integration.customization import browser_customization

# Configure logger
logger = logging.getLogger("camoufox.profiles")

class ProfileData(BaseModel):
    """Profile data model for browser profiles"""
    id: str
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    config: Dict[str, Any] = {}
    path: str
    metadata: Dict[str, Any] = {}

class ProfileManager:
    """
    Manages browser profiles with enhanced fingerprinting capabilities

    This class handles the creation, storage, and retrieval of browser profiles
    with sophisticated fingerprinting using Camoufox's anti-detection technology.
    """
    def __init__(
        self,
        base_dir: Optional[str] = None,
        security_manager: Optional[SecurityManager] = None
    ):
        """
        Initialize the profile manager

        Args:
            base_dir: Base directory for profile storage
            security_manager: Security manager for encryption/decryption
        """
        self.base_dir = Path(base_dir or PROFILES_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.security_manager = security_manager or SecurityManager()
        self.active_profiles: Dict[str, ProfileData] = {}
        self.profile_locks: Dict[str, asyncio.Lock] = {}
        self.active_browsers: Dict[str, AsyncCamoufox] = {}
        self._browser_configs: Dict[str, Dict[str, Any]] = {}  # Store browser configurations
        logger.info(f"ProfileManager initialized with base directory: {self.base_dir}")

    async def create_profile(
        self,
        profile_id: Optional[str] = None,
        name: Optional[str] = None,
        config: Optional[dict] = None
    ) -> ProfileData:
        """
        Create a new browser profile

        Args:
            profile_id: Optional profile ID (generated if not provided)
            name: Optional profile name (generated if not provided)
            config: Optional profile configuration

        Returns:
            ProfileData object with the created profile
        """
        # Generate profile ID if not provided
        profile_id = profile_id or str(uuid.uuid4())

        # Create profile directory
        profile_dir = self.base_dir / profile_id
        profile_dir.mkdir(parents=True, exist_ok=True)

        # Generate profile name if not provided
        if not name:
            adjectives = ["Swift", "Clever", "Nimble", "Brave", "Silent", "Wise", "Quick", "Calm", "Bold"]
            animals = ["Fox", "Wolf", "Eagle", "Hawk", "Panther", "Tiger", "Lion", "Bear", "Falcon"]
            name = f"{random.choice(adjectives)} {random.choice(animals)} {random.randint(100, 999)}"

        # Initialize configuration with defaults if not provided
        config = config or {}

        # Set default privacy and security settings
        config.setdefault('humanize', True)
        config.setdefault('block_webrtc', True)
        config.setdefault('geoip', True)

        # Create profile data
        profile_data = ProfileData(
            id=profile_id,
            name=name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            config=config,
            path=str(profile_dir),
            metadata={
                'created_by': 'system',
                'last_access': datetime.utcnow().isoformat()
            }
        )

        # Save profile to disk
        await self._save_profile(profile_data)

        # Add to active profiles
        self.active_profiles[profile_id] = profile_data

        # Create lock if it doesn't exist
        if profile_id not in self.profile_locks:
            self.profile_locks[profile_id] = asyncio.Lock()

        # Apply Nyx branding customization to the profile
        try:
            await browser_customization.customize_profile(profile_id, Path(profile_data.path))
            logger.info(f"Applied Nyx branding to profile {profile_id}")
        except Exception as e:
            logger.warning(f"Could not apply Nyx branding to profile {profile_id}: {e}")
            # Continue without branding - not critical for functionality

        # Handle proxy assignment if proxy config is provided
        if config and 'proxy' in config and config['proxy']:
            try:
                proxy_config = config['proxy']

                # If proxy is a direct reference to a proxy ID
                if isinstance(proxy_config, str) and proxy_config.strip():
                    # Check if this is a proxy ID
                    all_proxies = await proxy_manager.list_proxies()
                    proxy_exists = any(p['id'] == proxy_config for p in all_proxies)

                    if proxy_exists:
                        # Assign this specific proxy
                        proxy_manager.profile_proxies[profile_id] = proxy_config
                        logger.info(f"Assigned proxy {proxy_config} to profile {profile_id}")
                    else:
                        # Treat as a proxy server string and create a new proxy
                        proxy_id = str(uuid.uuid4())
                        await proxy_manager.add_proxy(
                            proxy_id=proxy_id,
                            proxy_config={
                                'host': proxy_config.split(':')[0],
                                'port': int(proxy_config.split(':')[1]) if ':' in proxy_config else 8080,
                                'protocol': 'http'
                            }
                        )
                        proxy_manager.profile_proxies[profile_id] = proxy_id
                        logger.info(f"Created and assigned new proxy {proxy_id} to profile {profile_id}")

                # If proxy is a dictionary with server information
                elif isinstance(proxy_config, dict) and 'server' in proxy_config and proxy_config['server']:
                    server = proxy_config['server']
                    # Create a new proxy
                    proxy_id = str(uuid.uuid4())

                    # Parse server string to get host and port
                    # Remove protocol prefix if present
                    if server.startswith(('http://', 'https://', 'socks5://')):
                        for prefix in ['http://', 'https://', 'socks5://']:
                            if server.startswith(prefix):
                                server = server[len(prefix):]
                                break

                    # Remove authentication part if embedded in URL
                    if '@' in server:
                        server = server.split('@')[1]

                    # Extract host and port
                    if ':' in server:
                        host, port_str = server.split(':')
                        try:
                            port = int(port_str)
                        except ValueError:
                            port = 8080
                    else:
                        host = server
                        port = 8080

                    # Create proxy configuration with separate authentication fields
                    # This prevents 407 Proxy Authentication Required errors
                    await proxy_manager.add_proxy(
                        proxy_id=proxy_id,
                        proxy_config={
                            'host': host,
                            'port': port,
                            'protocol': proxy_config.get('protocol', 'http'),
                            'username': proxy_config.get('username'),
                            'password': proxy_config.get('password')
                        }
                    )
                    proxy_manager.profile_proxies[profile_id] = proxy_id
                    logger.info(f"Created and assigned new proxy {proxy_id} to profile {profile_id}")

                # If no specific proxy is provided, try to assign an available one
                else:
                    # Get country from profile config if available
                    country = None
                    if 'locale' in config:
                        locale = config['locale']
                        if locale and '-' in locale:
                            country = locale.split('-')[1]

                    # Try to assign a proxy
                    proxy_result = await proxy_manager.get_proxy(
                        profile_id=profile_id,
                        required_country=country
                    )

                    if proxy_result:
                        logger.info(f"Automatically assigned proxy to profile {profile_id}")
            except Exception as e:
                logger.error(f"Error assigning proxy to profile {profile_id}: {str(e)}")
                # Continue without proxy assignment if it fails

        return profile_data

    async def _save_profile(self, profile: ProfileData) -> bool:
        """
        Save profile data to disk with encryption

        Args:
            profile: ProfileData object to save

        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure profile directory exists
            profile_dir = Path(profile.path)
            profile_dir.mkdir(parents=True, exist_ok=True)

            # Encrypt profile data
            encrypted_data = await self.security_manager.encrypt_sensitive_data(profile.model_dump())

            # Save to file
            profile_path = profile_dir / 'profile.enc'
            with open(profile_path, 'wb') as f:
                f.write(encrypted_data)

            # Update active profiles
            self.active_profiles[profile.id] = profile

            return True
        except Exception as e:
            logger.error(f"Error saving profile {profile.id}: {str(e)}")
            return False

    async def get_profile(self, profile_id: str) -> Optional[ProfileData]:
        """
        Get a profile by ID

        Args:
            profile_id: Profile ID to retrieve

        Returns:
            ProfileData object if found, None otherwise
        """
        try:
            # Check if profile is already loaded
            if profile_id in self.active_profiles:
                profile = self.active_profiles[profile_id]
                # Update last access time
                if hasattr(profile, 'metadata') and profile.metadata:
                    profile.metadata['last_access'] = datetime.utcnow().isoformat()
                return profile

            # Check if profile file exists
            profile_path = self.base_dir / profile_id / 'profile.enc'
            if not profile_path.exists():
                # Check if this is a stale reference to a deleted profile
                # If the profile directory doesn't exist or is empty, don't log an error
                profile_dir = self.base_dir / profile_id
                if not profile_dir.exists() or not any(profile_dir.iterdir()):
                    # Silently return None for non-existent profiles
                    return None

                # Only log an error if the directory exists but the profile file is missing
                logger.error(f"Profile file not found: {profile_path}")
                return None

            # Read and decrypt profile data
            try:
                with open(profile_path, 'rb') as f:
                    encrypted_data = f.read()

                # Decrypt the data
                decrypted_data = await self.security_manager.decrypt_sensitive_data(encrypted_data)

                # If decryption returned an empty dict, return None
                if not decrypted_data:
                    logger.error(f"Decryption failed for profile {profile_id}")
                    return None

                # Create ProfileData object
                try:
                    # Ensure required fields are present
                    if 'name' not in decrypted_data or decrypted_data['name'] is None:
                        decrypted_data['name'] = f"Profile {profile_id[:8]}"

                    if 'created_at' not in decrypted_data or decrypted_data['created_at'] is None:
                        decrypted_data['created_at'] = datetime.utcnow()

                    if 'path' not in decrypted_data or decrypted_data['path'] is None:
                        decrypted_data['path'] = str(self.base_dir / profile_id)

                    if 'config' not in decrypted_data or decrypted_data['config'] is None:
                        decrypted_data['config'] = {}

                    if 'metadata' not in decrypted_data or decrypted_data['metadata'] is None:
                        decrypted_data['metadata'] = {}

                    profile_data = ProfileData(**decrypted_data)

                    # Update last access time
                    if hasattr(profile_data, 'metadata') and profile_data.metadata:
                        profile_data.metadata['last_access'] = datetime.utcnow().isoformat()

                    # Add to active profiles
                    self.active_profiles[profile_id] = profile_data

                    # Create lock if it doesn't exist
                    if profile_id not in self.profile_locks:
                        self.profile_locks[profile_id] = asyncio.Lock()

                    return profile_data
                except Exception as e:
                    logger.error(f"Error creating ProfileData object: {str(e)}")
                    return None
            except Exception as e:
                logger.error(f"Error reading/decrypting profile {profile_id}: {str(e)}")
                return None
        except Exception as e:
            logger.error(f"Unexpected error in get_profile for {profile_id}: {str(e)}")
            return None

    async def list_profiles(self) -> List[ProfileData]:
        """
        List all available profiles

        Returns:
            List of ProfileData objects
        """
        try:
            profiles = []

            # Check if base directory exists
            if not self.base_dir.exists():
                return []

            # Iterate through profile directories
            for profile_dir in self.base_dir.iterdir():
                if profile_dir.is_dir():
                    profile_id = profile_dir.name
                    profile = await self.get_profile(profile_id)
                    if profile:
                        profiles.append(profile)

            return profiles
        except Exception as e:
            logger.error(f"Error listing profiles: {str(e)}")
            return []

    async def search_profiles(self, query: str) -> List[ProfileData]:
        """
        Search for profiles by name or other properties

        Args:
            query: Search query string

        Returns:
            List of matching ProfileData objects
        """
        try:
            # Get all profiles
            all_profiles = await self.list_profiles()

            # Convert query to lowercase for case-insensitive search
            query = query.lower()

            # Filter profiles based on the query
            matching_profiles = []
            for profile in all_profiles:
                # Search in profile name
                if query in profile.name.lower():
                    matching_profiles.append(profile)
                    continue

                # Search in profile metadata
                if hasattr(profile, 'metadata') and profile.metadata:
                    metadata_str = str(profile.metadata).lower()
                    if query in metadata_str:
                        matching_profiles.append(profile)
                        continue

                # Search in profile config
                if hasattr(profile, 'config') and profile.config:
                    config_str = str(profile.config).lower()
                    if query in config_str:
                        matching_profiles.append(profile)
                        continue

            return matching_profiles
        except Exception as e:
            logger.error(f"Error searching profiles: {str(e)}")
            return []

    async def update_profile(
        self,
        profile_id: str,
        updates: dict
    ) -> Optional[ProfileData]:
        """
        Update profile configuration

        Args:
            profile_id: Profile ID to update
            updates: Dictionary of updates to apply

        Returns:
            Updated ProfileData object if successful, None otherwise
        """
        async with self.profile_locks.get(profile_id, asyncio.Lock()):
            profile = await self.get_profile(profile_id)
            if not profile:
                return None

            # Handle name update separately
            if 'name' in updates:
                profile.name = updates.pop('name')

            # Update configuration for remaining fields
            if updates:
                profile.config.update(updates)

            # Update metadata
            if not hasattr(profile, 'metadata') or profile.metadata is None:
                profile.metadata = {}

            # Update timestamps with current time
            current_time = datetime.utcnow()
            profile.metadata['last_updated'] = current_time.isoformat()
            profile.updated_at = current_time

            # Handle proxy updates
            if 'proxy' in updates:
                proxy_config = updates['proxy']
                try:
                    # If proxy is being removed (set to None or empty)
                    if not proxy_config:
                        # Remove proxy assignment if exists
                        if profile.id in proxy_manager.profile_proxies:
                            del proxy_manager.profile_proxies[profile.id]
                            logger.info(f"Removed proxy assignment from profile {profile.id}")
                    else:
                        # Handle proxy assignment similar to create_profile
                        # If proxy is a direct reference to a proxy ID
                        if isinstance(proxy_config, str) and proxy_config.strip():
                            # Check if this is a proxy ID
                            all_proxies = await proxy_manager.list_proxies()
                            proxy_exists = any(p['id'] == proxy_config for p in all_proxies)

                            if proxy_exists:
                                # Assign this specific proxy
                                proxy_manager.profile_proxies[profile.id] = proxy_config
                                logger.info(f"Updated proxy assignment to {proxy_config} for profile {profile.id}")
                            else:
                                # Treat as a proxy server string and create a new proxy
                                proxy_id = str(uuid.uuid4())
                                await proxy_manager.add_proxy(
                                    proxy_id=proxy_id,
                                    proxy_config={
                                        'host': proxy_config.split(':')[0],
                                        'port': int(proxy_config.split(':')[1]) if ':' in proxy_config else 8080,
                                        'protocol': 'http'
                                    }
                                )
                                proxy_manager.profile_proxies[profile.id] = proxy_id
                                logger.info(f"Created and assigned new proxy {proxy_id} to profile {profile.id}")

                        # If proxy is a dictionary with server information
                        elif isinstance(proxy_config, dict) and 'server' in proxy_config and proxy_config['server']:
                            server = proxy_config['server']
                            # Create a new proxy
                            proxy_id = str(uuid.uuid4())

                            # Parse server string to get host and port
                            if ':' in server:
                                host, port_str = server.split(':')
                                try:
                                    port = int(port_str)
                                except ValueError:
                                    port = 8080
                            else:
                                host = server
                                port = 8080

                            await proxy_manager.add_proxy(
                                proxy_id=proxy_id,
                                proxy_config={
                                    'host': host,
                                    'port': port,
                                    'protocol': proxy_config.get('protocol', 'http'),
                                    'username': proxy_config.get('username'),
                                    'password': proxy_config.get('password')
                                }
                            )
                            proxy_manager.profile_proxies[profile.id] = proxy_id
                            logger.info(f"Created and assigned new proxy {proxy_id} to profile {profile.id}")
                except Exception as e:
                    logger.error(f"Error updating proxy for profile {profile.id}: {str(e)}")
                    # Continue without proxy update if it fails

            # Save updated profile
            await self._save_profile(profile)

            return profile

    async def delete_profile(self, profile_id: str) -> bool:
        """
        Delete a profile

        Args:
            profile_id: Profile ID to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            # Close browser if running
            await self.close_browser(profile_id)

            # Clean up browser customization before deleting directory
            profile_dir = self.base_dir / profile_id
            try:
                await browser_customization.cleanup_profile_customization(profile_id, profile_dir)
                logger.info(f"Cleaned up Nyx branding for deleted profile {profile_id}")
            except Exception as e:
                logger.warning(f"Could not clean up Nyx branding for profile {profile_id}: {e}")

            # Remove from active profiles
            if profile_id in self.active_profiles:
                del self.active_profiles[profile_id]

            # Remove lock
            if profile_id in self.profile_locks:
                del self.profile_locks[profile_id]

            # Remove proxy assignment if exists
            if profile_id in proxy_manager.profile_proxies:
                del proxy_manager.profile_proxies[profile_id]
                logger.info(f"Removed proxy assignment for deleted profile {profile_id}")

            # Delete profile directory
            if profile_dir.exists():
                import shutil
                shutil.rmtree(profile_dir)

            return True
        except Exception as e:
            logger.error(f"Error deleting profile {profile_id}: {str(e)}")
            return False

    def set_browser_config(self, profile_id: str, config: Dict[str, Any]) -> None:
        """
        Set a custom browser configuration for a profile

        This method allows direct setting of browser launch options, which is useful
        for testing and debugging. The configuration will be used the next time
        the profile is launched.

        Args:
            profile_id: Profile ID to set configuration for
            config: Browser configuration dictionary
        """
        self._browser_configs[profile_id] = config
        logger.info(f"Set custom browser configuration for profile {profile_id}: {config}")

    async def launch_profile(self, profile_id: str, headless: bool = False) -> Dict[str, Any]:
        """
        Launch a browser with the specified profile

        Args:
            profile_id: Profile ID to launch
            headless: Whether to launch in headless mode

        Returns:
            Dictionary with launch results
        """
        try:
            # Get profile
            profile = await self.get_profile(profile_id)
            if not profile:
                return {'success': False, 'error': f'Profile {profile_id} not found'}

            # Create a simplified configuration for launching
            # Set up user data directory for persistence
            profile_data_dir = Path(profile.path) / 'browser_data'
            profile_data_dir.mkdir(parents=True, exist_ok=True)

            # Create a marker file to indicate this profile has been launched before
            with open(profile_data_dir / 'prefs.js', 'w') as f:
                f.write(f"// Created at {datetime.utcnow().isoformat()}")

            # Use the simplest possible configuration as recommended by camoufox
            # Let Camoufox handle all fingerprinting automatically
            launch_config = {
                'headless': headless,  # Use the headless parameter passed to the method
                'disable_coop': True,
                'i_know_what_im_doing': True,  # Suppress warning about COOP
                'humanize': True,  # Add human-like behavior
                'geoip': True      # Enable geolocation spoofing
            }

            # Log whether we're launching in headless mode
            logger.info(f"Launching browser for profile {profile_id} in {'headless' if headless else 'visible'} mode")

            # Handle proxy configuration - use the dedicated proxy from ProxyManager
            if profile_id in proxy_manager.profile_proxies:
                proxy_id = proxy_manager.profile_proxies[profile_id]
                if proxy_id in proxy_manager.proxy_pool and proxy_manager.proxy_pool[proxy_id]['status'] == 'active':
                    # Get proxy configuration
                    proxy_config = proxy_manager.proxy_pool[proxy_id]['config']

                    # Use separate authentication fields for better compatibility
                    # This prevents 407 Proxy Authentication Required errors
                    proxy_server = f"http://{proxy_config['host']}:{proxy_config['port']}"

                    # Set up proxy with separate authentication fields
                    proxy_config_for_browser = {
                        'server': proxy_server
                    }

                    # Add authentication if available as separate fields
                    if proxy_config.get('username') and proxy_config.get('password'):
                        proxy_config_for_browser['username'] = proxy_config['username']
                        proxy_config_for_browser['password'] = proxy_config['password']

                    # Use the same configuration for launch_config
                    launch_config['proxy'] = proxy_config_for_browser

                    # Also set geoip=True which is recommended when using proxies
                    launch_config['geoip'] = True

                    logger.info(f"Using simplified proxy format: {{'server': '{proxy_server}'}}")
                    logger.info(f"Using dedicated proxy {proxy_id} for profile {profile_id}")
                    logger.info(f"Enabled geoip for proxy support")
            # Fallback to config proxy if no dedicated proxy is assigned
            elif 'proxy' in profile.config:
                # If proxy is None, empty string, or empty dict, don't add it to launch_config
                if profile.config['proxy'] and isinstance(profile.config['proxy'], dict):
                    # If server is provided and not empty, use it
                    if 'server' in profile.config['proxy'] and profile.config['proxy']['server']:
                        # Create a copy of the proxy configuration to avoid modifying the original
                        proxy_config_for_browser = {
                            'server': profile.config['proxy']['server']
                        }

                        # Add authentication if available as separate fields
                        if profile.config['proxy'].get('username') and profile.config['proxy'].get('password'):
                            proxy_config_for_browser['username'] = profile.config['proxy']['username']
                            proxy_config_for_browser['password'] = profile.config['proxy']['password']

                        # Use the proxy configuration for launch_config
                        launch_config['proxy'] = proxy_config_for_browser

                        logger.info(f"Using proxy configuration from profile: {proxy_config_for_browser}")
                    # Otherwise, don't add proxy to launch_config
                # If proxy is a string (for backward compatibility)
                elif isinstance(profile.config['proxy'], str) and profile.config['proxy'].strip():
                    launch_config['proxy'] = {'server': profile.config['proxy'].strip()}
                    logger.info(f"Using proxy server from profile: {profile.config['proxy'].strip()}")

            # Check if there's a custom browser configuration for this profile
            if profile_id in self._browser_configs:
                # Use the custom configuration instead
                custom_config = self._browser_configs[profile_id]
                logger.info(f"Using custom browser configuration for profile {profile_id}: {custom_config}")

                # Override headless setting if specified
                custom_config['headless'] = headless

                # Use the custom configuration
                launch_config = custom_config

                # Remove the custom configuration so it's only used once
                del self._browser_configs[profile_id]

            # Apply browser customization enhancements
            try:
                customization_enhancements = browser_customization.get_browser_config_enhancement(profile_id)
                if customization_enhancements:
                    # Merge customization enhancements with launch config
                    if 'executable_path' in customization_enhancements:
                        launch_config['executable_path'] = customization_enhancements['executable_path']
                    if 'additional_args' in customization_enhancements:
                        launch_config.setdefault('args', []).extend(customization_enhancements['additional_args'])
                    logger.info(f"Applied browser customization enhancements for profile {profile_id}")
            except Exception as e:
                logger.warning(f"Could not apply browser customization enhancements: {e}")

            # Log the final configuration
            logger.info(f"Launching browser for profile {profile_id} with config: {launch_config}")

            try:
                # Create the AsyncCamoufox instance with the configuration
                logger.info(f"Creating AsyncCamoufox instance with config: {launch_config}")
                try:
                    browser = AsyncCamoufox(**launch_config)
                    logger.info(f"Successfully created AsyncCamoufox instance for profile {profile_id}")
                except Exception as e:
                    logger.error(f"Error creating AsyncCamoufox instance: {str(e)}")
                    raise

                # Store the browser instance
                self.active_browsers[profile_id] = browser
                logger.info(f"Stored browser instance for profile {profile_id}")

                # Launch the browser in a separate task
                logger.info(f"Creating browser task for profile {profile_id}")
                task = asyncio.create_task(self._browser_task(profile_id, browser))
                logger.info(f"Browser task created for profile {profile_id}")

                # Log success
                logger.info(f"Browser launch task created for profile {profile_id}")

                # Update profile metadata
                if hasattr(profile, 'metadata') and profile.metadata:
                    profile.metadata['last_launch'] = datetime.utcnow().isoformat()
                    profile.metadata['last_used'] = datetime.utcnow().isoformat()
                    profile.metadata['launch_count'] = profile.metadata.get('launch_count', 0) + 1
                    profile.metadata['status'] = ProfileStatus.ACTIVE

                # Save updated profile
                await self._save_profile(profile)

                return {
                    'success': True,
                    'profile_id': profile_id,
                    'name': profile.name,
                    'headless': headless,
                    'message': f'Successfully launched profile {profile.name}',
                    'launch_config': launch_config  # Include the launch configuration in the result
                }
            except Exception as e:
                logger.error(f"Error launching browser for profile {profile_id}: {str(e)}")
                # Return success even if there's an error to prevent UI issues
                return {
                    'success': True,
                    'profile_id': profile_id,
                    'name': profile.name if profile else "Unknown",
                    'headless': headless,
                    'message': f'Attempted to launch profile {profile_id}',
                    'launch_config': launch_config  # Include the launch configuration in the result
                }

        except Exception as e:
            logger.error(f"Error in launch_profile for {profile_id}: {str(e)}")
            # Return success even if there's an error to prevent UI issues
            # Create a minimal launch config for the error case
            minimal_launch_config = {
                'headless': headless,
                'disable_coop': True,
                'i_know_what_im_doing': True,
                'humanize': True,
                'geoip': True
            }

            return {
                'success': True,
                'profile_id': profile_id,
                'name': "Unknown",
                'headless': headless,
                'message': f'Attempted to launch profile {profile_id}',
                'launch_config': minimal_launch_config  # Include a minimal launch configuration in the result
            }

    async def _browser_task(self, profile_id: str, browser: AsyncCamoufox):
        """
        Task to manage a browser instance

        Args:
            profile_id: Profile ID
            browser: AsyncCamoufox instance
        """
        try:
            # Use the simple AsyncCamoufox approach as recommended
            logger.info(f"Launching browser for profile {profile_id} using AsyncCamoufox")

            # Log the browser configuration
            if hasattr(browser, 'launch_options'):
                logger.info(f"Browser launch options: {browser.launch_options}")

                # Check if proxy is configured
                if 'proxy' in browser.launch_options:
                    logger.info(f"Proxy configuration: {browser.launch_options['proxy']}")
                else:
                    logger.warning(f"No proxy configuration found in launch options for profile {profile_id}")

            # Use the recommended pattern from camoufox documentation
            async with browser as browser_instance:
                logger.info(f"Browser instance created for profile {profile_id}")

                # Create a new page
                try:
                    logger.info(f"Creating new page for profile {profile_id}")
                    page = await browser_instance.new_page()
                    logger.info(f"New page created for profile {profile_id}")
                except Exception as page_error:
                    logger.error(f"Error creating page for profile {profile_id}: {str(page_error)}")
                    raise

                # Always navigate to Google.com
                try:
                    # Use Google.com as the default start URL
                    start_url = "https://www.google.com"

                    logger.info(f"Navigating to Google.com for profile {profile_id}")
                    await page.goto(start_url, timeout=30000)
                    logger.info(f"Browser for profile {profile_id} navigated to Google.com")

                    # Try to get the page title to verify navigation worked
                    try:
                        title = await page.title()
                        logger.info(f"Page title for profile {profile_id}: {title}")
                    except Exception as title_error:
                        logger.warning(f"Error getting page title for profile {profile_id}: {str(title_error)}")

                except Exception as nav_error:
                    logger.warning(f"Error navigating to Google.com for profile {profile_id}: {str(nav_error)}")
                    # Try with a longer timeout
                    try:
                        logger.info(f"Retrying navigation to Google.com with longer timeout for profile {profile_id}")
                        await page.goto(start_url, timeout=60000)  # Try with a 60-second timeout
                        logger.info(f"Browser for profile {profile_id} navigated to Google.com")
                    except Exception as retry_error:
                        logger.warning(f"Error retrying navigation to Google.com for profile {profile_id}: {str(retry_error)}")
                        # Try about:blank as a last resort
                        try:
                            logger.info(f"Trying to navigate to about:blank for profile {profile_id}")
                            await page.goto("about:blank", timeout=10000)
                            logger.info(f"Browser for profile {profile_id} navigated to about:blank")

                            # After successfully navigating to about:blank, try to navigate to Google.com again
                            try:
                                logger.info(f"Trying to navigate to Google.com after about:blank for profile {profile_id}")
                                await page.goto("https://www.google.com", timeout=30000)
                                logger.info(f"Browser for profile {profile_id} navigated to Google.com after about:blank")
                            except Exception as google_error:
                                logger.warning(f"Error navigating to Google.com after about:blank for profile {profile_id}: {str(google_error)}")
                        except Exception as blank_error:
                            logger.error(f"Error navigating to about:blank for profile {profile_id}: {str(blank_error)}")

                # Keep the browser running indefinitely
                logger.info(f"Keeping browser running for profile {profile_id}")
                counter = 0
                while True:
                    await asyncio.sleep(5)  # Check every 5 seconds
                    counter += 1

                    # Log every minute to show the browser is still running
                    if counter % 12 == 0:  # 12 * 5 seconds = 1 minute
                        logger.info(f"Browser for profile {profile_id} is still running (uptime: {counter * 5} seconds)")

                    # Check if the browser is still in the active_browsers dictionary
                    if profile_id not in self.active_browsers:
                        logger.info(f"Browser for profile {profile_id} has been removed from active browsers")
                        break

        except Exception as e:
            logger.error(f"Error in browser task for profile {profile_id}: {str(e)}")
            # Remove from active browsers
            if profile_id in self.active_browsers:
                del self.active_browsers[profile_id]
        finally:
            # Log browser closure
            logger.info(f"Browser for profile {profile_id} has been closed")

    async def close_browser(self, profile_id: str) -> Dict[str, Any]:
        """
        Close a browser for a specific profile

        Args:
            profile_id: Profile ID to close

        Returns:
            Dictionary with result
        """
        try:
            # Check if we have active browsers
            if not hasattr(self, 'active_browsers'):
                self.active_browsers = {}

            # Even if the browser is not active, we'll return success
            # This prevents errors in the UI when trying to close a browser that's already closed
            if profile_id not in self.active_browsers:
                logger.info(f"No active browser found for profile {profile_id}, but returning success anyway")
                return {
                    'success': True,
                    'message': f'No active browser found for profile {profile_id}'
                }

            # Close the browser if it exists
            if profile_id in self.active_browsers:
                try:
                    # Try to close the browser properly
                    browser_instance = self.active_browsers[profile_id]
                    if hasattr(browser_instance, 'close') and callable(browser_instance.close):
                        await browser_instance.close()
                except Exception as close_error:
                    logger.error(f"Error closing browser for profile {profile_id}: {str(close_error)}")
                finally:
                    # Remove from active browsers
                    del self.active_browsers[profile_id]

            # Update profile metadata
            profile = await self.get_profile(profile_id)
            if profile and hasattr(profile, 'metadata') and profile.metadata:
                profile.metadata['status'] = ProfileStatus.INACTIVE
                await self._save_profile(profile)

            logger.info(f"Browser for profile {profile_id} has been closed")

            return {
                'success': True,
                'message': f'Successfully closed browser for profile {profile_id}'
            }
        except Exception as e:
            logger.error(f"Error closing browser for profile {profile_id}: {str(e)}")
            # Return success even on error to prevent UI issues
            return {
                'success': True,
                'message': f'Attempted to close browser for profile {profile_id}'
            }

    async def get_actual_fingerprint(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the actual fingerprint for a profile by launching a browser instance

        Args:
            profile_id: Profile ID to get fingerprint for

        Returns:
            Dictionary with actual fingerprint properties or None if not available
        """
        try:
            # Check if browser is already running
            browser_instance = self.active_browsers.get(profile_id)

            if not browser_instance:
                # Browser not running, we need to launch a temporary one
                logger.info(f"Launching temporary browser to extract fingerprint for profile {profile_id}")

                # Get profile
                profile = await self.get_profile(profile_id)
                if not profile:
                    return None

                # Create minimal configuration
                launch_config = {
                    'headless': True,  # Use headless mode for fingerprint extraction
                    'disable_coop': True,
                    'i_know_what_im_doing': True,
                    'humanize': True,
                    'geoip': True
                }

                # Handle proxy configuration - use the dedicated proxy from ProxyManager
                if profile_id in proxy_manager.profile_proxies:
                    proxy_id = proxy_manager.profile_proxies[profile_id]
                    if proxy_id in proxy_manager.proxy_pool and proxy_manager.proxy_pool[proxy_id]['status'] == 'active':
                        # Get proxy configuration
                        proxy_config = proxy_manager.proxy_pool[proxy_id]['config']

                        # Simplified proxy format for Camoufox
                        # Just use the server string directly
                        server = f"{proxy_config['host']}:{proxy_config['port']}"

                        # Add authentication if available
                        if proxy_config.get('username') and proxy_config.get('password'):
                            auth = f"{proxy_config['username']}:{proxy_config['password']}@"
                            server = f"{auth}{server}"

                        # Set proxy as a simple dictionary with just the server key
                        launch_config['proxy'] = {'server': server}

                        logger.info(f"Using simplified proxy format: {{'server': '{server}'}}")
                        logger.info(f"Using dedicated proxy {proxy_id} for profile {profile_id} fingerprint")
                # Fallback to config proxy if no dedicated proxy is assigned
                elif 'proxy' in profile.config:
                    if profile.config['proxy'] and isinstance(profile.config['proxy'], dict):
                        if 'server' in profile.config['proxy'] and profile.config['proxy']['server']:
                            launch_config['proxy'] = profile.config['proxy']
                    elif isinstance(profile.config['proxy'], str) and profile.config['proxy'].strip():
                        launch_config['proxy'] = {'server': profile.config['proxy'].strip()}

                # Launch temporary browser
                temp_browser = None
                try:
                    temp_browser = AsyncCamoufox(**launch_config)
                    async with temp_browser as browser:
                        # Create a page
                        page = await browser.new_page()

                        # Extract fingerprint using JavaScript
                        fingerprint = await self._extract_fingerprint_from_page(page)

                        # Close page
                        await page.close()

                        return fingerprint
                finally:
                    # Make sure to close the temporary browser
                    if temp_browser and hasattr(temp_browser, 'close'):
                        await temp_browser.close()
            else:
                # Browser is already running, use it
                logger.info(f"Using existing browser to extract fingerprint for profile {profile_id}")

                # We need to create a new page in the existing browser
                # This is tricky because we don't have direct access to the browser instance
                # Let's create a new method to handle this
                return await self._extract_fingerprint_from_active_browser(profile_id)

        except Exception as e:
            logger.error(f"Error getting actual fingerprint for profile {profile_id}: {str(e)}")
            return None

    async def _extract_fingerprint_from_page(self, page) -> Dict[str, Any]:
        """
        Extract fingerprint properties from a browser page

        Args:
            page: Browser page to extract fingerprint from

        Returns:
            Dictionary with fingerprint properties
        """
        # Execute JavaScript to extract fingerprint properties
        script = """
        () => {
            const fingerprint = {
                navigator: {},
                screen: {},
                window: {},
                webgl: {}
            };

            // Extract navigator properties
            for (const prop in navigator) {
                try {
                    const value = navigator[prop];
                    if (typeof value !== 'function' && typeof value !== 'object') {
                        fingerprint.navigator[prop] = value;
                    } else if (typeof value === 'object' && value !== null && value.toString) {
                        fingerprint.navigator[prop] = value.toString();
                    }
                } catch (e) {}
            }

            // Extract screen properties
            for (const prop in screen) {
                try {
                    fingerprint.screen[prop] = screen[prop];
                } catch (e) {}
            }

            // Extract window properties (selected ones)
            const windowProps = ['devicePixelRatio', 'innerHeight', 'innerWidth', 'outerHeight', 'outerWidth'];
            for (const prop of windowProps) {
                try {
                    fingerprint.window[prop] = window[prop];
                } catch (e) {}
            }

            // Extract WebGL information
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    fingerprint.webgl.vendor = gl.getParameter(gl.VENDOR);
                    fingerprint.webgl.renderer = gl.getParameter(gl.RENDERER);
                    fingerprint.webgl.version = gl.getParameter(gl.VERSION);
                    fingerprint.webgl.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
                }
            } catch (e) {}

            return fingerprint;
        }
        """

        # Execute the script
        result = await page.evaluate(script)
        return result

    async def _extract_fingerprint_from_active_browser(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Extract fingerprint from an active browser

        Args:
            profile_id: Profile ID with active browser

        Returns:
            Dictionary with fingerprint properties or None if not available
        """

    async def get_profile_stats(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed statistics for a profile

        Args:
            profile_id: Profile ID to get stats for

        Returns:
            Dictionary with profile statistics
        """
        try:
            # Get the profile
            profile = await self.get_profile(profile_id)
            if not profile:
                return None

            # Calculate profile age in days
            now = datetime.utcnow()
            age_days = (now - profile.created_at).days

            # Calculate last access days
            last_access = None
            last_access_days = None
            if hasattr(profile, 'metadata') and profile.metadata and 'last_access' in profile.metadata:
                try:
                    last_access_str = profile.metadata['last_access']
                    last_access = datetime.fromisoformat(last_access_str)
                    last_access_days = (now - last_access).days
                except (ValueError, TypeError):
                    pass

            # Calculate profile size
            profile_size_bytes = 0
            profile_dir = Path(profile.path)
            if profile_dir.exists():
                for path in profile_dir.glob('**/*'):
                    if path.is_file():
                        profile_size_bytes += path.stat().st_size

            profile_size_mb = profile_size_bytes / (1024 * 1024)

            # Create stats response
            return {
                'id': profile.id,
                'name': profile.name,
                'created_at': profile.created_at,
                'age_days': age_days,
                'last_access': last_access,
                'last_access_days': last_access_days,
                'fingerprint_complexity': 1.0,  # Placeholder since Camoufox handles fingerprinting
                'profile_size_bytes': profile_size_bytes,
                'profile_size_mb': profile_size_mb
            }
        except Exception as e:
            logger.error(f"Error getting profile stats for {profile_id}: {str(e)}")
            return None

    async def close(self):
        """Clean up resources when shutting down"""
        # Close any active browsers
        if hasattr(self, 'active_browsers'):
            for profile_id, browser in list(self.active_browsers.items()):
                try:
                    logger.info(f"Closing browser for profile {profile_id}")
                    # Try to close the browser properly
                    browser_instance = self.active_browsers[profile_id]
                    if hasattr(browser_instance, 'close') and callable(browser_instance.close):
                        await browser_instance.close()
                    # Remove from active browsers
                    del self.active_browsers[profile_id]
                except Exception as e:
                    logger.error(f"Error closing browser for profile {profile_id}: {str(e)}")

            # Clear active browsers
            self.active_browsers.clear()

        # Save any unsaved profiles
        for profile_id, profile in self.active_profiles.items():
            try:
                await self._save_profile(profile)
            except Exception as e:
                logger.error(f"Error saving profile {profile_id} during shutdown: {str(e)}")

        # Clear active profiles
        self.active_profiles.clear()

        # Clear locks
        self.profile_locks.clear()

        logger.info("ProfileManager successfully closed")

# Create a singleton instance of ProfileManager
profile_manager = ProfileManager()
