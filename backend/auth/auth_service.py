from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from ..database.models import User, UserSession, PasswordResetToken
from .jwt_handler import jwt_handler
from .password_handler import password_handler
from ..core.config import settings
from loguru import logger
import secrets
import hashlib


class AuthService:
    """
    Authentication service for user management and authentication
    """
    
    def __init__(self):
        self.max_login_attempts = 5
        self.lockout_duration = timedelta(minutes=30)
        self.session_timeout = timedelta(hours=24)
    
    async def register_user(
        self, 
        db: Session, 
        email: str, 
        password: str, 
        full_name: str,
        role: str = "analyst"
    ) -> User:
        """
        Register a new user
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            full_name: User's full name
            role: User role (default: analyst)
            
        Returns:
            Created user object
        """
        try:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                logger.warning(f"Registration attempt with existing email: {email}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Validate password strength
            password_validation = password_handler.validate_password_strength(password)
            if not password_validation["is_valid"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "message": "Password does not meet security requirements",
                        "issues": password_validation["issues"],
                        "suggestions": password_validation["suggestions"]
                    }
                )
            
            # Hash password
            hashed_password = password_handler.hash_password(password)
            
            # Create user
            user = User(
                email=email,
                hashed_password=hashed_password,
                full_name=full_name,
                role=role,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"User registered successfully: {email}")
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registering user {email}: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register user"
            )
    
    async def authenticate_user(
        self, 
        db: Session, 
        email: str, 
        password: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Authenticate user and create session
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            user_agent: User agent string
            ip_address: Client IP address
            
        Returns:
            Authentication result with tokens or None
        """
        try:
            # Get user
            user = db.query(User).filter(User.email == email).first()
            if not user:
                logger.warning(f"Login attempt with non-existent email: {email}")
                await self._log_failed_attempt(db, email, ip_address, "user_not_found")
                return None
            
            # Check if user is active
            if not user.is_active:
                logger.warning(f"Login attempt with inactive user: {email}")
                await self._log_failed_attempt(db, email, ip_address, "user_inactive")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is disabled"
                )
            
            # Check if user is locked out
            if await self._is_user_locked_out(db, user.id):
                logger.warning(f"Login attempt with locked out user: {email}")
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Account is temporarily locked due to too many failed attempts"
                )
            
            # Verify password
            if not password_handler.verify_password(password, user.hashed_password):
                logger.warning(f"Failed login attempt for user: {email}")
                await self._log_failed_attempt(db, email, ip_address, "invalid_password")
                await self._increment_failed_attempts(db, user.id)
                return None
            
            # Reset failed attempts on successful login
            await self._reset_failed_attempts(db, user.id)
            
            # Update last login
            user.last_login = datetime.utcnow()
            user.updated_at = datetime.utcnow()
            
            # Create session
            session = await self._create_user_session(
                db, user.id, user_agent, ip_address
            )
            
            # Create tokens
            token_data = {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "session_id": session.id,
                "permissions": await self._get_user_permissions(user.role)
            }
            
            tokens = jwt_handler.create_token_pair(token_data)
            
            db.commit()
            
            logger.info(f"User authenticated successfully: {email}")
            return {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "last_login": user.last_login
                },
                "tokens": tokens,
                "session_id": session.id
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error authenticating user {email}: {e}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication failed"
            )
    
    async def refresh_token(self, db: Session, refresh_token: str) -> Optional[Dict[str, str]]:
        """
        Refresh access token using refresh token
        
        Args:
            db: Database session
            refresh_token: Valid refresh token
            
        Returns:
            New tokens or None if invalid
        """
        try:
            # Verify refresh token
            payload = jwt_handler.verify_token(refresh_token)
            if not payload or payload.get("type") != "refresh":
                logger.warning("Invalid refresh token")
                return None
            
            # Check if session is still valid
            session_id = payload.get("session_id")
            if session_id:
                session = db.query(UserSession).filter(
                    and_(
                        UserSession.id == session_id,
                        UserSession.is_active == True,
                        UserSession.expires_at > datetime.utcnow()
                    )
                ).first()
                
                if not session:
                    logger.warning(f"Invalid or expired session: {session_id}")
                    return None
            
            # Get user
            user_id = payload.get("sub")
            user = db.query(User).filter(
                and_(User.id == user_id, User.is_active == True)
            ).first()
            
            if not user:
                logger.warning(f"User not found or inactive: {user_id}")
                return None
            
            # Create new access token
            new_access_token = jwt_handler.refresh_access_token(refresh_token)
            if not new_access_token:
                return None
            
            logger.info(f"Token refreshed for user: {user.email}")
            return {
                "access_token": new_access_token,
                "token_type": "bearer"
            }
            
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return None
    
    async def logout_user(self, db: Session, session_id: str) -> bool:
        """
        Logout user by invalidating session
        
        Args:
            db: Database session
            session_id: Session ID to invalidate
            
        Returns:
            True if successful, False otherwise
        """
        try:
            session = db.query(UserSession).filter(UserSession.id == session_id).first()
            if session:
                session.is_active = False
                session.ended_at = datetime.utcnow()
                db.commit()
                logger.info(f"User session ended: {session_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error logging out user: {e}")
            db.rollback()
            return False
    
    async def change_password(
        self, 
        db: Session, 
        user_id: int, 
        current_password: str, 
        new_password: str
    ) -> bool:
        """
        Change user password
        
        Args:
            db: Database session
            user_id: User ID
            current_password: Current password
            new_password: New password
            
        Returns:
            True if successful, False otherwise
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            # Verify current password
            if not password_handler.verify_password(current_password, user.hashed_password):
                logger.warning(f"Invalid current password for user: {user.email}")
                return False
            
            # Validate new password
            password_validation = password_handler.validate_password_strength(new_password)
            if not password_validation["is_valid"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "message": "New password does not meet security requirements",
                        "issues": password_validation["issues"],
                        "suggestions": password_validation["suggestions"]
                    }
                )
            
            # Hash new password
            user.hashed_password = password_handler.hash_password(new_password)
            user.updated_at = datetime.utcnow()
            
            # Invalidate all user sessions except current one
            db.query(UserSession).filter(
                and_(
                    UserSession.user_id == user_id,
                    UserSession.is_active == True
                )
            ).update({"is_active": False, "ended_at": datetime.utcnow()})
            
            db.commit()
            logger.info(f"Password changed for user: {user.email}")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error changing password for user {user_id}: {e}")
            db.rollback()
            return False
    
    async def _create_user_session(
        self, 
        db: Session, 
        user_id: int, 
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> UserSession:
        """
        Create a new user session
        """
        session = UserSession(
            id=secrets.token_urlsafe(32),
            user_id=user_id,
            user_agent=user_agent,
            ip_address=ip_address,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + self.session_timeout,
            is_active=True
        )
        
        db.add(session)
        return session
    
    async def _get_user_permissions(self, role: str) -> List[str]:
        """
        Get user permissions based on role
        """
        permissions_map = {
            "admin": [
                "read:all", "write:all", "delete:all", "manage:users", 
                "manage:system", "view:analytics", "manage:threats"
            ],
            "security_analyst": [
                "read:threats", "write:threats", "read:devices", 
                "view:analytics", "manage:alerts"
            ],
            "analyst": [
                "read:threats", "read:devices", "view:analytics"
            ],
            "operator": [
                "read:devices", "read:alerts", "write:devices"
            ],
            "viewer": [
                "read:devices", "read:alerts"
            ]
        }
        
        return permissions_map.get(role, ["read:basic"])
    
    async def _is_user_locked_out(self, db: Session, user_id: int) -> bool:
        """
        Check if user is locked out due to failed attempts
        """
        # Implementation would check failed login attempts
        # For now, return False
        return False
    
    async def _log_failed_attempt(
        self, 
        db: Session, 
        email: str, 
        ip_address: Optional[str], 
        reason: str
    ):
        """
        Log failed authentication attempt
        """
        logger.warning(f"Failed auth attempt - Email: {email}, IP: {ip_address}, Reason: {reason}")
    
    async def _increment_failed_attempts(self, db: Session, user_id: int):
        """
        Increment failed login attempts counter
        """
        # Implementation would track failed attempts
        pass
    
    async def _reset_failed_attempts(self, db: Session, user_id: int):
        """
        Reset failed login attempts counter
        """
        # Implementation would reset failed attempts
        pass


# Global auth service instance
auth_service = AuthService()