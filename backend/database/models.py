from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum

from sqlalchemy import (
    Column, Integer, String, DateTime, Float, Boolean, Text, JSON,
    ForeignKey, Index, UniqueConstraint, CheckConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from sqlalchemy.dialects.postgresql import UUID, INET, JSONB
import uuid

Base = declarative_base()

class ThreatSeverity(str, Enum):
    """Threat severity levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ThreatStatus(str, Enum):
    """Threat alert status"""
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

class DeviceStatus(str, Enum):
    """Device status"""
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    WARNING = "WARNING"
    ERROR = "ERROR"
    MAINTENANCE = "MAINTENANCE"

class DeviceType(str, Enum):
    """Industrial device types"""
    PLC = "PLC"
    HMI = "HMI"
    SCADA = "SCADA"
    RTU = "RTU"
    SENSOR = "SENSOR"
    CONTROLLER = "CONTROLLER"
    GATEWAY = "GATEWAY"
    SWITCH = "SWITCH"
    ROUTER = "ROUTER"
    FIREWALL = "FIREWALL"
    OTHER = "OTHER"

class PCAPStatus(str, Enum):
    """PCAP file processing status"""
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"

class ProtocolType(str, Enum):
    """Network protocol types"""
    TCP = "TCP"
    UDP = "UDP"
    ICMP = "ICMP"
    ARP = "ARP"
    MODBUS = "MODBUS"
    S7 = "S7"
    DNP3 = "DNP3"
    OTHER = "OTHER"

class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    threat_alerts = relationship("ThreatAlert", back_populates="assigned_user")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"


class UserSession(Base):
    """User session model for tracking active sessions"""
    __tablename__ = "user_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_accessed = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", backref="sessions")
    
    def __repr__(self):
        return f"<UserSession(user_id='{self.user_id}', active='{self.is_active}')>"


class PasswordResetToken(Base):
    """Password reset token model"""
    __tablename__ = "password_reset_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    user = relationship("User", backref="password_reset_tokens")
    
    def __repr__(self):
        return f"<PasswordResetToken(user_id='{self.user_id}', used='{self.is_used}')>"


class Device(Base):
    """Industrial device model"""
    __tablename__ = "devices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)  # PLC, HMI, SCADA, etc.
    ip_address = Column(INET, nullable=False, index=True)
    mac_address = Column(String(17), nullable=True, index=True)
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    firmware_version = Column(String(50), nullable=True)
    location = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default=DeviceStatus.OFFLINE, nullable=False)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Configuration and metadata
    configuration = Column(JSONB, nullable=True)
    device_metadata = Column(JSONB, nullable=True)
    
    # Relationships
    network_packets = relationship("NetworkPacket", back_populates="source_device")
    threat_alerts = relationship("ThreatAlert", back_populates="affected_device")
    device_metrics = relationship("DeviceMetric", back_populates="device")
    
    # Indexes
    __table_args__ = (
        Index('idx_device_ip_status', 'ip_address', 'status'),
        Index('idx_device_type_status', 'device_type', 'status'),
    )
    
    def __repr__(self):
        return f"<Device(name='{self.name}', ip='{self.ip_address}', status='{self.status}')>"

class PCAPFile(Base):
    """PCAP file storage model"""
    __tablename__ = "pcap_files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    packet_count = Column(Integer, default=0, nullable=False)
    capture_start_time = Column(DateTime(timezone=True), nullable=True)
    capture_end_time = Column(DateTime(timezone=True), nullable=True)
    capture_duration = Column(Float, nullable=True)  # Duration in seconds
    capture_interface = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    is_processed = Column(Boolean, default=False, nullable=False)
    
    # Analysis results
    analysis_results = Column(JSONB, nullable=True)
    threat_count = Column(Integer, default=0, nullable=False)
    
    # File metadata
    checksum = Column(String(64), nullable=True)  # SHA-256 checksum
    file_metadata = Column(JSONB, nullable=True)
    
    # Relationships
    network_packets = relationship("NetworkPacket", back_populates="pcap_file")
    
    # Indexes
    __table_args__ = (
        Index('idx_pcap_filename', 'filename'),
        Index('idx_pcap_created_processed', 'created_at', 'is_processed'),
    )
    
    def __repr__(self):
        return f"<PCAPFile(filename='{self.filename}', packets={self.packet_count})>"

class NetworkPacket(Base):
    """Network packet model"""
    __tablename__ = "network_packets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pcap_file_id = Column(UUID(as_uuid=True), ForeignKey('pcap_files.id'), nullable=True)
    source_device_id = Column(UUID(as_uuid=True), ForeignKey('devices.id'), nullable=True)
    
    # Packet metadata
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    packet_size = Column(Integer, nullable=False)
    protocol = Column(String(20), nullable=False, index=True)
    
    # Network layer information
    source_ip = Column(INET, nullable=True, index=True)
    destination_ip = Column(INET, nullable=True, index=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    
    # Transport layer information
    tcp_flags = Column(String(20), nullable=True)
    sequence_number = Column(Integer, nullable=True)
    acknowledgment_number = Column(Integer, nullable=True)
    window_size = Column(Integer, nullable=True)
    
    # Packet characteristics
    payload_size = Column(Integer, default=0, nullable=False)
    is_fragmented = Column(Boolean, default=False, nullable=False)
    ttl = Column(Integer, nullable=True)
    
    # Industrial protocol specific
    is_industrial_protocol = Column(Boolean, default=False, nullable=False)
    industrial_protocol_type = Column(String(20), nullable=True)
    function_code = Column(Integer, nullable=True)
    
    # ML analysis results
    threat_score = Column(Float, default=0.0, nullable=False)
    anomaly_score = Column(Float, default=0.0, nullable=False)
    is_anomaly = Column(Boolean, default=False, nullable=False)
    ml_predictions = Column(JSONB, nullable=True)
    
    # Raw packet data (optional, for detailed analysis)
    raw_packet_hex = Column(Text, nullable=True)
    
    # Relationships
    pcap_file = relationship("PCAPFile", back_populates="network_packets")
    source_device = relationship("Device", back_populates="network_packets")
    threat_alerts = relationship("ThreatAlert", back_populates="related_packet")
    
    # Indexes
    __table_args__ = (
        Index('idx_packet_timestamp_protocol', 'timestamp', 'protocol'),
        Index('idx_packet_src_dst_ip', 'source_ip', 'destination_ip'),
        Index('idx_packet_threat_score', 'threat_score'),
        Index('idx_packet_industrial', 'is_industrial_protocol', 'industrial_protocol_type'),
    )
    
    def __repr__(self):
        return f"<NetworkPacket(src={self.source_ip}, dst={self.destination_ip}, protocol={self.protocol})>"

class ThreatAlert(Base):
    """Threat alert model"""
    __tablename__ = "threat_alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    related_packet_id = Column(UUID(as_uuid=True), ForeignKey('network_packets.id'), nullable=True)
    affected_device_id = Column(UUID(as_uuid=True), ForeignKey('devices.id'), nullable=True)
    assigned_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    
    # Alert information
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    threat_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default=ThreatSeverity.MEDIUM, nullable=False, index=True)
    status = Column(String(20), default=ThreatStatus.OPEN, nullable=False, index=True)
    
    # Threat details
    threat_score = Column(Float, nullable=False, index=True)
    confidence = Column(Float, default=0.0, nullable=False)
    source_ip = Column(INET, nullable=True, index=True)
    destination_ip = Column(INET, nullable=True, index=True)
    protocol = Column(String(20), nullable=True)
    
    # Timestamps
    detected_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional data
    evidence = Column(JSONB, nullable=True)  # Supporting evidence
    mitigation_steps = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # MITRE ATT&CK mapping
    mitre_tactics = Column(JSONB, nullable=True)
    mitre_techniques = Column(JSONB, nullable=True)
    
    # Relationships
    related_packet = relationship("NetworkPacket", back_populates="threat_alerts")
    affected_device = relationship("Device", back_populates="threat_alerts")
    assigned_user = relationship("User", back_populates="threat_alerts")
    
    # Indexes
    __table_args__ = (
        Index('idx_alert_severity_status', 'severity', 'status'),
        Index('idx_alert_detected_type', 'detected_at', 'threat_type'),
        Index('idx_alert_src_ip', 'source_ip'),
    )
    
    def __repr__(self):
        return f"<ThreatAlert(type='{self.threat_type}', severity='{self.severity}', status='{self.status}')>"

class DeviceMetric(Base):
    """Device performance and health metrics"""
    __tablename__ = "device_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey('devices.id'), nullable=False)
    
    # Metric information
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String(20), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Metric metadata
    tags = Column(JSONB, nullable=True)  # Additional tags for filtering
    
    # Relationships
    device = relationship("Device", back_populates="device_metrics")
    
    # Indexes
    __table_args__ = (
        Index('idx_metric_device_name_time', 'device_id', 'metric_name', 'timestamp'),
        Index('idx_metric_timestamp', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<DeviceMetric(device_id={self.device_id}, name='{self.metric_name}', value={self.metric_value})>"

class NetworkScan(Base):
    """Network scan results"""
    __tablename__ = "network_scans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Scan information
    scan_type = Column(String(50), nullable=False)  # port_scan, device_discovery, vulnerability_scan
    target_range = Column(String(100), nullable=False)  # IP range or specific target
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Float, nullable=True)  # Duration in seconds
    
    # Scan results
    devices_found = Column(Integer, default=0, nullable=False)
    ports_scanned = Column(Integer, default=0, nullable=False)
    vulnerabilities_found = Column(Integer, default=0, nullable=False)
    
    # Detailed results
    scan_results = Column(JSONB, nullable=True)
    scan_config = Column(JSONB, nullable=True)
    
    # Status
    status = Column(String(20), default="RUNNING", nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_scan_type_started', 'scan_type', 'started_at'),
        Index('idx_scan_status', 'status'),
    )
    
    def __repr__(self):
        return f"<NetworkScan(type='{self.scan_type}', target='{self.target_range}', status='{self.status}')>"

class AuditLog(Base):
    """Audit log for system activities"""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    
    # Activity information
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    
    # Request details
    ip_address = Column(INET, nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Activity details
    details = Column(JSONB, nullable=True)
    old_values = Column(JSONB, nullable=True)
    new_values = Column(JSONB, nullable=True)
    
    # Result
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_action_timestamp', 'action', 'timestamp'),
        Index('idx_audit_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
    )
    
    def __repr__(self):
        return f"<AuditLog(action='{self.action}', user_id={self.user_id}, timestamp={self.timestamp})>"

class SystemConfiguration(Base):
    """System configuration settings"""
    __tablename__ = "system_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Configuration details
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(JSONB, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True, index=True)
    
    # Metadata
    is_sensitive = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<SystemConfiguration(key='{self.key}', category='{self.category}')>"

class MLModel(Base):
    """Machine learning model metadata"""
    __tablename__ = "ml_models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Model information
    name = Column(String(100), nullable=False, unique=True)
    model_type = Column(String(50), nullable=False)  # sklearn, pytorch, tensorflow
    algorithm = Column(String(50), nullable=False)  # RandomForest, LSTM, CNN, etc.
    version = Column(String(20), nullable=False)
    
    # Model files
    file_path = Column(String(500), nullable=False)
    config_path = Column(String(500), nullable=True)
    
    # Training information
    training_data_size = Column(Integer, nullable=True)
    training_accuracy = Column(Float, nullable=True)
    validation_accuracy = Column(Float, nullable=True)
    trained_at = Column(DateTime(timezone=True), nullable=True)
    
    # Model metadata
    parameters = Column(JSONB, nullable=True)
    metrics = Column(JSONB, nullable=True)
    feature_names = Column(JSONB, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes
    __table_args__ = (
        Index('idx_model_name_version', 'name', 'version'),
        Index('idx_model_type_active', 'model_type', 'is_active'),
    )
    
    def __repr__(self):
        return f"<MLModel(name='{self.name}', type='{self.model_type}', version='{self.version}')>"

# Database utility functions
def create_tables(engine):
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def drop_tables(engine):
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)

def get_table_names():
    """Get list of all table names"""
    return [table.name for table in Base.metadata.tables.values()]

# Database session utilities
class DatabaseManager:
    """Database manager for common operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create_user(self, username: str, email: str, hashed_password: str, **kwargs) -> User:
        """Create a new user"""
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            **kwargs
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
    
    async def create_device(self, name: str, device_type: str, ip_address: str, **kwargs) -> Device:
        """Create a new device"""
        device = Device(
            name=name,
            device_type=device_type,
            ip_address=ip_address,
            **kwargs
        )
        self.session.add(device)
        self.session.commit()
        self.session.refresh(device)
        return device
    
    async def create_threat_alert(self, title: str, description: str, threat_type: str, 
                                threat_score: float, **kwargs) -> ThreatAlert:
        """Create a new threat alert"""
        alert = ThreatAlert(
            title=title,
            description=description,
            threat_type=threat_type,
            threat_score=threat_score,
            **kwargs
        )
        self.session.add(alert)
        self.session.commit()
        self.session.refresh(alert)
        return alert
    
    async def get_active_threats(self, limit: int = 100) -> List[ThreatAlert]:
        """Get active threat alerts"""
        return self.session.query(ThreatAlert).filter(
            ThreatAlert.status.in_([ThreatStatus.OPEN, ThreatStatus.INVESTIGATING])
        ).order_by(ThreatAlert.detected_at.desc()).limit(limit).all()
    
    async def get_devices_by_status(self, status: DeviceStatus) -> List[Device]:
        """Get devices by status"""
        return self.session.query(Device).filter(Device.status == status).all()
    
    async def log_audit_event(self, action: str, user_id: Optional[str] = None, **kwargs):
        """Log an audit event"""
        audit_log = AuditLog(
            action=action,
            user_id=user_id,
            **kwargs
        )
        self.session.add(audit_log)
        self.session.commit()
        return audit_log


def create_tables(engine):
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def drop_tables(engine):
    """Drop all database tables"""
    Base.metadata.drop_all(bind=engine)

def get_table_names():
    """Get list of all table names"""
    return [table.name for table in Base.metadata.tables.values()]

# Database session utilities
class DatabaseManager:
    """Database manager for common operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create_user(self, username: str, email: str, hashed_password: str, **kwargs) -> User:
        """Create a new user"""
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            **kwargs
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
    
    async def create_device(self, name: str, device_type: str, ip_address: str, **kwargs) -> Device:
        """Create a new device"""
        device = Device(
            name=name,
            device_type=device_type,
            ip_address=ip_address,
            **kwargs
        )
        self.session.add(device)
        self.session.commit()
        self.session.refresh(device)
        return device
    
    async def create_threat_alert(self, device_id: str, threat_type: str, severity: ThreatSeverity, **kwargs) -> ThreatAlert:
        """Create a new threat alert"""
        alert = ThreatAlert(
            device_id=device_id,
            threat_type=threat_type,
            severity=severity,
            **kwargs
        )
        self.session.add(alert)
        self.session.commit()
        self.session.refresh(alert)
        return alert
    
    async def get_active_threats(self, limit: int = 100) -> List[ThreatAlert]:
        """Get active threat alerts"""
        return self.session.query(ThreatAlert).filter(
            ThreatAlert.status.in_([ThreatStatus.OPEN, ThreatStatus.INVESTIGATING])
        ).order_by(ThreatAlert.detected_at.desc()).limit(limit).all()
    
    async def get_devices_by_status(self, status: DeviceStatus) -> List[Device]:
        """Get devices by status"""
        return self.session.query(Device).filter(Device.status == status).all()
    
    async def log_audit_event(self, action: str, user_id: Optional[str] = None, **kwargs):
        """Log an audit event"""
        audit_log = AuditLog(
            action=action,
            user_id=user_id,
            **kwargs
        )
        self.session.add(audit_log)
        self.session.commit()
        return audit_log