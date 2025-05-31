"""
Authentication module for the application.

This module provides basic authentication functionality.
Currently, it returns a default user for development purposes.
In a production environment, this would be replaced with real authentication.
"""

from typing import Optional
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Optional OAuth2 scheme - can be used later for real authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

class User(BaseModel):
    """User model for authentication."""
    id: str
    username: str
    email: Optional[str] = None
    is_active: bool = True

# Default development user
DEFAULT_USER = User(
    id="dev-user-123",
    username="developer",
    email="dev@example.com",
    is_active=True
)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> User:
    """
    Get the current authenticated user.
    
    In development mode, this returns a default user.
    In production, this would validate the token and return the real user.
    
    Args:
        token: OAuth2 token (optional)
        
    Returns:
        User: The authenticated user
    """
    # For development, always return the default user
    # In production, this would validate the token and return the real user
    return DEFAULT_USER

async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[User]:
    """
    Get the current user if authenticated, or None if not.
    
    Args:
        token: OAuth2 token (optional)
        
    Returns:
        Optional[User]: The authenticated user or None
    """
    if not token:
        return None
    return await get_current_user(token)

def get_user_id(user: User = Depends(get_current_user)) -> str:
    """
    Get the ID of the current user.
    
    Args:
        user: The authenticated user
        
    Returns:
        str: The user ID
    """
    return user.id
