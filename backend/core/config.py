from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import secrets
from pathlib import Path

class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "ICS Cybersecurity Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    ALLOWED_HOSTS: List[str] = ["*"]
    DATABASE_ECHO: bool = False
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_HASH_ROUNDS: int = 12
    
    # Database
    DATABASE_URL: str = "postgresql://ics_user:ics_password@localhost:5432/ics_cybersecurity"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000"
    ]
    
    # File Storage
    UPLOAD_DIR: str = "/app/uploads"
    PCAP_STORAGE_DIR: str = "/app/pcap_files"
    PCAP_STORAGE_PATH: str = "/app/pcap_files"
    MODEL_STORAGE_DIR: str = "/app/models"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    MAX_PCAP_FILE_SIZE: int = 500 * 1024 * 1024  # 500MB
    
    # PCAP Capture Settings
    CAPTURE_INTERFACE: str = "eth0"
    CAPTURE_BUFFER_SIZE: int = 1024 * 1024  # 1MB
    CAPTURE_TIMEOUT: int = 1000  # milliseconds
    MAX_PACKETS_PER_FILE: int = 10000
    PCAP_ROTATION_TIME: int = 3600  # seconds (1 hour)
    MAX_PCAP_FILES_TO_KEEP: int = 15
    PCAP_USE_WIRESHARK: bool = True
    PCAP_AUTO_CLEANUP: bool = True
    PCAP_ARCHIVE_OLD_FILES: bool = False
    
    # Machine Learning
    ML_MODEL_DIR: str = "/app/models"
    ML_MODEL_UPDATE_INTERVAL: int = 3600  # seconds (1 hour)
    ML_BATCH_SIZE: int = 32
    ML_EPOCHS: int = 100
    ML_LEARNING_RATE: float = 0.001
    ML_VALIDATION_SPLIT: float = 0.2
    
    # Threat Detection
    THREAT_SCORE_THRESHOLD: float = 0.7
    ANOMALY_DETECTION_WINDOW: int = 300  # seconds (5 minutes)
    MAX_ALERTS_PER_MINUTE: int = 10
    
    # Network Scanning
    NETWORK_SCAN_INTERVAL: int = 300  # seconds (5 minutes)
    NETWORK_RANGES: List[str] = ["192.168.1.0/24", "10.0.0.0/24"]
    SCAN_TIMEOUT: int = 5  # seconds
    MAX_BANDWIDTH_MBPS: int = 100
    
    # Monitoring
    METRICS_RETENTION_DAYS: int = 30
    LOG_LEVEL: str = "INFO"
    LOG_ROTATION: str = "1 day"
    LOG_RETENTION: str = "30 days"
    
    # External Services
    THREAT_INTEL_API_KEY: Optional[str] = None
    THREAT_INTEL_UPDATE_INTERVAL: int = 3600  # seconds
    
    # Industrial Protocols
    MODBUS_ENABLED: bool = True
    MODBUS_PORT: int = 502
    SIEMENS_S7_ENABLED: bool = True
    SIEMENS_S7_PORT: int = 102
    
    # Email Notifications
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    
    # Webhook Notifications
    WEBHOOK_URL: Optional[str] = None
    WEBHOOK_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Ensure directories exist
for directory in [settings.UPLOAD_DIR, settings.PCAP_STORAGE_DIR, settings.MODEL_STORAGE_DIR]:
    Path(directory).mkdir(parents=True, exist_ok=True)