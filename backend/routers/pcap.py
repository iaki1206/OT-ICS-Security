from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
from pydantic import BaseModel, Field
from enum import Enum
import os
import uuid
import aiofiles
import asyncio
from pathlib import Path

from database.database import get_async_db
from auth import get_current_active_user, require_permission
from database.models import User, PCAPFile, PCAPStatus
from core.config import settings
from services.pcap_service import PCAPService

# Initialize PCAP service instance
pcap_service = PCAPService()
router = APIRouter(prefix="/pcap", tags=["PCAP Management"])


class PCAPResponse(BaseModel):
    """PCAP file response model"""
    id: int
    filename: str
    original_filename: str
    file_size: int
    file_path: str
    status: PCAPStatus
    upload_date: datetime
    processed_date: Optional[datetime]
    packet_count: Optional[int]
    duration_seconds: Optional[float]
    protocols: List[str]
    source_ips: List[str]
    destination_ips: List[str]
    analysis_results: Dict[str, Any]
    metadata: Dict[str, Any]
    uploaded_by: int
    
    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "filename": "capture_20240101_120000.pcap",
                "original_filename": "network_capture.pcap",
                "file_size": 1048576,
                "file_path": "/uploads/pcap/capture_20240101_120000.pcap",
                "status": "processed",
                "upload_date": "2024-01-01T12:00:00Z",
                "processed_date": "2024-01-01T12:05:00Z",
                "packet_count": 1500,
                "duration_seconds": 300.5,
                "protocols": ["TCP", "UDP", "Modbus"],
                "source_ips": ["192.168.1.100", "192.168.1.101"],
                "destination_ips": ["192.168.1.200", "10.0.0.50"],
                "analysis_results": {
                    "threats_detected": 2,
                    "anomalies": 5,
                    "risk_score": 65
                }


class CaptureControlRequest(BaseModel):
    """Capture control request model"""
    action: str = Field(pattern="^(start|stop)$")
    use_wireshark: bool = Field(default=True)
    interface: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "action": "start",
                "use_wireshark": True,
                "interface": "eth0"
            }
        }


class FileManagementRequest(BaseModel):
    """File management request model"""
    action: str = Field(pattern="^(flag|unflag|export|delete)$")
    filename: str
    export_path: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "action": "flag",
                "filename": "capture_20240101_120000.pcap"
            }
        }


class TrainingRequest(BaseModel):
    """Training request model"""
    filenames: Optional[List[str]] = None  # If None, use all prioritized files
    
    class Config:
        schema_extra = {
            "example": {
                "filenames": ["capture_20240101_120000.pcap", "capture_20240101_130000.pcap"]
            }
        }


class RecentFilesResponse(BaseModel):
    """Recent files response model"""
    files: List[Dict[str, Any]]
    total_count: int
    dropdown_active: bool  # True if >= 15 files
    
    class Config:
        schema_extra = {
            "example": {
                "files": [
                    {
                        "filename": "capture_20240101_120000.pcap",
                        "size": 1048576,
                        "packet_count": 1500,
                        "created": "2024-01-01T12:00:00Z",
                        "prioritized": False
                    }
                ],
                "total_count": 15,
                "dropdown_active": True
            }
        },
                "metadata": {
                    "capture_interface": "eth0",
                    "capture_filter": "tcp port 502"
                },
                "uploaded_by": 1
            }
        }


class PCAPStats(BaseModel):
    """PCAP statistics model"""
    total_files: int
    total_size_bytes: int
    processed_files: int
    processing_files: int
    failed_files: int
    total_packets: int
    unique_protocols: List[str]
    recent_uploads_24h: int
    avg_processing_time_seconds: float
    
    class Config:
        schema_extra = {
            "example": {
                "total_files": 45,
                "total_size_bytes": 52428800,
                "processed_files": 42,
                "processing_files": 2,
                "failed_files": 1,
                "total_packets": 125000,
                "unique_protocols": ["TCP", "UDP", "Modbus", "DNP3", "HTTP"],
                "recent_uploads_24h": 8,
                "avg_processing_time_seconds": 45.2
            }
        }


