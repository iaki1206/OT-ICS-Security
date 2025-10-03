#!/bin/bash

# ICS/OT Cybersecurity Platform - Linux Installer
# Supports Ubuntu 20.04+, CentOS 8+, and other major distributions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/ics-cybersecurity"
SERVICE_USER="ics-cyber"
LOG_FILE="/tmp/ics-cybersecurity-install.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Detect Linux distribution
detect_distro() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        DISTRO=$ID
        VERSION=$VERSION_ID
    else
        error "Cannot detect Linux distribution"
    fi
    
    log "Detected distribution: $DISTRO $VERSION"
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check architecture
    ARCH=$(uname -m)
    if [[ "$ARCH" != "x86_64" ]]; then
        warning "This platform is optimized for x86_64 architecture. Current: $ARCH"
    fi
    
    # Check memory
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $MEMORY_GB -lt 8 ]]; then
        warning "Minimum 8GB RAM recommended. Current: ${MEMORY_GB}GB"
    fi
    
    # Check disk space
    DISK_SPACE_GB=$(df / | awk 'NR==2{print int($4/1024/1024)}')
    if [[ $DISK_SPACE_GB -lt 50 ]]; then
        error "Minimum 50GB free disk space required. Current: ${DISK_SPACE_GB}GB"
    fi
    
    log "System requirements check completed"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    case $DISTRO in
        ubuntu|debian)
            apt-get update
            apt-get install -y \
                curl \
                wget \
                git \
                build-essential \
                python3 \
                python3-pip \
                python3-venv \
                python3-dev \
                nodejs \
                npm \
                nginx \
                redis-server \
                postgresql \
                postgresql-contrib \
                nmap \
                net-tools \
                htop \
                supervisor \
                ufw \
                fail2ban \
                logrotate
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                dnf update -y
                dnf install -y \
                    curl \
                    wget \
                    git \
                    gcc \
                    gcc-c++ \
                    make \
                    python3 \
                    python3-pip \
                    python3-devel \
                    nodejs \
                    npm \
                    nginx \
                    redis \
                    postgresql \
                    postgresql-server \
                    nmap \
                    net-tools \
                    htop \
                    supervisor \
                    firewalld
            else
                yum update -y
                yum install -y \
                    curl \
                    wget \
                    git \
                    gcc \
                    gcc-c++ \
                    make \
                    python3 \
                    python3-pip \
                    python3-devel \
                    nodejs \
                    npm \
                    nginx \
                    redis \
                    postgresql \
                    postgresql-server \
                    nmap \
                    net-tools \
                    htop \
                    supervisor \
                    firewalld
            fi
            ;;
        *)
            error "Unsupported distribution: $DISTRO"
            ;;
    esac
    
    log "System dependencies installed"
}

# Create system user
create_user() {
    log "Creating system user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
        log "Created user: $SERVICE_USER"
    else
        log "User $SERVICE_USER already exists"
    fi
}

# Create directories
create_directories() {
    log "Creating application directories..."
    
    mkdir -p "$INSTALL_DIR"/{backend,frontend,data,logs,models,config}
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    chmod -R 755 "$INSTALL_DIR"
    
    log "Application directories created"
}

