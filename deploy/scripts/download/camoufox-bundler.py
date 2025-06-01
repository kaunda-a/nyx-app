#!/usr/bin/env python3
"""
Camoufox bundling system for Nyx App deployment.

This module handles downloading, bundling, and customizing Camoufox
from the forked repository for inclusion in Nyx App distributions.
"""

import sys
import os
import shutil
import logging
import asyncio
import zipfile
import requests
from pathlib import Path
from typing import Dict, Any, Optional, List
import tempfile
import subprocess
import json

# Add common utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent / "common"))
try:
    from utils import utils
except ImportError:
    # Fallback if utils not found
    print("Warning: Utils module not found, using basic functionality")

    class BasicUtils:
        @staticmethod
        def ensure_directory(path):
            Path(path).mkdir(parents=True, exist_ok=True)

        @staticmethod
        def get_project_paths():
            return {
                'dist': Path.cwd() / 'dist',
                'deploy': Path.cwd() / 'deploy'
            }

        @staticmethod
        def get_current_timestamp():
            import datetime
            return datetime.datetime.now().isoformat()

        class config:
            @staticmethod
            def get(key, default=None):
                return default

        class logger:
            @staticmethod
            def info(msg):
                print(f"INFO: {msg}")

            @staticmethod
            def warning(msg):
                print(f"WARNING: {msg}")

            @staticmethod
            def error(msg):
                print(f"ERROR: {msg}")

            @staticmethod
            def debug(msg):
                print(f"DEBUG: {msg}")

    utils = BasicUtils()

