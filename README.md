# OT/ICS Security Platform

## Overview

AI-Powered Cybersecurity Framework for Industrial Control Systems (ICS/OT) with real-time threat detection, PCAP analysis, and machine learning capabilities.

## Features

- **Real-time Network Monitoring**: Live traffic analysis and anomaly detection
- **PCAP Analysis**: Upload, analyze, and process network capture files
- **AI/ML Threat Detection**: Advanced machine learning models for threat identification
- **Industrial Protocol Support**: Modbus, DNP3, and other ICS protocols
- **Authentication & Authorization**: JWT-based security with role management
- **Monitoring & Alerting**: Prometheus metrics and Grafana dashboards
- **RESTful API**: Comprehensive API for all platform features
- **Modern Web Interface**: React-based dashboard with real-time updates

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│ (PostgreSQL)    │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │     Redis       │    │   Prometheus    │    │    Grafana      │
         │   (Cache)       │    │  (Metrics)      │    │ (Monitoring)    │
         │   Port: 6379    │    │   Port: 9090    │    │   Port: 3001    │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Repository Structure

```
├── backend/           # FastAPI backend application
├── config/            # Configuration files (.env.example, nginx.conf, prometheus.yml)
├── deployments/       # Deployment configurations for different environments
├── docs/              # Documentation files
├── frontend/          # React frontend application
├── grafana/           # Grafana dashboards and configurations
├── production/        # Production-specific Dockerfiles and configurations
├── scripts/           # Installation and utility scripts
└── docker-compose.yml # Main Docker Compose configuration
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- 8GB+ RAM recommended
- 20GB+ disk space

## Platform-Specific Deployments

Choose your deployment method based on your operating system:

### 🪟 Windows Deployment

For Windows 10/11 users with one-click installation:

1. **Navigate to Windows deployment folder**:
   ```cmd
   cd deployments\windows
   ```

2. **Run the installer as Administrator**:
   - Right-click on `install.bat`
   - Select "Run as administrator"
   - Follow the prompts

3. **Access the platform**:
   - Main Application: http://localhost:3000
   - API Documentation: http://localhost:8000/docs
   - Grafana Monitoring: http://localhost:3001

**Requirements**: Windows 10/11, Docker Desktop, 8GB+ RAM

For detailed instructions, see: [`deployments/windows/README.md`](deployments/windows/README.md)

### 🐧 Linux Debian Deployment

For Linux Debian/Ubuntu users with automated installation:

1. **Navigate to Linux deployment folder**:
   ```bash
   cd deployments/linux
   ```

2. **Make installer executable and run**:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Access the platform**:
   - Main Application: http://localhost:3000
   - API Documentation: http://localhost:8000/docs
   - Grafana Monitoring: http://localhost:3001

**Requirements**: Debian 10+/Ubuntu 18.04+, Docker, 4GB+ RAM

For detailed instructions, see: [`deployments/linux/README.md`](deployments/linux/README.md)

### 🐳 Docker Compose (Universal)

For manual deployment on any platform:

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd ics-cybersecurity-platform-production
   ```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```env
# Application
APP_NAME="ICS Cybersecurity Platform"
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000

# Security
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql://ics_user:secure_password@postgres:5432/ics_cybersecurity
POSTGRES_USER=ics_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=ics_cybersecurity

# Redis
REDIS_URL=redis://redis:6379/0
```

### 3. Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 4. Access Applications

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Grafana Monitoring**: http://localhost:3001 (admin/admin)
- **Prometheus Metrics**: http://localhost:9090

## Development Setup

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Device Management

- `GET /api/v1/devices` - List all devices
- `POST /api/v1/devices` - Create new device
- `GET /api/v1/devices/{id}` - Get device details
- `PUT /api/v1/devices/{id}` - Update device
- `DELETE /api/v1/devices/{id}` - Delete device

### Threat Detection

- `GET /api/v1/threats` - List threat alerts
- `POST /api/v1/threats/analyze` - Analyze network traffic
- `GET /api/v1/threats/statistics` - Threat statistics

### PCAP Analysis

- `POST /api/v1/pcap/upload` - Upload PCAP file
- `GET /api/v1/pcap` - List PCAP files
- `GET /api/v1/pcap/{id}/analyze` - Analyze PCAP file
- `GET /api/v1/pcap/{id}/download` - Download PCAP file

### Network Monitoring

- `GET /api/v1/network/statistics` - Network statistics
- `GET /api/v1/network/devices` - Discover network devices
- `WebSocket /api/v1/network/monitor` - Real-time monitoring

## Security Configuration

### SSL/TLS Setup

1. **Generate SSL Certificates**:

```bash
# Self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/certificate.crt -days 365 -nodes

# Let's Encrypt (production)
certbot certonly --standalone -d your-domain.com
```

2. **Update Docker Compose**:

```yaml
nginx:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
  ports:
    - "443:443"
```

### Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Frontend (if direct access needed)
sudo ufw enable
```

## Monitoring and Logging

### Prometheus Metrics

- Application metrics: `/metrics`
- Custom business metrics
- System resource monitoring

### Grafana Dashboards

- **System Overview**: CPU, Memory, Disk usage
- **Application Metrics**: Request rates, response times
- **Security Metrics**: Threat detection rates, alerts
- **Network Analysis**: Traffic patterns, anomalies

### Log Management

```bash
# View application logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs -f postgres

# Export logs
docker-compose logs --no-color > application.log
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U ics_user ics_cybersecurity > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U ics_user ics_cybersecurity < backup.sql
```

### Automated Backups

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check PostgreSQL container status
   - Verify database credentials in `.env`
   - Ensure database is initialized

2. **Authentication Errors**:
   - Verify JWT secret keys
   - Check token expiration settings
   - Ensure proper CORS configuration

3. **PCAP Upload Issues**:
   - Check file size limits
   - Verify upload directory permissions
   - Ensure sufficient disk space

4. **Performance Issues**:
   - Monitor resource usage with `docker stats`
   - Check database query performance
   - Review application logs for bottlenecks

### Health Checks

```bash
# Check service health
curl http://localhost:8000/health

# Detailed health check
curl http://localhost:8000/health/detailed

# Check all services
docker-compose ps
```

## Production Deployment

### System Requirements

- **CPU**: 4+ cores
- **RAM**: 16GB+ recommended
- **Storage**: 100GB+ SSD
- **Network**: 1Gbps+ for high-traffic environments

### Security Hardening

1. **Change Default Passwords**
2. **Enable SSL/TLS**
3. **Configure Firewall**
4. **Regular Security Updates**
5. **Monitor Access Logs**
6. **Implement Rate Limiting**

### Performance Optimization

1. **Database Tuning**:
   - Optimize PostgreSQL configuration
   - Add appropriate indexes
   - Regular VACUUM and ANALYZE

2. **Application Scaling**:
   - Use multiple worker processes
   - Implement connection pooling
   - Add Redis caching

3. **Network Optimization**:
   - Use CDN for static assets
   - Enable gzip compression
   - Optimize API response sizes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

## Changelog

### v1.0.0
- Initial production release
- Complete backend API implementation
- Authentication and authorization system
- PCAP analysis capabilities
- ML-based threat detection
- Real-time monitoring dashboard
- Docker containerization
- Monitoring and logging integration