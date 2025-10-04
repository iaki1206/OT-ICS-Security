"""Security middleware for FastAPI application"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
from typing import Callable
from ..utils.security import SecurityValidator, RateLimiter, SECURITY_HEADERS, generate_csp_header
import logging

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware to add security headers and basic protection"""
    
    def __init__(self, app, rate_limiter: RateLimiter = None):
        super().__init__(app)
        self.rate_limiter = rate_limiter or RateLimiter(max_requests=1000, window_seconds=3600)
        self.validator = SecurityValidator()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client IP for rate limiting
        client_ip = self._get_client_ip(request)
        
        # Apply rate limiting
        if not self.rate_limiter.is_allowed(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."}
            )
        
        # Validate request headers
        if not self._validate_request_headers(request):
            logger.warning(f"Invalid request headers from IP: {client_ip}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid request headers"}
            )
        
        # Process the request
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add security headers
        self._add_security_headers(response)
        
        # Add processing time header for monitoring
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log security events
        self._log_security_event(request, response, client_ip, process_time)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request"""
        # Check for forwarded headers (when behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"
    
    def _validate_request_headers(self, request: Request) -> bool:
        """Validate request headers for security"""
        # Check Content-Length for reasonable size
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > 100 * 1024 * 1024:  # 100MB limit
                    return False
            except ValueError:
                return False
        
        # Validate User-Agent (basic check)
        user_agent = request.headers.get("user-agent", "")
        if len(user_agent) > 1000:  # Suspiciously long user agent
            return False
        
        # Check for suspicious headers
        suspicious_headers = [
            "x-forwarded-host", "x-forwarded-server", "x-forwarded-proto"
        ]
        
        for header in suspicious_headers:
            value = request.headers.get(header, "")
            if value and not self._is_safe_header_value(value):
                return False
        
        return True
    
    def _is_safe_header_value(self, value: str) -> bool:
        """Check if header value is safe"""
        # Basic check for injection attempts
        dangerous_patterns = [
            "<script", "javascript:", "data:", "vbscript:",
            "onload=", "onerror=", "onclick="
        ]
        
        value_lower = value.lower()
        return not any(pattern in value_lower for pattern in dangerous_patterns)
    
    def _add_security_headers(self, response: Response) -> None:
        """Add security headers to response"""
        # Add standard security headers
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
        
        # Add Content Security Policy
        response.headers["Content-Security-Policy"] = generate_csp_header()
        
        # Remove server information
        if "server" in response.headers:
            del response.headers["server"]
    
    def _log_security_event(self, request: Request, response: Response, 
                          client_ip: str, process_time: float) -> None:
        """Log security-related events"""
        # Log suspicious activities
        if response.status_code >= 400:
            logger.warning(
                f"HTTP {response.status_code} - {request.method} {request.url.path} "
                f"from {client_ip} - Time: {process_time:.3f}s"
            )
        
        # Log slow requests (potential DoS)
        if process_time > 5.0:  # 5 seconds
            logger.warning(
                f"Slow request detected - {request.method} {request.url.path} "
                f"from {client_ip} - Time: {process_time:.3f}s"
            )


class InputValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for input validation and sanitization"""
    
    def __init__(self, app):
        super().__init__(app)
        self.validator = SecurityValidator()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Validate query parameters
        if not self._validate_query_params(request):
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid query parameters"}
            )
        
        # Validate path parameters
        if not self._validate_path_params(request):
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid path parameters"}
            )
        
        return await call_next(request)
    
    def _validate_query_params(self, request: Request) -> bool:
        """Validate query parameters"""
        for key, value in request.query_params.items():
            # Check parameter name
            if not key.replace('_', '').replace('-', '').isalnum():
                return False
            
            # Check parameter value length
            if len(str(value)) > 1000:
                return False
            
            # Check for injection attempts
            if not self._is_safe_parameter_value(str(value)):
                return False
        
        return True
    
    def _validate_path_params(self, request: Request) -> bool:
        """Validate path parameters"""
        path = str(request.url.path)
        
        # Check for path traversal attempts
        if "../" in path or "..\\" in path:
            return False
        
        # Check for null bytes
        if "\x00" in path:
            return False
        
        return True
    
    def _is_safe_parameter_value(self, value: str) -> bool:
        """Check if parameter value is safe"""
        # Check for common injection patterns
        dangerous_patterns = [
            "<script", "</script>", "javascript:", "data:",
            "SELECT ", "INSERT ", "UPDATE ", "DELETE ",
            "DROP ", "CREATE ", "ALTER ", "UNION ",
            "--", "/*", "*/", "xp_", "sp_"
        ]
        
        value_lower = value.lower()
        return not any(pattern in value_lower for pattern in dangerous_patterns)


# CORS security configuration
CORS_CONFIG = {
    "allow_origins": [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000"
    ],
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": [
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],
    "expose_headers": ["X-Process-Time"],
    "max_age": 600  # 10 minutes
}