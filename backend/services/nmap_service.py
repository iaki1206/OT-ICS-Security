import asyncio
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

try:
    import nmap
except Exception:
    nmap = None

class NmapService:
    """Service wrapper around python-nmap for async usage and result normalization"""

    def __init__(self) -> None:
        if nmap is None:
            raise RuntimeError("python-nmap library is not available. Please install python-nmap.")
        self.scanner = nmap.PortScanner()

    async def scan_host(
        self,
        target_ip: str,
        ports: Optional[str] = None,
        arguments: str = "-sV -O -Pn"
    ) -> Dict[str, Any]:
        """Scan a single host and return normalized results"""
        start = time.time()
        result = await asyncio.get_running_loop().run_in_executor(
            None,
            lambda: self.scanner.scan(hosts=target_ip, ports=ports, arguments=arguments)
        )
        scanned_at = datetime.utcnow().isoformat()
        normalized = self._normalize_scan_result(result, scanned_at)
        normalized["duration"] = time.time() - start
        return normalized

    async def scan_subnet(
        self,
        subnet_cidr: str,
        arguments: str = "-sV -O -Pn"
    ) -> Dict[str, Any]:
        """Scan a subnet and return normalized results grouped by host"""
        start = time.time()
        result = await asyncio.get_running_loop().run_in_executor(
            None,
            lambda: self.scanner.scan(hosts=subnet_cidr, arguments=arguments)
        )
        scanned_at = datetime.utcnow().isoformat()
        hosts: List[Dict[str, Any]] = []
        for host in result.get("scan", {}):
            host_data = self._normalize_host(result["scan"].get(host, {}), host, scanned_at)
            hosts.append(host_data)

        return {
            "target": subnet_cidr,
            "hosts": hosts,
            "scanned_at": scanned_at,
            "duration": time.time() - start
        }

    def _normalize_scan_result(self, raw: Dict[str, Any], scanned_at: str) -> Dict[str, Any]:
        scan_dict = raw.get("scan", {})
        # If multiple hosts scanned, return list under hosts
        if len(scan_dict.keys()) > 1:
            hosts: List[Dict[str, Any]] = []
            for host_ip, host_data in scan_dict.items():
                hosts.append(self._normalize_host(host_data, host_ip, scanned_at))
            return {
                "hosts": hosts,
                "scanned_at": scanned_at
            }
        elif len(scan_dict.keys()) == 1:
            host_ip = next(iter(scan_dict.keys()))
            return self._normalize_host(scan_dict[host_ip], host_ip, scanned_at)
        else:
            return {
                "hosts": [],
                "scanned_at": scanned_at
            }

    def _normalize_host(self, host_data: Dict[str, Any], host_ip: str, scanned_at: str) -> Dict[str, Any]:
        # Hostnames
        hostnames = host_data.get("hostnames", [])
        hostname = None
        if hostnames and isinstance(hostnames, list):
            hostname = hostnames[0].get("name") or None

        # OS detection
        osmatch = host_data.get("osmatch", [])
        os_name = None
        os_accuracy = None
        if osmatch:
            best = osmatch[0]
            os_name = best.get("name")
            os_accuracy = best.get("accuracy")

        # Ports and services
        open_ports: List[int] = []
        services: List[Dict[str, Any]] = []
        for proto in ("tcp", "udp"):
            if proto in host_data:
                for port, pdata in host_data[proto].items():
                    if pdata.get("state") == "open":
                        open_ports.append(int(port))
                        services.append({
                            "port": int(port),
                            "protocol": proto,
                            "service": pdata.get("name"),
                            "product": pdata.get("product"),
                            "version": pdata.get("version"),
                            "extrainfo": pdata.get("extrainfo")
                        })

        return {
            "ip_address": host_ip,
            "hostname": hostname,
            "open_ports": sorted(open_ports),
            "services": services,
            "os": {
                "name": os_name,
                "accuracy": os_accuracy
            } if os_name else None,
            "scanned_at": scanned_at
        }

    async def health_check(self) -> bool:
        try:
            # Quick no-op call: check scanner is initialized
            return self.scanner is not None
        except Exception:
            return False

    async def cleanup(self) -> None:
        # No persistent resources to cleanup for python-nmap
        return None