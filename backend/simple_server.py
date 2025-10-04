from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

app = FastAPI(title="ICS Cybersecurity Platform API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Stubbed Network scan endpoints for development
@app.post("/api/v1/network/scan/host")
async def scan_host(payload: dict):
    target_ip = payload.get("target_ip")
    ports = payload.get("ports", [])
    args = payload.get("arguments", "")
    if not target_ip:
        raise HTTPException(status_code=400, detail="target_ip is required")
    scan_id = f"scan-{int(datetime.utcnow().timestamp() * 1000)}"
    # Initialize store if not present
    if not hasattr(app.state, "network_scans"):
        app.state.network_scans = {}
    result = {
        "scan_id": scan_id,
        "scan_type": "HOST",
        "target": target_ip,
        "status": "COMPLETED",
        "started_at": datetime.utcnow().isoformat() + "Z",
        "completed_at": datetime.utcnow().isoformat() + "Z",
        "open_ports": [
            {"port": 22, "protocol": "tcp", "service": "ssh"},
            {"port": 80, "protocol": "tcp", "service": "http"},
            {"port": 443, "protocol": "tcp", "service": "https"}
        ],
        "arguments": args,
        "ports": ports,
    }
    app.state.network_scans[scan_id] = result
    return result

@app.post("/api/v1/network/scan/subnet")
async def scan_subnet(payload: dict):
    subnet_cidr = payload.get("subnet_cidr")
    args = payload.get("arguments", "")
    if not subnet_cidr:
        raise HTTPException(status_code=400, detail="subnet_cidr is required")
    scan_id = f"scan-{int(datetime.utcnow().timestamp() * 1000)}"
    if not hasattr(app.state, "network_scans"):
        app.state.network_scans = {}
    result = {
        "scan_id": scan_id,
        "scan_type": "SUBNET",
        "target": subnet_cidr,
        "status": "COMPLETED",
        "started_at": datetime.utcnow().isoformat() + "Z",
        "completed_at": datetime.utcnow().isoformat() + "Z",
        "hosts": [
            {
                "ip": "192.168.1.10",
                "open_ports": [
                    {"port": 502, "protocol": "tcp", "service": "modbus"},
                    {"port": 80, "protocol": "tcp", "service": "http"}
                ]
            },
            {
                "ip": "192.168.1.20",
                "open_ports": [
                    {"port": 22, "protocol": "tcp", "service": "ssh"}
                ]
            }
        ],
        "arguments": args,
    }
    app.state.network_scans[scan_id] = result
    return result

@app.get("/api/v1/network/scans")
async def list_scans(status_filter: str = None, limit: int = 20):
    scans = list(getattr(app.state, "network_scans", {}).values())
    if status_filter:
        scans = [s for s in scans if s.get("status") == status_filter]
    return {"items": scans[:limit], "total": len(scans)}

@app.get("/api/v1/network/scans/{scan_id}")
async def get_scan(scan_id: str):
    scan = getattr(app.state, "network_scans", {}).get(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)