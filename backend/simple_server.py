from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

app = FastAPI(title="ICS Cybersecurity Platform API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for testing
mock_files = [
    {"id": 1, "name": "capture_001.pcap", "size": 1024000, "created_at": "2024-01-15T10:30:00Z"},
    {"id": 2, "name": "capture_002.pcap", "size": 2048000, "created_at": "2024-01-15T11:45:00Z"},
    {"id": 3, "name": "capture_003.pcap", "size": 512000, "created_at": "2024-01-15T14:20:00Z"}
]

mock_stats = {
    "total_files": 3,
    "total_size": 3584000,
    "captures_today": 5,
    "threats_detected": 2
}

mock_capture_status = {
    "status": "idle",
    "interface": "eth0",
    "packets_captured": 0,
    "duration": 0
}

# PCAP endpoints
@app.get("/api/v1/pcap/")
async def get_pcap_files(limit: int = None):
    files = mock_files
    if limit:
        files = files[:limit]
    return {"files": files}

@app.get("/api/v1/pcap/stats")
async def get_pcap_stats():
    return mock_stats

@app.get("/api/v1/pcap/capture/status")
async def get_capture_status():
    return mock_capture_status

@app.post("/api/v1/pcap/capture/start")
async def start_capture(config: dict = None):
    return {"message": "Capture started", "status": "running"}

@app.post("/api/v1/pcap/capture/stop")
async def stop_capture():
    return {"message": "Capture stopped", "status": "idle"}

@app.post("/api/v1/pcap/training/start")
async def start_training(config: dict = None):
    return {"message": "Training started", "status": "running"}

@app.get("/api/v1/pcap/training/status")
async def get_training_status():
    return {"status": "idle", "progress": 0, "accuracy": 0.95}

@app.post("/api/v1/pcap/export")
async def export_files(config: dict = None):
    return {"message": "Export started", "download_url": "/api/v1/pcap/download/export.zip"}

@app.post("/api/v1/pcap/upload")
async def upload_file():
    return {"message": "File uploaded successfully", "file_id": 4}

@app.get("/api/v1/pcap/{file_id}")
async def get_file(file_id: int):
    return {"id": file_id, "name": f"file_{file_id}.pcap", "size": 1024000}

@app.get("/api/v1/pcap/{file_id}/download")
async def download_file(file_id: int):
    return {"message": "File download started", "file_id": file_id}

@app.delete("/api/v1/pcap/{file_id}")
async def delete_file(file_id: int):
    return {"message": "File deleted successfully", "file_id": file_id}

@app.post("/api/v1/pcap/{file_id}/analyze")
async def analyze_file(file_id: int, analysis_request: dict = None):
    return {"message": "Analysis started", "file_id": file_id, "analysis_id": "analysis_123"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)