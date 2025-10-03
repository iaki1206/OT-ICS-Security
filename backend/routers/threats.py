from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
from pydantic import BaseModel, Field, IPvAnyAddress
from enum import Enum

from database.database import get_async_db
from auth import get_current_active_user, require_permission
from database.models import User, ThreatAlert, ThreatSeverity, Device
from core.config import settings
from services.ml_service import MLService

# settings is already imported from core.config
router = APIRouter(prefix="/threats", tags=["Threat Detection"])


class ThreatStatus(str, Enum):
    """Threat alert status"""
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class ThreatCategory(str, Enum):
    """Threat categories"""
    MALWARE = "malware"
    INTRUSION = "intrusion"
    ANOMALY = "anomaly"
    PROTOCOL_VIOLATION = "protocol_violation"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    DATA_EXFILTRATION = "data_exfiltration"
    DOS_ATTACK = "dos_attack"
    BRUTE_FORCE = "brute_force"
    SUSPICIOUS_TRAFFIC = "suspicious_traffic"
    CONFIGURATION_CHANGE = "configuration_change"


class ThreatResponse(BaseModel):
    """Threat alert response model"""
    id: int
    title: str
    description: str
    severity: ThreatSeverity
    category: str
    status: str
    source_ip: Optional[str]
    destination_ip: Optional[str]
    device_id: Optional[int]
    device_name: Optional[str]
    confidence_score: float
    risk_score: int
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    resolved_by: Optional[int]
    tags: List[str]
    metadata: Dict[str, Any]
    
    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "title": "Suspicious Network Traffic Detected",
                "description": "Unusual communication pattern detected from PLC-001",
                "severity": "high",
                "category": "anomaly",
                "status": "open",
                "source_ip": "192.168.1.100",
                "destination_ip": "10.0.0.50",
                "device_id": 1,
                "device_name": "PLC-001",
                "confidence_score": 0.85,
                "risk_score": 75,
                "created_at": "2024-01-01T12:00:00Z",
                "updated_at": "2024-01-01T12:00:00Z",
                "resolved_at": None,
                "resolved_by": None,
                "tags": ["network", "anomaly"],
                "metadata": {
                    "protocol": "Modbus TCP",
                    "packet_count": 150,
                    "duration": 300
                }
            }
        }


