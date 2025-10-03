# ICS/OT Cybersecurity Platform - Deployment Guide

## Quick Start Deployment Options

### Option 1: Docker Compose (Recommended for Development/Testing)

```bash
# Clone or extract the project
cd ics-cybersecurity-complete

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Grafana: http://localhost:3001 (admin/admin_change_me)
# Kibana: http://localhost:5601
```

### Option 2: Automated Installation Scripts

#### Windows (Run as Administrator)
```cmd
cd installation-scripts\windows
install.bat
```

#### Linux (Run as root/sudo)
```bash
cd installation-scripts/linux
sudo ./install.sh
```

### Option 3: Manual Installation

#### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 12+
- Redis 6+
- Nginx (for production)

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start backend
python src/main.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run build

# For development
npm run dev

# For production
npm run preview
```

## Production Deployment

### 1. System Requirements

#### Minimum Production Requirements
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 200GB SSD
- **OS**: Ubuntu 20.04 LTS or CentOS 8+
- **Network**: Dedicated network interface for OT scanning

#### Recommended Production Requirements
- **CPU**: 16+ cores with AVX2 support
- **RAM**: 32GB+
- **Storage**: 500GB NVMe SSD
- **GPU**: NVIDIA GPU with CUDA (for ML acceleration)
- **Network**: Multiple network interfaces for network segmentation

### 2. Security Hardening

#### System Security
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Configure SSH
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

#### Application Security
```bash
# Generate secure keys
openssl rand -hex 32  # For SECRET_KEY
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For ENCRYPTION_KEY

# Set secure file permissions
chmod 600 backend/.env
chmod 600 frontend/.env
chown -R app:app /opt/ics-cybersecurity
```

### 3. SSL/TLS Configuration

#### Generate SSL Certificate
```bash
# Self-signed certificate (for testing)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/ics-cybersecurity.key \
    -out /etc/ssl/certs/ics-cybersecurity.crt

# Let's Encrypt (for production)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Update Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/ics-cybersecurity.crt;
    ssl_certificate_key /etc/ssl/private/ics-cybersecurity.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Your location blocks here...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. Database Configuration

#### PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE cybersecurity;
CREATE USER ics_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cybersecurity TO ics_user;
\q

# Configure PostgreSQL
sudo nano /etc/postgresql/12/main/postgresql.conf
# Uncomment and set:
# listen_addresses = 'localhost'
# max_connections = 200
# shared_buffers = 256MB
# effective_cache_size = 1GB

sudo systemctl restart postgresql
```

#### Redis Configuration
```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set:
# bind 127.0.0.1
# requirepass your_redis_password
# maxmemory 512mb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis
```

### 5. Monitoring and Logging

#### Log Configuration
```bash
# Create log directories
sudo mkdir -p /var/log/ics-cybersecurity
sudo chown app:app /var/log/ics-cybersecurity

# Configure logrotate
sudo nano /etc/logrotate.d/ics-cybersecurity
```

```
/var/log/ics-cybersecurity/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        systemctl reload ics-cybersecurity-backend
    endscript
}
```

#### Monitoring Setup
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Configure system monitoring
sudo nano /etc/systemd/system/ics-monitoring.service
```

### 6. Backup and Recovery

#### Database Backup
```bash
#!/bin/bash
# backup-db.sh
BACKUP_DIR="/opt/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U ics_user cybersecurity > $BACKUP_DIR/cybersecurity_$DATE.sql
gzip $BACKUP_DIR/cybersecurity_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

#### Application Backup
```bash
#!/bin/bash
# backup-app.sh
BACKUP_DIR="/opt/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/ics-cybersecurity_$DATE.tar.gz \
    /opt/ics-cybersecurity/config \
    /opt/ics-cybersecurity/models \
    /opt/ics-cybersecurity/data

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

#### Automated Backups
```bash
# Add to crontab
sudo crontab -e

# Daily database backup at 2 AM
0 2 * * * /opt/scripts/backup-db.sh

# Weekly application backup on Sunday at 3 AM
0 3 * * 0 /opt/scripts/backup-app.sh
```

### 7. Performance Optimization

#### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_devices_ip ON devices(ip_address);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_threats_timestamp ON threats(created_at);
CREATE INDEX idx_threats_severity ON threats(severity);
CREATE INDEX idx_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_events_type ON security_events(event_type);

