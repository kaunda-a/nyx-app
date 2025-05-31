
from typing import Optional, Dict, Callable
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from datetime import datetime, timedelta
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from supabase import Client, create_client
import os
from functools import lru_cache
import asyncio

class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        public_paths: set[str] = None,
        exclude_paths: set[str] = None
    ):
        super().__init__(app)
        self.public_paths = public_paths or {"/api/auth/signin", "/api/auth/signup"}
        self.exclude_paths = exclude_paths or set()
        self.security = HTTPBearer()
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_ANON_KEY")
        )

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if request.url.path in self.public_paths:
            return await call_next(request)

        if request.url.path in self.exclude_paths:
            return await call_next(request)

        try:
            token = await self.get_token(request)
            if not token:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid authentication credentials"
                )

            user_data = await self.validate_token(token)
            if not user_data:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or expired token"
                )

            # Add user data to request state
            request.state.user = user_data
            request.state.token = token

            # Check if token needs refresh
            if self.should_refresh_token(user_data):
                new_token = await self.refresh_token(token)
                response = await call_next(request)
                response.headers["X-New-Token"] = new_token
                return response

            return await call_next(request)

        except HTTPException as exc:
            raise exc
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error: {str(exc)}"
            )

    async def get_token(self, request: Request) -> Optional[str]:
        """Extract token from request header"""
        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return None
            
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                return None
            
            return token
        except Exception:
            return None

    async def validate_token(self, token: str) -> Optional[Dict]:
        """Validate JWT token and return user data"""
        try:
            # Verify token with Supabase
            user = self.supabase.auth.get_user(token)
            if not user:
                return None

            return {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "exp": user.exp,
                "last_sign_in_at": user.last_sign_in_at
            }
        except Exception:
            return None

    def should_refresh_token(self, user_data: Dict) -> bool:
        """Check if token should be refreshed"""
        if not user_data.get("exp"):
            return False
        
        # Refresh if token expires in less than 1 hour
        exp_time = datetime.fromtimestamp(user_data["exp"])
        refresh_threshold = datetime.utcnow() + timedelta(hours=1)
        return exp_time <= refresh_threshold

    async def refresh_token(self, current_token: str) -> str:
        """Refresh the access token"""
        try:
            # Refresh token using Supabase
            refresh_response = await self.supabase.auth.refresh_session()
            return refresh_response.session.access_token
        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail="Token refresh failed"
            )

# FastAPI dependency for getting current user
async def get_current_user(request: Request) -> Dict:
    """Dependency to get current authenticated user"""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    return user

# FastAPI dependency for getting admin user
async def get_admin_user(user: Dict = Depends(get_current_user)) -> Dict:
    """Dependency to get current admin user"""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )
    return user

# Rate limiting implementation
class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests = {}
        self.lock = asyncio.Lock()
        self.rpm = requests_per_minute

    async def check_rate_limit(self, client_id: str) -> bool:
        async with self.lock:
            now = datetime.now()
            if client_id not in self.requests:
                self.requests[client_id] = []
            
            # Clean old requests
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id] 
                if now - req_time < timedelta(minutes=1)
            ]
            
            if len(self.requests[client_id]) >= self.rpm:
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
                
            self.requests[client_id].append(now)
            return True

# Cache for rate limiter instance
@lru_cache()
def get_rate_limiter() -> RateLimiter:
    return RateLimiter()

# Rate limiting dependency
async def check_rate_limit(
    request: Request,
    rate_limiter: RateLimiter = Depends(get_rate_limiter)
) -> None:
    user = getattr(request.state, "user", None)
    if user and rate_limiter.is_rate_limited(user["id"]):
        raise HTTPException(
            status_code=429,
            detail="Too many requests"
        )

