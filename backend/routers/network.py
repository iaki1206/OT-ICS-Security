from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, text
from typing import List, Optional, Dict, Any, AsyncGenerator
from datetime import datetime, timedelta
from loguru import logger
from pydantic import BaseModel, Field, IPvAnyAddress
from enum import Enum
import asyncio
import json
from collections import defaultdict

from database.database import get_async_db
from auth import get_current_active_user, require_permission
from database.models import User, Device, NetworkPacket, ThreatAlert
from core.config import settings
from services.pcap_service import PCAPService

# settings is already imported from core.config
router = APIRouter(prefix="/network", tags=["Network Monitoring"])


class NetworkStats(BaseModel):
    """Network statistics model"""
    total_packets: int
    total_bytes: int
    packets_per_second: float
    bytes_per_second: float
    unique_sources: int
    unique_destinations: int
    protocol_distribution: Dict[str, int]
    top_talkers: List[Dict[str, Any]]
    bandwidth_utilization: float
    active_connections: int
    
    class Config:
        schema_extra = {
            "example": {
                "total_packets": 125000,
                "total_bytes": 52428800,
                "packets_per_second": 450.5,
                "bytes_per_second": 1048576,
                "unique_sources": 25,
                "unique_destinations": 18,
                "protocol_distribution": {
                    "TCP": 65,
                    "UDP": 25,
                    "Modbus": 8,
                    "DNP3": 2
                },
                "top_talkers": [
                    {"ip": "192.168.1.100", "packets": 15000, "bytes": 2048000},
                    {"ip": "192.168.1.101", "packets": 12000, "bytes": 1536000}
                ],
                "bandwidth_utilization": 75.5,
                "active_connections": 42
            }
        }


class TrafficPattern(BaseModel):
    """Traffic pattern model"""
    timestamp: datetime
    source_ip: str
    destination_ip: str
    protocol: str
    port: int
    packet_count: int
    byte_count: int
    duration_seconds: float
    flags: List[str]
    
    class Config:
        schema_extra = {
            "example": {
                "timestamp": "2024-01-01T12:00:00Z",
                "source_ip": "192.168.1.100",
                "destination_ip": "192.168.1.200",
                "protocol": "Modbus",
                "port": 502,
                "packet_count": 150,
                "byte_count": 9600,
                "duration_seconds": 30.5,
                "flags": ["SYN", "ACK"]
            }
        }


class NetworkDevice(BaseModel):
    """Network device discovery model"""
    ip_address: str
    mac_address: Optional[str] = None
    hostname: Optional[str] = None
    vendor: Optional[str] = None
    device_type: Optional[str] = None
    open_ports: List[int]
    services: List[Dict[str, str]]
    last_seen: datetime
    first_seen: datetime
    is_active: bool
    risk_score: float
    
    class Config:
        schema_extra = {
            "example": {
                "ip_address": "192.168.1.100",
                "mac_address": "00:1B:44:11:3A:B7",
                "hostname": "plc-001.factory.local",
                "vendor": "Schneider Electric",
                "device_type": "PLC",
                "open_ports": [502, 80, 443],
                "services": [
                    {"port": "502", "service": "Modbus", "version": "1.0"},
                    {"port": "80", "service": "HTTP", "version": "1.1"}
                ],
                "last_seen": "2024-01-01T12:00:00Z",
                "first_seen": "2024-01-01T08:00:00Z",
                "is_active": True,
                "risk_score": 25.5
            }
        }


class NetworkAlert(BaseModel):
    """Network alert model"""
    id: str
    alert_type: str
    severity: str
    title: str
    description: str
    source_ip: str
    destination_ip: Optional[str] = None
    protocol: str
    timestamp: datetime
    details: Dict[str, Any]
    is_acknowledged: bool = False
    
    class Config:
        schema_extra = {
            "example": {
                "id": "alert_123456",
                "alert_type": "suspicious_traffic",
                "severity": "medium",
                "title": "Unusual Modbus Traffic Pattern",
                "description": "Detected unusual Modbus communication pattern from 192.168.1.100",
                "source_ip": "192.168.1.100",
                "destination_ip": "192.168.1.200",
                "protocol": "Modbus",
                "timestamp": "2024-01-01T12:00:00Z",
                "details": {
                    "packet_count": 500,
                    "frequency": "high",
                    "anomaly_score": 0.85
                },
                "is_acknowledged": False
            }
        }