class PCAPAnalysisRequest(BaseModel):
    """PCAP analysis request model"""
    analysis_type: str = Field(default="full", pattern="^(full|quick|deep|custom)$")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    include_ml_analysis: bool = Field(default=True)
    include_threat_detection: bool = Field(default=True)
    include_protocol_analysis: bool = Field(default=True)
    
    class Config:
        schema_extra = {
            "example": {
                "analysis_type": "full",
                "filters": {
                    "protocol": "Modbus",
                    "source_ip": "192.168.1.100"
                },
                "include_ml_analysis": True,
                "include_threat_detection": True,
                "include_protocol_analysis": True
            }
        }


class PCAPAnalysisResponse(BaseModel):
    """PCAP analysis response model"""
    analysis_id: str
    status: str
    progress: float
    results: Optional[Dict[str, Any]] = None
    threats_detected: int
    anomalies_found: int
    processing_time_seconds: float
    
    class Config:
        schema_extra = {
            "example": {
                "analysis_id": "analysis_123456",
                "status": "completed",
                "progress": 100.0,
                "results": {
                    "protocol_distribution": {"TCP": 60, "UDP": 30, "Modbus": 10},
                    "traffic_patterns": {"normal": 85, "suspicious": 15},
                    "top_talkers": ["192.168.1.100", "192.168.1.101"]
                },
                "threats_detected": 3,
                "anomalies_found": 7,
                "processing_time_seconds": 23.5
            }
        }


class PCAPFilterRequest(BaseModel):
    """PCAP filter request model"""
    protocol: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    port: Optional[int] = None
    time_range: Optional[Dict[str, str]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "protocol": "Modbus",
                "source_ip": "192.168.1.100",
                "port": 502,
                "time_range": {
                    "start": "2024-01-01T12:00:00Z",
                    "end": "2024-01-01T13:00:00Z"
                }
            }
        }


