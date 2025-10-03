#!/bin/bash

# ICS Cybersecurity Platform - Linux Debian One-Click Installer
# This script installs and starts the ICS Cybersecurity Platform on Linux Debian

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_status "Please run as a regular user. The script will use sudo when needed."
        exit 1
    fi
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
}

# Function to check Docker installation
check_docker() {
    if ! command_exists docker; then
        print_warning "Docker is not installed."
        read -p "Would you like to install Docker automatically? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_docker
            print_warning "Please log out and log back in for Docker group membership to take effect."
            print_status "After logging back in, run this script again."
            exit 0
        else
            print_error "Docker is required. Please install it manually and run this script again."
            exit 1
        fi
    fi
    
    # Check if Docker daemon is running
    if ! sudo systemctl is-active --quiet docker; then
        print_status "Starting Docker service..."
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    # Check if user is in docker group
    if ! groups $USER | grep -q docker; then
        print_warning "User $USER is not in the docker group."
        print_status "Adding user to docker group..."
        sudo usermod -aG docker $USER
        print_warning "Please log out and log back in for the changes to take effect."
        print_status "After logging back in, run this script again."
        exit 0
    fi
    
    print_success "Docker is installed and running"
}

# Function to check Docker Compose
check_docker_compose() {
    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not available."
        print_status "Please ensure Docker is properly installed with Compose plugin."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Function to create directories
setup_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p data/pcap
    mkdir -p data/models
    mkdir -p logs
    mkdir -p grafana/dashboards
    mkdir -p grafana/datasources
    
    # Set proper permissions
    chmod 755 data logs grafana
    chmod 755 data/pcap data/models
    chmod 755 grafana/dashboards grafana/datasources
    
    print_success "Directories created successfully"
}

# Function to setup configuration files
setup_config() {
    print_status "Setting up configuration files..."
    
    # Copy Prometheus config if it doesn't exist
    if [ ! -f "prometheus.yml" ]; then
        if [ -f "../../prometheus.yml" ]; then
            cp "../../prometheus.yml" "prometheus.yml"
        else
            print_warning "prometheus.yml not found in parent directory"
        fi
    fi
    
    # Copy Grafana datasource config if it doesn't exist
    if [ ! -f "grafana/datasources/prometheus.yml" ]; then
        if [ -f "../../grafana/datasources/prometheus.yml" ]; then
            cp "../../grafana/datasources/prometheus.yml" "grafana/datasources/prometheus.yml"
        else
            print_warning "Grafana datasource config not found in parent directory"
        fi
    fi
    
    print_success "Configuration files set up"
}

# Function to start the platform
start_platform() {
    print_status "Starting ICS Cybersecurity Platform..."
    
    # Stop any existing containers
    print_status "Stopping any existing containers..."
    docker compose down >/dev/null 2>&1 || true
    
    # Pull latest images
    print_status "Pulling Docker images (this may take a few minutes)..."
    docker compose pull
    
    # Build and start services
    print_status "Building and starting services..."
    docker compose up -d --build
    
    # Wait for services to start
    print_status "Waiting for services to initialize..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    docker compose ps
    
    print_success "Platform started successfully"
}

# Function to open browser
open_browser() {
    print_status "Opening application in browser..."
    
    # Try different browser commands
    if command_exists xdg-open; then
        xdg-open http://localhost:3000 >/dev/null 2>&1 &
    elif command_exists firefox; then
        firefox http://localhost:3000 >/dev/null 2>&1 &
    elif command_exists chromium-browser; then
        chromium-browser http://localhost:3000 >/dev/null 2>&1 &
    elif command_exists google-chrome; then
        google-chrome http://localhost:3000 >/dev/null 2>&1 &
    else
        print_warning "Could not detect browser. Please open http://localhost:3000 manually."
    fi
}

# Main installation function
main() {
    echo "========================================"
    echo "ICS Cybersecurity Platform Installer"
    echo "Linux Debian Deployment"
    echo "========================================"
    echo
    
    # Check if running as root
    check_root
    
    # Update system packages
    print_status "Updating system packages..."
    sudo apt-get update
    
    # Install required packages
    print_status "Installing required packages..."
    sudo apt-get install -y curl wget git
    
    # Check Docker installation
    check_docker
    
    # Check Docker Compose
    check_docker_compose
    
    # Setup directories and configuration
    setup_directories
    setup_config
    
    # Start the platform
    start_platform
    
    echo
    echo "========================================"
    echo "Installation Complete!"
    echo "========================================"
    echo
    echo "The ICS Cybersecurity Platform is now running."
    echo
    echo "Access URLs:"
    echo "- Main Application: http://localhost:3000"
    echo "- API Documentation: http://localhost:8000/docs"
    echo "- Grafana Monitoring: http://localhost:3001"
    echo "- Prometheus Metrics: http://localhost:9090"
    echo
    echo "Default Credentials:"
    echo "- Grafana: admin / admin123"
    echo
    echo "Management Commands:"
    echo "- Stop platform: docker compose down"
    echo "- View logs: docker compose logs -f"
    echo "- Restart: docker compose restart"
    echo
    
    # Open browser
    open_browser
    
    print_success "Installation completed successfully!"
}

# Run main function
main "$@"