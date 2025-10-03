from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import User, UserSession
from .jwt_handler import jwt_handler
from .auth_service import auth_service
from loguru import logger
from datetime import datetime


# Security scheme
security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Extract and verify JWT token from request
    
    Args:
        credentials: HTTP Bearer credentials
        
    Returns:
        Token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        token = credentials.credentials
        payload = jwt_handler.verify_token(token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check token type
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return payload
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    db: Session = Depends(get_db),
    token_payload: dict = Depends(get_current_user_token)
) -> User:
    """
    Get current authenticated user
    
    Args:
        db: Database session
        token_payload: JWT token payload
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If user not found or inactive
    """
    try:
        user_id = token_payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user
    
    Args:
        current_user: Current user from token
        
    Returns:
        Active user object
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_user_session(
    db: Session = Depends(get_db),
    token_payload: dict = Depends(get_current_user_token)
) -> Optional[UserSession]:
    """
    Get current user session
    
    Args:
        db: Database session
        token_payload: JWT token payload
        
    Returns:
        Current user session or None
    """
    try:
        session_id = token_payload.get("session_id")
        if not session_id:
            return None
        
        session = db.query(UserSession).filter(
            UserSession.id == session_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        return session
        
    except Exception as e:
        logger.error(f"Error getting user session: {e}")
        return None


def require_role(allowed_roles: List[str]) -> Callable:
    """
    Dependency factory for role-based access control
    
    Args:
        allowed_roles: List of allowed roles
        
    Returns:
        Dependency function
    """
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            logger.warning(
                f"Access denied - User: {current_user.email}, "
                f"Role: {current_user.role}, Required: {allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def require_permission(required_permissions: List[str], require_all: bool = False) -> Callable:
    """
    Dependency factory for permission-based access control
    
    Args:
        required_permissions: List of required permissions
        require_all: If True, user must have all permissions; if False, any permission
        
    Returns:
        Dependency function
    """
    async def permission_checker(
        token_payload: dict = Depends(get_current_user_token),
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        user_permissions = token_payload.get("permissions", [])
        
        if require_all:
            # User must have ALL required permissions
            has_permission = all(
                perm in user_permissions for perm in required_permissions
            )
        else:
            # User must have at least ONE required permission
            has_permission = any(
                perm in user_permissions for perm in required_permissions
            )
        
        if not has_permission:
            logger.warning(
                f"Permission denied - User: {current_user.email}, "
                f"Permissions: {user_permissions}, Required: {required_permissions}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {', '.join(required_permissions)}"
            )
        
        return current_user
    
    return permission_checker


# Common role dependencies
require_admin = require_role(["admin"])
require_security_analyst = require_role(["admin", "security_analyst"])
require_analyst = require_role(["admin", "security_analyst", "analyst"])
require_operator = require_role(["admin", "security_analyst", "analyst", "operator"])


# Common permission dependencies
require_read_threats = require_permission(["read:threats", "read:all"])
require_write_threats = require_permission(["write:threats", "write:all"])
require_manage_users = require_permission(["manage:users"])
require_manage_system = require_permission(["manage:system"])
require_view_analytics = require_permission(["view:analytics", "read:all"])


async def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None
    Useful for endpoints that work for both authenticated and anonymous users
    
    Args:
        request: FastAPI request object
        db: Database session
        
    Returns:
        Current user or None
    """
    try:
        # Try to extract token
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            return None
        
        token = authorization.split(" ")[1]
        payload = jwt_handler.verify_token(token)
        
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = db.query(User).filter(
            User.id == int(user_id),
            User.is_active == True
        ).first()
        
        return user
        
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")
        return None


async def validate_session(
    db: Session = Depends(get_db),
    token_payload: dict = Depends(get_current_user_token)
) -> bool:
    """
    Validate current user session
    
    Args:
        db: Database session
        token_payload: JWT token payload
        
    Returns:
        True if session is valid
        
    Raises:
        HTTPException: If session is invalid or expired
    """
    try:
        session_id = token_payload.get("session_id")
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No session information in token"
            )
        
        session = db.query(UserSession).filter(
            UserSession.id == session_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid"
            )
        
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session validation failed"
        )


async def get_user_permissions(
    token_payload: dict = Depends(get_current_user_token)
) -> List[str]:
    """
    Get current user permissions
    
    Args:
        token_payload: JWT token payload
        
    Returns:
        List of user permissions
    """
    return token_payload.get("permissions", [])


async def check_api_key(
    request: Request,
    db: Session = Depends(get_db)
) -> bool:
    """
    Check API key for service-to-service authentication
    
    Args:
        request: FastAPI request object
        db: Database session
        
    Returns:
        True if API key is valid
        
    Raises:
        HTTPException: If API key is invalid
    """
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # In production, validate against database
    # For now, check against settings
    valid_api_keys = getattr(settings, 'API_KEYS', [])
    
    if api_key not in valid_api_keys:
        logger.warning(f"Invalid API key used: {api_key[:8]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return True