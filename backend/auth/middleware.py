from typing import Optional, List, Callable
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import User, UserSession
from .jwt_handler import jwt_handler
from core.config import settings
from loguru import logger
from datetime import datetime
import time


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware for validating JWT tokens
    """
    
    def __init__(self, app, exclude_paths: Optional[List[str]] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/docs", "/redoc", "/openapi.json", "/health", "/metrics",
            "/auth/login", "/auth/register", "/auth/refresh", "/"
        ]
        self.security = HTTPBearer(auto_error=False)
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request through authentication middleware
        """
        start_time = time.time()
        
        # Skip authentication for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            response = await call_next(request)
            return response
        
        try:
            # Extract and validate token
            token = await self._extract_token(request)
            if not token:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Authentication required"}
                )
            
            # Verify token
            payload = jwt_handler.verify_token(token)
            if not payload:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid or expired token"}
                )
            
            # Validate session if present
            session_id = payload.get("session_id")
            if session_id and not await self._validate_session(session_id):
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Session expired or invalid"}
                )
            
            # Add user info to request state
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
            request.state.user_role = payload.get("role")
            request.state.user_permissions = payload.get("permissions", [])
            request.state.session_id = session_id
            
            # Process request
            response = await call_next(request)
            
            # Log request
            process_time = time.time() - start_time
            logger.info(
                f"Auth request - User: {request.state.user_email}, "
                f"Path: {request.url.path}, Method: {request.method}, "
                f"Time: {process_time:.3f}s"
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Authentication middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Authentication service error"}
            )
    
    async def _extract_token(self, request: Request) -> Optional[str]:
        """
        Extract JWT token from request
        """
        # Try Authorization header first
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            return authorization.split(" ")[1]
        
        # Try cookie as fallback
        token = request.cookies.get("access_token")
        if token:
            return token
        
        return None
    
    async def _validate_session(self, session_id: str) -> bool:
        """
        Validate user session
        """
        try:
            db = next(get_db())
            session = db.query(UserSession).filter(
                UserSession.id == session_id,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.utcnow()
            ).first()
            
            return session is not None
        except Exception as e:
            logger.error(f"Error validating session {session_id}: {e}")
            return False


class RoleMiddleware:
    """
    Role-based access control middleware
    """
    
    def __init__(self, required_roles: List[str]):
        self.required_roles = required_roles
    
    def __call__(self, request: Request) -> bool:
        """
        Check if user has required role
        """
        user_role = getattr(request.state, "user_role", None)
        
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        if user_role not in self.required_roles:
            logger.warning(
                f"Access denied - User role: {user_role}, "
                f"Required: {self.required_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        return True


class PermissionMiddleware:
    """
    Permission-based access control middleware
    """
    
    def __init__(self, required_permissions: List[str], require_all: bool = False):
        self.required_permissions = required_permissions
        self.require_all = require_all
    
    def __call__(self, request: Request) -> bool:
        """
        Check if user has required permissions
        """
        user_permissions = getattr(request.state, "user_permissions", [])
        
        if not user_permissions:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        if self.require_all:
            # User must have ALL required permissions
            has_permission = all(
                perm in user_permissions for perm in self.required_permissions
            )
        else:
            # User must have at least ONE required permission
            has_permission = any(
                perm in user_permissions for perm in self.required_permissions
            )
        
        if not has_permission:
            logger.warning(
                f"Access denied - User permissions: {user_permissions}, "
                f"Required: {self.required_permissions}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware
    """
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = {}  # In production, use Redis
    
    async def dispatch(self, request: Request, call_next):
        """
        Process request through rate limiting
        """
        # Get client identifier
        client_id = self._get_client_id(request)
        current_time = time.time()
        
        # Clean old entries
        self._cleanup_old_requests(current_time)
        
        # Check rate limit
        if client_id in self.requests:
            request_times = self.requests[client_id]
            # Count requests in the last minute
            recent_requests = [
                req_time for req_time in request_times 
                if current_time - req_time < 60
            ]
            
            if len(recent_requests) >= self.requests_per_minute:
                logger.warning(f"Rate limit exceeded for client: {client_id}")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded",
                        "retry_after": 60
                    }
                )
            
            # Update request times
            self.requests[client_id] = recent_requests + [current_time]
        else:
            self.requests[client_id] = [current_time]
        
        response = await call_next(request)
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """
        Get client identifier for rate limiting
        """
        # Try to get user ID from request state
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user_{user_id}"
        
        # Fallback to IP address
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        return f"ip_{client_ip}"
    
    def _cleanup_old_requests(self, current_time: float):
        """
        Clean up old request records
        """
        cutoff_time = current_time - 300  # Keep 5 minutes of history
        
        for client_id in list(self.requests.keys()):
            self.requests[client_id] = [
                req_time for req_time in self.requests[client_id]
                if req_time > cutoff_time
            ]
            
            # Remove empty entries
            if not self.requests[client_id]:
                del self.requests[client_id]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Security headers middleware
    """
    
    async def dispatch(self, request: Request, call_next):
        """
        Add security headers to response
        """
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' ws: wss:;"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )
        
        return response