# Authentication and Authorization Module

from .auth_service import AuthService
from .jwt_handler import JWTHandler
from .password_handler import PasswordHandler
from .middleware import AuthMiddleware, RoleMiddleware
from .dependencies import get_current_user, get_current_active_user, require_role, require_permission
from .models import UserCreate, UserLogin, UserResponse, TokenResponse

__all__ = [
    "AuthService",
    "JWTHandler",
    "PasswordHandler",
    "AuthMiddleware",
    "RoleMiddleware",
    "get_current_user",
    "get_current_active_user",
    "require_role",
    "require_permission",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
]