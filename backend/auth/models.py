from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles enum"""
    ADMIN = "admin"
    SECURITY_ANALYST = "security_analyst"
    ANALYST = "analyst"
    OPERATOR = "operator"
    VIEWER = "viewer"


class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="User password (minimum 8 characters)"
    )
    full_name: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="User's full name"
    )
    role: UserRole = Field(
        default=UserRole.ANALYST,
        description="User role"
    )
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least one uppercase, lowercase, digit, and special char
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v)
        
        if not all([has_upper, has_lower, has_digit, has_special]):
            raise ValueError(
                'Password must contain at least one uppercase letter, '
                'one lowercase letter, one digit, and one special character'
            )
        
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        """Validate full name"""
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        
        # Check for valid characters (letters, spaces, hyphens, apostrophes)
        import re
        if not re.match(r"^[a-zA-Z\s\-']+$", v):
            raise ValueError('Full name can only contain letters, spaces, hyphens, and apostrophes')
        
        return v.strip()
    
    class Config:
        schema_extra = {
            "example": {
                "email": "analyst@company.com",
                "password": "SecurePass123!",
                "full_name": "John Doe",
                "role": "analyst"
            }
        }


class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    remember_me: bool = Field(default=False, description="Remember login session")
    
    class Config:
        schema_extra = {
            "example": {
                "email": "analyst@company.com",
                "password": "SecurePass123!",
                "remember_me": False
            }
        }


class UserResponse(BaseModel):
    """User response model"""
    id: int = Field(..., description="User ID")
    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(..., description="User's full name")
    role: UserRole = Field(..., description="User role")
    is_active: bool = Field(..., description="User active status")
    created_at: datetime = Field(..., description="Account creation timestamp")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    
    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "email": "analyst@company.com",
                "full_name": "John Doe",
                "role": "analyst",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z",
                "last_login": "2024-01-01T12:00:00Z"
            }
        }


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    
    class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        }


class LoginResponse(BaseModel):
    """Login response model"""
    user: UserResponse = Field(..., description="User information")
    tokens: TokenResponse = Field(..., description="Authentication tokens")
    session_id: str = Field(..., description="Session ID")
    
    class Config:
        schema_extra = {
            "example": {
                "user": {
                    "id": 1,
                    "email": "analyst@company.com",
                    "full_name": "John Doe",
                    "role": "analyst",
                    "is_active": True,
                    "created_at": "2024-01-01T00:00:00Z",
                    "last_login": "2024-01-01T12:00:00Z"
                },
                "tokens": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "expires_in": 1800
                },
                "session_id": "abc123def456"
            }
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request model"""
    refresh_token: str = Field(..., description="JWT refresh token")
    
    class Config:
        schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class ChangePasswordRequest(BaseModel):
    """Change password request model"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="New password (minimum 8 characters)"
    )
    
    @validator('new_password')
    def validate_new_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least one uppercase, lowercase, digit, and special char
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v)
        
        if not all([has_upper, has_lower, has_digit, has_special]):
            raise ValueError(
                'Password must contain at least one uppercase letter, '
                'one lowercase letter, one digit, and one special character'
            )
        
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "current_password": "OldPassword123!",
                "new_password": "NewSecurePass456@"
            }
        }


class PasswordResetRequest(BaseModel):
    """Password reset request model"""
    email: EmailStr = Field(..., description="User email address")
    
    class Config:
        schema_extra = {
            "example": {
                "email": "analyst@company.com"
            }
        }


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation model"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="New password (minimum 8 characters)"
    )
    
    @validator('new_password')
    def validate_new_password(cls, v):
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least one uppercase, lowercase, digit, and special char
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v)
        
        if not all([has_upper, has_lower, has_digit, has_special]):
            raise ValueError(
                'Password must contain at least one uppercase letter, '
                'one lowercase letter, one digit, and one special character'
            )
        
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "token": "reset_token_abc123",
                "new_password": "NewSecurePass456@"
            }
        }


class UserUpdate(BaseModel):
    """User update model"""
    full_name: Optional[str] = Field(
        None, 
        min_length=2, 
        max_length=100,
        description="User's full name"
    )
    role: Optional[UserRole] = Field(None, description="User role")
    is_active: Optional[bool] = Field(None, description="User active status")
    
    @validator('full_name')
    def validate_full_name(cls, v):
        """Validate full name"""
        if v is not None:
            if not v.strip():
                raise ValueError('Full name cannot be empty')
            
            # Check for valid characters
            import re
            if not re.match(r"^[a-zA-Z\s\-']+$", v):
                raise ValueError('Full name can only contain letters, spaces, hyphens, and apostrophes')
            
            return v.strip()
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "full_name": "John Smith",
                "role": "security_analyst",
                "is_active": True
            }
        }


class SessionResponse(BaseModel):
    """User session response model"""
    id: str = Field(..., description="Session ID")
    user_id: int = Field(..., description="User ID")
    user_agent: Optional[str] = Field(None, description="User agent string")
    ip_address: Optional[str] = Field(None, description="IP address")
    created_at: datetime = Field(..., description="Session creation timestamp")
    expires_at: datetime = Field(..., description="Session expiration timestamp")
    is_active: bool = Field(..., description="Session active status")
    
    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": "session_abc123def456",
                "user_id": 1,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "ip_address": "192.168.1.100",
                "created_at": "2024-01-01T12:00:00Z",
                "expires_at": "2024-01-02T12:00:00Z",
                "is_active": True
            }
        }


class PermissionResponse(BaseModel):
    """Permission response model"""
    permissions: List[str] = Field(..., description="List of user permissions")
    role: UserRole = Field(..., description="User role")
    
    class Config:
        schema_extra = {
            "example": {
                "permissions": [
                    "read:threats",
                    "read:devices",
                    "read:pcap",
                    "view:analytics"
                ],
                "role": "analyst"
            }
        }


class APIResponse(BaseModel):
    """Generic API response model"""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {}
            }
        }