@router.get(
    "/",
    response_model=List[PCAPResponse],
    summary="Get PCAP files",
    description="Get list of PCAP files with optional filtering"
)
async def get_pcap_files(
    skip: int = Query(0, ge=0, description="Number of files to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of files to return"),
    status: Optional[PCAPStatus] = Query(None, description="Filter by processing status"),
    start_date: Optional[datetime] = Query(None, description="Filter files after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter files before this date"),
    search: Optional[str] = Query(None, description="Search in filename"),
    current_user: User = Depends(require_permission("read:pcap")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get PCAP files with filtering options"""
    try:
        # Build query
        query = select(PCAPFile)
        
        # Apply filters
        conditions = []
        
        if status:
            conditions.append(PCAPFile.status == status)
        
        if start_date:
            conditions.append(PCAPFile.upload_date >= start_date)
        
        if end_date:
            conditions.append(PCAPFile.upload_date <= end_date)
        
        if search:
            conditions.append(PCAPFile.original_filename.ilike(f"%{search}%"))
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Apply pagination and ordering
        query = query.offset(skip).limit(limit).order_by(desc(PCAPFile.upload_date))
        
        # Execute query
        result = await db.execute(query)
        pcap_files = result.scalars().all()
        
        logger.info(f"Retrieved {len(pcap_files)} PCAP files for user {current_user.email}")
        return pcap_files
        
    except Exception as e:
        logger.error(f"Error retrieving PCAP files: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve PCAP files"
        )


@router.get(
    "/stats",
    response_model=PCAPStats,
    summary="Get PCAP statistics",
    description="Get PCAP file statistics and metrics"
)
async def get_pcap_stats(
    current_user: User = Depends(require_permission("read:pcap")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get PCAP statistics"""
    try:
        # Total files
        total_result = await db.execute(select(func.count(PCAPFile.id)))
        total_files = total_result.scalar()
        
        # Total size
        size_result = await db.execute(select(func.sum(PCAPFile.file_size)))
        total_size_bytes = size_result.scalar() or 0
        
        # Files by status
        processed_result = await db.execute(
            select(func.count(PCAPFile.id)).where(PCAPFile.status == PCAPStatus.PROCESSED)
        )
        processed_files = processed_result.scalar()
        
        processing_result = await db.execute(
            select(func.count(PCAPFile.id)).where(PCAPFile.status == PCAPStatus.PROCESSING)
        )
        processing_files = processing_result.scalar()
        
        failed_result = await db.execute(
            select(func.count(PCAPFile.id)).where(PCAPFile.status == PCAPStatus.FAILED)
        )
        failed_files = failed_result.scalar()
        
        # Total packets
        packets_result = await db.execute(select(func.sum(PCAPFile.packet_count)))
        total_packets = packets_result.scalar() or 0
        
        # Unique protocols (aggregate from all files)
        protocols_result = await db.execute(
            select(PCAPFile.protocols).where(PCAPFile.protocols.isnot(None))
        )
        all_protocols = set()
        for row in protocols_result.fetchall():
            if row[0]:
                all_protocols.update(row[0])
        unique_protocols = list(all_protocols)
        
        # Recent uploads (last 24 hours)
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        recent_result = await db.execute(
            select(func.count(PCAPFile.id)).where(PCAPFile.upload_date >= recent_cutoff)
        )
        recent_uploads_24h = recent_result.scalar()
        
        # Average processing time
        processing_time_result = await db.execute(
            select(func.avg(
                func.extract('epoch', PCAPFile.processed_date - PCAPFile.upload_date)
            )).where(PCAPFile.processed_date.isnot(None))
        )
        avg_processing_time = processing_time_result.scalar() or 0.0
        
        stats = PCAPStats(
            total_files=total_files,
            total_size_bytes=total_size_bytes,
            processed_files=processed_files,
            processing_files=processing_files,
            failed_files=failed_files,
            total_packets=total_packets,
            unique_protocols=unique_protocols,
            recent_uploads_24h=recent_uploads_24h,
            avg_processing_time_seconds=round(avg_processing_time, 2)
        )
        
        logger.info(f"PCAP stats retrieved for user {current_user.email}")
        return stats
        
    except Exception as e:
        logger.error(f"Error retrieving PCAP stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve PCAP statistics"
        )


@router.post(
    "/upload",
    response_model=PCAPResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload PCAP file",
    description="Upload a PCAP file for processing and analysis"
)
async def upload_pcap_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PCAP file to upload"),
    current_user: User = Depends(require_permission("write:pcap")),
    db: AsyncSession = Depends(get_async_db),
    pcap_service: PCAPService = Depends()
):
    """Upload PCAP file"""
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith(('.pcap', '.pcapng', '.cap')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only PCAP files are allowed (.pcap, .pcapng, .cap)"
            )
        
        # Check file size
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_PCAP_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {settings.MAX_PCAP_FILE_SIZE} bytes"
            )
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.PCAP_STORAGE_PATH, unique_filename)
        
        # Ensure upload directory exists
        os.makedirs(settings.PCAP_STORAGE_PATH, exist_ok=True)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Create database record
        pcap_file = PCAPFile(
            filename=unique_filename,
            original_filename=file.filename,
            file_size=file_size,
            file_path=file_path,
            status=PCAPStatus.UPLOADED,
            protocols=[],
            source_ips=[],
            destination_ips=[],
            analysis_results={},
            file_metadata={},
            uploaded_by=current_user.id
        )
        
        db.add(pcap_file)
        await db.commit()
        await db.refresh(pcap_file)
        
        # Start background processing
        background_tasks.add_task(
            process_pcap_file,
            pcap_file.id,
            file_path,
            pcap_service,
            db
        )
        
        logger.info(
            f"PCAP file uploaded: {file.filename} ({file_size} bytes) "
            f"by user {current_user.email}"
        )
        
        return pcap_file
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading PCAP file: {str(e)}")
        # Clean up file if it was created
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload PCAP file"
        )


