"""
Crawler database operations module.

This module serves as a bridge/sync layer between CrawlerManager (operational) and database storage.
It provides:
- Automatic synchronization between CrawlerManager and database
- Enhanced database features (search, filtering, analytics)
- Unified data flow through CrawlerManager as source of truth
- Database-powered crawler task and campaign management

The database serves as an enhancement layer while CrawlerManager handles all operational tasks.
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
logger = logging.getLogger("camoufox.db.crawlers")

# Import CrawlerManager singleton
from core.crawler_manager import crawler_manager, Task, Campaign

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


class CrawlerOperations:
    """
    Bridge/sync layer between CrawlerManager and database.

    This class provides unified crawler operations by:
    - Using CrawlerManager as the source of truth for operational data
    - Automatically syncing all changes to the database
    - Providing enhanced database features (search, filtering, analytics)
    - Maintaining data consistency between CrawlerManager and database
    """

    def __init__(self):
        """Initialize the crawler database bridge."""
        self.supabase = supabase
        self.crawler_manager = crawler_manager
        # Initialize sync on startup (will be called when event loop is available)
        self._sync_initialized = False

    async def _ensure_sync_initialized(self):
        """Ensure synchronization is initialized (called on first use)."""
        if not self._sync_initialized and self.supabase:
            try:
                logger.info("Initializing crawler synchronization...")
                await self.sync_all_tasks()
                await self.sync_all_campaigns()
                self._sync_initialized = True
                logger.info("Crawler synchronization initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing crawler sync: {str(e)}")

    async def sync_task_to_db(self, task: Task) -> bool:
        """
        Sync a CrawlerManager task to the database.

        Args:
            task: Task object from CrawlerManager

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase:
            return False

        try:
            # Convert Task object to database format
            db_task = {
                'id': task.task_id,
                'url': task.url,
                'instructions': task.instructions,
                'profile_id': task.profile_id,
                'proxy_id': task.proxy_id,
                'campaign_id': task.campaign_id,
                'status': task.status,
                'priority': task.priority,
                'max_duration': task.max_duration,
                'parameters': task.parameters,
                'schedule': task.schedule,
                'created_at': task.created_at.isoformat(),
                'started_at': task.started_at.isoformat() if task.started_at else None,
                'completed_at': task.completed_at.isoformat() if task.completed_at else None,
                'result': task.result,
                'error': task.error,
                'engagement_metrics': task.engagement_metrics or {}
            }

            # Try to update first, then insert if not exists
            response = self.supabase.table('crawler_tasks').upsert(db_task).execute()

            if response.data:
                logger.debug(f"Synced task {task.task_id} to database")
                return True
            return False
        except Exception as e:
            logger.error(f"Error syncing task {task.task_id} to database: {str(e)}")
            return False

    async def sync_campaign_to_db(self, campaign: Campaign) -> bool:
        """
        Sync a CrawlerManager campaign to the database.

        Args:
            campaign: Campaign object from CrawlerManager

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase:
            return False

        try:
            # Convert Campaign object to database format
            db_campaign = {
                'id': campaign.campaign_id,
                'name': campaign.name,
                'description': campaign.description,
                'urls': campaign.urls,
                'profile_ids': campaign.profile_ids,
                'status': campaign.status,
                'schedule': campaign.schedule,
                'parameters': campaign.parameters,
                'task_ids': campaign.task_ids,
                'metrics': campaign.metrics,
                'created_at': campaign.created_at.isoformat(),
                'updated_at': campaign.updated_at.isoformat() if campaign.updated_at else None
            }

            # Try to update first, then insert if not exists
            response = self.supabase.table('crawler_campaigns').upsert(db_campaign).execute()

            if response.data:
                logger.debug(f"Synced campaign {campaign.campaign_id} to database")
                return True
            return False
        except Exception as e:
            logger.error(f"Error syncing campaign {campaign.campaign_id} to database: {str(e)}")
            return False

    async def sync_task_from_db(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get enhanced task data from database.

        Args:
            task_id: Task ID to get database data for

        Returns:
            Database task data or None if not found
        """
        if not self.supabase:
            return None

        try:
            response = self.supabase.table('crawler_tasks').select('*').eq('id', task_id).single().execute()
            return response.data
        except Exception as e:
            logger.debug(f"Task {task_id} not found in database: {str(e)}")
            return None

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
            response = self.supabase.table('crawler_campaigns').select('*').eq('id', campaign_id).single().execute()
            return response.data
        except Exception as e:
            logger.debug(f"Campaign {campaign_id} not found in database: {str(e)}")
            return None

    async def sync_all_tasks(self):
        """Sync all CrawlerManager tasks to database."""
        if not self.supabase:
            return

        try:
            # Get all active tasks from CrawlerManager
            active_tasks = await self.crawler_manager.get_active_tasks()

            for task_dict in active_tasks:
                # Convert dict back to Task object for syncing
                task = Task.from_dict(task_dict)
                await self.sync_task_to_db(task)

            # Also sync task history
            task_history = await self.crawler_manager.get_task_history()
            for task_dict in task_history:
                task = Task.from_dict(task_dict)
                await self.sync_task_to_db(task)

            logger.info(f"Synced {len(active_tasks) + len(task_history)} tasks to database")
        except Exception as e:
            logger.error(f"Error syncing all tasks: {str(e)}")

    async def sync_all_campaigns(self):
        """Sync all CrawlerManager campaigns to database."""
        if not self.supabase:
            return

        try:
            # Get all campaigns from CrawlerManager
            campaigns_data = await self.crawler_manager.list_campaigns()

            for campaign_dict in campaigns_data:
                # Convert dict back to Campaign object for syncing
                campaign = Campaign.from_dict(campaign_dict)
                await self.sync_campaign_to_db(campaign)

            logger.info(f"Synced {len(campaigns_data)} campaigns to database")
        except Exception as e:
            logger.error(f"Error syncing all campaigns: {str(e)}")


    # ===== TASK MANAGEMENT METHODS =====

    async def list_tasks(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get all tasks with enhanced database features and filtering.

        Uses CrawlerManager as source of truth, enhanced with database metadata.
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Get all tasks from CrawlerManager (source of truth)
            active_tasks = await self.crawler_manager.get_active_tasks()
            task_history = await self.crawler_manager.get_task_history()
            all_tasks = active_tasks + task_history

            # Apply filters if provided
            if filters:
                filtered_tasks = []
                for task in all_tasks:
                    # Status filter
                    if 'status' in filters and filters['status']:
                        if task.get('status') != filters['status']:
                            continue

                    # Campaign filter
                    if 'campaign_id' in filters and filters['campaign_id']:
                        if task.get('campaign_id') != filters['campaign_id']:
                            continue

                    # Profile filter
                    if 'profile_id' in filters and filters['profile_id']:
                        if task.get('profile_id') != filters['profile_id']:
                            continue

                    # Search filter
                    if 'search' in filters and filters['search']:
                        search_term = filters['search'].lower()
                        if search_term not in task.get('instructions', '').lower():
                            if not task.get('url') or search_term not in task['url'].lower():
                                continue

                    filtered_tasks.append(task)

                all_tasks = filtered_tasks

            # Apply sorting
            if filters and 'sort_by' in filters and filters['sort_by']:
                sort_field = filters['sort_by']
                reverse = filters.get('sort_order', 'asc') == 'desc'
                all_tasks.sort(key=lambda t: t.get(sort_field, ''), reverse=reverse)
            else:
                # Default sort by created_at descending
                all_tasks.sort(
                    key=lambda t: t.get('created_at') or '',
                    reverse=True
                )

            return all_tasks

        except Exception as e:
            logger.error(f"Error listing enhanced tasks: {str(e)}")
            return []

    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single task by ID with enhanced database metadata.

        Uses CrawlerManager as source of truth, enhanced with database data.
        """
        try:
            # Get task from CrawlerManager (source of truth)
            cm_task = await self.crawler_manager.get_task(task_id)
            if cm_task:
                task_dict = cm_task.to_dict()
            else:
                # Check task history
                task_history = await self.crawler_manager.get_task_history()
                task_dict = next((t for t in task_history if t['task_id'] == task_id), None)

            if not task_dict:
                return None

            # Enhance with database metadata if available
            db_data = await self.sync_task_from_db(task_id)
            if db_data:
                # Add any database-specific fields that might not be in CrawlerManager
                for key, value in db_data.items():
                    if key not in task_dict and value is not None:
                        task_dict[key] = value

            return task_dict

        except Exception as e:
            logger.error(f"Error getting enhanced task {task_id}: {str(e)}")
            return None

    async def create_task(self, task_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new task using CrawlerManager and sync to database.

        Uses CrawlerManager as source of truth, then syncs to database.
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Create task using CrawlerManager (source of truth)
            task_id = await self.crawler_manager.add_task(task_data)

            if not task_id:
                logger.error("Failed to create task in CrawlerManager")
                return None

            # Get the created task from CrawlerManager
            created_task = await self.crawler_manager.get_task(task_id)

            if not created_task:
                logger.error(f"Failed to retrieve created task {task_id} from CrawlerManager")
                return None

            # Sync to database
            await self.sync_task_to_db(created_task)

            return task_id

        except Exception as e:
            logger.error(f"Error creating task: {str(e)}")
            return None

    async def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a task using CrawlerManager and update database.

        Uses CrawlerManager as source of truth, then syncs to database.
        """
        try:
            # Cancel task using CrawlerManager (source of truth)
            success = await self.crawler_manager.cancel_task(task_id)

            if success and self.supabase:
                try:
                    # Update task status in database
                    self.supabase.table('crawler_tasks').update({
                        'status': 'cancelled',
                        'completed_at': datetime.utcnow().isoformat()
                    }).eq('id', task_id).execute()
                    logger.debug(f"Updated cancelled task {task_id} in database")
                except Exception as e:
                    logger.warning(f"Failed to update cancelled task in database: {str(e)}")

            return success

        except Exception as e:
            logger.error(f"Error cancelling task {task_id}: {str(e)}")
            return False

    # ===== CAMPAIGN MANAGEMENT METHODS =====

    async def list_campaigns(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get all campaigns with enhanced database features and filtering.

        Uses CrawlerManager as source of truth, enhanced with database metadata.
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Get all campaigns from CrawlerManager (source of truth)
            campaigns_data = []
            for campaign_id, campaign in self.crawler_manager.campaigns.items():
                campaign_dict = campaign.to_dict()
                campaigns_data.append(campaign_dict)

            # Apply filters if provided
            if filters:
                filtered_campaigns = []
                for campaign in campaigns_data:
                    # Status filter
                    if 'status' in filters and filters['status']:
                        if campaign.get('status') != filters['status']:
                            continue

                    # Search filter
                    if 'search' in filters and filters['search']:
                        search_term = filters['search'].lower()
                        if search_term not in campaign.get('name', '').lower():
                            if not campaign.get('description') or search_term not in campaign['description'].lower():
                                continue

                    filtered_campaigns.append(campaign)

                campaigns_data = filtered_campaigns

            # Apply sorting
            if filters and 'sort_by' in filters and filters['sort_by']:
                sort_field = filters['sort_by']
                reverse = filters.get('sort_order', 'asc') == 'desc'
                campaigns_data.sort(key=lambda c: c.get(sort_field, ''), reverse=reverse)
            else:
                # Default sort by created_at descending
                campaigns_data.sort(
                    key=lambda c: c.get('created_at') or '',
                    reverse=True
                )

            return campaigns_data

        except Exception as e:
            logger.error(f"Error listing enhanced campaigns: {str(e)}")
            return []

    async def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a single campaign by ID with enhanced database metadata.

        Uses CrawlerManager as source of truth, enhanced with database data.
        """
        try:
            # Get campaign from CrawlerManager (source of truth)
            if campaign_id not in self.crawler_manager.campaigns:
                return None

            campaign = self.crawler_manager.campaigns[campaign_id]
            campaign_dict = campaign.to_dict()

            # Enhance with database metadata if available
            db_data = await self.sync_campaign_from_db(campaign_id)
            if db_data:
                # Add any database-specific fields that might not be in CrawlerManager
                for key, value in db_data.items():
                    if key not in campaign_dict and value is not None:
                        campaign_dict[key] = value

            return campaign_dict

        except Exception as e:
            logger.error(f"Error getting enhanced campaign {campaign_id}: {str(e)}")
            return None

    async def create_campaign(self, campaign_data: Dict[str, Any]) -> Optional[str]:
        """
        Create a new campaign using CrawlerManager and sync to database.

        Uses CrawlerManager as source of truth, then syncs to database.
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Create campaign using CrawlerManager (source of truth)
            campaign_id = await self.crawler_manager.create_campaign(campaign_data)

            if not campaign_id:
                logger.error("Failed to create campaign in CrawlerManager")
                return None

            # Get the created campaign from CrawlerManager
            if campaign_id not in self.crawler_manager.campaigns:
                logger.error(f"Failed to retrieve created campaign {campaign_id} from CrawlerManager")
                return None

            created_campaign = self.crawler_manager.campaigns[campaign_id]

            # Sync to database
            await self.sync_campaign_to_db(created_campaign)

            return campaign_id

        except Exception as e:
            logger.error(f"Error creating campaign: {str(e)}")
            return None

    async def delete_campaign(self, campaign_id: str) -> bool:
        """
        Delete a campaign using CrawlerManager and remove from database.

        Uses CrawlerManager as source of truth, then removes from database.
        """
        try:
            # Delete campaign using CrawlerManager (source of truth)
            if campaign_id in self.crawler_manager.campaigns:
                del self.crawler_manager.campaigns[campaign_id]
                logger.info(f"Removed campaign {campaign_id} from CrawlerManager")
            else:
                logger.warning(f"Campaign {campaign_id} not found in CrawlerManager")
                return False

            # Remove from database
            if self.supabase:
                try:
                    response = self.supabase.table('crawler_campaigns').delete().eq('id', campaign_id).execute()
                    logger.debug(f"Removed campaign {campaign_id} from database")
                except Exception as e:
                    logger.warning(f"Failed to remove campaign {campaign_id} from database: {str(e)}")
                    # Don't fail the operation if database removal fails

            return True

        except Exception as e:
            logger.error(f"Error deleting campaign {campaign_id}: {str(e)}")
            return False

    # ===== OPERATIONAL METHODS (Pass-through to CrawlerManager) =====

    async def start_scheduler(self) -> bool:
        """
        Start the crawler scheduler using CrawlerManager.

        Pass-through to CrawlerManager for operational functionality.
        """
        try:
            await self.crawler_manager.start_scheduler()
            return True
        except Exception as e:
            logger.error(f"Error starting crawler scheduler: {str(e)}")
            return False

    async def stop_scheduler(self) -> bool:
        """
        Stop the crawler scheduler using CrawlerManager.

        Pass-through to CrawlerManager for operational functionality.
        """
        try:
            await self.crawler_manager.stop_scheduler()
            return True
        except Exception as e:
            logger.error(f"Error stopping crawler scheduler: {str(e)}")
            return False

    def is_scheduler_running(self) -> bool:
        """
        Check if the crawler scheduler is running.

        Pass-through to CrawlerManager for operational functionality.
        """
        return self.crawler_manager.scheduler_running

    async def get_task_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get task execution history with optional limit.

        Pass-through to CrawlerManager for operational functionality.
        """
        try:
            history = await self.crawler_manager.get_task_history()
            if limit:
                history = history[-limit:]  # Get most recent tasks
            return history
        except Exception as e:
            logger.error(f"Error getting task history: {str(e)}")
            return []

    async def clear_task_history(self) -> bool:
        """
        Clear task execution history.

        Pass-through to CrawlerManager for operational functionality.
        """
        try:
            await self.crawler_manager.clear_task_history()

            # Also clear from database if available
            if self.supabase:
                try:
                    # Delete completed/failed tasks from database
                    self.supabase.table('crawler_tasks').delete().in_('status', ['completed', 'failed', 'cancelled']).execute()
                    logger.debug("Cleared task history from database")
                except Exception as e:
                    logger.warning(f"Failed to clear task history from database: {str(e)}")

            return True
        except Exception as e:
            logger.error(f"Error clearing task history: {str(e)}")
            return False

    async def get_crawler_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive crawler statistics.

        Combines CrawlerManager data with database analytics.
        """
        try:
            # Get basic stats from CrawlerManager
            active_tasks = await self.crawler_manager.get_active_tasks()
            task_history = await self.crawler_manager.get_task_history()

            # Calculate basic statistics
            total_tasks = len(active_tasks) + len(task_history)
            completed_tasks = len([t for t in task_history if t.get('status') == 'completed'])
            failed_tasks = len([t for t in task_history if t.get('status') == 'failed'])
            running_tasks = len([t for t in active_tasks if t.get('status') == 'running'])
            pending_tasks = len([t for t in active_tasks if t.get('status') == 'pending'])

            # Calculate success rate
            success_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

            # Get campaign stats
            total_campaigns = len(self.crawler_manager.campaigns)
            active_campaigns = len([c for c in self.crawler_manager.campaigns.values() if c.status == 'active'])

            stats = {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'failed_tasks': failed_tasks,
                'running_tasks': running_tasks,
                'pending_tasks': pending_tasks,
                'success_rate': round(success_rate, 2),
                'total_campaigns': total_campaigns,
                'active_campaigns': active_campaigns,
                'scheduler_running': self.crawler_manager.scheduler_running,
                'max_concurrent_tasks': self.crawler_manager.max_concurrent_tasks
            }

            # Add database-specific analytics if available
            if self.supabase:
                try:
                    # Get additional analytics from database
                    # This could include historical trends, performance metrics, etc.
                    pass
                except Exception as e:
                    logger.warning(f"Failed to get database analytics: {str(e)}")

            return stats

        except Exception as e:
            logger.error(f"Error getting crawler stats: {str(e)}")
            return {}

    async def update_profile_usage(self, profile_id: str, task_id: str, usage_data: Dict[str, Any]) -> bool:
        """
        Update profile usage statistics.

        Pass-through to CrawlerManager with database sync.
        """
        try:
            # Update in CrawlerManager
            await self.crawler_manager.update_profile_usage(profile_id, task_id, usage_data)

            # Sync to database if available
            if self.supabase:
                try:
                    # Update or insert profile usage data
                    usage_record = {
                        'profile_id': profile_id,
                        'task_id': task_id,
                        'usage_data': usage_data,
                        'updated_at': datetime.utcnow().isoformat()
                    }

                    self.supabase.table('profile_usage').upsert(usage_record).execute()
                    logger.debug(f"Synced profile usage for {profile_id} to database")
                except Exception as e:
                    logger.warning(f"Failed to sync profile usage to database: {str(e)}")

            return True

        except Exception as e:
            logger.error(f"Error updating profile usage: {str(e)}")
            return False

# Create a singleton instance
crawler_operations = CrawlerOperations()