class ThreatCreate(BaseModel):
    """Threat alert creation model"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=1000)
    severity: ThreatSeverity
    category: ThreatCategory
    source_ip: Optional[IPvAnyAddress] = None
    destination_ip: Optional[IPvAnyAddress] = None
    device_id: Optional[int] = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    risk_score: int = Field(..., ge=0, le=100)
    tags: Optional[List[str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Malware Detection",
                "description": "Potential malware detected in network traffic",
                "severity": "critical",
                "category": "malware",
                "source_ip": "192.168.1.100",
                "destination_ip": "10.0.0.50",
                "device_id": 1,
                "confidence_score": 0.92,
                "risk_score": 95,
                "tags": ["malware", "critical"],
                "metadata": {
                    "signature": "Trojan.Generic.123",
                    "file_hash": "abc123def456"
                }
            }
        }


class ThreatUpdate(BaseModel):
    """Threat alert update model"""
    status: Optional[ThreatStatus] = None
    severity: Optional[ThreatSeverity] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = Field(None, max_length=1000)
    
    class Config:
        schema_extra = {
            "example": {
                "status": "investigating",
                "notes": "Investigating potential false positive",
                "tags": ["investigating", "false_positive_candidate"]
            }
        }


class ThreatStats(BaseModel):
    """Threat statistics model"""
    total_threats: int
    open_threats: int
    critical_threats: int
    high_threats: int
    medium_threats: int
    low_threats: int
    threats_by_category: Dict[str, int]
    threats_by_status: Dict[str, int]
    recent_threats_24h: int
    avg_resolution_time_hours: float
    
    class Config:
        schema_extra = {
            "example": {
                "total_threats": 245,
                "open_threats": 12,
                "critical_threats": 3,
                "high_threats": 8,
                "medium_threats": 15,
                "low_threats": 5,
                "threats_by_category": {
                    "anomaly": 85,
                    "intrusion": 45,
                    "malware": 25,
                    "protocol_violation": 35,
                    "unauthorized_access": 55
                },
                "threats_by_status": {
                    "open": 12,
                    "investigating": 8,
                    "resolved": 220,
                    "false_positive": 5
                },
                "recent_threats_24h": 8,
                "avg_resolution_time_hours": 4.5
            }
        }


class ThreatAnalysisRequest(BaseModel):
    """Threat analysis request model"""
    pcap_file_id: Optional[int] = None
    network_data: Optional[Dict[str, Any]] = None
    device_id: Optional[int] = None
    analysis_type: str = Field(default="full", pattern="^(full|quick|deep)$")
    
    class Config:
        schema_extra = {
            "example": {
                "pcap_file_id": 123,
                "device_id": 1,
                "analysis_type": "full"
            }
        }


class ThreatAnalysisResponse(BaseModel):
    """Threat analysis response model"""
    analysis_id: str
    status: str
    threats_detected: int
    confidence_score: float
    risk_assessment: str
    recommendations: List[str]
    analysis_time_seconds: float
    
    class Config:
        schema_extra = {
            "example": {
                "analysis_id": "analysis_123456",
                "status": "completed",
                "threats_detected": 3,
                "confidence_score": 0.78,
                "risk_assessment": "medium",
                "recommendations": [
                    "Monitor device PLC-001 closely",
                    "Update firewall rules",
                    "Investigate source IP 192.168.1.100"
                ],
                "analysis_time_seconds": 12.5
            }
        }


@router.get(
    "/",
    response_model=List[ThreatResponse],
    summary="Get threat alerts",
    description="Get list of threat alerts with optional filtering"
)
async def get_threats(
    skip: int = Query(0, ge=0, description="Number of threats to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of threats to return"),
    severity: Optional[ThreatSeverity] = Query(None, description="Filter by severity"),
    status: Optional[ThreatStatus] = Query(None, description="Filter by status"),
    category: Optional[ThreatCategory] = Query(None, description="Filter by category"),
    device_id: Optional[int] = Query(None, description="Filter by device ID"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    start_date: Optional[datetime] = Query(None, description="Filter threats after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter threats before this date"),
    search: Optional[str] = Query(None, description="Search in title or description"),
    current_user: User = Depends(require_permission("read:threats")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get threat alerts with filtering options"""
    try:
        # Build query
        query = select(ThreatAlert)
        
        # Apply filters
        conditions = []
        
        if severity:
            conditions.append(ThreatAlert.severity == severity)
        
        if status:
            conditions.append(ThreatAlert.status == status)
        
        if category:
            conditions.append(ThreatAlert.category == category)
        
        if device_id:
            conditions.append(ThreatAlert.device_id == device_id)
        
        if source_ip:
            conditions.append(ThreatAlert.source_ip == source_ip)
        
        if start_date:
            conditions.append(ThreatAlert.created_at >= start_date)
        
        if end_date:
            conditions.append(ThreatAlert.created_at <= end_date)
        
        if search:
            search_condition = or_(
                ThreatAlert.title.ilike(f"%{search}%"),
                ThreatAlert.description.ilike(f"%{search}%")
            )
            conditions.append(search_condition)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Apply pagination and ordering
        query = query.offset(skip).limit(limit).order_by(desc(ThreatAlert.created_at))
        
        # Execute query
        result = await db.execute(query)
        threats = result.scalars().all()
        
        # Enrich with device names
        for threat in threats:
            if threat.device_id:
                device_result = await db.execute(
                    select(Device.name).where(Device.id == threat.device_id)
                )
                device_name = device_result.scalar_one_or_none()
                threat.device_name = device_name
        
        logger.info(f"Retrieved {len(threats)} threats for user {current_user.email}")
        return threats
        
    except Exception as e:
        logger.error(f"Error retrieving threats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve threats"
        )


