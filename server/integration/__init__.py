"""
Integration module for external tool customizations and enhancements.

This module handles integrations with external tools and services,
providing customization capabilities while maintaining separation
from core business logic.
"""

from .customization import BrowserCustomization

__all__ = ['BrowserCustomization']