class NetworkMonitoringRequest(BaseModel):
    """Network monitoring configuration"""
    interface: Optional[str] = Field(default="any", description="Network interface to monitor")
    capture_filter: Optional[str] = Field(default="", description="BPF capture filter")
    duration_seconds: Optional[int] = Field(default=300, ge=1, le=3600, description="Monitoring duration")
    packet_limit: Optional[int] = Field(default=10000, ge=1, le=100000, description="Maximum packets to capture")
    enable_analysis: bool = Field(default=True, description="Enable real-time analysis")
    protocols: List[str] = Field(default_factory=lambda: ["TCP", "UDP", "Modbus", "DNP3"], description="Protocols to monitor")
    
    class Config:
        schema_extra = {
            "example": {
                "interface": "eth0",
                "capture_filter": "tcp port 502 or udp port 20000",
                "duration_seconds": 600,
                "packet_limit": 50000,
                "enable_analysis": True,
                "protocols": ["TCP", "UDP", "Modbus", "DNP3"]
            }
        }


class ConnectionManager:
    """WebSocket connection manager for real-time monitoring"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.monitoring_tasks: Dict[str, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected for user {user_id}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {str(e)}")
    
    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            if connection in self.active_connections:
                self.active_connections.remove(connection)


manager = ConnectionManager()


@router.get(
    "/stats",
    response_model=NetworkStats,
    summary="Get network statistics",
    description="Get real-time network statistics and metrics"
)
async def get_network_stats(
    time_range: int = Query(3600, ge=60, le=86400, description="Time range in seconds"),
    current_user: User = Depends(require_permission("read:network")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get network statistics"""
    try:
        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(seconds=time_range)
        
        # Total packets and bytes
        packet_stats = await db.execute(
            select(
                func.count(NetworkPacket.id).label('total_packets'),
                func.sum(NetworkPacket.packet_size).label('total_bytes')
            ).where(
                NetworkPacket.timestamp.between(start_time, end_time)
            )
        )
        packet_result = packet_stats.first()
        total_packets = packet_result.total_packets or 0
        total_bytes = packet_result.total_bytes or 0
        
        # Calculate rates
        packets_per_second = total_packets / time_range if time_range > 0 else 0
        bytes_per_second = total_bytes / time_range if time_range > 0 else 0
        
        # Unique sources and destinations
        unique_sources_result = await db.execute(
            select(func.count(func.distinct(NetworkPacket.source_ip)))
            .where(NetworkPacket.timestamp.between(start_time, end_time))
        )
        unique_sources = unique_sources_result.scalar() or 0
        
        unique_destinations_result = await db.execute(
            select(func.count(func.distinct(NetworkPacket.destination_ip)))
            .where(NetworkPacket.timestamp.between(start_time, end_time))
        )
        unique_destinations = unique_destinations_result.scalar() or 0
        
        # Protocol distribution
        protocol_result = await db.execute(
            select(
                NetworkPacket.protocol,
                func.count(NetworkPacket.id).label('count')
            ).where(
                NetworkPacket.timestamp.between(start_time, end_time)
            ).group_by(NetworkPacket.protocol)
        )
        protocol_distribution = {row.protocol: row.count for row in protocol_result.fetchall()}
        
        # Top talkers
        top_talkers_result = await db.execute(
            select(
                NetworkPacket.source_ip,
                func.count(NetworkPacket.id).label('packets'),
                func.sum(NetworkPacket.packet_size).label('bytes')
            ).where(
                NetworkPacket.timestamp.between(start_time, end_time)
            ).group_by(NetworkPacket.source_ip)
            .order_by(desc('packets'))
            .limit(10)
        )
        top_talkers = [
            {
                "ip": row.source_ip,
                "packets": row.packets,
                "bytes": row.bytes or 0
            }
            for row in top_talkers_result.fetchall()
        ]
        
        # Active connections (simplified)
        active_connections_result = await db.execute(
            select(func.count(func.distinct(
                func.concat(NetworkPacket.source_ip, ':', NetworkPacket.destination_ip)
            ))).where(
                NetworkPacket.timestamp.between(start_time, end_time)
            )
        )
        active_connections = active_connections_result.scalar() or 0
        
        # Bandwidth utilization (mock calculation)
        max_bandwidth = settings.MAX_BANDWIDTH_MBPS * 1024 * 1024  # Convert to bytes
        bandwidth_utilization = min((bytes_per_second / max_bandwidth) * 100, 100) if max_bandwidth > 0 else 0
        
        stats = NetworkStats(
            total_packets=total_packets,
            total_bytes=total_bytes,
            packets_per_second=round(packets_per_second, 2),
            bytes_per_second=round(bytes_per_second, 2),
            unique_sources=unique_sources,
            unique_destinations=unique_destinations,
            protocol_distribution=protocol_distribution,
            top_talkers=top_talkers,
            bandwidth_utilization=round(bandwidth_utilization, 2),
            active_connections=active_connections
        )
        
        logger.info(f"Network stats retrieved for user {current_user.email}")
        return stats
        
    except Exception as e:
        logger.error(f"Error retrieving network stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve network statistics"
        )


