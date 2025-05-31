"""
Security-focused Settings Manager for user account management.

This module handles essential user account security features:
- User authentication and login information
- Password management and security
- Two-factor authentication (2FA)
- Account notifications and security alerts
- Account deletion and data management
- Secure API key for account backup/restore

Focus: High-level security and account protection only.
"""

from typing import Dict, List, Optional, Any
import logging
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, asdict
import bcrypt

# Configure logger
logger = logging.getLogger("camoufox.core.settings")

# Import storage utilities
from core.storage import STORAGE_DIR

# Settings storage directory
SETTINGS_DIR = STORAGE_DIR / "user_accounts"
SETTINGS_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class UserAccount:
    """Core user account with security-focused settings."""
    user_id: str
    username: str
    email: str
    password_hash: str

    # Two-factor authentication
    two_factor_enabled: bool = False
    two_factor_secret: str = ""
    backup_codes: List[str] = None

    # Security notifications (essential only)
    login_notifications: bool = True
    security_alerts: bool = True
    failed_login_alerts: bool = True

    # Account security
    session_timeout_minutes: int = 30
    max_failed_logins: int = 5
    account_locked: bool = False
    locked_until: Optional[datetime] = None

    # Account backup/restore
    api_key: str = ""  # Secure key for account backup/restore

    # Timestamps
    created_at: datetime = None
    updated_at: datetime = None
    last_login: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.backup_codes is None:
            self.backup_codes = []
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
        if not self.api_key:
            self.api_key = self._generate_api_key()

    def _generate_api_key(self) -> str:
        """Generate secure API key for account backup/restore."""
        return f"sk-{secrets.token_urlsafe(32)}"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash,
            'two_factor_enabled': self.two_factor_enabled,
            'two_factor_secret': self.two_factor_secret,
            'backup_codes': self.backup_codes,
            'login_notifications': self.login_notifications,
            'security_alerts': self.security_alerts,
            'failed_login_alerts': self.failed_login_alerts,
            'session_timeout_minutes': self.session_timeout_minutes,
            'max_failed_logins': self.max_failed_logins,
            'account_locked': self.account_locked,
            'locked_until': self.locked_until.isoformat() if self.locked_until else None,
            'api_key': self.api_key,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'password_changed_at': self.password_changed_at.isoformat() if self.password_changed_at else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserAccount':
        """Create from dictionary."""
        account = cls(
            user_id=data['user_id'],
            username=data['username'],
            email=data['email'],
            password_hash=data['password_hash']
        )

        # Security settings
        account.two_factor_enabled = data.get('two_factor_enabled', False)
        account.two_factor_secret = data.get('two_factor_secret', '')
        account.backup_codes = data.get('backup_codes', [])

        # Security notification settings
        account.login_notifications = data.get('login_notifications', True)
        account.security_alerts = data.get('security_alerts', True)
        account.failed_login_alerts = data.get('failed_login_alerts', True)

        # Security settings
        account.session_timeout_minutes = data.get('session_timeout_minutes', 30)
        account.max_failed_logins = data.get('max_failed_logins', 5)
        account.account_locked = data.get('account_locked', False)

        if data.get('locked_until'):
            account.locked_until = datetime.fromisoformat(data['locked_until'])

        # API key
        account.api_key = data.get('api_key', account._generate_api_key())

        # Timestamps
        if data.get('created_at'):
            account.created_at = datetime.fromisoformat(data['created_at'])
        if data.get('updated_at'):
            account.updated_at = datetime.fromisoformat(data['updated_at'])
        if data.get('last_login'):
            account.last_login = datetime.fromisoformat(data['last_login'])
        if data.get('password_changed_at'):
            account.password_changed_at = datetime.fromisoformat(data['password_changed_at'])

        return account