-- Analyze tables
ANALYZE devices;
ANALYZE threats;
ANALYZE security_events;
```

#### Application Optimization
```bash
# Backend optimization
export PYTHONOPTIMIZE=1
export PYTHONUNBUFFERED=1

# Frontend optimization
# Already optimized in build process

# System optimization
echo 'vm.swappiness=10' >> /etc/sysctl.conf
echo 'net.core.rmem_max=16777216' >> /etc/sysctl.conf
echo 'net.core.wmem_max=16777216' >> /etc/sysctl.conf
sysctl -p
```

### 8. High Availability Setup

#### Load Balancer Configuration
```nginx
upstream backend_servers {
    server 192.168.1.10:8000 weight=3;
    server 192.168.1.11:8000 weight=3;
    server 192.168.1.12:8000 weight=2 backup;
}

upstream frontend_servers {
    server 192.168.1.10:3000;
    server 192.168.1.11:3000;
    server 192.168.1.12:3000 backup;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://frontend_servers;
        # proxy configuration...
    }
    
    location /api/ {
        proxy_pass http://backend_servers;
        # proxy configuration...
    }
}
```

#### Database Replication
```bash
# Master-slave PostgreSQL setup
# Configure master server
sudo nano /etc/postgresql/12/main/postgresql.conf
# Set:
# wal_level = replica
# max_wal_senders = 3
# wal_keep_segments = 64

# Configure slave server
sudo nano /etc/postgresql/12/main/recovery.conf
# Set:
# standby_mode = 'on'
# primary_conninfo = 'host=master_ip port=5432 user=replicator'
```

### 9. Disaster Recovery

#### Recovery Procedures
```bash
# Database recovery
gunzip -c /opt/backups/database/cybersecurity_20231201_020000.sql.gz | \
    psql -h localhost -U ics_user cybersecurity

# Application recovery
tar -xzf /opt/backups/application/ics-cybersecurity_20231201_030000.tar.gz -C /

# Service restart
systemctl restart ics-cybersecurity-backend
systemctl restart ics-cybersecurity-frontend
```

### 10. Maintenance Procedures

#### Regular Maintenance Tasks
```bash
#!/bin/bash
# maintenance.sh

# Update threat intelligence
curl -X POST http://localhost:8000/api/threats/update

# Retrain AI models
curl -X POST http://localhost:8000/api/ai-models/retrain

# Clean old logs
find /var/log/ics-cybersecurity -name "*.log" -mtime +30 -delete

# Update system packages
apt update && apt list --upgradable

# Check disk space
df -h

# Check memory usage
free -h

# Check service status
systemctl status ics-cybersecurity-backend
systemctl status ics-cybersecurity-frontend
```

#### Scheduled Maintenance
```bash
# Add to crontab
# Weekly maintenance on Sunday at 4 AM
0 4 * * 0 /opt/scripts/maintenance.sh

# Daily threat intelligence update at 6 AM
0 6 * * * curl -X POST http://localhost:8000/api/threats/update

# Hourly model retraining during business hours
0 9-17 * * 1-5 curl -X POST http://localhost:8000/api/ai-models/retrain
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
journalctl -u ics-cybersecurity-backend -f
journalctl -u ics-cybersecurity-frontend -f

# Check configuration
nginx -t
systemctl status postgresql
systemctl status redis

# Check ports
netstat -tlnp | grep :8000
netstat -tlnp | grep :3000
```

#### Performance Issues
```bash
# Check system resources
htop
iotop
nethogs

# Check database performance
sudo -u postgres psql cybersecurity -c "SELECT * FROM pg_stat_activity;"

# Check application metrics
curl http://localhost:8000/metrics
```

#### Network Issues
```bash
# Check network connectivity
ping 8.8.8.8
nslookup google.com

# Check firewall rules
ufw status verbose
iptables -L

# Check network scanning
nmap -sn 192.168.1.0/24
```

### Support Contacts

For technical support and assistance:
- Documentation: README.md
- Log files: /var/log/ics-cybersecurity/
- Configuration: /opt/ics-cybersecurity/config/

---

**Note**: This deployment guide covers production-ready deployment scenarios. Always test thoroughly in a staging environment before deploying to production.