@router.get(
    "/traffic",
    response_model=List[TrafficPattern],
    summary="Get traffic patterns",
    description="Get network traffic patterns and flows"
)
async def get_traffic_patterns(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of patterns to return"),
    protocol: Optional[str] = Query(None, description="Filter by protocol"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    destination_ip: Optional[str] = Query(None, description="Filter by destination IP"),
    time_range: int = Query(3600, ge=60, le=86400, description="Time range in seconds"),
    current_user: User = Depends(require_permission("read:network")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get traffic patterns"""
    try:
        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(seconds=time_range)
        
        # Build query
        query = select(NetworkPacket).where(
            NetworkPacket.timestamp.between(start_time, end_time)
        )
        
        # Apply filters
        if protocol:
            query = query.where(NetworkPacket.protocol == protocol)
        if source_ip:
            query = query.where(NetworkPacket.source_ip == source_ip)
        if destination_ip:
            query = query.where(NetworkPacket.destination_ip == destination_ip)
        
        # Apply ordering and limit
        query = query.order_by(desc(NetworkPacket.timestamp)).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        packets = result.scalars().all()
        
        # Convert to traffic patterns
        patterns = []
        for packet in packets:
            pattern = TrafficPattern(
                timestamp=packet.timestamp,
                source_ip=packet.source_ip,
                destination_ip=packet.destination_ip,
                protocol=packet.protocol,
                port=packet.destination_port or 0,
                packet_count=1,  # Individual packet
                byte_count=packet.packet_size or 0,
                duration_seconds=0.0,  # Individual packet has no duration
                flags=packet.flags or []
            )
            patterns.append(pattern)
        
        logger.info(f"Retrieved {len(patterns)} traffic patterns for user {current_user.email}")
        return patterns
        
    except Exception as e:
        logger.error(f"Error retrieving traffic patterns: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve traffic patterns"
        )


@router.get(
    "/devices",
    response_model=List[NetworkDevice],
    summary="Discover network devices",
    description="Discover and list network devices"
)
async def discover_network_devices(
    active_only: bool = Query(True, description="Show only active devices"),
    subnet: Optional[str] = Query(None, description="Filter by subnet (e.g., 192.168.1.0/24)"),
    current_user: User = Depends(require_permission("read:network")),
    db: AsyncSession = Depends(get_async_db),
    pcap_service: PCAPService = Depends()
):
    """Discover network devices"""
    try:
        # Get devices from database
        query = select(Device)
        
        if active_only:
            # Consider devices active if seen in last 5 minutes
            cutoff_time = datetime.utcnow() - timedelta(minutes=5)
            query = query.where(Device.last_seen >= cutoff_time)
        
        result = await db.execute(query)
        devices = result.scalars().all()
        
        # Convert to network device format
        network_devices = []
        for device in devices:
            network_device = NetworkDevice(
                ip_address=device.ip_address,
                mac_address=device.mac_address,
                hostname=device.hostname,
                vendor=device.vendor,
                device_type=device.device_type,
                open_ports=device.open_ports or [],
                services=device.services or [],
                last_seen=device.last_seen,
                first_seen=device.first_seen,
                is_active=device.status.value == "online",
                risk_score=device.risk_score or 0.0
            )
            network_devices.append(network_device)
        
        # Apply subnet filter if provided
        if subnet:
            # Simple subnet filtering (could be enhanced with proper IP network libraries)
            subnet_prefix = subnet.split('/')[0].rsplit('.', 1)[0]
            network_devices = [
                device for device in network_devices
                if device.ip_address.startswith(subnet_prefix)
            ]
        
        logger.info(f"Discovered {len(network_devices)} network devices for user {current_user.email}")
        return network_devices
        
    except Exception as e:
        logger.error(f"Error discovering network devices: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to discover network devices"
        )


@router.get(
    "/alerts",
    response_model=List[NetworkAlert],
    summary="Get network alerts",
    description="Get network security alerts and anomalies"
)
async def get_network_alerts(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of alerts to return"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledgment status"),
    time_range: int = Query(86400, ge=60, le=604800, description="Time range in seconds"),
    current_user: User = Depends(require_permission("read:threats")),
    db: AsyncSession = Depends(get_async_db)
):
    """Get network alerts"""
    try:
        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(seconds=time_range)
        
        # Build query
        query = select(ThreatAlert).where(
            ThreatAlert.detected_at.between(start_time, end_time)
        )
        
        # Apply filters
        if severity:
            query = query.where(ThreatAlert.severity.has_value(severity))
        if acknowledged is not None:
            query = query.where(ThreatAlert.is_acknowledged == acknowledged)
        
        # Apply ordering and limit
        query = query.order_by(desc(ThreatAlert.detected_at)).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        threat_alerts = result.scalars().all()
        
        # Convert to network alerts
        network_alerts = []
        for alert in threat_alerts:
            network_alert = NetworkAlert(
                id=str(alert.id),
                alert_type=alert.threat_type,
                severity=alert.severity.value,
                title=alert.title,
                description=alert.description,
                source_ip=alert.source_ip or "unknown",
                destination_ip=alert.destination_ip,
                protocol=alert.metadata.get('protocol', 'unknown') if alert.metadata else 'unknown',
                timestamp=alert.detected_at,
                details=alert.metadata or {},
                is_acknowledged=alert.is_acknowledged
            )
            network_alerts.append(network_alert)
        
        logger.info(f"Retrieved {len(network_alerts)} network alerts for user {current_user.email}")
        return network_alerts
        
    except Exception as e:
        logger.error(f"Error retrieving network alerts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve network alerts"
        )


@router.post(
    "/monitor/start",
    summary="Start network monitoring",
    description="Start real-time network monitoring session"
)
async def start_network_monitoring(
    monitoring_request: NetworkMonitoringRequest,
    current_user: User = Depends(require_permission("monitor:network")),
    pcap_service: PCAPService = Depends()
):
    """Start network monitoring"""
    try:
        # Generate monitoring session ID
        session_id = f"monitor_{current_user.id}_{int(datetime.utcnow().timestamp())}"
        
        # Start monitoring task
        monitoring_task = asyncio.create_task(
            monitor_network_traffic(
                session_id,
                monitoring_request,
                current_user.id,
                pcap_service
            )
        )
        
        # Store task reference
        manager.monitoring_tasks[session_id] = monitoring_task
        
        logger.info(
            f"Network monitoring started: {session_id} for user {current_user.email}"
        )
        
        return {
            "session_id": session_id,
            "status": "started",
            "message": "Network monitoring session started successfully"
        }
        
    except Exception as e:
        logger.error(f"Error starting network monitoring: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start network monitoring"
        )


@router.post(
    "/monitor/stop/{session_id}",
    summary="Stop network monitoring",
    description="Stop network monitoring session"
)
async def stop_network_monitoring(
    session_id: str,
    current_user: User = Depends(require_permission("monitor:network"))
):
    """Stop network monitoring"""
    try:
        # Check if session exists
        if session_id not in manager.monitoring_tasks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Monitoring session not found"
            )
        
        # Cancel monitoring task
        task = manager.monitoring_tasks[session_id]
        task.cancel()
        
        # Remove from active tasks
        del manager.monitoring_tasks[session_id]
        
        logger.info(
            f"Network monitoring stopped: {session_id} for user {current_user.email}"
        )
        
        return {
            "session_id": session_id,
            "status": "stopped",
            "message": "Network monitoring session stopped successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping network monitoring: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop network monitoring"
        )


@router.websocket("/monitor/live")
async def websocket_network_monitoring(
    websocket: WebSocket,
    current_user: User = Depends(get_current_active_user)
):
    """WebSocket endpoint for real-time network monitoring"""
    await manager.connect(websocket, current_user.id)
    
    try:
        while True:
            # Wait for client messages (keep connection alive)
            data = await websocket.receive_text()
            
            # Parse client message
            try:
                message = json.loads(data)
                if message.get('type') == 'ping':
                    await manager.send_personal_message(
                        {'type': 'pong', 'timestamp': datetime.utcnow().isoformat()},
                        websocket
                    )
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from WebSocket client: {data}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, current_user.id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket, current_user.id)


async def monitor_network_traffic(
    session_id: str,
    monitoring_request: NetworkMonitoringRequest,
    user_id: int,
    pcap_service: PCAPService
):
    """Background task for network traffic monitoring"""
    try:
        logger.info(f"Starting network monitoring task: {session_id}")
        
        # Start packet capture
        async for packet_data in pcap_service.capture_live_traffic(
            interface=monitoring_request.interface,
            capture_filter=monitoring_request.capture_filter,
            duration_seconds=monitoring_request.duration_seconds,
            packet_limit=monitoring_request.packet_limit
        ):
            # Process packet data
            if monitoring_request.enable_analysis:
                # Perform real-time analysis
                analysis_result = await pcap_service.analyze_packet_realtime(packet_data)
                
                # Check for threats or anomalies
                if analysis_result.get('threat_detected') or analysis_result.get('anomaly_detected'):
                    # Broadcast alert to connected clients
                    alert_message = {
                        'type': 'alert',
                        'session_id': session_id,
                        'timestamp': datetime.utcnow().isoformat(),
                        'data': analysis_result
                    }
                    await manager.broadcast(alert_message)
            
            # Broadcast packet data to connected clients
            packet_message = {
                'type': 'packet',
                'session_id': session_id,
                'timestamp': datetime.utcnow().isoformat(),
                'data': packet_data
            }
            await manager.broadcast(packet_message)
            
            # Small delay to prevent overwhelming clients
            await asyncio.sleep(0.01)
        
        logger.info(f"Network monitoring task completed: {session_id}")
        
    except asyncio.CancelledError:
        logger.info(f"Network monitoring task cancelled: {session_id}")
    except Exception as e:
        logger.error(f"Error in network monitoring task {session_id}: {str(e)}")
        
        # Send error message to clients
        error_message = {
            'type': 'error',
            'session_id': session_id,
            'timestamp': datetime.utcnow().isoformat(),
            'message': f"Monitoring error: {str(e)}"
        }
        await manager.broadcast(error_message)
    
    finally:
        # Clean up task reference
        if session_id in manager.monitoring_tasks:
            del manager.monitoring_tasks[session_id]