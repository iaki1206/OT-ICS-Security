import asyncio
import os
import subprocess
import shutil
from datetime import datetime, timedelta
from typing import List, Dict, Optional, AsyncGenerator, Tuple
from pathlib import Path
import json
import glob
import threading
from collections import deque

from scapy.all import (
    sniff, wrpcap, rdpcap, IP, TCP, UDP, ICMP, ARP,
    get_if_list, get_if_addr, Ether
)
import pyshark
import pandas as pd
import numpy as np
from loguru import logger

from core.config import settings
from database.models import PCAPFile, NetworkPacket, ThreatAlert
from services.ml_service import MLService

class PCAPService:
    """Enhanced PCAP service with Wireshark integration and rolling file management"""
    
    def __init__(self):
        self.capture_active = False
        self.capture_process = None
        self.wireshark_process = None
        self.ml_service = None
        self.packet_buffer = []
        self.current_file_path = None
        self.packet_count = 0
        self.file_rotation_timer = None
        self.file_list = deque(maxlen=15)  # Keep track of recent 15 files
        self.prioritized_files = set()  # Files flagged for training
        self.activity_log = []
        
        # Configuration
        self.max_file_size = getattr(settings, 'MAX_PCAP_FILE_SIZE', 50 * 1024 * 1024)  # 50MB default
        self.rotation_time = getattr(settings, 'PCAP_ROTATION_TIME', 3600)  # 1 hour default
        self.max_files_to_keep = 15
        
        # Ensure PCAP directory exists
        Path(settings.PCAP_STORAGE_DIR).mkdir(parents=True, exist_ok=True)
        
    async def initialize(self, ml_service: MLService):
        """Initialize PCAP service with ML service"""
        self.ml_service = ml_service
        logger.info("PCAP Service initialized")
        
    async def start_capture_service(self, use_wireshark: bool = True):
        """Start the packet capture service with Wireshark integration"""
        if self.capture_active:
            logger.warning("Capture service already active")
            return
            
        self.capture_active = True
        logger.info(f"Starting packet capture on interface: {settings.CAPTURE_INTERFACE}")
        
        # Initialize file list from existing files
        await self._initialize_file_list()
        
        if use_wireshark and shutil.which('tshark'):
            # Use Wireshark's tshark for capture
            await self._start_wireshark_capture()
        else:
            # Fallback to Scapy capture
            asyncio.create_task(self._capture_loop())
            
        # Start file rotation timer
        self._start_rotation_timer()
        
        self._log_activity("capture_started", {"interface": settings.CAPTURE_INTERFACE, "method": "wireshark" if use_wireshark else "scapy"})
        
    async def stop_capture_service(self):
        """Stop the packet capture service"""
        self.capture_active = False
        
        # Stop Wireshark process
        if self.wireshark_process:
            try:
                self.wireshark_process.terminate()
                self.wireshark_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.wireshark_process.kill()
            self.wireshark_process = None
            
        # Stop Scapy capture process
        if self.capture_process:
            self.capture_process.terminate()
            
        # Stop rotation timer
        if self.file_rotation_timer:
            self.file_rotation_timer.cancel()
            
        logger.info("Packet capture service stopped")
        self._log_activity("capture_stopped", {})
        
    async def _capture_loop(self):
        """Main capture loop"""
        while self.capture_active:
            try:
                await self._capture_packets()
                await asyncio.sleep(1)  # Brief pause between captures
            except Exception as e:
                logger.error(f"Error in capture loop: {e}")
                await asyncio.sleep(5)  # Wait before retrying
                
    async def _capture_packets(self):
        """Capture packets and process them"""
        try:
            # Create new PCAP file if needed
            if not self.current_file_path or self.packet_count >= settings.MAX_PACKETS_PER_FILE:
                self.current_file_path = self._create_new_pcap_file()
                self.packet_count = 0
                
            # Capture packets
            packets = sniff(
                iface=settings.CAPTURE_INTERFACE,
                count=100,  # Capture in small batches
                timeout=settings.CAPTURE_TIMEOUT / 1000,
                store=True
            )
            
            if packets:
                # Save packets to file
                wrpcap(self.current_file_path, packets, append=True)
                self.packet_count += len(packets)
                
                # Process packets for analysis
                await self._process_packets(packets)
                
                logger.debug(f"Captured {len(packets)} packets")
                
        except Exception as e:
            logger.error(f"Error capturing packets: {e}")
            
    def _create_new_pcap_file(self) -> str:
        """Create a new PCAP file for storing captured packets"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"capture_{timestamp}.pcap"
        file_path = os.path.join(settings.PCAP_STORAGE_DIR, filename)
        
        # Ensure directory exists
        Path(settings.PCAP_STORAGE_DIR).mkdir(parents=True, exist_ok=True)
        
        # Add to file list and manage rotation
        self.file_list.append({
            'filename': filename,
            'path': file_path,
            'created': datetime.now(),
            'size': 0,
            'packet_count': 0,
            'prioritized': False
        })
        
        # Clean up old files if we exceed the limit
        await self._cleanup_old_files()
        
        logger.info(f"Created new PCAP file: {filename}")
        self._log_activity("file_created", {"filename": filename, "path": file_path})
        return file_path
        
    async def _process_packets(self, packets):
        """Process captured packets for threat detection"""
        try:
            # Extract features from packets
            features = self._extract_packet_features(packets)
            
            if features and self.ml_service:
                # Analyze with ML models
                predictions = await self.ml_service.analyze_network_traffic(features)
                
                # Check for threats
                await self._check_for_threats(packets, predictions)
                
        except Exception as e:
            logger.error(f"Error processing packets: {e}")
            
    def _extract_packet_features(self, packets) -> List[Dict]:
        """Extract features from network packets for ML analysis"""
        features = []
        
        for packet in packets:
            try:
                feature_dict = {
                    'timestamp': float(packet.time),
                    'length': len(packet),
                    'protocol': self._get_protocol(packet),
                    'src_ip': self._get_src_ip(packet),
                    'dst_ip': self._get_dst_ip(packet),
                    'src_port': self._get_src_port(packet),
                    'dst_port': self._get_dst_port(packet),
                    'flags': self._get_tcp_flags(packet),
                    'payload_size': self._get_payload_size(packet),
                    'is_fragmented': self._is_fragmented(packet),
                    'ttl': self._get_ttl(packet),
                    'window_size': self._get_window_size(packet)
                }
                
                # Add industrial protocol specific features
                feature_dict.update(self._extract_industrial_features(packet))
                
                features.append(feature_dict)
                
            except Exception as e:
                logger.debug(f"Error extracting features from packet: {e}")
                continue
                
        return features
        
    def _get_protocol(self, packet) -> str:
        """Get protocol type from packet"""
        if packet.haslayer(TCP):
            return 'TCP'
        elif packet.haslayer(UDP):
            return 'UDP'
        elif packet.haslayer(ICMP):
            return 'ICMP'
        elif packet.haslayer(ARP):
            return 'ARP'
        else:
            return 'OTHER'
            
    def _get_src_ip(self, packet) -> Optional[str]:
        """Get source IP address"""
        if packet.haslayer(IP):
            return packet[IP].src
        return None
        
    def _get_dst_ip(self, packet) -> Optional[str]:
        """Get destination IP address"""
        if packet.haslayer(IP):
            return packet[IP].dst
        return None
        
    def _get_src_port(self, packet) -> Optional[int]:
        """Get source port"""
        if packet.haslayer(TCP):
            return packet[TCP].sport
        elif packet.haslayer(UDP):
            return packet[UDP].sport
        return None
        
    def _get_dst_port(self, packet) -> Optional[int]:
        """Get destination port"""
        if packet.haslayer(TCP):
            return packet[TCP].dport
        elif packet.haslayer(UDP):
            return packet[UDP].dport
        return None
        
    def _get_tcp_flags(self, packet) -> str:
        """Get TCP flags as string"""
        if packet.haslayer(TCP):
            flags = packet[TCP].flags
            return str(flags)
        return ''
        
    def _get_payload_size(self, packet) -> int:
        """Get payload size"""
        if packet.haslayer(TCP):
            return len(packet[TCP].payload)
        elif packet.haslayer(UDP):
            return len(packet[UDP].payload)
        return 0
        
    def _is_fragmented(self, packet) -> bool:
        """Check if packet is fragmented"""
        if packet.haslayer(IP):
            return bool(packet[IP].flags & 0x1) or packet[IP].frag > 0
        return False
        
    def _get_ttl(self, packet) -> Optional[int]:
        """Get TTL value"""
        if packet.haslayer(IP):
            return packet[IP].ttl
        return None
        
    def _get_window_size(self, packet) -> Optional[int]:
        """Get TCP window size"""
        if packet.haslayer(TCP):
            return packet[TCP].window
        return None
        
    def _extract_industrial_features(self, packet) -> Dict:
        """Extract industrial protocol specific features"""
        features = {
            'is_modbus': False,
            'is_s7': False,
            'is_dnp3': False,
            'industrial_function_code': None
        }
        
        # Check for Modbus (TCP port 502)
        if packet.haslayer(TCP) and (packet[TCP].dport == 502 or packet[TCP].sport == 502):
            features['is_modbus'] = True
            # Additional Modbus analysis could be added here
            
        # Check for Siemens S7 (TCP port 102)
        if packet.haslayer(TCP) and (packet[TCP].dport == 102 or packet[TCP].sport == 102):
            features['is_s7'] = True
            # Additional S7 analysis could be added here
            
        # Check for DNP3 (TCP port 20000)
        if packet.haslayer(TCP) and (packet[TCP].dport == 20000 or packet[TCP].sport == 20000):
            features['is_dnp3'] = True
            
        return features
        
    async def _check_for_threats(self, packets, predictions):
        """Check packets and predictions for potential threats"""
        for i, (packet, prediction) in enumerate(zip(packets, predictions)):
            try:
                threat_score = prediction.get('threat_score', 0.0)
                
                if threat_score > settings.THREAT_SCORE_THRESHOLD:
                    await self._create_threat_alert(packet, prediction, threat_score)
                    
            except Exception as e:
                logger.error(f"Error checking threat for packet {i}: {e}")
                
    async def _create_threat_alert(self, packet, prediction, threat_score):
        """Create a threat alert for suspicious packet"""
        try:
            alert_data = {
                'timestamp': datetime.fromtimestamp(float(packet.time)),
                'threat_type': prediction.get('threat_type', 'Unknown'),
                'severity': self._calculate_severity(threat_score),
                'source_ip': self._get_src_ip(packet),
                'destination_ip': self._get_dst_ip(packet),
                'protocol': self._get_protocol(packet),
                'threat_score': threat_score,
                'description': f"Suspicious network activity detected with score {threat_score:.3f}",
                'raw_packet': bytes(packet).hex()
            }
            
            logger.warning(f"Threat detected: {alert_data['threat_type']} from {alert_data['source_ip']}")
            
            # Here you would save to database
            # await self._save_threat_alert(alert_data)
            
        except Exception as e:
            logger.error(f"Error creating threat alert: {e}")
            
    def _calculate_severity(self, threat_score: float) -> str:
        """Calculate threat severity based on score"""
        if threat_score >= 0.9:
            return 'CRITICAL'
        elif threat_score >= 0.8:
            return 'HIGH'
        elif threat_score >= 0.7:
            return 'MEDIUM'
        else:
            return 'LOW'
            
    async def analyze_pcap_file(self, file_path: str) -> Dict:
        """Analyze an existing PCAP file"""
        try:
            logger.info(f"Analyzing PCAP file: {file_path}")
            
            # Read PCAP file
            packets = rdpcap(file_path)
            
            # Extract features
            features = self._extract_packet_features(packets)
            
            # Analyze with ML models
            if self.ml_service and features:
                predictions = await self.ml_service.analyze_network_traffic(features)
                
                # Generate analysis report
                report = self._generate_analysis_report(packets, features, predictions)
                
                return report
            else:
                return {'error': 'ML service not available or no features extracted'}
                
        except Exception as e:
            logger.error(f"Error analyzing PCAP file: {e}")
            return {'error': str(e)}
            
    def _generate_analysis_report(self, packets, features, predictions) -> Dict:
        """Generate comprehensive analysis report"""
        try:
            total_packets = len(packets)
            threat_count = sum(1 for p in predictions if p.get('threat_score', 0) > settings.THREAT_SCORE_THRESHOLD)
            
            # Protocol distribution
            protocols = {}
            for feature in features:
                protocol = feature.get('protocol', 'Unknown')
                protocols[protocol] = protocols.get(protocol, 0) + 1
                
            # IP address statistics
            src_ips = set(f.get('src_ip') for f in features if f.get('src_ip'))
            dst_ips = set(f.get('dst_ip') for f in features if f.get('dst_ip'))
            
            # Time range
            timestamps = [f.get('timestamp') for f in features if f.get('timestamp')]
            time_range = {
                'start': datetime.fromtimestamp(min(timestamps)).isoformat() if timestamps else None,
                'end': datetime.fromtimestamp(max(timestamps)).isoformat() if timestamps else None,
                'duration_seconds': max(timestamps) - min(timestamps) if len(timestamps) > 1 else 0
            }
            
            # Industrial protocol analysis
            industrial_stats = {
                'modbus_packets': sum(1 for f in features if f.get('is_modbus')),
                's7_packets': sum(1 for f in features if f.get('is_s7')),
                'dnp3_packets': sum(1 for f in features if f.get('is_dnp3'))
            }
            
            report = {
                'summary': {
                    'total_packets': total_packets,
                    'threats_detected': threat_count,
                    'threat_percentage': (threat_count / total_packets * 100) if total_packets > 0 else 0,
                    'unique_source_ips': len(src_ips),
                    'unique_destination_ips': len(dst_ips)
                },
                'time_analysis': time_range,
                'protocol_distribution': protocols,
                'industrial_protocols': industrial_stats,
                'threat_analysis': {
                    'high_risk_packets': threat_count,
                    'average_threat_score': np.mean([p.get('threat_score', 0) for p in predictions]),
                    'max_threat_score': max([p.get('threat_score', 0) for p in predictions], default=0)
                },
                'recommendations': self._generate_recommendations(protocols, industrial_stats, threat_count, total_packets)
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating analysis report: {e}")
            return {'error': 'Failed to generate report'}
            
    def _generate_recommendations(self, protocols, industrial_stats, threat_count, total_packets) -> List[str]:
        """Generate security recommendations based on analysis"""
        recommendations = []
        
        if threat_count > 0:
            threat_percentage = (threat_count / total_packets * 100) if total_packets > 0 else 0
            if threat_percentage > 10:
                recommendations.append("High threat activity detected. Immediate investigation recommended.")
            elif threat_percentage > 5:
                recommendations.append("Moderate threat activity detected. Monitor closely.")
            else:
                recommendations.append("Low-level threats detected. Regular monitoring sufficient.")
                
        if industrial_stats['modbus_packets'] > 0:
            recommendations.append("Modbus traffic detected. Ensure proper authentication and encryption.")
            
        if industrial_stats['s7_packets'] > 0:
            recommendations.append("Siemens S7 communication detected. Verify authorized access only.")
            
        if protocols.get('TCP', 0) > protocols.get('UDP', 0) * 2:
            recommendations.append("High TCP traffic ratio. Monitor for potential data exfiltration.")
            
        if not recommendations:
            recommendations.append("Network traffic appears normal. Continue regular monitoring.")
            
        return recommendations
        
    async def get_available_interfaces(self) -> List[str]:
        """Get list of available network interfaces"""
        try:
            interfaces = get_if_list()
            return interfaces
        except Exception as e:
            logger.error(f"Error getting network interfaces: {e}")
            return []
            
    async def get_capture_statistics(self) -> Dict:
        """Get current capture statistics"""
        return {
            'capture_active': self.capture_active,
            'current_file': os.path.basename(self.current_file_path) if self.current_file_path else None,
            'packets_in_current_file': self.packet_count,
            'capture_interface': settings.CAPTURE_INTERFACE,
            'storage_directory': settings.PCAP_STORAGE_DIR,
            'total_files': len(self.file_list),
            'prioritized_files': len(self.prioritized_files),
            'recent_files': [f['filename'] for f in list(self.file_list)[-15:]]
        }
        
    # New methods for enhanced PCAP management
    
    async def _start_wireshark_capture(self):
        """Start Wireshark tshark capture process"""
        try:
            # Create initial PCAP file
            self.current_file_path = self._create_new_pcap_file()
            
            # Build tshark command for continuous capture with rotation
            cmd = [
                'tshark',
                '-i', settings.CAPTURE_INTERFACE,
                '-w', self.current_file_path,
                '-b', f'filesize:{self.max_file_size // 1024}',  # Size in KB
                '-b', f'duration:{self.rotation_time}',  # Duration in seconds
                '-b', f'files:{self.max_files_to_keep}',  # Number of files to keep
                '-f', 'not arp and not stp',  # Basic filter to reduce noise
                '-q'  # Quiet mode
            ]
            
            # Start tshark process
            self.wireshark_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            logger.info(f"Started Wireshark capture with PID: {self.wireshark_process.pid}")
            
            # Monitor the process
            asyncio.create_task(self._monitor_wireshark_process())
            
        except Exception as e:
            logger.error(f"Failed to start Wireshark capture: {e}")
            # Fallback to Scapy
            asyncio.create_task(self._capture_loop())
            
    async def _monitor_wireshark_process(self):
        """Monitor Wireshark process and handle file rotation"""
        while self.capture_active and self.wireshark_process:
            try:
                # Check if process is still running
                if self.wireshark_process.poll() is not None:
                    logger.warning("Wireshark process terminated unexpectedly")
                    break
                    
                # Check for new files created by tshark rotation
                await self._check_for_new_files()
                
                # Update file statistics
                await self._update_file_statistics()
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"Error monitoring Wireshark process: {e}")
                await asyncio.sleep(10)
                
    async def _check_for_new_files(self):
        """Check for new PCAP files created by tshark rotation"""
        try:
            # Get all PCAP files in the directory
            pcap_pattern = os.path.join(settings.PCAP_STORAGE_DIR, "*.pcap*")
            current_files = set(glob.glob(pcap_pattern))
            
            # Find new files
            known_files = set(f['path'] for f in self.file_list)
            new_files = current_files - known_files
            
            for file_path in new_files:
                filename = os.path.basename(file_path)
                file_stat = os.stat(file_path)
                
                # Add to file list
                self.file_list.append({
                    'filename': filename,
                    'path': file_path,
                    'created': datetime.fromtimestamp(file_stat.st_ctime),
                    'size': file_stat.st_size,
                    'packet_count': 0,  # Will be updated later
                    'prioritized': False
                })
                
                logger.info(f"Detected new PCAP file: {filename}")
                self._log_activity("file_detected", {"filename": filename, "size": file_stat.st_size})
                
                # Process new file for ML if enabled
                if self.ml_service:
                    asyncio.create_task(self._process_new_file_for_ml(file_path))
                    
        except Exception as e:
            logger.error(f"Error checking for new files: {e}")
            
    async def _update_file_statistics(self):
        """Update statistics for files in the list"""
        for file_info in self.file_list:
            try:
                if os.path.exists(file_info['path']):
                    stat = os.stat(file_info['path'])
                    file_info['size'] = stat.st_size
                    
                    # Update packet count if not set
                    if file_info['packet_count'] == 0:
                        file_info['packet_count'] = await self._count_packets_in_file(file_info['path'])
                        
            except Exception as e:
                logger.debug(f"Error updating stats for {file_info['filename']}: {e}")
                
    async def _count_packets_in_file(self, file_path: str) -> int:
        """Count packets in a PCAP file"""
        try:
            packets = rdpcap(file_path)
            return len(packets)
        except Exception as e:
            logger.debug(f"Error counting packets in {file_path}: {e}")
            return 0
            
    async def _process_new_file_for_ml(self, file_path: str):
        """Process new PCAP file for ML analysis"""
        try:
            logger.info(f"Processing new file for ML: {os.path.basename(file_path)}")
            
            # Analyze the file
            analysis_result = await self.analyze_pcap_file(file_path)
            
            # Log the analysis
            self._log_activity("file_analyzed", {
                "filename": os.path.basename(file_path),
                "threats_detected": analysis_result.get('threat_analysis', {}).get('high_risk_packets', 0),
                "packets_analyzed": analysis_result.get('summary', {}).get('total_packets', 0)
            })
            
        except Exception as e:
            logger.error(f"Error processing file for ML: {e}")
            
    async def _initialize_file_list(self):
        """Initialize file list from existing PCAP files"""
        try:
            pcap_pattern = os.path.join(settings.PCAP_STORAGE_DIR, "*.pcap*")
            existing_files = glob.glob(pcap_pattern)
            
            # Sort by creation time and take the most recent 15
            file_stats = []
            for file_path in existing_files:
                try:
                    stat = os.stat(file_path)
                    file_stats.append((file_path, stat.st_ctime, stat.st_size))
                except OSError:
                    continue
                    
            # Sort by creation time (newest first) and take last 15
            file_stats.sort(key=lambda x: x[1], reverse=True)
            recent_files = file_stats[:15]
            
            # Add to file list
            for file_path, ctime, size in recent_files:
                filename = os.path.basename(file_path)
                self.file_list.append({
                    'filename': filename,
                    'path': file_path,
                    'created': datetime.fromtimestamp(ctime),
                    'size': size,
                    'packet_count': 0,  # Will be updated later
                    'prioritized': False
                })
                
            logger.info(f"Initialized with {len(self.file_list)} existing PCAP files")
            
        except Exception as e:
            logger.error(f"Error initializing file list: {e}")
            
    async def _cleanup_old_files(self):
        """Clean up old PCAP files beyond the retention limit"""
        try:
            # Get all PCAP files in directory
            pcap_pattern = os.path.join(settings.PCAP_STORAGE_DIR, "*.pcap*")
            all_files = glob.glob(pcap_pattern)
            
            if len(all_files) <= self.max_files_to_keep:
                return
                
            # Sort by creation time
            file_stats = []
            for file_path in all_files:
                try:
                    stat = os.stat(file_path)
                    file_stats.append((file_path, stat.st_ctime))
                except OSError:
                    continue
                    
            # Sort by creation time (oldest first)
            file_stats.sort(key=lambda x: x[1])
            
            # Remove oldest files
            files_to_remove = file_stats[:-self.max_files_to_keep]
            
            for file_path, _ in files_to_remove:
                try:
                    filename = os.path.basename(file_path)
                    
                    # Check if file is prioritized
                    if file_path in self.prioritized_files:
                        logger.info(f"Skipping deletion of prioritized file: {filename}")
                        continue
                        
                    # Archive or delete the file
                    await self._archive_or_delete_file(file_path)
                    
                    logger.info(f"Cleaned up old PCAP file: {filename}")
                    self._log_activity("file_cleaned", {"filename": filename})
                    
                except Exception as e:
                    logger.error(f"Error removing file {file_path}: {e}")
                    
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            
    async def _archive_or_delete_file(self, file_path: str):
        """Archive or delete a PCAP file"""
        # For now, just delete. In production, you might want to archive to cloud storage
        try:
            os.remove(file_path)
        except OSError as e:
            logger.error(f"Error deleting file {file_path}: {e}")
            
    def _start_rotation_timer(self):
        """Start timer for file rotation"""
        if self.file_rotation_timer:
            self.file_rotation_timer.cancel()
            
        self.file_rotation_timer = threading.Timer(
            self.rotation_time,
            self._rotate_file
        )
        self.file_rotation_timer.start()
        
    def _rotate_file(self):
        """Rotate to a new PCAP file"""
        if self.capture_active and not self.wireshark_process:  # Only for Scapy capture
            try:
                # Create new file
                old_file = self.current_file_path
                self.current_file_path = self._create_new_pcap_file()
                self.packet_count = 0
                
                logger.info(f"Rotated from {os.path.basename(old_file) if old_file else 'None'} to {os.path.basename(self.current_file_path)}")
                self._log_activity("file_rotated", {"old_file": old_file, "new_file": self.current_file_path})
                
                # Restart timer
                self._start_rotation_timer()
                
            except Exception as e:
                logger.error(f"Error during file rotation: {e}")
                
    def _log_activity(self, activity_type: str, details: Dict):
        """Log PCAP management activity"""
        activity = {
            'timestamp': datetime.now().isoformat(),
            'type': activity_type,
            'details': details
        }
        
        self.activity_log.append(activity)
        
        # Keep only last 1000 activities
        if len(self.activity_log) > 1000:
            self.activity_log = self.activity_log[-1000:]
            
        logger.debug(f"Activity logged: {activity_type} - {details}")
        
    # Public methods for PCAP management
    
    async def get_recent_files(self) -> List[Dict]:
        """Get list of recent PCAP files"""
        return list(self.file_list)
        
    async def flag_file_for_training(self, filename: str) -> bool:
        """Flag a file as prioritized for ML training"""
        try:
            for file_info in self.file_list:
                if file_info['filename'] == filename:
                    file_info['prioritized'] = True
                    self.prioritized_files.add(file_info['path'])
                    self._log_activity("file_prioritized", {"filename": filename})
                    logger.info(f"File flagged for training: {filename}")
                    return True
            return False
        except Exception as e:
            logger.error(f"Error flagging file for training: {e}")
            return False
            
    async def unflag_file_for_training(self, filename: str) -> bool:
        """Remove training priority flag from a file"""
        try:
            for file_info in self.file_list:
                if file_info['filename'] == filename:
                    file_info['prioritized'] = False
                    self.prioritized_files.discard(file_info['path'])
                    self._log_activity("file_unprioritized", {"filename": filename})
                    logger.info(f"Training flag removed from file: {filename}")
                    return True
            return False
        except Exception as e:
            logger.error(f"Error removing training flag: {e}")
            return False
            
    async def send_files_to_training(self, filenames: List[str] = None) -> Dict:
        """Send specified files or all prioritized files to ML training"""
        try:
            files_to_process = []
            
            if filenames:
                # Process specific files
                for filename in filenames:
                    for file_info in self.file_list:
                        if file_info['filename'] == filename:
                            files_to_process.append(file_info['path'])
                            break
            else:
                # Process all prioritized files
                files_to_process = list(self.prioritized_files)
                
            if not files_to_process:
                return {'status': 'error', 'message': 'No files to process'}
                
            # Process files for training
            results = []
            for file_path in files_to_process:
                try:
                    analysis = await self.analyze_pcap_file(file_path)
                    results.append({
                        'filename': os.path.basename(file_path),
                        'status': 'processed',
                        'analysis': analysis
                    })
                except Exception as e:
                    results.append({
                        'filename': os.path.basename(file_path),
                        'status': 'error',
                        'error': str(e)
                    })
                    
            self._log_activity("files_sent_to_training", {
                "files_count": len(files_to_process),
                "successful": len([r for r in results if r['status'] == 'processed'])
            })
            
            return {
                'status': 'completed',
                'processed_files': len(files_to_process),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error sending files to training: {e}")
            return {'status': 'error', 'message': str(e)}
            
    async def export_file(self, filename: str, export_path: str = None) -> str:
        """Export a PCAP file to specified location"""
        try:
            # Find the file
            source_path = None
            for file_info in self.file_list:
                if file_info['filename'] == filename:
                    source_path = file_info['path']
                    break
                    
            if not source_path or not os.path.exists(source_path):
                raise FileNotFoundError(f"File not found: {filename}")
                
            # Determine export path
            if not export_path:
                export_path = os.path.join(os.getcwd(), filename)
                
            # Copy file
            shutil.copy2(source_path, export_path)
            
            self._log_activity("file_exported", {
                "filename": filename,
                "export_path": export_path
            })
            
            logger.info(f"File exported: {filename} -> {export_path}")
            return export_path
            
        except Exception as e:
            logger.error(f"Error exporting file: {e}")
            raise
            
    async def upload_external_file(self, file_path: str, original_filename: str) -> bool:
        """Upload external PCAP file to the management system"""
        try:
            # Validate file
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Source file not found: {file_path}")
                
            # Generate new filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            new_filename = f"upload_{timestamp}_{original_filename}"
            destination_path = os.path.join(settings.PCAP_STORAGE_DIR, new_filename)
            
            # Copy file to PCAP directory
            shutil.copy2(file_path, destination_path)
            
            # Add to file list
            file_stat = os.stat(destination_path)
            self.file_list.append({
                'filename': new_filename,
                'path': destination_path,
                'created': datetime.now(),
                'size': file_stat.st_size,
                'packet_count': await self._count_packets_in_file(destination_path),
                'prioritized': False
            })
            
            # Clean up old files if needed
            await self._cleanup_old_files()
            
            self._log_activity("file_uploaded", {
                "original_filename": original_filename,
                "new_filename": new_filename,
                "size": file_stat.st_size
            })
            
            logger.info(f"External file uploaded: {original_filename} -> {new_filename}")
            
            # Process for ML if enabled
            if self.ml_service:
                asyncio.create_task(self._process_new_file_for_ml(destination_path))
                
            return True
            
        except Exception as e:
            logger.error(f"Error uploading external file: {e}")
            return False
            
    async def get_activity_log(self, limit: int = 100) -> List[Dict]:
        """Get recent activity log"""
        return self.activity_log[-limit:] if limit else self.activity_log
        
    async def get_file_details(self, filename: str) -> Optional[Dict]:
        """Get detailed information about a specific file"""
        for file_info in self.file_list:
            if file_info['filename'] == filename:
                # Add additional details
                details = file_info.copy()
                
                # Get file analysis if available
                try:
                    if os.path.exists(file_info['path']):
                        analysis = await self.analyze_pcap_file(file_info['path'])
                        details['analysis'] = analysis
                except Exception as e:
                    details['analysis_error'] = str(e)
                    
                return details
                
        return None