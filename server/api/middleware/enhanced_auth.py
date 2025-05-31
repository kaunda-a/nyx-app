from typing import Optional, Dict, Callable, List, Set
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from datetime import datetime, timedelta
import os
import json

class EnhancedAuthMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        public_paths: Set[str] = None,
        exclude_paths: Set[str] = None,
        allow_origins: List[str] = None,
        allow_credentials: bool = True,
        allow_methods: List[str] = None,
        allow_headers: List[str] = None,
        jwt_secret: str = None,
        jwt_algorithm: str = "HS256",
    ):
        super().__init__(app)
        self.public_paths = public_paths or {"/api/auth/signin", "/api/auth/signup", "/health",
            "/api/browser-use/sessions", "/api/browser-use/sessions/test-session"}
        self.exclude_paths = exclude_paths or set()
        self.security = HTTPBearer()
        self.allow_origins = allow_origins or ["*"]
        self.allow_credentials = allow_credentials
        self.allow_methods = allow_methods or ["*"]
        self.allow_headers = allow_headers or ["*"]
        self.jwt_secret = jwt_secret or os.getenv("JWT_SECRET")
        self.jwt_algorithm = jwt_algorithm

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Handle CORS preflight requests
        if request.method == "OPTIONS":
            return await self._handle_cors(request, call_next)

        # Check if path is public or excluded
        if self._is_path_exempt(request.url.path):
            return await self._handle_cors(request, call_next)

        # For simplicity, we'll just pass through all requests
        # In a real implementation, this would validate tokens
        return await self._handle_cors(request, call_next)

    def _is_path_exempt(self, path: str) -> bool:
        """Check if path is public or excluded"""
        return path in self.public_paths or path in self.exclude_paths

    async def _handle_cors(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Handle CORS headers"""
        response = await call_next(request) if callable(call_next) else call_next(request)

        origin = request.headers.get("origin")
        if origin and (self.allow_origins == ["*"] or origin in self.allow_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = str(self.allow_credentials).lower()

            if request.method == "OPTIONS":
                response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allow_methods)
                response.headers["Access-Control-Allow-Headers"] = ", ".join(self.allow_headers)

        return response

# Role-based access control decorator
def requires_role(roles: List[str]):
    """Decorator to check if user has required role"""
    async def dependency(request: Request):
        # For simplicity, we'll just return a mock user
        return {"id": "1", "email": "user@example.com", "role": "admin"}
    return Depends(dependency)

# FastAPI dependency for getting current user
async def get_current_user(request: Request) -> Dict:
    """Dependency to get current authenticated user"""
    # For simplicity, we'll just return a mock user
    return {"id": "1", "email": "user@example.com", "role": "user"}

# FastAPI dependency for getting admin user
async def get_admin_user(request: Request) -> Dict:
    """Dependency to get current admin user"""
    # For simplicity, we'll just return a mock admin user
    return {"id": "1", "email": "admin@example.com", "role": "admin"}
