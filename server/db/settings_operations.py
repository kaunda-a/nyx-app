"""
Security-focused Settings database operations module.

This module serves as a bridge/sync layer between SettingsManager (operational) and database storage.
It provides:
- Automatic synchronization between SettingsManager and database
- Enhanced database features for security audit and monitoring
- Unified data flow through SettingsManager as source of truth
- Database-powered security analytics and account management

Focus: High-level security and account protection only.
"""

from typing import Dict, List, Optional, Any
import logging
from datetime import datetime, timedelta
import json
import os
import asyncio

# Configure logger
logger = logging.getLogger("camoufox.db.settings")

# Import SettingsManager singleton
from core.settings_manager import settings_manager, UserAccount

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


class SettingsOperations:
    """
    Bridge/sync layer between SettingsManager and database.

    This class provides unified security-focused operations by:
    - Using SettingsManager as the source of truth for operational data
    - Automatically syncing all changes to the database
    - Providing enhanced database features for security monitoring
    - Maintaining data consistency between SettingsManager and database
    """

    def __init__(self):
        """Initialize the settings database bridge."""
        self.supabase = supabase
        self.settings_manager = settings_manager
        # Initialize sync on startup (will be called when event loop is available)
        self._sync_initialized = False

    async def _ensure_sync_initialized(self):
        """Ensure synchronization is initialized (called on first use)."""
        if not self._sync_initialized and self.supabase:
            try:
                logger.info("Initializing security settings synchronization...")
                await self.sync_all_accounts()
                self._sync_initialized = True
                logger.info("Security settings synchronization initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing settings sync: {str(e)}")

    async def sync_account_to_db(self, account: UserAccount) -> bool:
        """
        Sync SettingsManager account to the database.

        Args:
            account: UserAccount object from SettingsManager

        Returns:
            True if successful, False otherwise
        """
        if not self.supabase:
            return False

        try:
            # Convert UserAccount object to database format
            db_account = {
                'user_id': account.user_id,
                'username': account.username,
                'email': account.email,
                'password_hash': account.password_hash,
                'two_factor_enabled': account.two_factor_enabled,
                'two_factor_secret': account.two_factor_secret,
                'backup_codes': account.backup_codes,
                'login_notifications': account.login_notifications,
                'security_alerts': account.security_alerts,
                'failed_login_alerts': account.failed_login_alerts,
                'session_timeout_minutes': account.session_timeout_minutes,
                'max_failed_logins': account.max_failed_logins,
                'account_locked': account.account_locked,
                'locked_until': account.locked_until.isoformat() if account.locked_until else None,
                'api_key': account.api_key,
                'created_at': account.created_at.isoformat(),
                'updated_at': account.updated_at.isoformat(),
                'last_login': account.last_login.isoformat() if account.last_login else None,
                'password_changed_at': account.password_changed_at.isoformat() if account.password_changed_at else None
            }

            # Try to update first, then insert if not exists
            response = self.supabase.table('user_accounts').upsert(db_account).execute()

            if response.data:
                logger.debug(f"Synced account {account.user_id} to database")
                return True
            return False
        except Exception as e:
            logger.error(f"Error syncing account {account.user_id} to database: {str(e)}")
            return False

    async def sync_account_from_db(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get enhanced account data from database.

        Args:
            user_id: User ID to get database data for

        Returns:
            Database account data or None if not found
        """
        if not self.supabase:
            return None

        try:
            response = self.supabase.table('user_accounts').select('*').eq('user_id', user_id).single().execute()
            return response.data
        except Exception as e:
            logger.debug(f"Account {user_id} not found in database: {str(e)}")
            return None

    async def sync_all_accounts(self):
        """Sync all SettingsManager accounts to database."""
        if not self.supabase:
            return

        try:
            # Get all account files from SettingsManager directory
            account_files = list(self.settings_manager.settings_dir.glob("*_account.json"))

            for account_file in account_files:
                user_id = account_file.stem.replace("_account", "")
                account = await self.settings_manager.get_user_account(user_id)
                if account:
                    await self.sync_account_to_db(account)

            logger.info(f"Synced {len(account_files)} accounts to database")
        except Exception as e:
            logger.error(f"Error syncing all accounts: {str(e)}")

    # ===== CORE ACCOUNT METHODS (Use SettingsManager as Source of Truth) =====

    async def create_user_account(self, user_id: str, username: str, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Create user account using SettingsManager and sync to database.

        Uses SettingsManager as source of truth, then syncs to database.
        """
        try:
            # Ensure sync is initialized
            await self._ensure_sync_initialized()

            # Create account using SettingsManager (source of truth)
            account = await self.settings_manager.create_user_account(user_id, username, email, password)

            if not account:
                logger.error(f"Failed to create account for user {user_id} in SettingsManager")
                return None

            # Sync to database
            await self.sync_account_to_db(account)

            # Log account creation
            await self._log_security_event(user_id, "account_created", {"username": username, "email": email})

            # Return account data (excluding sensitive info)
            account_dict = account.to_dict()
            account_dict.pop('password_hash', None)
            account_dict.pop('two_factor_secret', None)

            return account_dict

        except Exception as e:
            logger.error(f"Error creating account for user {user_id}: {str(e)}")
            return None

    async def get_user_account(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user account with enhanced database metadata.

        Uses SettingsManager as source of truth, enhanced with database data.
        """
        try:
            # Get account from SettingsManager (source of truth)
            sm_account = await self.settings_manager.get_user_account(user_id)
            if not sm_account:
                return None

            # Convert to dict (excluding sensitive info)
            account_dict = sm_account.to_dict()
            account_dict.pop('password_hash', None)
            account_dict.pop('two_factor_secret', None)

            # Enhance with database metadata if available
            db_data = await self.sync_account_from_db(user_id)
            if db_data:
                # Add any database-specific fields that might not be in SettingsManager
                for key, value in db_data.items():
                    if key not in account_dict and value is not None and key not in ['password_hash', 'two_factor_secret']:
                        account_dict[key] = value

            return account_dict

        except Exception as e:
            logger.error(f"Error getting enhanced account for user {user_id}: {str(e)}")
            return None

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """
        Change password using SettingsManager and sync to database.

        Uses SettingsManager as source of truth, then syncs to database.
        """
        try:
            # Change password using SettingsManager (source of truth)
            success = await self.settings_manager.change_password(user_id, current_password, new_password)

            if success:
                # Get updated account and sync to database
                account = await self.settings_manager.get_user_account(user_id)
                if account:
                    await self.sync_account_to_db(account)

                # Log password change
                await self._log_security_event(user_id, "password_changed", {})

            return success

        except Exception as e:
            logger.error(f"Error changing password for user {user_id}: {str(e)}")
            return False

    async def enable_two_factor(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Enable 2FA using SettingsManager and sync to database.

        Uses SettingsManager as source of truth, then syncs to database.
        """
        try:
            # Enable 2FA using SettingsManager (source of truth)
            result = await self.settings_manager.enable_two_factor(user_id)

            if result:
                # Get updated account and sync to database
                account = await self.settings_manager.get_user_account(user_id)
                if account:
                    await self.sync_account_to_db(account)

                # Log 2FA enablement
                await self._log_security_event(user_id, "two_factor_enabled", {})

            return result

        except Exception as e:
            logger.error(f"Error enabling 2FA for user {user_id}: {str(e)}")
            return None

    async def disable_two_factor(self, user_id: str, verification_code: str) -> bool:
        """
        Disable 2FA using SettingsManager and sync to database.

        Uses SettingsManager as source of truth, then syncs to database.
        """
        try:
            # Disable 2FA using SettingsManager (source of truth)
            success = await self.settings_manager.disable_two_factor(user_id, verification_code)

            if success:
                # Get updated account and sync to database
                account = await self.settings_manager.get_user_account(user_id)
                if account:
                    await self.sync_account_to_db(account)

                # Log 2FA disablement
                await self._log_security_event(user_id, "two_factor_disabled", {})

            return success

        except Exception as e:
            logger.error(f"Error disabling 2FA for user {user_id}: {str(e)}")
            return False

    async def update_notification_settings(self, user_id: str, settings: Dict[str, bool]) -> bool:
        """
        Update notification settings using SettingsManager and sync to database.

        Uses SettingsManager as source of truth, then syncs to database.
        """
        try:
            # Update settings using SettingsManager (source of truth)
            success = await self.settings_manager.update_notification_settings(user_id, settings)

            if success:
                # Get updated account and sync to database
                account = await self.settings_manager.get_user_account(user_id)
                if account:
                    await self.sync_account_to_db(account)

                # Log notification settings change
                await self._log_security_event(user_id, "notification_settings_updated", settings)

            return success

        except Exception as e:
            logger.error(f"Error updating notification settings for user {user_id}: {str(e)}")
            return False


    async def delete_user_account(self, user_id: str, password: str) -> bool:
        """
        Delete user account using SettingsManager and remove from database.

        Uses SettingsManager as source of truth, then removes from database.
        """
        try:
            # Delete account using SettingsManager (source of truth)
            success = await self.settings_manager.delete_user_account(user_id, password)

            if success:
                # Remove from database
                if self.supabase:
                    try:
                        # Delete user account
                        self.supabase.table('user_accounts').delete().eq('user_id', user_id).execute()

                        # Delete security events
                        self.supabase.table('security_events').delete().eq('user_id', user_id).execute()

                        logger.debug(f"Removed account {user_id} from database")
                    except Exception as e:
                        logger.warning(f"Failed to remove account {user_id} from database: {str(e)}")
                        # Don't fail the operation if database removal fails

                # Log account deletion
                await self._log_security_event(user_id, "account_deleted", {})

            return success

        except Exception as e:
            logger.error(f"Error deleting account for user {user_id}: {str(e)}")
            return False

    async def get_account_backup_data(self, user_id: str, api_key: str) -> Optional[Dict[str, Any]]:
        """
        Get account backup data using SettingsManager.

        Pass-through to SettingsManager for backup functionality.
        """
        try:
            backup_data = await self.settings_manager.get_account_backup_data(user_id, api_key)

            if backup_data:
                # Log backup data access
                await self._log_security_event(user_id, "backup_data_accessed", {"api_key_used": True})

            return backup_data

        except Exception as e:
            logger.error(f"Error getting backup data for user {user_id}: {str(e)}")
            return None

    async def restore_account_from_backup(self, backup_data: Dict[str, Any], new_password: str) -> bool:
        """
        Restore account from backup using SettingsManager and sync to database.

        Uses SettingsManager as source of truth, then syncs to database.
        """
        try:
            # Restore using SettingsManager (source of truth)
            success = await self.settings_manager.restore_account_from_backup(backup_data, new_password)

            if success:
                user_id = backup_data.get('user_id')
                if user_id:
                    # Get restored account and sync to database
                    account = await self.settings_manager.get_user_account(user_id)
                    if account:
                        await self.sync_account_to_db(account)

                    # Log account restoration
                    await self._log_security_event(user_id, "account_restored", {"from_backup": True})

            return success

        except Exception as e:
            logger.error(f"Error restoring account from backup: {str(e)}")
            return False

    # ===== ENHANCED DATABASE METHODS =====

    async def _log_security_event(self, user_id: str, event_type: str, details: Dict[str, Any]):
        """Log security events for audit trail."""
        if not self.supabase:
            return

        try:
            event_record = {
                'user_id': user_id,
                'event_type': event_type,
                'details': details,
                'timestamp': datetime.utcnow().isoformat(),
                'ip_address': None,  # Could be added from request context
                'user_agent': None   # Could be added from request context
            }

            self.supabase.table('security_events').insert(event_record).execute()
            logger.debug(f"Logged security event for user {user_id}: {event_type}")
        except Exception as e:
            logger.warning(f"Failed to log security event: {str(e)}")

    async def get_security_events(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get security events for a user.

        Args:
            user_id: User ID to get events for
            limit: Maximum number of events to return

        Returns:
            List of security event records
        """
        if not self.supabase:
            return []

        try:
            response = self.supabase.table('security_events')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('timestamp', desc=True)\
                .limit(limit)\
                .execute()

            return response.data or []
        except Exception as e:
            logger.error(f"Error getting security events for user {user_id}: {str(e)}")
            return []

    async def get_security_analytics(self) -> Dict[str, Any]:
        """
        Get comprehensive security analytics.

        Combines SettingsManager data with database analytics.
        """
        try:
            # Get basic stats from SettingsManager
            account_files = list(self.settings_manager.settings_dir.glob("*_account.json"))
            total_accounts = len(account_files)

            # Initialize analytics
            analytics = {
                'total_accounts': total_accounts,
                'two_factor_enabled': 0,
                'two_factor_disabled': 0,
                'accounts_with_security_notifications': 0,
                'recent_password_changes': 0,
                'recent_logins': 0
            }

            # Analyze accounts
            for account_file in account_files:
                try:
                    user_id = account_file.stem.replace("_account", "")
                    account = await self.settings_manager.get_user_account(user_id)

                    if account:
                        # 2FA statistics
                        if account.two_factor_enabled:
                            analytics['two_factor_enabled'] += 1
                        else:
                            analytics['two_factor_disabled'] += 1

                        # Security notification statistics
                        if (account.login_notifications or account.security_alerts or account.failed_login_alerts):
                            analytics['accounts_with_security_notifications'] += 1

                        # Recent activity (last 30 days)
                        if account.password_changed_at and (datetime.utcnow() - account.password_changed_at).days <= 30:
                            analytics['recent_password_changes'] += 1

                        if account.last_login and (datetime.utcnow() - account.last_login).days <= 7:
                            analytics['recent_logins'] += 1

                except Exception as e:
                    logger.warning(f"Error analyzing account {account_file}: {str(e)}")
                    continue

            # Add database-specific analytics if available
            if self.supabase:
                try:
                    # Get recent security events count
                    recent_events = self.supabase.table('security_events')\
                        .select('event_type', count='exact')\
                        .gte('timestamp', (datetime.utcnow() - timedelta(days=7)).isoformat())\
                        .execute()

                    analytics['recent_security_events'] = len(recent_events.data) if recent_events.data else 0
                except Exception as e:
                    logger.warning(f"Failed to get database analytics: {str(e)}")

            return analytics

        except Exception as e:
            logger.error(f"Error getting security analytics: {str(e)}")
            return {}

    def verify_two_factor_code(self, user_id: str, code: str) -> bool:
        """
        Verify 2FA code using SettingsManager.

        Pass-through to SettingsManager for 2FA verification.
        """
        try:
            is_valid = self.settings_manager.verify_two_factor_code(user_id, code)

            # Log 2FA verification attempt
            if is_valid:
                asyncio.create_task(self._log_security_event(user_id, "two_factor_verified", {"success": True}))
            else:
                asyncio.create_task(self._log_security_event(user_id, "two_factor_verification_failed", {"success": False}))

            return is_valid

        except Exception as e:
            logger.error(f"Error verifying 2FA code for user {user_id}: {str(e)}")
            return False


# Create a singleton instance
settings_operations = SettingsOperations()