@router.get(
    "/stats",
    response_model=ThreatStats,
    summary="Get threat statistics",
    description="Get threat statistics and metrics"
)
async def get_threat_stats(
    current_user: User = Depends(require_permission("read:threats")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get threat statistics"""
    try:
        # Total threats
        total_result = await db.execute(select(func.count(ThreatAlert.id)))
        total_threats = total_result.scalar()
        
        # Open threats
        open_result = await db.execute(
            select(func.count(ThreatAlert.id)).where(ThreatAlert.status == "open")
        )
        open_threats = open_result.scalar()
        
        # Threats by severity
        critical_result = await db.execute(
            select(func.count(ThreatAlert.id)).where(ThreatAlert.severity == ThreatSeverity.CRITICAL)
        )
        critical_threats = critical_result.scalar()
        
        high_result = await db.execute(
            select(func.count(ThreatAlert.id)).where(ThreatAlert.severity == ThreatSeverity.HIGH)
        )
        high_threats = high_result.scalar()
        
        medium_result = await db.execute(
            select(func.count(ThreatAlert.id)).where(ThreatAlert.severity == ThreatSeverity.MEDIUM)
        )
        medium_threats = medium_result.scalar()
        
        low_result = await db.execute(
            select(func.count(ThreatAlert.id)).where(ThreatAlert.severity == ThreatSeverity.LOW)
        )
        low_threats = low_result.scalar()
        
        # Threats by category
        category_result = await db.execute(
            select(ThreatAlert.category, func.count(ThreatAlert.id))
            .group_by(ThreatAlert.category)
        )
        threats_by_category = {row[0]: row[1] for row in category_result.fetchall()}
        
        # Threats by status
        status_result = await db.execute(
            select(ThreatAlert.status, func.count(ThreatAlert.id))
            .group_by(ThreatAlert.status)
        )
        threats_by_status = {row[0]: row[1] for row in status_result.fetchall()}
        
        # Recent threats (last 24 hours)
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        recent_result = await db.execute(
            select(func.count(ThreatAlert.id)).where(ThreatAlert.created_at >= recent_cutoff)
        )
        recent_threats_24h = recent_result.scalar()
        
        # Average resolution time
        resolution_result = await db.execute(
            select(func.avg(
                func.extract('epoch', ThreatAlert.resolved_at - ThreatAlert.created_at) / 3600
            )).where(ThreatAlert.resolved_at.isnot(None))
        )
        avg_resolution_time = resolution_result.scalar() or 0.0
        
        stats = ThreatStats(
            total_threats=total_threats,
            open_threats=open_threats,
            critical_threats=critical_threats,
            high_threats=high_threats,
            medium_threats=medium_threats,
            low_threats=low_threats,
            threats_by_category=threats_by_category,
            threats_by_status=threats_by_status,
            recent_threats_24h=recent_threats_24h,
            avg_resolution_time_hours=round(avg_resolution_time, 2)
        )
        
        logger.info(f"Threat stats retrieved for user {current_user.email}")
        return stats
        
    except Exception as e:
        logger.error(f"Error retrieving threat stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve threat statistics"
        )


@router.post(
    "/",
    response_model=ThreatResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create threat alert",
    description="Create a new threat alert"
)
async def create_threat(
    threat_data: ThreatCreate,
    current_user: User = Depends(require_permission("write:threats")),
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new threat alert"""
    try:
        # Validate device exists if device_id provided
        if threat_data.device_id:
            device_result = await db.execute(
                select(Device).where(Device.id == threat_data.device_id)
            )
            if not device_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Device not found"
                )
        
        # Create threat alert
        threat = ThreatAlert(
            title=threat_data.title,
            description=threat_data.description,
            severity=threat_data.severity,
            category=threat_data.category.value,
            status="open",
            source_ip=str(threat_data.source_ip) if threat_data.source_ip else None,
            destination_ip=str(threat_data.destination_ip) if threat_data.destination_ip else None,
            device_id=threat_data.device_id,
            confidence_score=threat_data.confidence_score,
            risk_score=threat_data.risk_score,
            tags=threat_data.tags or [],
            device_metadata=threat_data.metadata or {},
            created_by=current_user.id
        )
        
        db.add(threat)
        await db.commit()
        await db.refresh(threat)
        
        # Add device name if available
        if threat.device_id:
            device_result = await db.execute(
                select(Device.name).where(Device.id == threat.device_id)
            )
            threat.device_name = device_result.scalar_one_or_none()
        
        logger.info(f"Threat alert created: {threat.title} by user {current_user.email}")
        return threat
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating threat alert: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create threat alert"
        )


