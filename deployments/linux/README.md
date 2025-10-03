# ICS Cybersecurity Platform - Linux Debian Deployment

This deployment package provides a complete setup for running the ICS Cybersecurity Platform on Linux Debian systems with browser-based access.

## Prerequisites

### System Requirements
- **Operating System**: Debian 10+ or Ubuntu 18.04+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **CPU**: 2+ cores recommended
- **Network**: Internet connection for initial setup

### Required Software
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For cloning repositories (optional)

## One-Click Installation

### Quick Start
1. Make the installer executable:
   ```bash
   chmod +x install.sh
   ```

2. Run the installer:
   ```bash
   ./install.sh
   ```

3. Follow the prompts and wait for installation to complete

4. The application will automatically open in your default browser

### What the Installer Does
- Checks and installs Docker if needed
- Creates necessary directories and sets permissions
- Configures environment variables
- Downloads and starts all services
- Opens the application in your browser

## Manual Installation

If you prefer manual installation or need to customize the setup:

### Step 1: Install Docker
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 2: Prepare Environment
```bash
# Create directories
mkdir -p data/pcap data/models logs grafana/dashboards grafana/datasources

# Set permissions
chmod 755 data logs grafana
chmod 755 data/pcap data/models grafana/dashboards grafana/datasources
```

### Step 3: Configure Environment
Edit the `.env` file to customize settings:
```bash
nano .env
```

### Step 4: Start Services
```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Access URLs

Once the platform is running, access these URLs in your browser:

- **Main Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc
- **Grafana Monitoring**: http://localhost:3001
- **Prometheus Metrics**: http://localhost:9090

## Default Credentials

- **Grafana Dashboard**: 
  - Username: `admin`
  - Password: `admin123`

## Platform Management

### Start Platform
```bash
docker compose up -d
```

### Stop Platform
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Update Platform
```bash
# Pull latest images
docker compose pull

# Restart with new images
docker compose up -d --force-recreate
```

### Restart Services
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
```

### Check Service Status
```bash
docker compose ps
```

## Data Storage

### Persistent Data Locations
- **Database**: Docker volume `postgres_data`
- **Redis Cache**: Docker volume `redis_data`
- **PCAP Files**: `./data/pcap/`
- **ML Models**: `./data/models/`
- **Application Logs**: `./logs/`
- **Grafana Data**: Docker volume `grafana_data`
- **Prometheus Data**: Docker volume `prometheus_data`

### Backup Data
```bash
# Backup database
docker compose exec postgres pg_dump -U ics_user ics_security > backup.sql

# Backup application data
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/
```

## Troubleshooting

### Common Issues

#### Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, then test
docker run hello-world
```

#### Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000

# Stop conflicting service or change port in .env file
```

#### Services Not Starting
```bash
# Check logs for errors
docker compose logs

# Check system resources
free -h
df -h
```

#### Database Connection Issues
```bash
# Reset database
docker compose down
docker volume rm linux_postgres_data
docker compose up -d
```

### Performance Optimization

#### For Low-Memory Systems
Edit `.env` file:
```bash
REDIS_MAXMEMORY=256mb
POSTGRES_MAX_CONNECTIONS=50
```

#### For High-Traffic Environments
```bash
REDIS_MAXMEMORY=1gb
POSTGRES_MAX_CONNECTIONS=200
```

## Security Notes

### Production Deployment
1. **Change Default Passwords**: Update all passwords in `.env` file
2. **Enable HTTPS**: Configure reverse proxy with SSL certificates
3. **Firewall Configuration**: Restrict access to necessary ports only
4. **Regular Updates**: Keep Docker images and system packages updated
5. **Backup Strategy**: Implement regular automated backups

### Network Security
- All services run in isolated Docker network
- Database and Redis are not exposed externally
- API endpoints include authentication and rate limiting

## Uninstallation

### Complete Removal
```bash
# Stop and remove containers
docker compose down -v

# Remove images
docker compose down --rmi all

# Remove data (WARNING: This deletes all data)
sudo rm -rf data/ logs/

# Remove Docker volumes
docker volume prune -f
```

### Keep Data, Remove Containers
```bash
# Stop containers but keep data
docker compose down

# Remove only containers and images
docker compose down --rmi all
```

## Support

For issues and support:
1. Check the logs: `docker compose logs -f`
2. Verify system requirements are met
3. Ensure all ports are available
4. Check Docker and Docker Compose versions

## License

This project is licensed under the MIT License. See the LICENSE file for details.