# Copy application files
copy_files() {
    log "Copying application files..."
    
    # Get script directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
    
    cp -r "$PROJECT_DIR/backend"/* "$INSTALL_DIR/backend/"
    cp -r "$PROJECT_DIR/frontend"/* "$INSTALL_DIR/frontend/"
    cp "$PROJECT_DIR/README.md" "$INSTALL_DIR/"
    cp "$PROJECT_DIR/docker-compose.yml" "$INSTALL_DIR/"
    
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    
    log "Application files copied"
}

# Setup Python environment
setup_python() {
    log "Setting up Python environment..."
    
    cd "$INSTALL_DIR/backend"
    
    # Create virtual environment
    sudo -u "$SERVICE_USER" python3 -m venv venv
    
    # Activate and install dependencies
    sudo -u "$SERVICE_USER" bash -c "
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
    "
    
    log "Python environment setup completed"
}

# Setup Node.js environment
setup_nodejs() {
    log "Setting up Node.js environment..."
    
    cd "$INSTALL_DIR/frontend"
    
    # Install dependencies and build
    sudo -u "$SERVICE_USER" npm install
    sudo -u "$SERVICE_USER" npm run build
    
    log "Node.js environment setup completed"
}

# Configure database
setup_database() {
    log "Setting up database..."
    
    case $DISTRO in
        ubuntu|debian)
            systemctl start postgresql
            systemctl enable postgresql
            ;;
        centos|rhel|fedora)
            if [[ ! -f /var/lib/pgsql/data/postgresql.conf ]]; then
                postgresql-setup initdb
            fi
            systemctl start postgresql
            systemctl enable postgresql
            ;;
    esac
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE cybersecurity;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER ics_user WITH PASSWORD 'secure_password_change_me';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cybersecurity TO ics_user;" 2>/dev/null || true
    
    log "Database setup completed"
}

# Configure Redis
setup_redis() {
    log "Setting up Redis..."
    
    systemctl start redis-server 2>/dev/null || systemctl start redis
    systemctl enable redis-server 2>/dev/null || systemctl enable redis
    
    log "Redis setup completed"
}

# Create systemd services
create_services() {
    log "Creating systemd services..."
    
    # Backend service
    cat > /etc/systemd/system/ics-cybersecurity-backend.service << EOF
[Unit]
Description=ICS/OT Cybersecurity Platform Backend
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/backend
Environment=PATH=$INSTALL_DIR/backend/venv/bin
ExecStart=$INSTALL_DIR/backend/venv/bin/python src/main.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ics-cybersecurity-backend

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service
    cat > /etc/systemd/system/ics-cybersecurity-frontend.service << EOF
[Unit]
Description=ICS/OT Cybersecurity Platform Frontend
After=network.target ics-cybersecurity-backend.service
Wants=ics-cybersecurity-backend.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/frontend
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ics-cybersecurity-frontend

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    
    log "Systemd services created"
}

# Configure Nginx
setup_nginx() {
    log "Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/ics-cybersecurity << 'EOF'
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
}
EOF

    # Enable site
    if [[ -d /etc/nginx/sites-enabled ]]; then
        ln -sf /etc/nginx/sites-available/ics-cybersecurity /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
    else
        # CentOS/RHEL style
        cp /etc/nginx/sites-available/ics-cybersecurity /etc/nginx/conf.d/ics-cybersecurity.conf
    fi
    
    # Test configuration
    nginx -t
    
    systemctl restart nginx
    systemctl enable nginx
    
    log "Nginx configuration completed"
}

# Configure firewall
setup_firewall() {
    log "Configuring firewall..."
    
    case $DISTRO in
        ubuntu|debian)
            ufw --force enable
            ufw allow ssh
            ufw allow 80/tcp
            ufw allow 443/tcp
            ufw allow 8000/tcp
            ufw allow 3000/tcp
            ;;
        centos|rhel|fedora)
            systemctl start firewalld
            systemctl enable firewalld
            firewall-cmd --permanent --add-service=ssh
            firewall-cmd --permanent --add-service=http
            firewall-cmd --permanent --add-service=https
            firewall-cmd --permanent --add-port=8000/tcp
            firewall-cmd --permanent --add-port=3000/tcp
            firewall-cmd --reload
            ;;
    esac
    
    log "Firewall configuration completed"
}

# Create environment configuration
create_config() {
    log "Creating configuration files..."
    
    # Backend configuration
    cat > "$INSTALL_DIR/backend/.env" << EOF
# Database Configuration
DATABASE_URL=postgresql://ics_user:secure_password_change_me@localhost/cybersecurity
REDIS_URL=redis://localhost:6379

# Security Settings
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# AI/ML Configuration
MODEL_PATH=$INSTALL_DIR/models
TRAINING_DATA_PATH=$INSTALL_DIR/data
ENABLE_GPU=false

# Network Configuration
NETWORK_SCAN_RANGE=192.168.1.0/24
SCAN_INTERVAL=300

# Threat Intelligence
THREAT_INTEL_API_KEY=your-api-key-here
UPDATE_INTERVAL=3600

# Logging
LOG_LEVEL=INFO
LOG_FILE=$INSTALL_DIR/logs/cybersecurity.log
EOF

    # Frontend configuration
    cat > "$INSTALL_DIR/frontend/.env" << EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws

# Feature Flags
VITE_ENABLE_CHATBOT=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_NETWORK_TOPOLOGY=true

# UI Configuration
VITE_THEME=dark
VITE_REFRESH_INTERVAL=30000
EOF

    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    
    log "Configuration files created"
}

# Start services
start_services() {
    log "Starting services..."
    
    systemctl start ics-cybersecurity-backend
    systemctl enable ics-cybersecurity-backend
    
    sleep 5
    
    systemctl start ics-cybersecurity-frontend
    systemctl enable ics-cybersecurity-frontend
    
    log "Services started"
}

# Create management scripts
create_scripts() {
    log "Creating management scripts..."
    
    # Start script
    cat > "$INSTALL_DIR/start.sh" << EOF
#!/bin/bash
echo "Starting ICS/OT Cybersecurity Platform..."
sudo systemctl start ics-cybersecurity-backend
sudo systemctl start ics-cybersecurity-frontend
echo "Platform started!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:8000"
EOF

    # Stop script
    cat > "$INSTALL_DIR/stop.sh" << EOF
#!/bin/bash
echo "Stopping ICS/OT Cybersecurity Platform..."
sudo systemctl stop ics-cybersecurity-frontend
sudo systemctl stop ics-cybersecurity-backend
echo "Platform stopped!"
EOF

    # Status script
    cat > "$INSTALL_DIR/status.sh" << EOF
#!/bin/bash
echo "ICS/OT Cybersecurity Platform Status:"
echo "====================================="
echo -n "Backend: "
systemctl is-active ics-cybersecurity-backend
echo -n "Frontend: "
systemctl is-active ics-cybersecurity-frontend
echo -n "Nginx: "
systemctl is-active nginx
echo -n "PostgreSQL: "
systemctl is-active postgresql
echo -n "Redis: "
systemctl is-active redis-server 2>/dev/null || systemctl is-active redis
EOF

    chmod +x "$INSTALL_DIR"/*.sh
    
    log "Management scripts created"
}

# Main installation function
main() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "ICS/OT Cybersecurity Platform Installer"
    echo "========================================"
    echo -e "${NC}"
    
    log "Starting installation..."
    
    check_root
    detect_distro
    check_requirements
    install_dependencies
    create_user
    create_directories
    copy_files
    setup_python
    setup_nodejs
    setup_database
    setup_redis
    create_services
    setup_nginx
    setup_firewall
    create_config
    create_scripts
    start_services
    
    echo -e "${GREEN}"
    echo "========================================"
    echo "Installation completed successfully!"
    echo "========================================"
    echo -e "${NC}"
    echo
    echo "The ICS/OT Cybersecurity Platform has been installed to:"
    echo "$INSTALL_DIR"
    echo
    echo "Access URLs:"
    echo "- Frontend: http://localhost"
    echo "- Backend API: http://localhost:8000"
    echo
    echo "Management commands:"
    echo "- Start: $INSTALL_DIR/start.sh"
    echo "- Stop: $INSTALL_DIR/stop.sh"
    echo "- Status: $INSTALL_DIR/status.sh"
    echo
    echo "Service management:"
    echo "- systemctl status ics-cybersecurity-backend"
    echo "- systemctl status ics-cybersecurity-frontend"
    echo
    echo "Logs:"
    echo "- journalctl -u ics-cybersecurity-backend -f"
    echo "- journalctl -u ics-cybersecurity-frontend -f"
    echo
    echo "For support and documentation, see $INSTALL_DIR/README.md"
    echo
    log "Installation completed successfully!"
}

# Run main function
main "$@"