@router.get(
    "/{threat_id}",
    response_model=ThreatResponse,
    summary="Get threat alert",
    description="Get threat alert by ID"
)
async def get_threat(
    threat_id: int,
    current_user: User = Depends(require_permission("read:threats")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get threat alert by ID"""
    try:
        result = await db.execute(select(ThreatAlert).where(ThreatAlert.id == threat_id))
        threat = result.scalar_one_or_none()
        
        if not threat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Threat alert not found"
            )
        
        # Add device name if available
        if threat.device_id:
            device_result = await db.execute(
                select(Device.name).where(Device.id == threat.device_id)
            )
            threat.device_name = device_result.scalar_one_or_none()
        
        return threat
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving threat {threat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve threat alert"
        )


@router.put(
    "/{threat_id}",
    response_model=ThreatResponse,
    summary="Update threat alert",
    description="Update threat alert status and information"
)
async def update_threat(
    threat_id: int,
    threat_update: ThreatUpdate,
    current_user: User = Depends(require_permission("write:threats")),
    db: AsyncSession = Depends(get_async_db)
):
    """Update threat alert"""
    try:
        # Get existing threat
        result = await db.execute(select(ThreatAlert).where(ThreatAlert.id == threat_id))
        threat = result.scalar_one_or_none()
        
        if not threat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Threat alert not found"
            )
        
        # Update threat fields
        update_data = threat_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "status" and value:
                setattr(threat, field, value.value)
                # Set resolved timestamp if status is resolved
                if value == ThreatStatus.RESOLVED:
                    threat.resolved_at = datetime.utcnow()
                    threat.resolved_by = current_user.id
            elif field != "notes":  # Notes are handled separately
                setattr(threat, field, value)
        
        # Add notes to metadata if provided
        if threat_update.notes:
            if not threat.device_metadata:
                threat.device_metadata = {}
            if "notes" not in threat.device_metadata:
                threat.device_metadata["notes"] = []
            threat.device_metadata["notes"].append({
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": current_user.id,
                "note": threat_update.notes
            })
        
        threat.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(threat)
        
        # Add device name if available
        if threat.device_id:
            device_result = await db.execute(
                select(Device.name).where(Device.id == threat.device_id)
            )
            threat.device_name = device_result.scalar_one_or_none()
        
        logger.info(f"Threat alert updated: {threat.title} by user {current_user.email}")
        return threat
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating threat {threat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update threat alert"
        )


@router.delete(
    "/{threat_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete threat alert",
    description="Delete threat alert by ID"
)
async def delete_threat(
    threat_id: int,
    current_user: User = Depends(require_permission("delete:threats")),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete threat alert"""
    try:
        # Get threat
        result = await db.execute(select(ThreatAlert).where(ThreatAlert.id == threat_id))
        threat = result.scalar_one_or_none()
        
        if not threat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Threat alert not found"
            )
        
        # Delete threat
        await db.delete(threat)
        await db.commit()
        
        logger.info(f"Threat alert deleted: {threat.title} by user {current_user.email}")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting threat {threat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete threat alert"
        )


@router.post(
    "/analyze",
    response_model=ThreatAnalysisResponse,
    summary="Analyze for threats",
    description="Perform threat analysis on network data or PCAP files"
)
async def analyze_threats(
    analysis_request: ThreatAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("analyze:threats")),
    db: AsyncSession = Depends(get_async_db),
    ml_service: MLService = Depends()
):
    """Perform threat analysis"""
    try:
        import time
        import uuid
        
        analysis_id = str(uuid.uuid4())
        start_time = time.time()
        
        # TODO: Implement actual threat analysis using ML service
        # This is a placeholder for threat analysis
        
        # Simulate analysis
        await asyncio.sleep(1)  # Simulate processing time
        
        # Mock analysis results
        threats_detected = 2
        confidence_score = 0.78
        risk_assessment = "medium"
        recommendations = [
            "Monitor suspicious IP addresses",
            "Update security policies",
            "Investigate anomalous traffic patterns"
        ]
        
        analysis_time = time.time() - start_time
        
        # Create threat alerts for detected threats (in background)
        if threats_detected > 0:
            background_tasks.add_task(
                create_threat_alerts_from_analysis,
                analysis_id,
                threats_detected,
                analysis_request.device_id,
                current_user.id,
                db
            )
        
        response = ThreatAnalysisResponse(
            analysis_id=analysis_id,
            status="completed",
            threats_detected=threats_detected,
            confidence_score=confidence_score,
            risk_assessment=risk_assessment,
            recommendations=recommendations,
            analysis_time_seconds=round(analysis_time, 2)
        )
        
        logger.info(
            f"Threat analysis completed: {analysis_id} by user {current_user.email}, "
            f"detected {threats_detected} threats"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error performing threat analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform threat analysis"
        )


async def create_threat_alerts_from_analysis(
    analysis_id: str,
    threats_count: int,
    device_id: Optional[int],
    user_id: int,
    db: AsyncSession
):
    """Background task to create threat alerts from analysis results"""
    try:
        for i in range(threats_count):
            threat = ThreatAlert(
                title=f"Threat detected in analysis {analysis_id[:8]}",
                description=f"Automated threat detection from analysis {analysis_id}",
                severity=ThreatSeverity.MEDIUM,
                category="anomaly",
                status="open",
                device_id=device_id,
                confidence_score=0.75,
                risk_score=60,
                tags=["automated", "analysis"],
                device_metadata={
                    "analysis_id": analysis_id,
                    "detection_method": "ml_analysis"
                },
                created_by=user_id
            )
            
            db.add(threat)
        
        await db.commit()
        logger.info(f"Created {threats_count} threat alerts from analysis {analysis_id}")
        
    except Exception as e:
        logger.error(f"Error creating threat alerts from analysis: {str(e)}")
        await db.rollback()


# Import asyncio for sleep function
import asyncio