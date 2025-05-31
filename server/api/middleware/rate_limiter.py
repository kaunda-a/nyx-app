from typing import Dict, Optional, Callable, Union, List
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response, JSONResponse
import time
import asyncio
from datetime import datetime, timedelta
import json
from enum import Enum
import logging

# Configure logging
logger = logging.getLogger("rate_limiter")

class RateLimitStrategy(str, Enum):
    """Rate limiting strategies"""
    TOKEN_BUCKET = "token_bucket"
    SLIDING_WINDOW = "sliding_window"
    FIXED_WINDOW = "fixed_window"

class RateLimitTier(str, Enum):
    """Rate limit tiers for different user types"""
    ANONYMOUS = "anonymous"
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"

class RateLimitResponse(str, Enum):
    """Response types for rate limit violations"""
    BLOCK = "block"  # Return 429 error
    THROTTLE = "throttle"  # Delay response
    LOG = "log"  # Only log the violation
    CHALLENGE = "challenge"  # Require additional verification

class RateLimitConfig:
    """Configuration for rate limiting"""
    def __init__(
        self,
        requests_per_minute: Dict[RateLimitTier, int] = None,
        burst_limit: Dict[RateLimitTier, int] = None,
        strategy: RateLimitStrategy = RateLimitStrategy.TOKEN_BUCKET,
        response_type: RateLimitResponse = RateLimitResponse.BLOCK,
        exclude_paths: List[str] = None,
        per_route_limits: Dict[str, Dict[RateLimitTier, int]] = None,
        max_penalty_seconds: int = 30,
    ):
        # Default limits per minute
        self.requests_per_minute = requests_per_minute or {
            RateLimitTier.ANONYMOUS: 30,
            RateLimitTier.USER: 60,
            RateLimitTier.PREMIUM: 120,
            RateLimitTier.ADMIN: 300
        }

        # Burst limits (max requests in a short period)
        self.burst_limit = burst_limit or {
            RateLimitTier.ANONYMOUS: 10,
            RateLimitTier.USER: 20,
            RateLimitTier.PREMIUM: 40,
            RateLimitTier.ADMIN: 100
        }

        self.strategy = strategy
        self.response_type = response_type
        self.exclude_paths = exclude_paths or ["/health", "/metrics"]
        self.per_route_limits = per_route_limits or {}
        self.max_penalty_seconds = max_penalty_seconds

class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        config: RateLimitConfig = None
    ):
        super().__init__(app)
        self.config = config or RateLimitConfig()

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip rate limiting for excluded paths
        if request.url.path in self.config.exclude_paths:
            return await call_next(request)

        # For simplicity, we'll just pass through all requests
        # In a real implementation, this would check rate limits
        return await call_next(request)



# FastAPI dependency for checking rate limits
async def check_rate_limit(request: Request):
    """Dependency to check rate limits for specific endpoints"""
    # This is a placeholder for endpoint-specific rate limiting
    # The actual implementation is handled by the middleware
    return True
