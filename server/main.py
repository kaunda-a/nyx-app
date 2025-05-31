import asyncio
import logging
import os
import signal
import sys
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import FastAPI app
from api.fastapi import app as fastapi_app

# Import container
from core.container import Container

# Import storage utilities
from core.storage import ensure_storage_directories

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("api")

# Ensure all required storage directories exist
ensure_storage_directories()

# Global variables to track servers and container
fastapi_server = None
container = None

async def run_fastapi_server():
    """Run the FastAPI server using uvicorn"""
    global fastapi_server

    try:
        # Create log file
        with open("sessions/logs/fastapi.log", "w") as fastapi_log:
            logger.info("Created FastAPI log file")

        # Start FastAPI server on port 8080
        logger.info("Starting FastAPI server on port 8080...")

        # Configure the server
        config = uvicorn.Config(
            app=fastapi_app,
            host="0.0.0.0",
            port=8080,
            log_level="info",
            access_log=False,
        )

        # Create the server
        fastapi_server = uvicorn.Server(config)

        # Run the server
        await fastapi_server.serve()

        return True
    except Exception as e:
        logger.error(f"Error starting FastAPI server: {e}")
        return False

async def initialize_container():
    """Initialize the dependency injection container"""
    global container

    try:
        # Default configuration
        config = {
            'log_dir': './sessions/logs',
            'data_dir': './sessions/storage',
            'temp_dir': './sessions/temp'
        }

        # Create container
        container = Container(config)
        logger.info("Dependency injection container initialized")

        return True
    except Exception as e:
        logger.error(f"Error initializing container: {e}")
        return False

async def configure_browser_settings():
    """Configure browser settings for the application"""
    try:
        # Set environment variables for browser configuration
        os.environ['BROWSER_PORT'] = '8081'
        os.environ['BROWSER_WS_PATH'] = 'browser'
        os.environ['BROWSER_HOST'] = '0.0.0.0'
        os.environ['BROWSER_HEADLESS'] = 'false'  # Show browser window on Windows
        os.environ['BROWSER_PROFILES_DIR'] = './sessions/storage/profiles'

        # Ensure profiles directory exists
        Path(os.environ['BROWSER_PROFILES_DIR']).mkdir(parents=True, exist_ok=True)

        logger.info("Browser settings configured successfully")
        return True
    except Exception as e:
        logger.error(f"Error configuring browser settings: {e}")
        return False

async def initialize_profile_manager():
    """Initialize the profile manager"""
    try:
        # Get profile manager from container
        profile_manager = container.get_profile_manager()

        # Initialize profile manager
        logger.info("Initializing profile manager...")
        await profile_manager.initialize()

        logger.info("Profile manager initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing profile manager: {e}")
        return False

async def initialize_browser_customization():
    """Initialize the browser customization system"""
    try:
        from integration.customization import browser_customization
        success = await browser_customization.initialize()
        if success:
            logger.info("Browser customization system initialized successfully")
        else:
            logger.warning("Browser customization system initialization failed")
        return success
    except Exception as e:
        logger.error(f"Error initializing browser customization: {e}")
        return False

async def main():
    # Initialize container
    logger.info("Initializing dependency injection container...")
    if not await initialize_container():
        logger.error("Failed to initialize container. Exiting.")
        return

    # Configure browser settings
    logger.info("Configuring browser settings...")
    if not await configure_browser_settings():
        logger.warning("Failed to configure browser settings, continuing anyway...")

    # Initialize profile manager
    logger.info("Initializing profile manager...")
    if not await initialize_profile_manager():
        logger.warning("Failed to initialize profile manager, continuing anyway...")

    # Initialize browser customization
    logger.info("Initializing browser customization...")
    if not await initialize_browser_customization():
        logger.warning("Failed to initialize browser customization, continuing anyway...")

    # Start FastAPI server
    logger.info("Starting FastAPI server...")
    await run_fastapi_server()

def signal_handler(sig, _):
    """Handle signals for graceful shutdown"""
    logger.info(f"Received signal {sig}. Shutting down...")
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server shutdown initiated by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        raise