class SettingsManager:
    """
    Security-focused user account management.

    Handles essential security features:
    - User authentication and login management
    - Password security and changes
    - Two-factor authentication
    - Security notifications
    - Account deletion and data management
    """

    def __init__(self):
        """Initialize the settings manager."""
        self.settings_dir = SETTINGS_DIR
        self.accounts_cache = {}  # In-memory cache for performance

        # Ensure settings directory exists
        self.settings_dir.mkdir(parents=True, exist_ok=True)

        logger.info("Security settings manager initialized")

    def _get_account_file_path(self, user_id: str) -> Path:
        """Get the file path for user account."""
        return self.settings_dir / f"{user_id}_account.json"

    def _hash_password(self, password: str) -> str:
        """Hash password securely."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

    def _generate_backup_codes(self) -> List[str]:
        """Generate 2FA backup codes."""
        return [secrets.token_hex(4).upper() for _ in range(10)]

    async def create_user_account(self, user_id: str, username: str, email: str, password: str) -> Optional[UserAccount]:
        """
        Create a new user account with security settings.

        Args:
            user_id: Unique user ID
            username: Username
            email: Email address
            password: Plain text password (will be hashed)

        Returns:
            UserAccount object or None if creation failed
        """
        try:
            # Check if account already exists
            if await self.get_user_account(user_id):
                logger.warning(f"Account already exists for user {user_id}")
                return None

            # Create account with hashed password
            account = UserAccount(
                user_id=user_id,
                username=username,
                email=email,
                password_hash=self._hash_password(password)
            )

            # Save account
            success = await self.save_user_account(account)

            if success:
                logger.info(f"Created new user account for {user_id}")
                return account
            else:
                logger.error(f"Failed to save new account for {user_id}")
                return None

        except Exception as e:
            logger.error(f"Error creating account for user {user_id}: {str(e)}")
            return None

    async def get_user_account(self, user_id: str) -> Optional[UserAccount]:
        """
        Get user account by ID.

        Args:
            user_id: User ID to get account for

        Returns:
            UserAccount object or None if not found
        """
        try:
            # Check cache first
            if user_id in self.accounts_cache:
                return self.accounts_cache[user_id]

            account_file = self._get_account_file_path(user_id)

            if account_file.exists():
                # Load from file
                with open(account_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                account = UserAccount.from_dict(data)

                # Cache the account
                self.accounts_cache[user_id] = account

                logger.debug(f"Loaded account for user {user_id}")
                return account
            else:
                logger.debug(f"Account not found for user {user_id}")
                return None

        except Exception as e:
            logger.error(f"Error getting account for user {user_id}: {str(e)}")
            return None

    async def save_user_account(self, account: UserAccount) -> bool:
        """
        Save user account to file.

        Args:
            account: UserAccount object to save

        Returns:
            True if successful, False otherwise
        """
        try:
            # Update timestamp
            account.updated_at = datetime.utcnow()

            account_file = self._get_account_file_path(account.user_id)

            # Save to file
            with open(account_file, 'w', encoding='utf-8') as f:
                json.dump(account.to_dict(), f, indent=2, ensure_ascii=False)

            # Update cache
            self.accounts_cache[account.user_id] = account

            logger.debug(f"Saved account for user {account.user_id}")
            return True

        except Exception as e:
            logger.error(f"Error saving account for user {account.user_id}: {str(e)}")
            return False

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """
        Change user password with verification.

        Args:
            user_id: User ID
            current_password: Current password for verification
            new_password: New password to set

        Returns:
            True if successful, False otherwise
        """
        try:
            account = await self.get_user_account(user_id)
            if not account:
                logger.warning(f"Account not found for password change: {user_id}")
                return False

            # Verify current password
            if not self._verify_password(current_password, account.password_hash):
                logger.warning(f"Invalid current password for user {user_id}")
                return False

            # Update password
            account.password_hash = self._hash_password(new_password)
            account.password_changed_at = datetime.utcnow()

            # Save account
            success = await self.save_user_account(account)

            if success:
                logger.info(f"Password changed for user {user_id}")

            return success

        except Exception as e:
            logger.error(f"Error changing password for user {user_id}: {str(e)}")
            return False

    async def enable_two_factor(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Enable two-factor authentication for user.

        Args:
            user_id: User ID

        Returns:
            Dict with secret and backup codes, or None if failed
        """
        try:
            account = await self.get_user_account(user_id)
            if not account:
                logger.warning(f"Account not found for 2FA setup: {user_id}")
                return None

            # Generate 2FA secret and backup codes
            import pyotp
            secret = pyotp.random_base32()
            backup_codes = self._generate_backup_codes()

            # Update account
            account.two_factor_enabled = True
            account.two_factor_secret = secret
            account.backup_codes = backup_codes

            # Save account
            success = await self.save_user_account(account)

            if success:
                logger.info(f"2FA enabled for user {user_id}")
                return {
                    'secret': secret,
                    'backup_codes': backup_codes,
                    'qr_code_url': pyotp.totp.TOTP(secret).provisioning_uri(
                        name=account.email,
                        issuer_name="Camoufox"
                    )
                }
            else:
                return None

        except Exception as e:
            logger.error(f"Error enabling 2FA for user {user_id}: {str(e)}")
            return None

    async def disable_two_factor(self, user_id: str, verification_code: str) -> bool:
        """
        Disable two-factor authentication.

        Args:
            user_id: User ID
            verification_code: 2FA code for verification

        Returns:
            True if successful, False otherwise
        """
        try:
            account = await self.get_user_account(user_id)
            if not account:
                return False

            if not account.two_factor_enabled:
                return True  # Already disabled

            # Verify 2FA code
            if not self.verify_two_factor_code(user_id, verification_code):
                logger.warning(f"Invalid 2FA code for disabling 2FA: {user_id}")
                return False

            # Disable 2FA
            account.two_factor_enabled = False
            account.two_factor_secret = ""
            account.backup_codes = []

            # Save account
            success = await self.save_user_account(account)

            if success:
                logger.info(f"2FA disabled for user {user_id}")

            return success

        except Exception as e:
            logger.error(f"Error disabling 2FA for user {user_id}: {str(e)}")
            return False

    def verify_two_factor_code(self, user_id: str, code: str) -> bool:
        """
        Verify 2FA code or backup code.

        Args:
            user_id: User ID
            code: 2FA code or backup code

        Returns:
            True if valid, False otherwise
        """
        try:
            account = self.accounts_cache.get(user_id)
            if not account or not account.two_factor_enabled:
                return False

            # Check if it's a backup code
            if code.upper() in account.backup_codes:
                # Remove used backup code
                account.backup_codes.remove(code.upper())
                # Save account asynchronously (fire and forget)
                import asyncio
                asyncio.create_task(self.save_user_account(account))
                logger.info(f"Backup code used for user {user_id}")
                return True

            # Verify TOTP code
            import pyotp
            totp = pyotp.TOTP(account.two_factor_secret)
            is_valid = totp.verify(code, valid_window=1)

            if is_valid:
                logger.debug(f"Valid 2FA code for user {user_id}")
            else:
                logger.warning(f"Invalid 2FA code for user {user_id}")

            return is_valid

        except Exception as e:
            logger.error(f"Error verifying 2FA code for user {user_id}: {str(e)}")
            return False

    async def update_notification_settings(self, user_id: str, settings: Dict[str, bool]) -> bool:
        """
        Update security notification settings.

        Args:
            user_id: User ID
            settings: Dict of security notification settings

        Returns:
            True if successful, False otherwise
        """
        try:
            account = await self.get_user_account(user_id)
            if not account:
                return False

            # Update security notification settings
            if 'login_notifications' in settings:
                account.login_notifications = settings['login_notifications']
            if 'security_alerts' in settings:
                account.security_alerts = settings['security_alerts']
            if 'failed_login_alerts' in settings:
                account.failed_login_alerts = settings['failed_login_alerts']

            # Save account
            success = await self.save_user_account(account)

            if success:
                logger.info(f"Security notification settings updated for user {user_id}")

            return success

        except Exception as e:
            logger.error(f"Error updating notification settings for user {user_id}: {str(e)}")
            return False

    async def delete_user_account(self, user_id: str, password: str) -> bool:
        """
        Delete user account with password verification.

        Args:
            user_id: User ID
            password: Password for verification

        Returns:
            True if successful, False otherwise
        """
        try:
            account = await self.get_user_account(user_id)
            if not account:
                return False

            # Verify password
            if not self._verify_password(password, account.password_hash):
                logger.warning(f"Invalid password for account deletion: {user_id}")
                return False

            # Delete account file
            account_file = self._get_account_file_path(user_id)
            if account_file.exists():
                account_file.unlink()
                logger.info(f"Deleted account file for user {user_id}")

            # Remove from cache
            if user_id in self.accounts_cache:
                del self.accounts_cache[user_id]
                logger.debug(f"Removed user {user_id} from accounts cache")

            logger.info(f"Account deleted for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting account for user {user_id}: {str(e)}")
            return False

    async def get_account_backup_data(self, user_id: str, api_key: str) -> Optional[Dict[str, Any]]:
        """
        Get account backup data using API key.

        Args:
            user_id: User ID
            api_key: User's API key for verification

        Returns:
            Account backup data or None if unauthorized
        """
        try:
            account = await self.get_user_account(user_id)
            if not account:
                return None

            # Verify API key
            if account.api_key != api_key:
                logger.warning(f"Invalid API key for backup data: {user_id}")
                return None

            # Return backup data (excluding sensitive info)
            backup_data = account.to_dict()
            # Remove password hash for security
            backup_data.pop('password_hash', None)

            logger.info(f"Account backup data retrieved for user {user_id}")
            return backup_data

        except Exception as e:
            logger.error(f"Error getting backup data for user {user_id}: {str(e)}")
            return None

    async def restore_account_from_backup(self, backup_data: Dict[str, Any], new_password: str) -> bool:
        """
        Restore account from backup data.

        Args:
            backup_data: Account backup data
            new_password: New password for restored account

        Returns:
            True if successful, False otherwise
        """
        try:
            user_id = backup_data.get('user_id')
            if not user_id:
                logger.error("No user_id in backup data")
                return False

            # Check if account already exists
            existing_account = await self.get_user_account(user_id)
            if existing_account:
                logger.warning(f"Account already exists, cannot restore: {user_id}")
                return False

            # Create account from backup
            account = UserAccount.from_dict(backup_data)
            # Set new password
            account.password_hash = self._hash_password(new_password)
            account.password_changed_at = datetime.utcnow()

            # Save restored account
            success = await self.save_user_account(account)

            if success:
                logger.info(f"Account restored from backup for user {user_id}")

            return success

        except Exception as e:
            logger.error(f"Error restoring account from backup: {str(e)}")
            return False


# Create a singleton instance
settings_manager = SettingsManager()
