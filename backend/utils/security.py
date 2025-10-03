"""Security utilities for input validation and sanitization"""

import re
import html
import ipaddress
from typing import Optional, Union
from urllib.parse import quote
import secrets
import hashlib
from datetime import datetime, timedelta


class SecurityValidator:
    """Security validation and sanitization utilities"""
    
    # Regex patterns for validation
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    ALPHANUMERIC_PATTERN = re.compile(r'^[a-zA-Z0-9_-]+$')
    FILENAME_PATTERN = re.compile(r'^[a-zA-Z0-9._-]+$')
    
    @staticmethod
    def sanitize_html(input_str: str) -> str:
        """Sanitize HTML to prevent XSS attacks"""
        if not isinstance(input_str, str):
            return ""
        return html.escape(input_str, quote=True)
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not isinstance(email, str) or len(email) > 254:
            return False
        return bool(SecurityValidator.EMAIL_PATTERN.match(email))
    
    @staticmethod
    def validate_ip_address(ip: str) -> bool:
        """Validate IP address format"""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def validate_network_range(network: str) -> bool:
        """Validate network range in CIDR notation"""
        try:
            ipaddress.ip_network(network, strict=False)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def validate_port(port: Union[str, int]) -> bool:
        """Validate port number"""
        try:
            port_num = int(port)
            return 1 <= port_num <= 65535
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def sanitize_filename(filename: str, max_length: int = 255) -> str:
        """Sanitize filename to prevent path traversal"""
        if not isinstance(filename, str):
            return ""
        
        # Remove path separators and dangerous characters
        sanitized = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        
        # Remove leading/trailing dots
        sanitized = sanitized.strip('.')
        
        # Limit length
        return sanitized[:max_length]
    
    @staticmethod
    def sanitize_sql_identifier(identifier: str) -> Optional[str]:
        """Sanitize SQL identifiers (table names, column names)"""
        if not isinstance(identifier, str):
            return None
        
        # Only allow alphanumeric characters and underscores
        if not SecurityValidator.ALPHANUMERIC_PATTERN.match(identifier):
            return None
        
        # Prevent SQL keywords (basic list)
        sql_keywords = {
            'select', 'insert', 'update', 'delete', 'drop', 'create',
            'alter', 'truncate', 'union', 'where', 'from', 'join'
        }
        
        if identifier.lower() in sql_keywords:
            return None
        
        return identifier
    
    @staticmethod
    def validate_password_strength(password: str) -> dict:
        """Validate password strength"""
        if not isinstance(password, str):
            return {'valid': False, 'errors': ['Password must be a string']}
        
        errors = []
        
        if len(password) < 8:
            errors.append('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', password):
            errors.append('Password must contain at least one digit')
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append('Password must contain at least one special character')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    @staticmethod
    def sanitize_search_query(query: str, max_length: int = 100) -> str:
        """Sanitize search query input"""
        if not isinstance(query, str):
            return ""
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\';\\]', '', query)
        
        # Trim whitespace and limit length
        return sanitized.strip()[:max_length]
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate a cryptographically secure random token"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple:
        """Hash password with salt"""
        if salt is None:
            salt = secrets.token_hex(16)
        
        # Use PBKDF2 with SHA-256
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # iterations
        )
        
        return password_hash.hex(), salt
    
    @staticmethod
    def verify_password(password: str, password_hash: str, salt: str) -> bool:
        """Verify password against hash"""
        computed_hash, _ = SecurityValidator.hash_password(password, salt)
        return secrets.compare_digest(computed_hash, password_hash)


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for given identifier"""
        now = datetime.now()
        window_start = now - timedelta(seconds=self.window_seconds)
        
        # Clean old requests
        if identifier in self.requests:
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if req_time > window_start
            ]
        else:
            self.requests[identifier] = []
        
        # Check if limit exceeded
        if len(self.requests[identifier]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[identifier].append(now)
        return True


# Content Security Policy configuration
CSP_POLICY = {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'connect-src': "'self'",
    'font-src': "'self'",
    'object-src': "'none'",
    'media-src': "'self'",
    'frame-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'"
}


def generate_csp_header() -> str:
    """Generate Content Security Policy header"""
    return '; '.join([f"{directive} {value}" for directive, value in CSP_POLICY.items()])


# Security headers configuration
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}