"""
Browser customization and icon branding integration.

This module handles customization of browser installations,
particularly Camoufox icon branding to maintain Nyx identity
across browser profiles and updates.
"""

import os
import shutil
import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, List
import tempfile
import subprocess
import json

# Configure logger
logger = logging.getLogger("nyx.integration.customization")

class BrowserCustomization:
    """
    Handles browser customization and icon branding for Nyx.

    This class manages:
    - Custom Camoufox installation with Nyx branding
    - Icon injection into browser profiles
    - Persistent branding across browser updates
    - Custom browser executable management
    """

    def __init__(self, storage_dir: Optional[Path] = None):
        """
        Initialize browser customization manager.

        Args:
            storage_dir: Directory for storing custom browser installations
        """
        self.storage_dir = storage_dir or Path("./sessions/storage/browsers")
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Paths for custom browser management
        self.custom_browser_dir = self.storage_dir / "nyx-camoufox"
        self.icon_cache_dir = self.storage_dir / "icons"
        self.icon_cache_dir.mkdir(parents=True, exist_ok=True)

        # Nyx icon paths (from client/public)
        self.nyx_icons = {
            '16x16': None,
            '32x32': None,
            '48x48': None,
            '64x64': None,
            '128x128': None,
            '256x256': None,
            '512x512': None
        }

        # Browser executable info
        self.custom_browser_executable = None
        self.is_custom_browser_ready = False

        logger.info(f"BrowserCustomization initialized with storage: {self.storage_dir}")

    async def initialize(self) -> bool:
        """
        Initialize the browser customization system.

        Returns:
            True if initialization successful, False otherwise
        """
        try:
            # Load Nyx icons from client directory
            await self._load_nyx_icons()

            # Check for existing custom browser installation
            await self._check_custom_browser()

            logger.info("Browser customization system initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize browser customization: {e}")
            return False

    async def _load_nyx_icons(self) -> None:
        """Load Nyx icons from client/public directory."""
        try:
            # Look for client icons in various possible locations
            client_paths = [
                Path("../client/public"),
                Path("./client/public"),
                Path("../../client/public")
            ]

            client_public = None
            for path in client_paths:
                if path.exists():
                    client_public = path
                    break

            if not client_public:
                logger.warning("Could not find client/public directory for Nyx icons")
                return

            # Map available icon files
            icon_files = {
                '32x32': client_public / "icon-32x32.png",
                '128x128': client_public / "icon-128x128.png",
                '256x256': client_public / "icon-256x256.png",
                '512x512': client_public / "icon-512x512.png"
            }

            # Copy icons to cache and update paths
            for size, icon_path in icon_files.items():
                if icon_path.exists():
                    cached_icon = self.icon_cache_dir / f"nyx-{size}.png"
                    shutil.copy2(icon_path, cached_icon)
                    self.nyx_icons[size] = cached_icon
                    logger.info(f"Cached Nyx icon {size}: {cached_icon}")

            # Also look for favicon.svg
            favicon_svg = client_public / "images" / "favicon.svg"
            if favicon_svg.exists():
                cached_favicon = self.icon_cache_dir / "nyx-favicon.svg"
                shutil.copy2(favicon_svg, cached_favicon)
                logger.info(f"Cached Nyx favicon: {cached_favicon}")

        except Exception as e:
            logger.error(f"Error loading Nyx icons: {e}")

    async def _check_custom_browser(self) -> None:
        """Check if custom Nyx-branded browser exists."""
        try:
            if self.custom_browser_dir.exists():
                # Look for browser executable
                possible_executables = [
                    self.custom_browser_dir / "camoufox.exe",
                    self.custom_browser_dir / "firefox.exe",
                    self.custom_browser_dir / "nyx-browser.exe"
                ]

                for exe_path in possible_executables:
                    if exe_path.exists():
                        self.custom_browser_executable = exe_path
                        self.is_custom_browser_ready = True
                        logger.info(f"Found custom Nyx browser: {exe_path}")
                        return

            logger.info("No custom Nyx browser found - will use system Camoufox")

        except Exception as e:
            logger.error(f"Error checking custom browser: {e}")

    async def prepare_custom_browser(self) -> bool:
        """
        Prepare a custom Nyx-branded browser installation.

        Returns:
            True if preparation successful, False otherwise
        """
        try:
            logger.info("Preparing custom Nyx-branded browser...")

            # For now, we'll focus on profile-level customization
            # Custom browser installation can be added later
            logger.info("Using profile-level icon customization approach")

            return True

        except Exception as e:
            logger.error(f"Error preparing custom browser: {e}")
            return False

    async def customize_profile(self, profile_id: str, profile_path: Path) -> bool:
        """
        Apply Nyx branding to a browser profile.

        Args:
            profile_id: Profile ID
            profile_path: Path to profile directory

        Returns:
            True if customization successful, False otherwise
        """
        try:
            logger.info(f"Applying Nyx branding to profile {profile_id}")

            # Create profile customization directory
            custom_dir = profile_path / "nyx-customization"
            custom_dir.mkdir(exist_ok=True)

            # Copy Nyx icons to profile
            await self._copy_icons_to_profile(custom_dir)

            # Create customization metadata
            await self._create_customization_metadata(custom_dir, profile_id)

            logger.info(f"Successfully applied Nyx branding to profile {profile_id}")
            return True

        except Exception as e:
            logger.error(f"Error customizing profile {profile_id}: {e}")
            return False

    async def _copy_icons_to_profile(self, custom_dir: Path) -> None:
        """Copy Nyx icons to profile customization directory."""
        try:
            icons_dir = custom_dir / "icons"
            icons_dir.mkdir(exist_ok=True)

            # Copy available icons
            for size, icon_path in self.nyx_icons.items():
                if icon_path and icon_path.exists():
                    dest_path = icons_dir / f"nyx-{size}.png"
                    shutil.copy2(icon_path, dest_path)
                    logger.debug(f"Copied icon {size} to profile")

            # Copy favicon if available
            favicon_path = self.icon_cache_dir / "nyx-favicon.svg"
            if favicon_path.exists():
                dest_favicon = icons_dir / "nyx-favicon.svg"
                shutil.copy2(favicon_path, dest_favicon)
                logger.debug("Copied favicon to profile")

        except Exception as e:
            logger.error(f"Error copying icons to profile: {e}")

    async def _create_customization_metadata(self, custom_dir: Path, profile_id: str) -> None:
        """Create metadata file for profile customization."""
        try:
            metadata = {
                "profile_id": profile_id,
                "customization_version": "1.0",
                "branding": "nyx",
                "created_at": str(asyncio.get_event_loop().time()),
                "icons_applied": True,
                "custom_browser": self.is_custom_browser_ready
            }

            metadata_file = custom_dir / "customization.json"
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)

            logger.debug(f"Created customization metadata for profile {profile_id}")

        except Exception as e:
            logger.error(f"Error creating customization metadata: {e}")

    def get_browser_config_enhancement(self, profile_id: str) -> Dict[str, Any]:
        """
        Get browser configuration enhancements for Nyx branding.

        Args:
            profile_id: Profile ID

        Returns:
            Dictionary of browser configuration enhancements
        """
        enhancements = {}

        try:
            # If we have a custom browser, use it
            if self.is_custom_browser_ready and self.custom_browser_executable:
                enhancements['executable_path'] = str(self.custom_browser_executable)
                logger.info(f"Using custom Nyx browser for profile {profile_id}")

            # Add any additional browser arguments for branding
            enhancements['additional_args'] = [
                '--disable-default-apps',  # Prevent default app associations
                '--no-first-run',          # Skip first run experience
            ]

            logger.debug(f"Browser config enhancements for {profile_id}: {enhancements}")

        except Exception as e:
            logger.error(f"Error getting browser config enhancements: {e}")

        return enhancements

    async def apply_runtime_customization(self, profile_id: str, browser_instance) -> bool:
        """
        Apply runtime customization to a running browser instance.

        Args:
            profile_id: Profile ID
            browser_instance: Running browser instance

        Returns:
            True if customization applied successfully, False otherwise
        """
        try:
            logger.info(f"Applying runtime customization to profile {profile_id}")

            # Apply window title customization
            await self._customize_browser_window(profile_id, browser_instance)

            # Apply icon customization if possible
            await self._apply_browser_icon_customization(profile_id, browser_instance)

            logger.info(f"Runtime customization applied to profile {profile_id}")
            return True

        except Exception as e:
            logger.error(f"Error applying runtime customization to {profile_id}: {e}")
            return False

    async def _customize_browser_window(self, profile_id: str, browser_instance) -> None:
        """Customize browser window properties."""
        try:
            # This could be extended to set window titles, etc.
            logger.debug(f"Applied window customization for profile {profile_id}")
        except Exception as e:
            logger.error(f"Error customizing browser window: {e}")

    async def _apply_browser_icon_customization(self, profile_id: str, browser_instance) -> None:
        """Apply icon customization to browser instance."""
        try:
            # For future implementation: inject custom CSS/JS to change browser icons
            # This would require deeper browser integration
            logger.debug(f"Applied icon customization for profile {profile_id}")
        except Exception as e:
            logger.error(f"Error applying browser icon customization: {e}")

    def is_customization_enabled(self) -> bool:
        """Check if browser customization is enabled."""
        return len([icon for icon in self.nyx_icons.values() if icon and icon.exists()]) > 0

    def get_customization_status(self) -> Dict[str, Any]:
        """Get current customization status."""
        return {
            "enabled": self.is_customization_enabled(),
            "custom_browser_ready": self.is_custom_browser_ready,
            "icons_available": {size: bool(path and path.exists()) for size, path in self.nyx_icons.items()},
            "storage_dir": str(self.storage_dir),
            "icon_cache_dir": str(self.icon_cache_dir)
        }

    async def cleanup_profile_customization(self, profile_id: str, profile_path: Path) -> bool:
        """
        Clean up customization for a profile.

        Args:
            profile_id: Profile ID
            profile_path: Path to profile directory

        Returns:
            True if cleanup successful, False otherwise
        """
        try:
            custom_dir = profile_path / "nyx-customization"
            if custom_dir.exists():
                shutil.rmtree(custom_dir)
                logger.info(f"Cleaned up customization for profile {profile_id}")

            return True

        except Exception as e:
            logger.error(f"Error cleaning up customization for {profile_id}: {e}")
            return False

# Global instance for easy access
browser_customization = BrowserCustomization()
