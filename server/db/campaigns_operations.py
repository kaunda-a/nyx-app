"""
Campaign database operations module.

This module serves as a bridge/sync layer between CampaignsManager (operational) and database storage.
It provides:
- Automatic synchronization between CampaignsManager and database
- Enhanced database features (search, filtering, analytics)
- Unified data flow through CampaignsManager as source of truth
- Database-powered campaign management and statistics tracking

The database serves as an enhancement layer while CampaignsManager handles all operational tasks.
"""

from typing import Dict, List, Optional, Any, Union, Tuple
import logging
import uuid
from datetime import datetime
import json
import os
from pathlib import Path
from enum import Enum
import asyncio

# Configure logger
logger = logging.getLogger("camoufox.db.campaigns")

# Import CampaignsManager singleton
from core.campaigns_manager import (
    campaigns_manager,
    Campaign,
    CampaignStatus,
    VisitFrequency,
    EngagementLevel,
    AdInteraction,
    TimeOfDay,
    BehavioralPattern
)

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

class CampaignsOperations:
    """
    Bridge/sync layer between CampaignsManager and database.

    This class provides unified campaign operations by:
    - Using CampaignsManager as the source of truth for operational data
    - Automatically syncing all changes to the database
    - Providing enhanced database features (search, filtering, analytics)
    - Maintaining data consistency between CampaignsManager and database
    """

    def __init__(self):
        """Initialize the campaign database bridge."""
        self.supabase = supabase
        self.campaigns_manager = campaigns_manager
        # Initialize sync on startup (will be called when event loop is available)
        self._sync_initialized = False

    async def _ensure_sync_initialized(self):
        """Ensure synchronization is initialized (called on first use)."""
        if not self._sync_initialized and self.supabase:
            try:
                logger.info("Initializing campaign synchronization...")
                await self.sync_all_campaigns()
                self._sync_initialized = True
                logger.info("Campaign synchronization initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing campaign sync: {str(e)}")

    async def sync_campaign_to_db(self, campaign: Campaign) -> bool:
        """
        Sync a CampaignsManager campaign to the database.

        Args:
            campaign: Campaign object from CampaignsManager

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase:
            return False

        try:
            # Convert Campaign object to database format
            db_campaign = {
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'status': campaign.status.value,
                'urls': campaign.urls,
                'profile_ids': campaign.profile_ids,
                'visit_frequency': campaign.visit_frequency.value,
                'engagement_level': campaign.engagement_level.value,
                'ad_interaction': campaign.ad_interaction.value,
                'created_at': campaign.created_at.isoformat(),
                'updated_at': campaign.updated_at.isoformat(),
                'start_date': campaign.start_date.isoformat() if campaign.start_date else None,
                'end_date': campaign.end_date.isoformat() if campaign.end_date else None,
                'custom_frequency': campaign.custom_frequency,
                'custom_engagement': campaign.custom_engagement,
                'custom_interaction': campaign.custom_interaction,
                'behavioral_evolution': campaign.behavioral_evolution,
                'device_rotation': campaign.device_rotation,
                'geo_distribution': campaign.geo_distribution,
                'total_visits': campaign.total_visits,
                'total_impressions': campaign.total_impressions,
                'total_clicks': campaign.total_clicks,
                'estimated_revenue': campaign.estimated_revenue
            }

            # Try to update first, then insert if not exists
            response = self.supabase.table('campaigns').upsert(db_campaign).execute()

            if response.data:
                logger.debug(f"Synced campaign {campaign.id} to database")
                return True
            return False
        except Exception as e:
            logger.error(f"Error syncing campaign {campaign.id} to database: {str(e)}")
            return False

    async def sync_campaign_from_db(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """
        Get enhanced campaign data from database.

        Args:
            campaign_id: Campaign ID to get database data for

        Returns:
            Database campaign data or None if not found
        """
        if not self.supabase:
            return None

        try:
            response = self.supabase.table('campaigns').select('*').eq('id', campaign_id).single().execute()
            return response.data
        except Exception as e:
            logger.debug(f"Campaign {campaign_id} not found in database: {str(e)}")
            return None

    async def sync_all_campaigns(self):
        """Sync all CampaignsManager campaigns to database."""
        if not self.supabase:
            return

        try:
            # Get all campaigns from CampaignsManager
            campaigns = await self.campaigns_manager.list_campaigns()

            for campaign in campaigns:
                await self.sync_campaign_to_db(campaign)

            logger.info(f"Synced {len(campaigns)} campaigns to database")
        except Exception as e:
            logger.error(f"Error syncing all campaigns: {str(e)}")

    async def list_campaigns(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get all campaigns with enhanced database features and filtering.

        Uses CampaignsManager as source of truth, enhanced with database metadata.

        Args:
            filters: Optional dictionary of filters to apply
                - search: Search string for campaign name
                - status: Filter by status
                - profile_id: Filter by profile ID
                - sort_by: Field to sort by
                - sort_order: 'asc' or 'desc'

        Returns:
            List of enhanced campaign dictionaries
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Get all campaigns from CampaignsManager (source of truth)
            cm_campaigns = await self.campaigns_manager.list_campaigns()

            # Convert to enhanced format with database data
            enhanced_campaigns = []
            for campaign in cm_campaigns:
                # Convert Campaign object to dict
                campaign_dict = {
                    'id': campaign.id,
                    'name': campaign.name,
                    'description': campaign.description,
                    'status': campaign.status.value,
                    'created_at': campaign.created_at.isoformat(),
                    'updated_at': campaign.updated_at.isoformat(),
                    'urls': campaign.urls,
                    'profile_ids': campaign.profile_ids,
                    'visit_frequency': campaign.visit_frequency.value,
                    'engagement_level': campaign.engagement_level.value,
                    'ad_interaction': campaign.ad_interaction.value,
                    'start_date': campaign.start_date.isoformat() if campaign.start_date else None,
                    'end_date': campaign.end_date.isoformat() if campaign.end_date else None,
                    'custom_frequency': campaign.custom_frequency,
                    'custom_engagement': campaign.custom_engagement,
                    'custom_interaction': campaign.custom_interaction,
                    'behavioral_evolution': campaign.behavioral_evolution,
                    'device_rotation': campaign.device_rotation,
                    'geo_distribution': campaign.geo_distribution,
                    'total_visits': campaign.total_visits,
                    'total_impressions': campaign.total_impressions,
                    'total_clicks': campaign.total_clicks,
                    'estimated_revenue': campaign.estimated_revenue
                }

                # Enhance with database metadata if available
                db_data = await self.sync_campaign_from_db(campaign.id)
                if db_data:
                    # Add any database-specific fields that might not be in CampaignsManager
                    for key, value in db_data.items():
                        if key not in campaign_dict and value is not None:
                            campaign_dict[key] = value

                enhanced_campaigns.append(campaign_dict)

            # Apply filters if provided
            if filters:
                filtered_campaigns = []
                for campaign in enhanced_campaigns:
                    # Search filter
                    if 'search' in filters and filters['search']:
                        search_term = filters['search'].lower()
                        if search_term not in campaign['name'].lower():
                            if not campaign.get('description') or search_term not in campaign['description'].lower():
                                continue

                    # Status filter
                    if 'status' in filters and filters['status']:
                        if campaign['status'] != filters['status']:
                            continue

                    # Profile ID filter
                    if 'profile_id' in filters and filters['profile_id']:
                        if filters['profile_id'] not in campaign.get('profile_ids', []):
                            continue

                    filtered_campaigns.append(campaign)

                enhanced_campaigns = filtered_campaigns

            # Apply sorting
            if filters and 'sort_by' in filters and filters['sort_by']:
                sort_field = filters['sort_by']
                reverse = filters.get('sort_order', 'asc') == 'desc'

                def get_sort_value(campaign):
                    return campaign.get(sort_field, '')

                enhanced_campaigns.sort(key=get_sort_value, reverse=reverse)
            else:
                # Default sort by updated_at descending
                enhanced_campaigns.sort(
                    key=lambda c: c.get('updated_at') or c.get('created_at') or '',
                    reverse=True
                )

            return enhanced_campaigns

        except Exception as e:
            logger.error(f"Error listing enhanced campaigns: {str(e)}")
            return []

    async def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single campaign by ID with enhanced database metadata.

        Uses CampaignsManager as source of truth, enhanced with database data.

        Args:
            campaign_id: The ID of the campaign to retrieve

        Returns:
            Enhanced campaign dictionary or None if not found
        """
        try:
            # Get campaign from CampaignsManager (source of truth)
            cm_campaign = await self.campaigns_manager.get_campaign(campaign_id)
            if not cm_campaign:
                return None

            # Convert Campaign object to dict
            campaign_dict = {
                'id': cm_campaign.id,
                'name': cm_campaign.name,
                'description': cm_campaign.description,
                'status': cm_campaign.status.value,
                'created_at': cm_campaign.created_at.isoformat(),
                'updated_at': cm_campaign.updated_at.isoformat(),
                'urls': cm_campaign.urls,
                'profile_ids': cm_campaign.profile_ids,
                'visit_frequency': cm_campaign.visit_frequency.value,
                'engagement_level': cm_campaign.engagement_level.value,
                'ad_interaction': cm_campaign.ad_interaction.value,
                'start_date': cm_campaign.start_date.isoformat() if cm_campaign.start_date else None,
                'end_date': cm_campaign.end_date.isoformat() if cm_campaign.end_date else None,
                'custom_frequency': cm_campaign.custom_frequency,
                'custom_engagement': cm_campaign.custom_engagement,
                'custom_interaction': cm_campaign.custom_interaction,
                'behavioral_evolution': cm_campaign.behavioral_evolution,
                'device_rotation': cm_campaign.device_rotation,
                'geo_distribution': cm_campaign.geo_distribution,
                'total_visits': cm_campaign.total_visits,
                'total_impressions': cm_campaign.total_impressions,
                'total_clicks': cm_campaign.total_clicks,
                'estimated_revenue': cm_campaign.estimated_revenue
            }

            # Enhance with database metadata if available
            db_data = await self.sync_campaign_from_db(campaign_id)
            if db_data:
                # Add any database-specific fields that might not be in CampaignsManager
                for key, value in db_data.items():
                    if key not in campaign_dict and value is not None:
                        campaign_dict[key] = value

            return campaign_dict

        except Exception as e:
            logger.error(f"Error getting enhanced campaign {campaign_id}: {str(e)}")
            return None

    async def create_campaign(self, campaign: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new campaign using CampaignsManager and sync to database.

        Uses CampaignsManager as source of truth, then syncs to database.

        Args:
            campaign: Campaign data dictionary with:
                - id: Optional campaign ID (generated if not provided)
                - name: Campaign name
                - description: Optional campaign description
                - urls: List of target URLs
                - profile_ids: List of profile IDs to use
                - visit_frequency: Visit frequency enum value
                - engagement_level: Engagement level enum value
                - ad_interaction: Ad interaction enum value
                - start_date: Optional start date
                - end_date: Optional end date

        Returns:
            Created enhanced campaign dictionary or None if creation failed
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Create campaign using CampaignsManager (source of truth)
            campaign_id = await self.campaigns_manager.create_campaign(campaign)

            if not campaign_id:
                logger.error("Failed to create campaign in CampaignsManager")
                return None

            # Get the created campaign from CampaignsManager
            created_campaign = await self.campaigns_manager.get_campaign(campaign_id)

            if not created_campaign:
                logger.error(f"Failed to retrieve created campaign {campaign_id} from CampaignsManager")
                return None

            # Sync to database
            await self.sync_campaign_to_db(created_campaign)

            # Return enhanced campaign data
            return await self.get_campaign(campaign_id)

        except Exception as e:
            logger.error(f"Error creating campaign: {str(e)}")
            return None

    async def update_campaign(self, campaign_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing campaign using CampaignsManager and sync to database.

        Uses CampaignsManager as source of truth, then syncs to database.

        Args:
            campaign_id: ID of the campaign to update
            updates: Dictionary of updates to apply

        Returns:
            Updated enhanced campaign dictionary or None if update failed
        """
        try:
            # Update campaign using CampaignsManager (source of truth)
            updated_campaign = await self.campaigns_manager.update_campaign(campaign_id, updates)

            if not updated_campaign:
                logger.error(f"Failed to update campaign {campaign_id} in CampaignsManager")
                return None

            # Sync to database
            await self.sync_campaign_to_db(updated_campaign)

            # Return enhanced campaign data
            return await self.get_campaign(campaign_id)

        except Exception as e:
            logger.error(f"Error updating campaign {campaign_id}: {str(e)}")
            return None

    async def delete_campaign(self, campaign_id: str) -> bool:
        """
        Delete a campaign using CampaignsManager and remove from database.

        Uses CampaignsManager as source of truth, then removes from database.

        Args:
            campaign_id: ID of the campaign to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            # Delete campaign using CampaignsManager (source of truth)
            cm_success = await self.campaigns_manager.delete_campaign(campaign_id)

            if not cm_success:
                logger.error(f"Failed to delete campaign {campaign_id} from CampaignsManager")
                return False

            # Remove from database
            if self.supabase:
                try:
                    response = self.supabase.table('campaigns').delete().eq('id', campaign_id).execute()
                    logger.debug(f"Removed campaign {campaign_id} from database")
                except Exception as e:
                    logger.warning(f"Failed to remove campaign {campaign_id} from database: {str(e)}")
                    # Don't fail the operation if database removal fails

            return True

        except Exception as e:
            logger.error(f"Error deleting campaign {campaign_id}: {str(e)}")
            return False

    async def update_status(self, campaign_id: str, status: Union[str, CampaignStatus]) -> Optional[Dict[str, Any]]:
        """
        Update campaign status in the database.

        Args:
            campaign_id: ID of the campaign to update
            status: New status (can be string or enum)

        Returns:
            Updated campaign dictionary or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Convert enum to string if needed
            if isinstance(status, CampaignStatus):
                status = status.value

            # Update the campaign
            response = self.supabase.table('campaigns').update({
                'status': status,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', campaign_id).execute()

            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating campaign status {campaign_id} in database: {str(e)}")
            return None

    async def update_statistics(self, campaign_id: str, statistics: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update campaign statistics in the database.

        Args:
            campaign_id: ID of the campaign to update
            statistics: Dictionary of statistics to update
                - total_visits: Total number of visits
                - total_impressions: Total number of ad impressions
                - total_clicks: Total number of ad clicks
                - estimated_revenue: Estimated revenue

        Returns:
            Updated campaign dictionary or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Update the campaign
            response = self.supabase.table('campaigns').update({
                **statistics,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', campaign_id).execute()

            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error updating campaign statistics {campaign_id} in database: {str(e)}")
            return None

    async def add_profile(self, campaign_id: str, profile_id: str) -> Optional[List[str]]:
        """
        Add a profile to a campaign.

        Args:
            campaign_id: ID of the campaign to update
            profile_id: ID of the profile to add

        Returns:
            Updated list of profile IDs or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Get current campaign
            campaign = await self.get_campaign(campaign_id)
            if not campaign:
                logger.error(f"Campaign {campaign_id} not found for profile addition")
                return None

            # Get current profile IDs
            profile_ids = campaign.get('profile_ids', [])

            # Add profile ID if not already present
            if profile_id not in profile_ids:
                profile_ids.append(profile_id)

            # Update the campaign
            response = self.supabase.table('campaigns').update({
                'profile_ids': profile_ids,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', campaign_id).execute()

            if response.data:
                return response.data[0]['profile_ids']
            return None
        except Exception as e:
            logger.error(f"Error adding profile {profile_id} to campaign {campaign_id} in database: {str(e)}")
            return None

    async def remove_profile(self, campaign_id: str, profile_id: str) -> Optional[List[str]]:
        """
        Remove a profile from a campaign.

        Args:
            campaign_id: ID of the campaign to update
            profile_id: ID of the profile to remove

        Returns:
            Updated list of profile IDs or None if update failed
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return None

        try:
            # Get current campaign
            campaign = await self.get_campaign(campaign_id)
            if not campaign:
                logger.error(f"Campaign {campaign_id} not found for profile removal")
                return None

            # Get current profile IDs
            profile_ids = campaign.get('profile_ids', [])

            # Remove profile ID if present
            if profile_id in profile_ids:
                profile_ids.remove(profile_id)

            # Update the campaign
            response = self.supabase.table('campaigns').update({
                'profile_ids': profile_ids,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', campaign_id).execute()

            if response.data:
                return response.data[0]['profile_ids']
            return None
        except Exception as e:
            logger.error(f"Error removing profile {profile_id} from campaign {campaign_id} in database: {str(e)}")
            return None

    # ===== OPERATIONAL METHODS (Pass-through to CampaignsManager) =====

    async def start_campaign(self, campaign_id: str) -> bool:
        """
        Start a campaign using CampaignsManager.

        Pass-through to CampaignsManager for operational functionality.
        """
        try:
            result = await self.campaigns_manager.start_campaign(campaign_id)

            # Update status in database if successful
            if result and self.supabase:
                try:
                    await self.update_status(campaign_id, CampaignStatus.ACTIVE)
                except Exception as e:
                    logger.warning(f"Failed to update campaign status in database: {str(e)}")

            return result
        except Exception as e:
            logger.error(f"Error starting campaign {campaign_id}: {str(e)}")
            return False

    async def stop_campaign(self, campaign_id: str) -> bool:
        """
        Stop a campaign using CampaignsManager.

        Pass-through to CampaignsManager for operational functionality.
        """
        try:
            result = await self.campaigns_manager.stop_campaign(campaign_id)

            # Update status in database if successful
            if result and self.supabase:
                try:
                    await self.update_status(campaign_id, CampaignStatus.STOPPED)
                except Exception as e:
                    logger.warning(f"Failed to update campaign status in database: {str(e)}")

            return result
        except Exception as e:
            logger.error(f"Error stopping campaign {campaign_id}: {str(e)}")
            return False

    async def pause_campaign(self, campaign_id: str) -> bool:
        """
        Pause a campaign using CampaignsManager.

        Pass-through to CampaignsManager for operational functionality.
        """
        try:
            result = await self.campaigns_manager.pause_campaign(campaign_id)

            # Update status in database if successful
            if result and self.supabase:
                try:
                    await self.update_status(campaign_id, CampaignStatus.PAUSED)
                except Exception as e:
                    logger.warning(f"Failed to update campaign status in database: {str(e)}")

            return result
        except Exception as e:
            logger.error(f"Error pausing campaign {campaign_id}: {str(e)}")
            return False

    async def resume_campaign(self, campaign_id: str) -> bool:
        """
        Resume a campaign using CampaignsManager.

        Pass-through to CampaignsManager for operational functionality.
        """
        try:
            result = await self.campaigns_manager.resume_campaign(campaign_id)

            # Update status in database if successful
            if result and self.supabase:
                try:
                    await self.update_status(campaign_id, CampaignStatus.ACTIVE)
                except Exception as e:
                    logger.warning(f"Failed to update campaign status in database: {str(e)}")

            return result
        except Exception as e:
            logger.error(f"Error resuming campaign {campaign_id}: {str(e)}")
            return False

    async def get_campaign_stats(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """
        Get campaign statistics using CampaignsManager.

        Pass-through to CampaignsManager for operational functionality.
        """
        try:
            # Get campaign from CampaignsManager for latest stats
            campaign = await self.campaigns_manager.get_campaign(campaign_id)
            if not campaign:
                return None

            stats = {
                'id': campaign.id,
                'name': campaign.name,
                'status': campaign.status.value,
                'total_visits': campaign.total_visits,
                'total_impressions': campaign.total_impressions,
                'total_clicks': campaign.total_clicks,
                'estimated_revenue': campaign.estimated_revenue,
                'click_through_rate': campaign.total_clicks / campaign.total_impressions if campaign.total_impressions > 0 else 0.0,
                'profiles_count': len(campaign.profile_ids),
                'urls_count': len(campaign.urls),
                'start_date': campaign.start_date.isoformat() if campaign.start_date else None,
                'end_date': campaign.end_date.isoformat() if campaign.end_date else None
            }

            # Update statistics in database
            if self.supabase:
                try:
                    await self.update_statistics(campaign_id, {
                        'total_visits': campaign.total_visits,
                        'total_impressions': campaign.total_impressions,
                        'total_clicks': campaign.total_clicks,
                        'estimated_revenue': campaign.estimated_revenue
                    })
                except Exception as e:
                    logger.warning(f"Failed to update campaign statistics in database: {str(e)}")

            return stats
        except Exception as e:
            logger.error(f"Error getting campaign stats for {campaign_id}: {str(e)}")
            return None

    async def start_scheduler(self) -> bool:
        """
        Start the campaigns scheduler using CampaignsManager.

        Pass-through to CampaignsManager for operational functionality.
        """
        try:
            await self.campaigns_manager.start_scheduler()
            return True
        except Exception as e:
            logger.error(f"Error starting campaigns scheduler: {str(e)}")
            return False

    async def stop_scheduler(self) -> bool:
        """
        Stop the campaigns scheduler using CampaignsManager.

        Pass-through to CampaignsManager for operational functionality.
        """
        try:
            await self.campaigns_manager.stop_scheduler()
            return True
        except Exception as e:
            logger.error(f"Error stopping campaigns scheduler: {str(e)}")
            return False

    def is_scheduler_running(self) -> bool:
        """
        Check if the campaigns scheduler is running.

        Pass-through to CampaignsManager for operational functionality.
        """
        return self.campaigns_manager.scheduler_running

# Create a singleton instance
campaigns_operations = CampaignsOperations()
