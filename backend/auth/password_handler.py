from passlib.context import CryptContext
from passlib.hash import bcrypt
from typing import Optional
import secrets
import string
from ..core.config import settings
from loguru import logger


class PasswordHandler:
    """
    Password hashing and verification handler
    """
    
    def __init__(self):
        # Configure password context with bcrypt
        self.pwd_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=settings.PASSWORD_HASH_ROUNDS
        )
        
    def hash_password(self, password: str) -> str:
        """
        Hash a password using bcrypt
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        try:
            hashed = self.pwd_context.hash(password)
            logger.debug("Password hashed successfully")
            return hashed
        except Exception as e:
            logger.error(f"Error hashing password: {e}")
            raise
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash
        
        Args:
            plain_password: Plain text password
            hashed_password: Hashed password from database
            
        Returns:
            True if password matches, False otherwise
        """
        try:
            is_valid = self.pwd_context.verify(plain_password, hashed_password)
            if is_valid:
                logger.debug("Password verification successful")
            else:
                logger.warning("Password verification failed")
            return is_valid
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False
    
    def needs_update(self, hashed_password: str) -> bool:
        """
        Check if password hash needs to be updated
        
        Args:
            hashed_password: Current hashed password
            
        Returns:
            True if hash needs update, False otherwise
        """
        try:
            return self.pwd_context.needs_update(hashed_password)
        except Exception as e:
            logger.error(f"Error checking if password needs update: {e}")
            return False
    
    def generate_password(
        self, 
        length: int = 12, 
        include_symbols: bool = True,
        include_numbers: bool = True,
        include_uppercase: bool = True,
        include_lowercase: bool = True
    ) -> str:
        """
        Generate a secure random password
        
        Args:
            length: Password length (minimum 8)
            include_symbols: Include special characters
            include_numbers: Include numbers
            include_uppercase: Include uppercase letters
            include_lowercase: Include lowercase letters
            
        Returns:
            Generated password
        """
        if length < 8:
            length = 8
            logger.warning("Password length increased to minimum of 8 characters")
        
        characters = ""
        
        if include_lowercase:
            characters += string.ascii_lowercase
        if include_uppercase:
            characters += string.ascii_uppercase
        if include_numbers:
            characters += string.digits
        if include_symbols:
            characters += "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        if not characters:
            # Fallback to alphanumeric if no character sets selected
            characters = string.ascii_letters + string.digits
            logger.warning("No character sets selected, using alphanumeric")
        
        try:
            password = ''.join(secrets.choice(characters) for _ in range(length))
            logger.debug(f"Generated password of length {length}")
            return password
        except Exception as e:
            logger.error(f"Error generating password: {e}")
            raise
    
    def validate_password_strength(self, password: str) -> dict:
        """
        Validate password strength
        
        Args:
            password: Password to validate
            
        Returns:
            Dictionary with validation results
        """
        result = {
            "is_valid": True,
            "score": 0,
            "issues": [],
            "suggestions": []
        }
        
        # Check minimum length
        if len(password) < 8:
            result["is_valid"] = False
            result["issues"].append("Password must be at least 8 characters long")
        else:
            result["score"] += 1
        
        # Check for lowercase letters
        if not any(c.islower() for c in password):
            result["issues"].append("Password should contain lowercase letters")
            result["suggestions"].append("Add lowercase letters (a-z)")
        else:
            result["score"] += 1
        
        # Check for uppercase letters
        if not any(c.isupper() for c in password):
            result["issues"].append("Password should contain uppercase letters")
            result["suggestions"].append("Add uppercase letters (A-Z)")
        else:
            result["score"] += 1
        
        # Check for numbers
        if not any(c.isdigit() for c in password):
            result["issues"].append("Password should contain numbers")
            result["suggestions"].append("Add numbers (0-9)")
        else:
            result["score"] += 1
        
        # Check for special characters
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            result["issues"].append("Password should contain special characters")
            result["suggestions"].append("Add special characters (!@#$%^&*)")
        else:
            result["score"] += 1
        
        # Check for common patterns
        common_patterns = [
            "123456", "password", "qwerty", "abc123", 
            "admin", "letmein", "welcome", "monkey"
        ]
        
        password_lower = password.lower()
        for pattern in common_patterns:
            if pattern in password_lower:
                result["is_valid"] = False
                result["issues"].append(f"Password contains common pattern: {pattern}")
                result["suggestions"].append("Avoid common words and patterns")
                break
        
        # Check for repeated characters
        if len(set(password)) < len(password) * 0.6:
            result["issues"].append("Password has too many repeated characters")
            result["suggestions"].append("Use more diverse characters")
        
        # Determine strength level
        if result["score"] >= 4 and result["is_valid"]:
            result["strength"] = "Strong"
        elif result["score"] >= 3:
            result["strength"] = "Medium"
        elif result["score"] >= 2:
            result["strength"] = "Weak"
        else:
            result["strength"] = "Very Weak"
            result["is_valid"] = False
        
        logger.debug(f"Password strength validation: {result['strength']}")
        return result
    
    def generate_reset_token(self, length: int = 32) -> str:
        """
        Generate a secure token for password reset
        
        Args:
            length: Token length
            
        Returns:
            Secure random token
        """
        try:
            token = secrets.token_urlsafe(length)
            logger.debug("Password reset token generated")
            return token
        except Exception as e:
            logger.error(f"Error generating reset token: {e}")
            raise


# Global password handler instance
password_handler = PasswordHandler()