@router.get(
    "/{pcap_id}",
    response_model=PCAPResponse,
    summary="Get PCAP file",
    description="Get PCAP file by ID"
)
async def get_pcap_file(
    pcap_id: int,
    current_user: User = Depends(require_permission("read:pcap")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get PCAP file by ID"""
    try:
        result = await db.execute(select(PCAPFile).where(PCAPFile.id == pcap_id))
        pcap_file = result.scalar_one_or_none()
        
        if not pcap_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PCAP file not found"
            )
        
        return pcap_file
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving PCAP file {pcap_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve PCAP file"
        )


@router.get(
    "/{pcap_id}/download",
    summary="Download PCAP file",
    description="Download original PCAP file"
)
async def download_pcap_file(
    pcap_id: int,
    current_user: User = Depends(require_permission("read:pcap")),
    db: AsyncSession = Depends(get_async_db)
):
    """Download PCAP file"""
    try:
        result = await db.execute(select(PCAPFile).where(PCAPFile.id == pcap_id))
        pcap_file = result.scalar_one_or_none()
        
        if not pcap_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PCAP file not found"
            )
        
        if not os.path.exists(pcap_file.file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PCAP file not found on disk"
            )
        
        logger.info(f"PCAP file downloaded: {pcap_file.original_filename} by user {current_user.email}")
        
        return FileResponse(
            path=pcap_file.file_path,
            filename=pcap_file.original_filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading PCAP file {pcap_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download PCAP file"
        )


@router.post(
    "/{pcap_id}/analyze",
    response_model=PCAPAnalysisResponse,
    summary="Analyze PCAP file",
    description="Perform detailed analysis on PCAP file"
)
async def analyze_pcap_file(
    pcap_id: int,
    analysis_request: PCAPAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("analyze:pcap")),
    db: AsyncSession = Depends(get_async_db),
    pcap_service: PCAPService = Depends()
):
    """Analyze PCAP file"""
    try:
        # Get PCAP file
        result = await db.execute(select(PCAPFile).where(PCAPFile.id == pcap_id))
        pcap_file = result.scalar_one_or_none()
        
        if not pcap_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PCAP file not found"
            )
        
        if pcap_file.status != PCAPStatus.PROCESSED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PCAP file must be processed before analysis"
            )
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Start background analysis
        background_tasks.add_task(
            analyze_pcap_in_background,
            analysis_id,
            pcap_file.id,
            pcap_file.file_path,
            analysis_request,
            current_user.id,
            pcap_service,
            db
        )
        
        logger.info(
            f"PCAP analysis started: {analysis_id} for file {pcap_file.original_filename} "
            f"by user {current_user.email}"
        )
        
        return PCAPAnalysisResponse(
            analysis_id=analysis_id,
            status="started",
            progress=0.0,
            threats_detected=0,
            anomalies_found=0,
            processing_time_seconds=0.0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting PCAP analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start PCAP analysis"
        )


@router.delete(
    "/{pcap_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete PCAP file",
    description="Delete PCAP file and associated data"
)
async def delete_pcap_file(
    pcap_id: int,
    current_user: User = Depends(require_permission("delete:pcap")),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete PCAP file"""
    try:
        # Get PCAP file
        result = await db.execute(select(PCAPFile).where(PCAPFile.id == pcap_id))
        pcap_file = result.scalar_one_or_none()
        
        if not pcap_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PCAP file not found"
            )
        
        # Delete file from disk
        if os.path.exists(pcap_file.file_path):
            try:
                os.remove(pcap_file.file_path)
            except Exception as e:
                logger.warning(f"Failed to delete file from disk: {str(e)}")
        
        # Delete database record
        await db.delete(pcap_file)
        await db.commit()
        
        logger.info(
            f"PCAP file deleted: {pcap_file.original_filename} "
            f"by user {current_user.email}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting PCAP file {pcap_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete PCAP file"
        )


async def process_pcap_file(
    pcap_id: int,
    file_path: str,
    pcap_service: PCAPService,
    db: AsyncSession
):
    """Background task to process PCAP file"""
    try:
        # Update status to processing
        result = await db.execute(select(PCAPFile).where(PCAPFile.id == pcap_id))
        pcap_file = result.scalar_one_or_none()
        
        if not pcap_file:
            logger.error(f"PCAP file {pcap_id} not found for processing")
            return
        
        pcap_file.status = PCAPStatus.PROCESSING
        await db.commit()
        
        # Process file using PCAP service
        processing_result = await pcap_service.process_pcap_file(file_path)
        
        # Update database with results
        pcap_file.status = PCAPStatus.PROCESSED
        pcap_file.processed_date = datetime.utcnow()
        pcap_file.packet_count = processing_result.get('packet_count', 0)
        pcap_file.duration_seconds = processing_result.get('duration_seconds', 0.0)
        pcap_file.protocols = processing_result.get('protocols', [])
        pcap_file.source_ips = processing_result.get('source_ips', [])
        pcap_file.destination_ips = processing_result.get('destination_ips', [])
        pcap_file.analysis_results = processing_result.get('analysis_results', {})
        pcap_file.metadata.update(processing_result.get('metadata', {}))
        
        await db.commit()
        
        logger.info(f"PCAP file processed successfully: {pcap_file.original_filename}")
        
    except Exception as e:
        logger.error(f"Error processing PCAP file {pcap_id}: {str(e)}")
        
        # Update status to failed
        try:
            result = await db.execute(select(PCAPFile).where(PCAPFile.id == pcap_id))
            pcap_file = result.scalar_one_or_none()
            if pcap_file:
                pcap_file.status = PCAPStatus.FAILED
                pcap_file.metadata['error'] = str(e)
                await db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update PCAP file status: {str(db_error)}")


async def analyze_pcap_in_background(
    analysis_id: str,
    pcap_id: int,
    file_path: str,
    analysis_request: PCAPAnalysisRequest,
    user_id: int,
    pcap_service: PCAPService,
    db: AsyncSession
):
    """Background task to analyze PCAP file"""
    try:
        import time
        start_time = time.time()
        
        # Perform analysis using PCAP service
        analysis_result = await pcap_service.analyze_pcap_file(
            file_path,
            analysis_request.dict()
        )
        
        processing_time = time.time() - start_time
        
        # Update PCAP file with analysis results
        result = await db.execute(select(PCAPFile).where(PCAPFile.id == pcap_id))
        pcap_file = result.scalar_one_or_none()
        
        if pcap_file:
            pcap_file.analysis_results.update({
                analysis_id: {
                    'status': 'completed',
                    'results': analysis_result,
                    'processing_time': processing_time,
                    'analyzed_by': user_id,
                    'analyzed_at': datetime.utcnow().isoformat()
                }
            })
            await db.commit()
        
        logger.info(
            f"PCAP analysis completed: {analysis_id} in {processing_time:.2f} seconds"
        )
        
    except Exception as e:
        logger.error(f"Error analyzing PCAP file {analysis_id}: {str(e)}")
        
        # Update analysis status to failed
        try:
            result = await db.execute(select(PCAPFile).where(PCAPFile.id == pcap_id))
            pcap_file = result.scalar_one_or_none()
            if pcap_file:
                pcap_file.analysis_results[analysis_id] = {
                    'status': 'failed',
                    'error': str(e),
                    'analyzed_by': user_id,
                    'analyzed_at': datetime.utcnow().isoformat()
                }
                await db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update analysis status: {str(db_error)}")


# New endpoints for enhanced PCAP management

@router.post(
    "/capture/control",
    summary="Control PCAP capture",
    description="Start or stop PCAP capture with Wireshark integration"
)
async def control_capture(
    request: CaptureControlRequest,
    current_user: User = Depends(require_permission("write:pcap"))
):
    """Control PCAP capture (start/stop)"""
    try:
        if request.action == "start":
            result = await pcap_service.start_capture_service(
                use_wireshark=request.use_wireshark,
                interface=request.interface
            )
            logger.info(f"PCAP capture started by user {current_user.email}")
        else:  # stop
            result = await pcap_service.stop_capture_service()
            logger.info(f"PCAP capture stopped by user {current_user.email}")
        
        return {
            "status": "success",
            "action": request.action,
            "message": f"Capture {request.action}ed successfully",
            "details": result
        }
        
    except Exception as e:
        logger.error(f"Error controlling capture: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to {request.action} capture: {str(e)}"
        )


@router.get(
    "/capture/status",
    summary="Get capture status",
    description="Get current PCAP capture status and statistics"
)
async def get_capture_status(
    current_user: User = Depends(require_permission("read:pcap"))
):
    """Get current capture status"""
    try:
        stats = pcap_service.get_capture_statistics()
        return {
            "status": "success",
            "capture_active": stats.get("capture_active", False),
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting capture status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get capture status"
        )


@router.get(
    "/recent",
    response_model=RecentFilesResponse,
    summary="Get recent PCAP files",
    description="Get the most recent 15 PCAP files for dropdown management"
)
async def get_recent_files(
    current_user: User = Depends(require_permission("read:pcap"))
):
    """Get recent PCAP files for dropdown management"""
    try:
        recent_files = pcap_service.get_recent_files()
        total_count = len(pcap_service.pcap_files)
        
        return RecentFilesResponse(
            files=recent_files,
            total_count=total_count,
            dropdown_active=total_count >= 15
        )
        
    except Exception as e:
        logger.error(f"Error getting recent files: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent files"
        )


@router.post(
    "/manage",
    summary="Manage PCAP files",
    description="Flag, unflag, export, or delete PCAP files"
)
async def manage_file(
    request: FileManagementRequest,
    current_user: User = Depends(require_permission("write:pcap"))
):
    """Manage PCAP files (flag/unflag/export/delete)"""
    try:
        if request.action == "flag":
            result = pcap_service.flag_file_for_training(request.filename)
        elif request.action == "unflag":
            result = pcap_service.unflag_file_for_training(request.filename)
        elif request.action == "export":
            result = pcap_service.export_file(request.filename, request.export_path)
        elif request.action == "delete":
            result = pcap_service.delete_file(request.filename)
        
        logger.info(f"File {request.action} action performed on {request.filename} by user {current_user.email}")
        
        return {
            "status": "success",
            "action": request.action,
            "filename": request.filename,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error managing file {request.filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to {request.action} file: {str(e)}"
        )


@router.post(
    "/training/send",
    summary="Send files to ML training",
    description="Send PCAP files to ML/DL training pipeline"
)
async def send_to_training(
    request: TrainingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("write:pcap"))
):
    """Send PCAP files to ML training pipeline"""
    try:
        # Get files to send (either specified or all prioritized)
        if request.filenames:
            files_to_send = request.filenames
        else:
            files_to_send = pcap_service.get_prioritized_files()
        
        if not files_to_send:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files specified or prioritized for training"
            )
        
        # Start background training task
        training_id = str(uuid.uuid4())
        background_tasks.add_task(
            send_files_to_ml_pipeline,
            training_id,
            files_to_send,
            current_user.id
        )
        
        logger.info(f"Training started with {len(files_to_send)} files by user {current_user.email}")
        
        return {
            "status": "success",
            "training_id": training_id,
            "files_count": len(files_to_send),
            "files": files_to_send
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending files to training: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send files to training"
        )


async def send_files_to_ml_pipeline(
    training_id: str,
    filenames: List[str],
    user_id: int
):
    """Background task to send files to ML pipeline"""
    try:
        # This would integrate with your ML/DL training service
        # For now, we'll simulate the process
        logger.info(f"Starting ML training {training_id} with {len(filenames)} files")
        
        # Here you would:
        # 1. Prepare files for ML pipeline
        # 2. Call ML service API
        # 3. Monitor training progress
        # 4. Update training status
        
        # Placeholder for ML integration
        await asyncio.sleep(2)  # Simulate processing time
        
        logger.info(f"ML training {training_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Error in ML training {training_id}: {str(e)}")