"""
Update server endpoints for Tauri auto-updater
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/updates", tags=["updates"])


class UpdateInfo(BaseModel):
    """Update information model"""
    version: str
    notes: str
    pub_date: str
    platforms: Dict[str, Dict[str, str]]


class UpdateResponse(BaseModel):
    """Response model for update checks"""
    version: str
    notes: str
    pub_date: str
    platforms: Dict[str, Dict[str, str]]


# In-memory cache for update info (in production, use Redis or database)
update_cache: Dict[str, UpdateInfo] = {}


@router.get("/{target}/{current_version}")
async def check_for_updates(
    target: str,
    current_version: str,
    request: Request
) -> Optional[UpdateResponse]:
    """
    Check for available updates for a specific target and version
    
    Args:
        target: Platform target (e.g., "windows-x86_64", "darwin-aarch64")
        current_version: Current app version
        
    Returns:
        Update information if available, None if up to date
    """
    try:
        logger.info(f"Update check: target={target}, current={current_version}")
        
        # Get latest release info from GitHub
        latest_release = await get_latest_github_release()
        
        if not latest_release:
            logger.warning("No releases found")
            return None
            
        latest_version = latest_release.get("tag_name", "").lstrip("v")
        
        # Compare versions (simple string comparison for now)
        if is_newer_version(latest_version, current_version.lstrip("v")):
            # Find the appropriate asset for the target platform
            download_url = find_asset_for_target(latest_release.get("assets", []), target)
            
            if not download_url:
                logger.warning(f"No asset found for target: {target}")
                return None
                
            # Get signature for the asset
            signature = await get_asset_signature(latest_release.get("assets", []), target)
            
            update_info = UpdateResponse(
                version=latest_version,
                notes=latest_release.get("body", ""),
                pub_date=latest_release.get("published_at", datetime.utcnow().isoformat()),
                platforms={
                    target: {
                        "signature": signature,
                        "url": download_url
                    }
                }
            )
            
            logger.info(f"Update available: {current_version} -> {latest_version}")
            return update_info
            
        logger.info(f"No update needed: {current_version} is up to date")
        return None
        
    except Exception as e:
        logger.error(f"Error checking for updates: {e}")
        raise HTTPException(status_code=500, detail="Failed to check for updates")


async def get_latest_github_release() -> Optional[Dict]:
    """Fetch latest release from GitHub API"""
    try:
        github_repo = os.getenv("GITHUB_REPOSITORY", "your-username/nyx_app")
        github_token = os.getenv("GITHUB_TOKEN")
        
        headers = {}
        if github_token:
            headers["Authorization"] = f"token {github_token}"
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{github_repo}/releases/latest",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"GitHub API error: {response.status_code}")
                return None
                
    except Exception as e:
        logger.error(f"Error fetching GitHub release: {e}")
        return None


def find_asset_for_target(assets: list, target: str) -> Optional[str]:
    """Find the download URL for a specific target platform"""
    target_mapping = {
        "windows-x86_64": [".msi", ".exe"],
        "darwin-x86_64": [".dmg", ".app.tar.gz"],
        "darwin-aarch64": [".dmg", ".app.tar.gz"],
        "linux-x86_64": [".AppImage", ".deb", ".tar.gz"]
    }
    
    extensions = target_mapping.get(target, [])
    
    for asset in assets:
        asset_name = asset.get("name", "").lower()
        for ext in extensions:
            if asset_name.endswith(ext.lower()):
                return asset.get("browser_download_url")
                
    return None


async def get_asset_signature(assets: list, target: str) -> str:
    """Get the signature for an asset"""
    # Look for .sig file corresponding to the target
    for asset in assets:
        asset_name = asset.get("name", "")
        if asset_name.endswith(".sig") and target in asset_name:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(asset.get("browser_download_url"))
                    if response.status_code == 200:
                        return response.text.strip()
            except Exception as e:
                logger.error(f"Error fetching signature: {e}")
                
    return ""


def is_newer_version(latest: str, current: str) -> bool:
    """Simple version comparison (you might want to use semantic versioning)"""
    try:
        latest_parts = [int(x) for x in latest.split(".")]
        current_parts = [int(x) for x in current.split(".")]
        
        # Pad shorter version with zeros
        max_len = max(len(latest_parts), len(current_parts))
        latest_parts.extend([0] * (max_len - len(latest_parts)))
        current_parts.extend([0] * (max_len - len(current_parts)))
        
        return latest_parts > current_parts
    except ValueError:
        # Fallback to string comparison
        return latest > current


@router.get("/health")
async def health_check():
    """Health check endpoint for the update server"""
    return {"status": "healthy", "service": "update-server"}
