from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
from pydantic import BaseModel, Field, IPvAnyAddress
from enum import Enum

from database.database import get_async_db
from auth import get_current_active_user, require_permission
from database.models import User, Device, DeviceStatus, DeviceType
from core.config import settings
router = APIRouter(prefix="/devices", tags=["Device Management"])


class DeviceCreate(BaseModel):
    """Device creation model"""
    name: str = Field(..., min_length=1, max_length=100, description="Device name")
    device_type: DeviceType = Field(..., description="Device type")
    ip_address: IPvAnyAddress = Field(..., description="Device IP address")
    mac_address: Optional[str] = Field(None, pattern=r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', description="MAC address")
    port: Optional[int] = Field(None, ge=1, le=65535, description="Device port")
    protocol: Optional[str] = Field(None, max_length=20, description="Communication protocol")
    vendor: Optional[str] = Field(None, max_length=100, description="Device vendor")
    model: Optional[str] = Field(None, max_length=100, description="Device model")
    firmware_version: Optional[str] = Field(None, max_length=50, description="Firmware version")
    location: Optional[str] = Field(None, max_length=200, description="Physical location")
    description: Optional[str] = Field(None, max_length=500, description="Device description")
    tags: Optional[List[str]] = Field(default_factory=list, description="Device tags")
    
    class Config:
        schema_extra = {
            "example": {
                "name": "PLC-001",
                "device_type": "plc",
                "ip_address": "192.168.1.100",
                "mac_address": "00:1B:44:11:3A:B7",
                "port": 502,
                "protocol": "Modbus TCP",
                "vendor": "Schneider Electric",
                "model": "M340",
                "firmware_version": "2.70",
                "location": "Production Floor A",
                "description": "Main production line PLC",
                "tags": ["critical", "production"]
            }
        }


class DeviceUpdate(BaseModel):
    """Device update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    device_type: Optional[DeviceType] = None
    ip_address: Optional[IPvAnyAddress] = None
    mac_address: Optional[str] = Field(None, pattern=r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$')
    port: Optional[int] = Field(None, ge=1, le=65535)
    protocol: Optional[str] = Field(None, max_length=20)
    vendor: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    firmware_version: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[DeviceStatus] = None
    tags: Optional[List[str]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "name": "PLC-001-Updated",
                "status": "online",
                "firmware_version": "2.71",
                "tags": ["critical", "production", "updated"]
            }
        }


class DeviceResponse(BaseModel):
    """Device response model"""
    id: int
    name: str
    device_type: DeviceType
    ip_address: str
    mac_address: Optional[str]
    port: Optional[int]
    protocol: Optional[str]
    vendor: Optional[str]
    model: Optional[str]
    firmware_version: Optional[str]
    location: Optional[str]
    description: Optional[str]
    status: DeviceStatus
    is_online: bool
    last_seen: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    tags: List[str]
    
    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "name": "PLC-001",
                "device_type": "plc",
                "ip_address": "192.168.1.100",
                "mac_address": "00:1B:44:11:3A:B7",
                "port": 502,
                "protocol": "Modbus TCP",
                "vendor": "Schneider Electric",
                "model": "M340",
                "firmware_version": "2.70",
                "location": "Production Floor A",
                "description": "Main production line PLC",
                "status": "online",
                "is_online": True,
                "last_seen": "2024-01-01T12:00:00Z",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T12:00:00Z",
                "tags": ["critical", "production"]
            }
        }


class DeviceStats(BaseModel):
    """Device statistics model"""
    total_devices: int
    online_devices: int
    offline_devices: int
    critical_devices: int
    devices_by_type: Dict[str, int]
    devices_by_status: Dict[str, int]
    recent_alerts: int
    
    class Config:
        schema_extra = {
            "example": {
                "total_devices": 150,
                "online_devices": 142,
                "offline_devices": 8,
                "critical_devices": 25,
                "devices_by_type": {
                    "plc": 45,
                    "hmi": 20,
                    "scada": 5,
                    "sensor": 80
                },
                "devices_by_status": {
                    "online": 142,
                    "offline": 8,
                    "maintenance": 0,
                    "error": 0
                },
                "recent_alerts": 3
            }
        }


class DeviceCommand(BaseModel):
    """Device command model"""
    command: str = Field(..., description="Command to execute")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Command parameters")
    
    class Config:
        schema_extra = {
            "example": {
                "command": "restart",
                "parameters": {
                    "force": False,
                    "delay": 5
                }
            }
        }


class DeviceCommandResponse(BaseModel):
    """Device command response model"""
    success: bool
    message: str
    command_id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Command executed successfully",
                "command_id": "cmd_123456",
                "result": {
                    "status": "restarting",
                    "estimated_time": 30
                }
            }
        }


@router.get(
    "/",
    response_model=List[DeviceResponse],
    summary="Get devices",
    description="Get list of devices with optional filtering"
)
async def get_devices(
    skip: int = Query(0, ge=0, description="Number of devices to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of devices to return"),
    device_type: Optional[DeviceType] = Query(None, description="Filter by device type"),
    status: Optional[DeviceStatus] = Query(None, description="Filter by device status"),
    location: Optional[str] = Query(None, description="Filter by location"),
    vendor: Optional[str] = Query(None, description="Filter by vendor"),
    search: Optional[str] = Query(None, description="Search in device name or description"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    current_user: User = Depends(require_permission("read:devices")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get devices with filtering options"""
    try:
        # Build query
        query = select(Device)
        
        # Apply filters
        conditions = []
        
        if device_type:
            conditions.append(Device.device_type == device_type)
        
        if status:
            conditions.append(Device.status == status)
        
        if location:
            conditions.append(Device.location.ilike(f"%{location}%"))
        
        if vendor:
            conditions.append(Device.vendor.ilike(f"%{vendor}%"))
        
        if search:
            search_condition = or_(
                Device.name.ilike(f"%{search}%"),
                Device.description.ilike(f"%{search}%")
            )
            conditions.append(search_condition)
        
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            for tag in tag_list:
                conditions.append(Device.tags.contains([tag]))
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Apply pagination
        query = query.offset(skip).limit(limit).order_by(Device.created_at.desc())
        
        # Execute query
        result = await db.execute(query)
        devices = result.scalars().all()
        
        logger.info(f"Retrieved {len(devices)} devices for user {current_user.email}")
        return devices
        
    except Exception as e:
        logger.error(f"Error retrieving devices: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve devices"
        )


@router.get(
    "/stats",
    response_model=DeviceStats,
    summary="Get device statistics",
    description="Get device statistics and metrics"
)
async def get_device_stats(
    current_user: User = Depends(require_permission("read:devices")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get device statistics"""
    try:
        # Total devices
        total_result = await db.execute(select(func.count(Device.id)))
        total_devices = total_result.scalar()
        
        # Online devices
        online_result = await db.execute(
            select(func.count(Device.id)).where(Device.status == DeviceStatus.ONLINE)
        )
        online_devices = online_result.scalar()
        
        # Offline devices
        offline_result = await db.execute(
            select(func.count(Device.id)).where(Device.status == DeviceStatus.OFFLINE)
        )
        offline_devices = offline_result.scalar()
        
        # Critical devices (tagged as critical)
        critical_result = await db.execute(
            select(func.count(Device.id)).where(Device.tags.contains(["critical"]))
        )
        critical_devices = critical_result.scalar()
        
        # Devices by type
        type_result = await db.execute(
            select(Device.device_type, func.count(Device.id))
            .group_by(Device.device_type)
        )
        devices_by_type = {row[0].value: row[1] for row in type_result.fetchall()}
        
        # Devices by status
        status_result = await db.execute(
            select(Device.status, func.count(Device.id))
            .group_by(Device.status)
        )
        devices_by_status = {row[0].value: row[1] for row in status_result.fetchall()}
        
        # Recent alerts (last 24 hours) - placeholder for now
        recent_alerts = 0  # This would be calculated from threat alerts
        
        stats = DeviceStats(
            total_devices=total_devices,
            online_devices=online_devices,
            offline_devices=offline_devices,
            critical_devices=critical_devices,
            devices_by_type=devices_by_type,
            devices_by_status=devices_by_status,
            recent_alerts=recent_alerts
        )
        
        logger.info(f"Device stats retrieved for user {current_user.email}")
        return stats
        
    except Exception as e:
        logger.error(f"Error retrieving device stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve device statistics"
        )


@router.post(
    "/",
    response_model=DeviceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create device",
    description="Register a new device"
)
async def create_device(
    device_data: DeviceCreate,
    current_user: User = Depends(require_permission("create:devices")),
    db: AsyncSession = Depends(get_async_db)
):
    """Create a new device"""
    try:
        # Check if device with same IP already exists
        existing_device = await db.execute(
            select(Device).where(Device.ip_address == str(device_data.ip_address))
        )
        if existing_device.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device with this IP address already exists"
            )
        
        # Create device
        device = Device(
            name=device_data.name,
            device_type=device_data.device_type,
            ip_address=str(device_data.ip_address),
            mac_address=device_data.mac_address,
            port=device_data.port,
            protocol=device_data.protocol,
            vendor=device_data.vendor,
            model=device_data.model,
            firmware_version=device_data.firmware_version,
            location=device_data.location,
            description=device_data.description,
            status=DeviceStatus.OFFLINE,  # Default to offline until first ping
            tags=device_data.tags or [],
            created_by=current_user.id
        )
        
        db.add(device)
        await db.commit()
        await db.refresh(device)
        
        logger.info(f"Device created: {device.name} by user {current_user.email}")
        return device
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating device: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create device"
        )


@router.get(
    "/{device_id}",
    response_model=DeviceResponse,
    summary="Get device",
    description="Get device by ID"
)
async def get_device(
    device_id: int,
    current_user: User = Depends(require_permission("read:devices")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get device by ID"""
    try:
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        return device
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving device {device_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve device"
        )


@router.put(
    "/{device_id}",
    response_model=DeviceResponse,
    summary="Update device",
    description="Update device information"
)
async def update_device(
    device_id: int,
    device_update: DeviceUpdate,
    current_user: User = Depends(require_permission("update:devices")),
    db: AsyncSession = Depends(get_async_db)
):
    """Update device"""
    try:
        # Get existing device
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        # Check IP address uniqueness if being updated
        if device_update.ip_address and str(device_update.ip_address) != device.ip_address:
            existing_device = await db.execute(
                select(Device).where(
                    and_(
                        Device.ip_address == str(device_update.ip_address),
                        Device.id != device_id
                    )
                )
            )
            if existing_device.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Device with this IP address already exists"
                )
        
        # Update device fields
        update_data = device_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "ip_address" and value:
                setattr(device, field, str(value))
            else:
                setattr(device, field, value)
        
        device.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(device)
        
        logger.info(f"Device updated: {device.name} by user {current_user.email}")
        return device
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating device {device_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update device"
        )


@router.delete(
    "/{device_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete device",
    description="Delete device by ID"
)
async def delete_device(
    device_id: int,
    current_user: User = Depends(require_permission("delete:devices")),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete device"""
    try:
        # Get device
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        # Delete device
        await db.delete(device)
        await db.commit()
        
        logger.info(f"Device deleted: {device.name} by user {current_user.email}")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting device {device_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete device"
        )


@router.post(
    "/{device_id}/command",
    response_model=DeviceCommandResponse,
    summary="Send command to device",
    description="Send a command to a specific device"
)
async def send_device_command(
    device_id: int,
    command: DeviceCommand,
    current_user: User = Depends(require_permission("control:devices")),
    db: AsyncSession = Depends(get_async_db)
):
    """Send command to device"""
    try:
        # Get device
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        if device.status != DeviceStatus.ONLINE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device is not online"
            )
        
        # TODO: Implement actual device communication
        # This is a placeholder for device command execution
        command_id = f"cmd_{device_id}_{int(datetime.utcnow().timestamp())}"
        
        # Log command execution
        logger.info(
            f"Command '{command.command}' sent to device {device.name} "
            f"by user {current_user.email}"
        )
        
        # Simulate command execution
        response = DeviceCommandResponse(
            success=True,
            message=f"Command '{command.command}' executed successfully",
            command_id=command_id,
            result={
                "device_id": device_id,
                "command": command.command,
                "parameters": command.parameters,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending command to device {device_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send command to device"
        )


@router.post(
    "/{device_id}/ping",
    response_model=Dict[str, Any],
    summary="Ping device",
    description="Check device connectivity"
)
async def ping_device(
    device_id: int,
    current_user: User = Depends(require_permission("read:devices")),
    db: AsyncSession = Depends(get_async_db)
):
    """Ping device to check connectivity"""
    try:
        # Get device
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalar_one_or_none()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        # TODO: Implement actual ping functionality
        # This is a placeholder for device ping
        import random
        is_online = random.choice([True, False])  # Simulate ping result
        response_time = random.uniform(1, 100) if is_online else None
        
        # Update device status
        if is_online:
            device.status = DeviceStatus.ONLINE
            device.last_seen = datetime.utcnow()
        else:
            device.status = DeviceStatus.OFFLINE
        
        device.is_online = is_online
        await db.commit()
        
        logger.info(f"Device {device.name} pinged: {'online' if is_online else 'offline'}")
        
        return {
            "device_id": device_id,
            "is_online": is_online,
            "response_time_ms": response_time,
            "timestamp": datetime.utcnow().isoformat(),
            "status": device.status.value
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pinging device {device_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to ping device"
        )