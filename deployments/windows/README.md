# ICS Cybersecurity Platform - Windows Deployment

This folder contains the Windows-specific deployment configuration for the ICS Cybersecurity Platform. The platform runs entirely in Docker containers and is accessible through your web browser.

## Prerequisites

### System Requirements
- Windows 10/11 (64-bit)
- Minimum 8GB RAM (16GB recommended)
- 20GB free disk space
- Internet connection for initial setup

### Required Software
1. **Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Ensure WSL 2 backend is enabled
   - Make sure Docker Desktop is running before installation

## One-Click Installation

### Quick Start
1. **Right-click** on `install.bat`
2. Select **"Run as administrator"**
3. Follow the on-screen instructions
4. Wait for installation to complete
5. Access the platform at http://localhost:3000

### What the Installer Does
- Checks for Docker Desktop installation
- Creates necessary data directories
- Sets up configuration files
- Downloads and builds Docker images
- Starts all platform services
- Opens the application in your browser

## Manual Installation (Alternative)

If you prefer manual installation:

```powershell
# 1. Open PowerShell as Administrator
# 2. Navigate to this directory
cd "path\to\deployments\windows"

# 3. Create data directories
mkdir data\pcap, data\models, logs -Force

# 4. Start the platform
docker compose up -d --build

# 5. Check status
docker compose ps
```

## Access URLs

Once installed, access these services in your browser:

| Service | URL | Description |
|---------|-----|-------------|
| **Main Application** | http://localhost:3000 | Primary web interface |
| **API Documentation** | http://localhost:8000/docs | Interactive API docs |
| **Grafana Monitoring** | http://localhost:3001 | System monitoring dashboards |
| **Prometheus Metrics** | http://localhost:9090 | Metrics collection |

## Default Credentials

- **Grafana**: `admin` / `admin123`
- **Application**: Create account on first access

## Managing the Platform

### Start Services
```powershell
docker compose up -d
```

### Stop Services
```powershell
docker compose down
```

### View Logs
```powershell
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
```

### Update Platform
```powershell
# Stop services
docker compose down

# Pull updates
docker compose pull

# Rebuild and start
docker compose up -d --build
```

## Data Storage

All platform data is stored in the following directories:

- `data/pcap/` - PCAP analysis files
- `data/models/` - ML model files
- `logs/` - Application logs
- Docker volumes for database and cache

## Troubleshooting

### Common Issues

**Docker Desktop not running**
- Start Docker Desktop from the Start menu
- Wait for the Docker icon in system tray to show "Docker Desktop is running"

**Port conflicts**
- Ensure ports 3000, 8000, 3001, 9090, 5432, 6379 are not in use
- Check with: `netstat -an | findstr :3000`

**Permission errors**
- Run PowerShell or Command Prompt as Administrator
- Ensure Docker Desktop has proper permissions

**Services not starting**
```powershell
# Check service status
docker compose ps

# View detailed logs
docker compose logs backend

# Restart specific service
docker compose restart backend
```

### Getting Help

1. Check the logs: `docker compose logs -f`
2. Verify Docker Desktop is running
3. Ensure all required ports are available
4. Try restarting Docker Desktop
5. Refer to the main documentation

## Security Notes

- Change default passwords in `.env` file for production use
- The platform is configured for local development by default
- For production deployment, update security settings
- Firewall rules may need adjustment for network access

## Uninstallation

To completely remove the platform:

```powershell
# Stop and remove containers
docker compose down -v

# Remove images (optional)
docker image prune -a

# Remove data directories
rmdir /s data logs grafana
```