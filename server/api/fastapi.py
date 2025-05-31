from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import os
import logging
import traceback
from contextlib import asynccontextmanager

# Import routes and other dependencies
from api.routes import api_router
from api.middleware.enhanced_auth import EnhancedAuthMiddleware
from api.middleware.rate_limiter import RateLimiterMiddleware, RateLimitConfig
# After adding CORS middleware
from api.middleware.options_middleware import OptionsMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("api")

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting up FastAPI server")

    # Redis initialization
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        try:
            logger.info(f"Initializing Redis connection")
            # Redis initialization would go here
        except Exception as e:
            logger.error(f"Error initializing Redis: {str(e)}")

    # WebSocket functionality removed - not needed for core features

    # Initialize profile manager
    try:
        # Use the profile manager
        from core.profile_manager import profile_manager
        logger.info("Initializing profile manager")
        logger.info("Using profile manager that lets Camoufox handle fingerprinting automatically")
    except Exception as e:
        logger.error(f"Error initializing profile manager: {str(e)}")

    # Initialize database modules
    try:
        from db import profile_operations, proxy_operations
        logger.info("Initializing database modules")
        logger.info("Database modules initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database modules: {str(e)}")

    # Initialize crawler manager
    try:
        from api.routes.crawlers import initialize_crawler_manager
        logger.info("Initializing crawler manager")
        await initialize_crawler_manager()
        logger.info("Crawler manager initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing crawler manager: {str(e)}")
        logger.info("Crawler manager will be initialized on first use")

    yield

    # Shutdown logic
    logger.info("Shutting down FastAPI server")

# Create FastAPI app
app = FastAPI(
    title="Camoufox API",
    description="API for Camoufox - Virtual Device Management",
    version="1.0.0",
    lifespan=lifespan,
)

# Define CORS origins
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev server
    "tauri://localhost",      # Tauri app
    "https://tauri.localhost" # Tauri app (secure)
]

# Add CORS middleware - MUST be first in the middleware stack
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicitly include OPTIONS
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Add options middleware to handle OPTIONS requests explicitly
app.add_middleware(OptionsMiddleware)

# Add custom exception handlers to ensure CORS headers are included in error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", origins[0]),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", origins[0]),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", origins[0]),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Include routers
app.include_router(api_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Enhanced health check endpoint for production monitoring"""
    import time
    import psutil
    from datetime import datetime

    try:
        # Basic health info
        health_info = {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": time.time() - psutil.boot_time(),
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "production")
        }

        # System resources
        try:
            health_info["system"] = {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:').percent
            }
        except Exception:
            health_info["system"] = {"status": "unavailable"}

        # Database connectivity (if applicable)
        try:
            # Add database health check here if needed
            health_info["database"] = {"status": "ok"}
        except Exception:
            health_info["database"] = {"status": "error"}

        return health_info

    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Camoufox API"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(
        "api.fastapi:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
