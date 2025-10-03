@echo off
REM ICS Cybersecurity Platform - Windows One-Click Installer
REM This script installs and starts the ICS Cybersecurity Platform on Windows

echo ========================================
echo ICS Cybersecurity Platform Installer
echo Windows Deployment
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo ERROR: This script requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Check if Docker Desktop is installed
echo Checking Docker Desktop installation...
docker --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Docker Desktop is not installed or not running.
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo After installation, make sure Docker Desktop is running.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
echo Checking Docker Compose...
docker compose version >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Docker Compose is not available.
    echo Please ensure Docker Desktop is properly installed and running.
    pause
    exit /b 1
)

echo Docker Desktop detected and running.
echo.

REM Create necessary directories
echo Creating data directories...
if not exist "data" mkdir data
if not exist "data\pcap" mkdir data\pcap
if not exist "data\models" mkdir data\models
if not exist "logs" mkdir logs
if not exist "grafana" mkdir grafana
if not exist "grafana\dashboards" mkdir grafana\dashboards
if not exist "grafana\datasources" mkdir grafana\datasources

REM Copy configuration files
echo Setting up configuration files...
if not exist "prometheus.yml" (
    copy "..\..\prometheus.yml" "prometheus.yml" >nul 2>&1
)

if not exist "grafana\datasources\prometheus.yml" (
    copy "..\..\grafana\datasources\prometheus.yml" "grafana\datasources\prometheus.yml" >nul 2>&1
)

REM Set proper permissions for data directories
echo Setting directory permissions...
icacls "data" /grant Everyone:(OI)(CI)F /T >nul 2>&1
icacls "logs" /grant Everyone:(OI)(CI)F /T >nul 2>&1

REM Stop any existing containers
echo Stopping any existing ICS containers...
docker compose down >nul 2>&1

REM Pull latest images
echo Pulling Docker images (this may take a few minutes)...
docker compose pull

REM Build and start services
echo Building and starting ICS Cybersecurity Platform...
docker compose up -d --build

REM Wait for services to start
echo Waiting for services to initialize...
timeout /t 30 /nobreak >nul

REM Check service health
echo Checking service health...
docker compose ps

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo The ICS Cybersecurity Platform is now running.
echo.
echo Access URLs:
echo - Main Application: http://localhost:3000
echo - API Documentation: http://localhost:8000/docs
echo - Grafana Monitoring: http://localhost:3001
echo - Prometheus Metrics: http://localhost:9090
echo.
echo Default Credentials:
echo - Grafana: admin / admin123
echo.
echo To stop the platform, run: docker compose down
echo To view logs, run: docker compose logs -f
echo.
echo Opening main application in your default browser...
start http://localhost:3000

echo.
echo Press any key to exit...
pause >nul