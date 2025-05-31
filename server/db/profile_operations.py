"""
Profile database operations module.

This module serves as a bridge/sync layer between ProfileManager (file-based) and database storage.
It provides:
- Automatic synchronization between local files and database
- Enhanced database features (tags, metadata, search, filtering)
- Unified data flow through ProfileManager as source of truth
- Database-powered search and organizational capabilities

The database serves as an enhancement layer while ProfileManager handles all operational tasks.
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
logger = logging.getLogger("camoufox.db.profiles")

# Import ProfileManager singleton
from core.profile_manager import profile_manager, ProfileData

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

class ProfileOperations:
    """
    Bridge/sync layer between ProfileManager and database.

    This class provides unified profile operations by:
    - Using ProfileManager as the source of truth for operational data
    - Automatically syncing all changes to the database
    - Providing enhanced database features (tags, metadata, search)
    - Maintaining data consistency between local files and database
    """

    def __init__(self):
        """Initialize the profile database bridge."""
        self.supabase = supabase
        self.profile_manager = profile_manager
        # Initialize sync on startup (will be called when event loop is available)
        self._sync_initialized = False

    async def _ensure_sync_initialized(self):
        """Ensure synchronization is initialized (called on first use)."""
        if not self._sync_initialized and self.supabase:
            try:
                logger.info("Initializing profile synchronization...")
                await self.sync_all_profiles()
                self._sync_initialized = True
                logger.info("Profile synchronization initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing profile sync: {str(e)}")

    async def _initialize_sync(self):
        """Initialize synchronization between ProfileManager and database."""
        if not self.supabase:
            logger.warning("Supabase not available, skipping sync initialization")
            return

        try:
            logger.info("Initializing profile synchronization...")
            await self.sync_all_profiles()
            self._sync_initialized = True
            logger.info("Profile synchronization initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing profile sync: {str(e)}")

    async def sync_profile_to_db(self, profile_data: ProfileData) -> bool:
        """
        Sync a ProfileManager profile to the database.

        Args:
            profile_data: ProfileData object to sync

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase:
            return False

        try:
            # Convert ProfileData to database format
            db_profile = {
                'id': profile_data.id,
                'name': profile_data.name,
                'config': profile_data.config,
                'created_at': profile_data.created_at.isoformat(),
                'updated_at': profile_data.updated_at.isoformat() if profile_data.updated_at else None
            }

            # Add metadata to config if not present
            if 'metadata' not in db_profile['config']:
                db_profile['config']['metadata'] = profile_data.metadata or {}
            else:
                # Merge metadata
                db_profile['config']['metadata'] = {
                    **db_profile['config']['metadata'],
                    **profile_data.metadata
                }

            # Try to update first, then insert if not exists
            response = self.supabase.table('profiles').upsert(db_profile).execute()

            if response.data:
                logger.debug(f"Synced profile {profile_data.id} to database")
                return True
            return False
        except Exception as e:
            logger.error(f"Error syncing profile {profile_data.id} to database: {str(e)}")
            return False

    async def sync_profile_from_db(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Get enhanced profile data from database (metadata, tags, etc.).

        Args:
            profile_id: Profile ID to get database data for

        Returns:
            Database profile data or None if not found
        """
        if not self.supabase:
            return None

        try:
            response = self.supabase.table('profiles').select('*').eq('id', profile_id).single().execute()
            return response.data
        except Exception as e:
            logger.debug(f"Profile {profile_id} not found in database: {str(e)}")
            return None

    async def sync_all_profiles(self):
        """Sync all ProfileManager profiles to database."""
        if not self.supabase:
            return

        try:
            # Get all profiles from ProfileManager
            profiles = await self.profile_manager.list_profiles()

            for profile in profiles:
                await self.sync_profile_to_db(profile)

            logger.info(f"Synced {len(profiles)} profiles to database")
        except Exception as e:
            logger.error(f"Error syncing all profiles: {str(e)}")

    async def list_profiles(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get all profiles with enhanced database features and filtering.

        Uses ProfileManager as source of truth, enhanced with database metadata.

        Args:
            filters: Optional dictionary of filters to apply
                - search: Search string for profile name
                - os: Filter by operating system
                - browser: Filter by browser type
                - sort_by: Field to sort by
                - sort_order: 'asc' or 'desc'
                - has_proxy: Filter profiles with/without proxies

        Returns:
            List of enhanced profile dictionaries
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()
            # Get all profiles from ProfileManager (source of truth)
            pm_profiles = await self.profile_manager.list_profiles()

            # Convert to dict format and enhance with database data
            enhanced_profiles = []
            for profile in pm_profiles:
                # Convert ProfileData to dict
                profile_dict = {
                    'id': profile.id,
                    'name': profile.name,
                    'created_at': profile.created_at.isoformat(),
                    'updated_at': profile.updated_at.isoformat() if profile.updated_at else None,
                    'config': profile.config,
                    'path': profile.path,
                    'metadata': profile.metadata or {}
                }

                # Enhance with database metadata if available
                db_data = await self.sync_profile_from_db(profile.id)
                if db_data and 'config' in db_data and 'metadata' in db_data['config']:
                    # Merge database metadata
                    profile_dict['metadata'] = {
                        **profile_dict['metadata'],
                        **db_data['config']['metadata']
                    }

                    # Add database-specific fields
                    if 'fingerprint' in db_data:
                        profile_dict['fingerprint'] = db_data['fingerprint']

                enhanced_profiles.append(profile_dict)

            # Apply filters if provided
            if filters:
                filtered_profiles = []
                for profile in enhanced_profiles:
                    # Search filter
                    if 'search' in filters and filters['search']:
                        search_term = filters['search'].lower()
                        if search_term not in profile['name'].lower():
                            continue

                    # OS filter
                    if 'os' in filters and filters['os']:
                        if profile['config'].get('os') != filters['os']:
                            continue

                    # Browser filter
                    if 'browser' in filters and filters['browser']:
                        if profile['config'].get('browser') != filters['browser']:
                            continue

                    # Proxy filter
                    if 'has_proxy' in filters:
                        has_proxy = bool(profile['config'].get('proxy'))
                        if has_proxy != filters['has_proxy']:
                            continue

                    filtered_profiles.append(profile)

                enhanced_profiles = filtered_profiles

            # Apply sorting
            if filters and 'sort_by' in filters and filters['sort_by']:
                sort_field = filters['sort_by']
                reverse = filters.get('sort_order', 'asc') == 'desc'

                def get_sort_value(profile):
                    if sort_field in profile:
                        return profile[sort_field] or ''
                    elif sort_field in profile.get('config', {}):
                        return profile['config'][sort_field] or ''
                    elif sort_field in profile.get('metadata', {}):
                        return profile['metadata'][sort_field] or ''
                    return ''

                enhanced_profiles.sort(key=get_sort_value, reverse=reverse)
            else:
                # Default sort by updated_at descending
                enhanced_profiles.sort(
                    key=lambda p: p.get('updated_at') or p.get('created_at') or '',
                    reverse=True
                )

            return enhanced_profiles

        except Exception as e:
            logger.error(f"Error listing enhanced profiles: {str(e)}")
            return []

    async def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single profile by ID with enhanced database metadata.

        Uses ProfileManager as source of truth, enhanced with database data.

        Args:
            profile_id: The ID of the profile to retrieve

        Returns:
            Enhanced profile dictionary or None if not found
        """
        try:
            # Get profile from ProfileManager (source of truth)
            pm_profile = await self.profile_manager.get_profile(profile_id)
            if not pm_profile:
                return None

            # Convert ProfileData to dict
            profile_dict = {
                'id': pm_profile.id,
                'name': pm_profile.name,
                'created_at': pm_profile.created_at.isoformat(),
                'updated_at': pm_profile.updated_at.isoformat() if pm_profile.updated_at else None,
                'config': pm_profile.config,
                'path': pm_profile.path,
                'metadata': pm_profile.metadata or {}
            }

            # Enhance with database metadata if available
            db_data = await self.sync_profile_from_db(profile_id)
            if db_data:
                if 'config' in db_data and 'metadata' in db_data['config']:
                    # Merge database metadata
                    profile_dict['metadata'] = {
                        **profile_dict['metadata'],
                        **db_data['config']['metadata']
                    }

                # Add database-specific fields
                if 'fingerprint' in db_data:
                    profile_dict['fingerprint'] = db_data['fingerprint']

            return profile_dict

        except Exception as e:
            logger.error(f"Error getting enhanced profile {profile_id}: {str(e)}")
            return None

    async def create_profile(self, profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new profile using ProfileManager and sync to database.

        Uses ProfileManager as source of truth, then syncs to database.

        Args:
            profile: Profile data dictionary with:
                - id: Optional profile ID (generated if not provided)
                - name: Profile name
                - config: Profile configuration

        Returns:
            Created enhanced profile dictionary or None if creation failed
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()
            # Create profile using ProfileManager (source of truth)
            pm_profile = await self.profile_manager.create_profile(
                profile_id=profile.get('id'),
                name=profile.get('name'),
                config=profile.get('config', {})
            )

            if not pm_profile:
                logger.error("Failed to create profile in ProfileManager")
                return None

            # Sync to database
            await self.sync_profile_to_db(pm_profile)

            # Return enhanced profile data
            return await self.get_profile(pm_profile.id)

        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            return None

    async def update_profile(self, profile_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing profile using ProfileManager and sync to database.

        Uses ProfileManager as source of truth, then syncs to database.

        Args:
            profile_id: ID of the profile to update
            updates: Dictionary of updates to apply

        Returns:
            Updated enhanced profile dictionary or None if update failed
        """
        try:
            # Update profile using ProfileManager (source of truth)
            pm_profile = await self.profile_manager.update_profile(profile_id, updates)

            if not pm_profile:
                logger.error(f"Failed to update profile {profile_id} in ProfileManager")
                return None

            # Sync to database
            await self.sync_profile_to_db(pm_profile)

            # Return enhanced profile data
            return await self.get_profile(profile_id)

        except Exception as e:
            logger.error(f"Error updating profile {profile_id}: {str(e)}")
            return None

    async def delete_profile(self, profile_id: str) -> bool:
        """
        Delete a profile using ProfileManager and remove from database.

        Uses ProfileManager as source of truth, then removes from database.

        Args:
            profile_id: ID of the profile to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            # Delete profile using ProfileManager (source of truth)
            pm_success = await self.profile_manager.delete_profile(profile_id)

            if not pm_success:
                logger.error(f"Failed to delete profile {profile_id} from ProfileManager")
                return False

            # Remove from database
            if self.supabase:
                try:
                    response = self.supabase.table('profiles').delete().eq('id', profile_id).execute()
                    logger.debug(f"Removed profile {profile_id} from database")
                except Exception as e:
                    logger.warning(f"Failed to remove profile {profile_id} from database: {str(e)}")
                    # Don't fail the operation if database removal fails

            return True

        except Exception as e:
            logger.error(f"Error deleting profile {profile_id}: {str(e)}")
            return False

    async def update_status(self, profile_id: str, is_active: bool) -> Optional[Dict[str, Any]]:
        """
        Update profile status in the database.

        Args:
            profile_id: ID of the profile to update
            is_active: Whether the profile is active

        Returns:
            Updated profile dictionary or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Get current profile to update config
            current_profile = await self.get_profile(profile_id)
            if not current_profile:
                logger.error(f"Profile {profile_id} not found for status update")
                return None

            # Get current config
            config = current_profile.get('config', {})

            # Update status in config.metadata
            if 'metadata' not in config:
                config['metadata'] = {}

            config['metadata']['is_active'] = is_active
            config['metadata']['last_active'] = datetime.utcnow().isoformat() if is_active else config['metadata'].get('last_active')

            # Update the profile
            response = self.supabase.table('profiles').update({
                'config': config
            }).eq('id', profile_id).execute()

            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating profile status {profile_id} in database: {str(e)}")
            return None

    async def update_metadata(self, profile_id: str, metadata: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update profile metadata in the database.

        Args:
            profile_id: ID of the profile to update
            metadata: Metadata to update

        Returns:
            Updated profile dictionary or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Get current profile to update config
            current_profile = await self.get_profile(profile_id)
            if not current_profile:
                logger.error(f"Profile {profile_id} not found for metadata update")
                return None

            # Get current config
            config = current_profile.get('config', {})

            # Update metadata in config
            if 'metadata' not in config:
                config['metadata'] = {}

            config['metadata'] = {
                **config['metadata'],
                **metadata
            }

            # Update the profile
            response = self.supabase.table('profiles').update({
                'config': config
            }).eq('id', profile_id).execute()

            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating profile metadata {profile_id} in database: {str(e)}")
            return None

    async def add_tag(self, profile_id: str, tag: str) -> Optional[List[str]]:
        """
        Add a tag to a profile.

        Args:
            profile_id: ID of the profile to update
            tag: Tag to add

        Returns:
            Updated list of tags or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Get current profile to update config
            current_profile = await self.get_profile(profile_id)
            if not current_profile:
                logger.error(f"Profile {profile_id} not found for tag update")
                return None

            # Get current config
            config = current_profile.get('config', {})

            # Get metadata
            if 'metadata' not in config:
                config['metadata'] = {}

            # Get tags
            tags = config['metadata'].get('tags', [])

            # Add tag if not already present
            if tag not in tags:
                tags.append(tag)

            # Update tags in metadata
            config['metadata']['tags'] = tags

            # Update the profile
            response = self.supabase.table('profiles').update({
                'config': config
            }).eq('id', profile_id).execute()

            if response.data:
                return response.data[0]['config']['metadata']['tags']
            return None
        except Exception as e:
            logger.error(f"Error adding tag to profile {profile_id} in database: {str(e)}")
            return None

    async def remove_tag(self, profile_id: str, tag: str) -> Optional[List[str]]:
        """
        Remove a tag from a profile.

        Args:
            profile_id: ID of the profile to update
            tag: Tag to remove

        Returns:
            Updated list of tags or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Get current profile to update config
            current_profile = await self.get_profile(profile_id)
            if not current_profile:
                logger.error(f"Profile {profile_id} not found for tag update")
                return None

            # Get current config
            config = current_profile.get('config', {})

            # Get metadata
            if 'metadata' not in config:
                config['metadata'] = {}

            # Get tags
            tags = config['metadata'].get('tags', [])

            # Remove tag if present
            if tag in tags:
                tags.remove(tag)

            # Update tags in metadata
            config['metadata']['tags'] = tags

            # Update the profile
            response = self.supabase.table('profiles').update({
                'config': config
            }).eq('id', profile_id).execute()

            if response.data:
                return response.data[0]['config']['metadata']['tags']
            return None
        except Exception as e:
            logger.error(f"Error removing tag from profile {profile_id} in database: {str(e)}")
            return None

    async def store_fingerprint(self, profile_id: str, fingerprint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Store fingerprint data for a profile in the database.

        Args:
            profile_id: ID of the profile to update
            fingerprint: Fingerprint data to store

        Returns:
            Updated profile dictionary or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Update the profile with fingerprint data
            response = self.supabase.table('profiles').update({
                'fingerprint': fingerprint
            }).eq('id', profile_id).execute()

            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error storing fingerprint for profile {profile_id} in database: {str(e)}")
            return None

    # ===== OPERATIONAL METHODS (Pass-through to ProfileManager) =====

    async def launch_profile(self, profile_id: str, headless: bool = False) -> Dict[str, Any]:
        """
        Launch a browser with the specified profile.

        Pass-through to ProfileManager for operational functionality.
        """
        try:
            result = await self.profile_manager.launch_profile(profile_id, headless)

            # Update last access in database if available
            if self.supabase and result.get('success'):
                try:
                    await self.update_metadata(profile_id, {
                        'last_access': datetime.utcnow().isoformat(),
                        'last_launch': datetime.utcnow().isoformat()
                    })
                except Exception as e:
                    logger.warning(f"Failed to update last access for profile {profile_id}: {str(e)}")

            return result
        except Exception as e:
            logger.error(f"Error launching profile {profile_id}: {str(e)}")
            return {'success': False, 'error': str(e)}

    async def close_browser(self, profile_id: str) -> Dict[str, Any]:
        """
        Close a browser instance for the specified profile.

        Pass-through to ProfileManager for operational functionality.
        """
        try:
            return await self.profile_manager.close_browser(profile_id)
        except Exception as e:
            logger.error(f"Error closing browser for profile {profile_id}: {str(e)}")
            return {'success': False, 'error': str(e)}

    async def get_actual_fingerprint(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the actual fingerprint for a profile.

        Pass-through to ProfileManager for operational functionality.
        """
        try:
            fingerprint = await self.profile_manager.get_actual_fingerprint(profile_id)

            # Store fingerprint in database if available
            if fingerprint and self.supabase:
                try:
                    await self.store_fingerprint(profile_id, fingerprint)
                except Exception as e:
                    logger.warning(f"Failed to store fingerprint for profile {profile_id}: {str(e)}")

            return fingerprint
        except Exception as e:
            logger.error(f"Error getting fingerprint for profile {profile_id}: {str(e)}")
            return None

    async def get_profile_stats(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed statistics for a profile.

        Pass-through to ProfileManager for operational functionality.
        """
        try:
            return await self.profile_manager.get_profile_stats(profile_id)
        except Exception as e:
            logger.error(f"Error getting stats for profile {profile_id}: {str(e)}")
            return None

    def set_browser_config(self, profile_id: str, config: Dict[str, Any]) -> None:
        """
        Set a custom browser configuration for a profile.

        Pass-through to ProfileManager for operational functionality.
        """
        try:
            self.profile_manager.set_browser_config(profile_id, config)
        except Exception as e:
            logger.error(f"Error setting browser config for profile {profile_id}: {str(e)}")

    async def search_profiles(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for profiles by name or other properties.

        Enhanced search using both ProfileManager and database capabilities.
        """
        try:
            # Use ProfileManager search as base
            pm_profiles = await self.profile_manager.search_profiles(query)

            # Convert to enhanced format
            enhanced_profiles = []
            for profile in pm_profiles:
                profile_dict = {
                    'id': profile.id,
                    'name': profile.name,
                    'created_at': profile.created_at.isoformat(),
                    'updated_at': profile.updated_at.isoformat() if profile.updated_at else None,
                    'config': profile.config,
                    'path': profile.path,
                    'metadata': profile.metadata or {}
                }

                # Enhance with database metadata
                db_data = await self.sync_profile_from_db(profile.id)
                if db_data and 'config' in db_data and 'metadata' in db_data['config']:
                    profile_dict['metadata'] = {
                        **profile_dict['metadata'],
                        **db_data['config']['metadata']
                    }

                enhanced_profiles.append(profile_dict)

            return enhanced_profiles

        except Exception as e:
            logger.error(f"Error searching profiles: {str(e)}")
            return []

# Create a singleton instance
profile_operations = ProfileOperations()
