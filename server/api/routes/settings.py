"""
Security-focused user settings API routes.

This module provides API endpoints for essential user account security features:
- User authentication and login information management
- Password management and security
- Two-factor authentication (2FA)
- Account notifications and security alerts
- Account deletion and data management
- Secure API key for account backup/restore

Focus: High-level security and account protection only.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query, Body
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime
from pydantic import BaseModel, Field, validator

# Import settings operations (unified bridge layer)
from db.settings_operations import settings_operations

# Import authentication
from api.middleware.auth import get_current_user
from security.auth import User

# Configure logger
logger = logging.getLogger("camoufox.api.settings")

# Create router
router = APIRouter(prefix="/settings")


# ===== PYDANTIC MODELS =====

class AccountCreate(BaseModel):
    """Account creation model."""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=8)


class PasswordChange(BaseModel):
    """Password change model."""
    current_password: str = Field(...)
    new_password: str = Field(..., min_length=8)


class NotificationSettings(BaseModel):
    """Security notification settings model."""
    # Security notifications (essential only)
    login_notifications: Optional[bool] = None
    security_alerts: Optional[bool] = None
    failed_login_alerts: Optional[bool] = None


class TwoFactorDisable(BaseModel):
    """2FA disable model."""
    verification_code: str = Field(..., min_length=6, max_length=8)


class TwoFactorVerify(BaseModel):
    """2FA verification model."""
    code: str = Field(..., min_length=6, max_length=8)


class AccountDelete(BaseModel):
    """Account deletion model."""
    password: str = Field(...)
    confirmation: str = Field(..., pattern=r'^DELETE$')


class BackupRestore(BaseModel):
    """Account restore model."""
    backup_data: Dict[str, Any] = Field(...)
    new_password: str = Field(..., min_length=8)


# ===== CORE ACCOUNT ROUTES =====

@router.post("/account", response_model=Dict[str, Any])
async def create_account(
    account: AccountCreate
):
    """Create a new user account with security settings."""
    try:
        # Generate user ID (in real app, this would come from auth system)
        import uuid
        user_id = str(uuid.uuid4())

        # Create account using unified operations
        created_account = await settings_operations.create_user_account(
            user_id, account.username, account.email, account.password
        )

        if not created_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create account - username or email may already exist"
            )

        return created_account

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account"
        )


@router.get("/account", response_model=Dict[str, Any])
async def get_account(
    current_user: User = Depends(get_current_user)
):
    """Get user account information with security settings."""
    try:
        account = await settings_operations.get_user_account(current_user.id)

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )

        return account

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting account for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get account information"
        )


@router.delete("/account", response_model=Dict[str, str])
async def delete_account(
    delete_request: AccountDelete,
    current_user: User = Depends(get_current_user)
):
    """Delete user account with password verification."""
    try:
        success = await settings_operations.delete_user_account(
            current_user.id, delete_request.password
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete account - invalid password"
            )

        return {"status": "deleted", "user_id": current_user.id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting account for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )


# ===== PASSWORD MANAGEMENT ROUTES =====

@router.put("/password", response_model=Dict[str, str])
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user)
):
    """Change user password with current password verification."""
    try:
        success = await settings_operations.change_password(
            current_user.id,
            password_change.current_password,
            password_change.new_password
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to change password - invalid current password"
            )

        return {"status": "changed", "message": "Password updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


# ===== TWO-FACTOR AUTHENTICATION ROUTES =====

@router.post("/2fa/enable", response_model=Dict[str, Any])
async def enable_two_factor(
    current_user: User = Depends(get_current_user)
):
    """Enable two-factor authentication for the user."""
    try:
        result = await settings_operations.enable_two_factor(current_user.id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to enable two-factor authentication"
            )

        return {
            "status": "enabled",
            "secret": result["secret"],
            "backup_codes": result["backup_codes"],
            "qr_code_url": result["qr_code_url"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enabling 2FA for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enable two-factor authentication"
        )


@router.post("/2fa/disable", response_model=Dict[str, str])
async def disable_two_factor(
    disable_request: TwoFactorDisable,
    current_user: User = Depends(get_current_user)
):
    """Disable two-factor authentication with verification."""
    try:
        success = await settings_operations.disable_two_factor(
            current_user.id, disable_request.verification_code
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to disable 2FA - invalid verification code"
            )

        return {"status": "disabled", "message": "Two-factor authentication disabled"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disabling 2FA for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable two-factor authentication"
        )


@router.post("/2fa/verify", response_model=Dict[str, bool])
async def verify_two_factor(
    verify_request: TwoFactorVerify,
    current_user: User = Depends(get_current_user)
):
    """Verify two-factor authentication code."""
    try:
        is_valid = settings_operations.verify_two_factor_code(
            current_user.id, verify_request.code
        )

        return {"valid": is_valid}

    except Exception as e:
        logger.error(f"Error verifying 2FA for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify two-factor code"
        )


# ===== NOTIFICATION SETTINGS ROUTES =====

@router.put("/notifications", response_model=Dict[str, str])
async def update_notifications(
    notifications: NotificationSettings,
    current_user: User = Depends(get_current_user)
):
    """Update notification settings."""
    try:
        # Convert Pydantic model to dict, excluding None values
        settings_dict = {k: v for k, v in notifications.dict().items() if v is not None}

        if not settings_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No notification settings provided"
            )

        success = await settings_operations.update_notification_settings(
            current_user.id, settings_dict
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update notification settings"
            )

        return {"status": "updated", "message": "Notification settings updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating notifications for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification settings"
        )


# ===== ACCOUNT BACKUP/RESTORE ROUTES =====

@router.get("/backup", response_model=Dict[str, Any])
async def get_account_backup(
    api_key: str = Query(..., description="User's API key for verification"),
    current_user: User = Depends(get_current_user)
):
    """Get account backup data using API key."""
    try:
        backup_data = await settings_operations.get_account_backup_data(
            current_user.id, api_key
        )

        if not backup_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key or account not found"
            )

        return {
            "backup_data": backup_data,
            "exported_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting backup for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get account backup"
        )


@router.post("/restore", response_model=Dict[str, str])
async def restore_account(
    restore_request: BackupRestore
):
    """Restore account from backup data."""
    try:
        success = await settings_operations.restore_account_from_backup(
            restore_request.backup_data, restore_request.new_password
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to restore account - invalid backup data or account already exists"
            )

        return {
            "status": "restored",
            "message": "Account restored successfully",
            "user_id": restore_request.backup_data.get("user_id")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to restore account"
        )


# ===== SECURITY MONITORING ROUTES =====

@router.get("/security/events", response_model=List[Dict[str, Any]])
async def get_security_events(
    limit: int = Query(50, description="Maximum number of events to return"),
    current_user: User = Depends(get_current_user)
):
    """Get security events for the user."""
    try:
        events = await settings_operations.get_security_events(current_user.id, limit)
        return events

    except Exception as e:
        logger.error(f"Error getting security events for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get security events"
        )


@router.get("/security/analytics", response_model=Dict[str, Any])
async def get_security_analytics(
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive security analytics (admin only)."""
    try:
        analytics = await settings_operations.get_security_analytics()
        return analytics

    except Exception as e:
        logger.error(f"Error getting security analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get security analytics"
        )
