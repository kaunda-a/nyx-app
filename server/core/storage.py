"""
Storage utilities for the application.
"""

import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Define common storage paths
SESSIONS_DIR = Path("./sessions")
STORAGE_DIR = SESSIONS_DIR / "storage"
PROFILES_DIR = STORAGE_DIR / "profiles"
LOGS_DIR = SESSIONS_DIR / "./logs"
TEMP_DIR = SESSIONS_DIR / "./temp"

def ensure_storage_directories():
    """
    Ensure all required storage directories exist.
    This should be called at application startup.
    """
    directories = [
        SESSIONS_DIR,
        STORAGE_DIR,
        PROFILES_DIR,
        LOGS_DIR,
        TEMP_DIR
    ]
    
    for directory in directories:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"Ensured directory exists: {directory}")
        except Exception as e:
            logger.error(f"Failed to create directory {directory}: {e}")
    
    return True
