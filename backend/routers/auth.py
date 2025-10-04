from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from loguru import logger
from ..database.database import get_async_db
from ..auth import AuthService, get_current_user, get_current_active_user, require_role
from ..auth.models import (
    UserCreate, UserLogin, UserResponse, LoginResponse, TokenResponse,
    RefreshTokenRequest, ChangePasswordRequest, PasswordResetRequest,
    PasswordResetConfirm, UserUpdate, SessionResponse, PermissionResponse,
    APIResponse, UserRole
)
from ..database.models import User
from ..core.config import settings

# settings is already imported from core.config
security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account with email and password"
)
async def register(
    user_data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Register a new user"""
    try:
        logger.info(f"Registration attempt for email: {user_data.email}")
        
        # Get client IP for logging
        client_ip = request.client.host if request.client else "unknown"
        
        # Register user
        user = await auth_service.register_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            role=user_data.role,
            db=db
        )
        
        logger.info(f"User registered successfully: {user.email} from IP: {client_ip}")
        return user
        
    except ValueError as e:
        logger.warning(f"Registration failed for {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration error for {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="User login",
    description="Authenticate user and return access tokens"
)
async def login(
    user_credentials: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Authenticate user and return tokens"""
    try:
        logger.info(f"Login attempt for email: {user_credentials.email}")
        
        # Get client information
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Authenticate user
        login_result = await auth_service.authenticate_user(
            email=user_credentials.email,
            password=user_credentials.password,
            remember_me=user_credentials.remember_me,
            client_ip=client_ip,
            user_agent=user_agent,
            db=db
        )
        
        if not login_result:
            logger.warning(f"Failed login attempt for {user_credentials.email} from IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Set secure cookie for refresh token if remember_me is True
        if user_credentials.remember_me:
            response.set_cookie(
                key="refresh_token",
                value=login_result["tokens"]["refresh_token"],
                max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                httponly=True,
                secure=settings.ENVIRONMENT == "production",
                samesite="strict"
            )
        
        logger.info(f"User logged in successfully: {user_credentials.email} from IP: {client_ip}")
        return login_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {user_credentials.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Get new access token using refresh token"
)
async def refresh_token(
    token_request: RefreshTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Refresh access token"""
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Refresh token
        new_tokens = await auth_service.refresh_access_token(
            refresh_token=token_request.refresh_token,
            client_ip=client_ip,
            db=db
        )
        
        if not new_tokens:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        logger.info(f"Token refreshed successfully from IP: {client_ip}")
        return new_tokens
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed. Please try again."
        )


@router.post(
    "/logout",
    response_model=APIResponse,
    summary="User logout",
    description="Logout user and invalidate session"
)
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Logout user and invalidate session"""
    try:
        # Get session ID from request headers or token
        session_id = request.headers.get("X-Session-ID")
        
        # Logout user
        await auth_service.logout_user(
            user_id=current_user.id,
            session_id=session_id,
            db=db
        )
        
        # Clear refresh token cookie
        response.delete_cookie(
            key="refresh_token",
            httponly=True,
            secure=settings.ENVIRONMENT == "production",
            samesite="strict"
        )
        
        logger.info(f"User logged out successfully: {current_user.email}")
        return APIResponse(
            success=True,
            message="Logged out successfully"
        )
        
    except Exception as e:
        logger.error(f"Logout error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed. Please try again."
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get current authenticated user information"
)
async def get_me(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user",
    description="Update current user information"
)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Update current user information"""
    try:
        # Update user
        updated_user = await auth_service.update_user(
            user_id=current_user.id,
            update_data=user_update.dict(exclude_unset=True),
            db=db
        )
        
        logger.info(f"User updated successfully: {current_user.email}")
        return updated_user
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"User update error for {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User update failed. Please try again."
        )


@router.post(
    "/change-password",
    response_model=APIResponse,
    summary="Change password",
    description="Change current user password"
)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Change user password"""
    try:
        # Change password
        success = await auth_service.change_password(
            user_id=current_user.id,
            current_password=password_data.current_password,
            new_password=password_data.new_password,
            db=db
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        logger.info(f"Password changed successfully for user: {current_user.email}")
        return APIResponse(
            success=True,
            message="Password changed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed. Please try again."
        )


@router.post(
    "/forgot-password",
    response_model=APIResponse,
    summary="Request password reset",
    description="Request password reset email"
)
async def forgot_password(
    reset_request: PasswordResetRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Request password reset"""
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Request password reset
        await auth_service.request_password_reset(
            email=reset_request.email,
            client_ip=client_ip,
            db=db
        )
        
        logger.info(f"Password reset requested for: {reset_request.email} from IP: {client_ip}")
        
        # Always return success to prevent email enumeration
        return APIResponse(
            success=True,
            message="If the email exists, a password reset link has been sent"
        )
        
    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}")
        # Still return success to prevent information disclosure
        return APIResponse(
            success=True,
            message="If the email exists, a password reset link has been sent"
        )


@router.post(
    "/reset-password",
    response_model=APIResponse,
    summary="Reset password",
    description="Reset password using reset token"
)
async def reset_password(
    reset_data: PasswordResetConfirm,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Reset password using token"""
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Reset password
        success = await auth_service.reset_password(
            token=reset_data.token,
            new_password=reset_data.new_password,
            client_ip=client_ip,
            db=db
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        logger.info(f"Password reset successfully from IP: {client_ip}")
        return APIResponse(
            success=True,
            message="Password reset successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again."
        )


@router.get(
    "/sessions",
    response_model=List[SessionResponse],
    summary="Get user sessions",
    description="Get all active sessions for current user"
)
async def get_sessions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Get user sessions"""
    try:
        sessions = await auth_service.get_user_sessions(
            user_id=current_user.id,
            db=db
        )
        
        return sessions
        
    except Exception as e:
        logger.error(f"Get sessions error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions"
        )


@router.delete(
    "/sessions/{session_id}",
    response_model=APIResponse,
    summary="Revoke session",
    description="Revoke a specific user session"
)
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Revoke a specific session"""
    try:
        success = await auth_service.revoke_session(
            user_id=current_user.id,
            session_id=session_id,
            db=db
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        logger.info(f"Session revoked: {session_id} for user: {current_user.email}")
        return APIResponse(
            success=True,
            message="Session revoked successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session revoke error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke session"
        )


@router.get(
    "/permissions",
    response_model=PermissionResponse,
    summary="Get user permissions",
    description="Get current user permissions and role"
)
async def get_permissions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Get user permissions"""
    try:
        permissions = await auth_service.get_user_permissions(
            user_role=current_user.role
        )
        
        return PermissionResponse(
            permissions=permissions,
            role=current_user.role
        )
        
    except Exception as e:
        logger.error(f"Get permissions error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve permissions"
        )


# Admin endpoints
@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="Get all users (Admin only)",
    description="Get list of all users - requires admin role"
)
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Get all users (admin only)"""
    try:
        users = await auth_service.get_all_users(
            skip=skip,
            limit=limit,
            db=db
        )
        
        return users
        
    except Exception as e:
        logger.error(f"Get users error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )


@router.put(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Update user (Admin only)",
    description="Update any user - requires admin role"
)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Update user (admin only)"""
    try:
        updated_user = await auth_service.update_user(
            user_id=user_id,
            update_data=user_update.dict(exclude_unset=True),
            db=db
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"User {user_id} updated by admin: {current_user.email}")
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin user update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User update failed"
        )


@router.delete(
    "/users/{user_id}",
    response_model=APIResponse,
    summary="Delete user (Admin only)",
    description="Delete any user - requires admin role"
)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_async_db),
    auth_service: AuthService = Depends()
):
    """Delete user (admin only)"""
    try:
        # Prevent self-deletion
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        success = await auth_service.delete_user(
            user_id=user_id,
            db=db
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"User {user_id} deleted by admin: {current_user.email}")
        return APIResponse(
            success=True,
            message="User deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin user delete error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User deletion failed"
        )