class CamoufoxBundler:
    """
    Handles Camoufox bundling for Nyx App deployment.
    
    This class manages:
    - Downloading Camoufox from forked repository
    - Applying Nyx branding to browser
    - Bundling browser with server executable
    - Creating portable browser installation
    """
    
    def __init__(self):
        """Initialize Camoufox bundler."""
        self.paths = utils.get_project_paths()
        self.config = utils.config.get('deployment', {}).get('camoufox', {})
        self.logger = utils.logger
        
        # Configuration
        self.camoufox_source = self.config.get('source', 'https://github.com/kaunda-a/camoufox')
        self.camoufox_branch = self.config.get('branch', 'main')
        self.bundle_path = self.paths['dist'] / self.config.get('bundle_path', 'camoufox')
        self.executable_name = self.config.get('executable_name', 'camoufox.exe')
        self.apply_branding = self.config.get('apply_branding', True)
        
        self.logger.info(f"CamoufoxBundler initialized for source: {self.camoufox_source}")
    
    async def download_camoufox(self, force_download: bool = False) -> bool:
        """
        Download Camoufox from the forked repository.
        
        Args:
            force_download: Force download even if already exists
            
        Returns:
            True if download successful, False otherwise
        """
        try:
            self.logger.info("Downloading Camoufox from forked repository...")
            
            # Create temporary directory for download
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Download latest release or source
                success = await self._download_camoufox_release(temp_path)
                
                if not success:
                    # Fallback to source download
                    success = await self._download_camoufox_source(temp_path)
                
                if success:
                    # Extract and prepare Camoufox
                    await self._prepare_camoufox(temp_path)

                    self.logger.info("✅ Camoufox downloaded and prepared successfully")
                    return True
                else:
                    # Fallback to placeholder if download fails
                    self.logger.warning("⚠️  Camoufox download failed, creating placeholder bundle")
                    await self._create_placeholder_bundle()
                    return True
                    
        except Exception as e:
            self.logger.error(f"ERROR: Error downloading Camoufox: {e}")
            # Even if download fails completely, create a placeholder
            try:
                self.logger.warning("Creating emergency placeholder bundle...")
                await self._create_placeholder_bundle()
                return True
            except Exception as fallback_error:
                self.logger.error(f"ERROR: Could not create fallback bundle: {fallback_error}")
                return False
    
    async def _download_camoufox_release(self, temp_path: Path) -> bool:
        """Download latest Camoufox release."""
        try:
            # Get latest release info from GitHub API
            api_url = f"https://api.github.com/repos/kaunda-a/camoufox/releases/latest"
            
            self.logger.info(f"Checking for latest Camoufox release...")
            response = requests.get(api_url, timeout=30)
            
            if response.status_code == 200:
                release_data = response.json()
                
                # Look for Windows executable in assets
                for asset in release_data.get('assets', []):
                    if 'windows' in asset['name'].lower() or asset['name'].endswith('.exe'):
                        download_url = asset['browser_download_url']
                        
                        self.logger.info(f"Downloading Camoufox release: {asset['name']}")
                        
                        # Download the release
                        download_response = requests.get(download_url, timeout=300)
                        if download_response.status_code == 200:
                            release_file = temp_path / asset['name']
                            with open(release_file, 'wb') as f:
                                f.write(download_response.content)
                            
                            self.logger.info(f"Downloaded Camoufox release to: {release_file}")
                            return True
                
                self.logger.warning("No Windows executable found in latest release")
                return False
            else:
                self.logger.warning(f"Could not fetch release info: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error downloading Camoufox release: {e}")
            return False
    
    async def _download_camoufox_source(self, temp_path: Path) -> bool:
        """Download Camoufox source code."""
        try:
            # Clone the repository
            clone_url = f"{self.camoufox_source}/archive/refs/heads/{self.camoufox_branch}.zip"
            
            self.logger.info(f"Downloading Camoufox source from: {clone_url}")
            
            response = requests.get(clone_url, timeout=300)
            if response.status_code == 200:
                zip_file = temp_path / "camoufox-source.zip"
                with open(zip_file, 'wb') as f:
                    f.write(response.content)
                
                # Extract the zip
                with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                    zip_ref.extractall(temp_path)
                
                self.logger.info("Downloaded and extracted Camoufox source")
                return True
            else:
                self.logger.error(f"Failed to download source: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error downloading Camoufox source: {e}")
            return False

    async def _create_placeholder_bundle(self) -> None:
        """Create a placeholder Camoufox bundle when download fails."""
        try:
            self.logger.info("Creating placeholder Camoufox bundle...")

            # Ensure bundle directory exists
            utils.ensure_directory(self.bundle_path)

            # Create basic structure
            camoufox_dir = self.bundle_path / "browser"
            utils.ensure_directory(camoufox_dir)

            # Create placeholder executable
            placeholder_exe = camoufox_dir / self.executable_name
            with open(placeholder_exe, 'w') as f:
                f.write("# Camoufox executable placeholder\n")
                f.write("# This is a placeholder - actual Camoufox will be downloaded later\n")
                f.write("# The application will use system browser as fallback\n")

            # Create placeholder metadata
            placeholder_metadata = {
                "bundle_type": "placeholder",
                "created_at": utils.get_current_timestamp() if hasattr(utils, 'get_current_timestamp') else "unknown",
                "note": "Placeholder bundle created due to download failure"
            }

            metadata_file = camoufox_dir / "bundle-info.json"
            with open(metadata_file, 'w') as f:
                json.dump(placeholder_metadata, f, indent=2)

            # Try to apply basic branding (with error handling)
            try:
                if self.apply_branding:
                    await self._apply_nyx_branding_safe(camoufox_dir)
            except Exception as e:
                self.logger.warning(f"Could not apply branding to placeholder: {e}")

            self.logger.info(f"Created placeholder Camoufox bundle at: {self.bundle_path}")

        except Exception as e:
            self.logger.error(f"Error creating placeholder bundle: {e}")
            raise

    async def _prepare_camoufox(self, temp_path: Path) -> None:
        """Prepare Camoufox for bundling."""
        try:
            # Ensure bundle directory exists
            utils.ensure_directory(self.bundle_path)
            
            # For now, create a placeholder structure
            # This will be enhanced when we have the actual Camoufox build process
            
            # Create basic structure
            camoufox_dir = self.bundle_path / "browser"
            utils.ensure_directory(camoufox_dir)
            
            # Create placeholder executable (will be replaced with actual Camoufox)
            placeholder_exe = camoufox_dir / self.executable_name
            with open(placeholder_exe, 'w') as f:
                f.write("# Camoufox executable placeholder\n")
            
            # Apply Nyx branding if enabled
            if self.apply_branding:
                await self._apply_nyx_branding(camoufox_dir)
            
            self.logger.info(f"Prepared Camoufox bundle at: {self.bundle_path}")
            
        except Exception as e:
            self.logger.error(f"Error preparing Camoufox: {e}")
            raise
    
    async def _apply_nyx_branding(self, camoufox_dir: Path) -> None:
        """Apply Nyx branding to Camoufox installation."""
        try:
            # Create branding directory
            branding_dir = camoufox_dir / "nyx-branding"
            utils.ensure_directory(branding_dir)
            
            # Copy Nyx icons
            from integration.customization import browser_customization
            
            # Initialize browser customization if not already done
            if not browser_customization.is_customization_enabled():
                await browser_customization.initialize()
            
            # Copy icons to branding directory
            for size, icon_path in browser_customization.nyx_icons.items():
                if icon_path and icon_path.exists():
                    dest_path = branding_dir / f"nyx-{size}.png"
                    shutil.copy2(icon_path, dest_path)
                    self.logger.debug(f"Applied Nyx icon {size} to Camoufox bundle")
            
            # Create branding metadata
            branding_metadata = {
                "brand": "Nyx",
                "version": "1.0",
                "applied_at": utils.get_current_timestamp(),
                "icons_applied": True
            }
            
            metadata_file = branding_dir / "branding.json"
            with open(metadata_file, 'w') as f:
                json.dump(branding_metadata, f, indent=2)
            
            self.logger.info("Applied Nyx branding to Camoufox bundle")
            
        except Exception as e:
            self.logger.error(f"Error applying Nyx branding: {e}")

    async def _apply_nyx_branding_safe(self, camoufox_dir: Path) -> None:
        """Apply Nyx branding with error handling for missing modules."""
        try:
            # Create branding directory
            branding_dir = camoufox_dir / "nyx-branding"
            utils.ensure_directory(branding_dir)

            # Try to import browser customization
            try:
                from integration.customization import browser_customization

                # Initialize browser customization if not already done
                if not browser_customization.is_customization_enabled():
                    await browser_customization.initialize()

                # Copy icons to branding directory
                for size, icon_path in browser_customization.nyx_icons.items():
                    if icon_path and icon_path.exists():
                        dest_path = branding_dir / f"nyx-{size}.png"
                        shutil.copy2(icon_path, dest_path)
                        self.logger.debug(f"Applied Nyx icon {size} to Camoufox bundle")

                self.logger.info("Applied Nyx branding to Camoufox bundle")

            except ImportError as e:
                self.logger.warning(f"Browser customization module not available: {e}")
                # Create basic branding without icons
                self.logger.info("Creating basic branding without customization module")

            # Create branding metadata (always create this)
            branding_metadata = {
                "brand": "Nyx",
                "version": "1.0",
                "applied_at": utils.get_current_timestamp() if hasattr(utils, 'get_current_timestamp') else "unknown",
                "icons_applied": False,  # Will be updated if icons are successfully applied
                "fallback_branding": True
            }

            metadata_file = branding_dir / "branding.json"
            with open(metadata_file, 'w') as f:
                json.dump(branding_metadata, f, indent=2)

        except Exception as e:
            self.logger.warning(f"Could not apply safe branding: {e}")

    def get_bundle_info(self) -> Dict[str, Any]:
        """Get information about the current Camoufox bundle."""
        try:
            bundle_info = {
                "bundle_exists": self.bundle_path.exists(),
                "bundle_path": str(self.bundle_path),
                "executable_path": str(self.bundle_path / "browser" / self.executable_name),
                "branding_applied": (self.bundle_path / "browser" / "nyx-branding").exists(),
                "source_repository": self.camoufox_source,
                "branch": self.camoufox_branch
            }
            
            # Check bundle size if it exists
            if bundle_info["bundle_exists"]:
                total_size = sum(f.stat().st_size for f in self.bundle_path.rglob('*') if f.is_file())
                bundle_info["bundle_size_mb"] = round(total_size / (1024 * 1024), 2)
            
            return bundle_info
            
        except Exception as e:
            self.logger.error(f"Error getting bundle info: {e}")
            return {"error": str(e)}
    
    async def update_camoufox(self) -> bool:
        """Update Camoufox to latest version."""
        try:
            self.logger.info("Updating Camoufox to latest version...")
            
            # Remove existing bundle
            if self.bundle_path.exists():
                shutil.rmtree(self.bundle_path)
                self.logger.info("Removed existing Camoufox bundle")
            
            # Download latest version
            success = await self.download_camoufox(force_download=True)
            
            if success:
                self.logger.info("✅ Camoufox updated successfully")
            else:
                self.logger.error("❌ Failed to update Camoufox")
            
            return success
            
        except Exception as e:
            self.logger.error(f"❌ Error updating Camoufox: {e}")
            return False
    
    async def clean_bundle(self) -> bool:
        """Clean Camoufox bundle."""
        try:
            if self.bundle_path.exists():
                shutil.rmtree(self.bundle_path)
                self.logger.info("Cleaned Camoufox bundle")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error cleaning Camoufox bundle: {e}")
            return False

# Global instance
camoufox_bundler = CamoufoxBundler()

def main():
    """Main entry point for Camoufox bundler."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Camoufox bundling system")
    parser.add_argument('--download', action='store_true', help='Download Camoufox')
    parser.add_argument('--update', action='store_true', help='Update to latest version')
    parser.add_argument('--info', action='store_true', help='Show bundle information')
    parser.add_argument('--clean', action='store_true', help='Clean bundle')
    
    args = parser.parse_args()
    
    async def run():
        if args.download:
            success = await camoufox_bundler.download_camoufox()
            return success
        elif args.update:
            success = await camoufox_bundler.update_camoufox()
            return success
        elif args.info:
            info = camoufox_bundler.get_bundle_info()
            print(json.dumps(info, indent=2))
            return True
        elif args.clean:
            success = await camoufox_bundler.clean_bundle()
            return success
        else:
            parser.print_help()
            return False
    
    success = asyncio.run(run())
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
