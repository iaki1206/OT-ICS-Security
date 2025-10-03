# ICS Cybersecurity Platform - Comprehensive Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Installation & Deployment](#installation--deployment)
4. [Configuration](#configuration)
5. [API Documentation](#api-documentation)
6. [Frontend Components](#frontend-components)
7. [Database Schema](#database-schema)
8. [Security Features](#security-features)
9. [User Manual](#user-manual)
10. [Development Guide](#development-guide)
11. [Troubleshooting](#troubleshooting)
12. [Performance & Monitoring](#performance--monitoring)

---

## System Overview

### Purpose
The ICS Cybersecurity Platform is an AI-powered security framework designed specifically for Industrial Control Systems (ICS). It provides real-time monitoring, threat detection, PCAP analysis, and comprehensive security management for industrial environments.

### Key Features
- **Real-time Network Monitoring**: Continuous monitoring of industrial network traffic
- **AI/ML Threat Detection**: Advanced machine learning algorithms for anomaly detection
- **PCAP Analysis**: Deep packet inspection and analysis capabilities
- **Device Management**: Comprehensive industrial device inventory and monitoring
- **Security Dashboard**: Intuitive web-based interface for security operations
- **Alert Management**: Real-time threat alerts and incident response
- **Network Topology Visualization**: Interactive network mapping and visualization
- **Compliance Reporting**: Automated security compliance reporting

### Target Industries
- Manufacturing
- Energy & Utilities
- Oil & Gas
- Water Treatment
- Transportation
- Critical Infrastructure

---

## Architecture

### System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│ (PostgreSQL)    │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • API Routes    │    │ • User Data     │
│ • AI Models UI  │    │ • ML Service    │    │ • Device Info   │
│ • Admin Panel   │    │ • Auth Service  │    │ • Threat Alerts │
│ • ChatBot       │    │ • PCAP Analysis │    │ • Network Data  │
│ • Security Mon. │    │ • Security Utils│    │ • ML Models     │
│ • Notifications │    │ • Real-time API │    │ • Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │     Redis       │    │   Prometheus    │    │    Grafana      │
         │   (Cache)       │    │  (Metrics)      │    │ (Monitoring)    │
         │   Port: 6379    │    │   Port: 9090    │    │   Port: 3001    │
         │                 │    │                 │    │                 │
         │ • Session Store │    │ • System Metrics│    │ • Dashboards    │
         │ • ML Model Cache│    │ • ML Metrics    │    │ • Alerts        │
         │ • Real-time Data│    │ • Security Stats│    │ • Visualizations│
         └─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   ML Pipeline   │
                    │   (PyTorch/TF)  │
                    │                 │
                    │ • LSTM Models   │
                    │ • CNN Models    │
                    │ • Anomaly Det.  │
                    │ • Classification│
                    │ • Real-time Inf.│
                    └─────────────────┘
```

### Component Details

#### Frontend (React Application)
- **Technology**: React 19.1.0 with Vite
- **UI Framework**: Tailwind CSS with Radix UI components
- **State Management**: React hooks and context
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Charts**: Recharts for data visualization

#### Backend (FastAPI Application)
- **Technology**: Python 3.11 with FastAPI
- **Database ORM**: SQLAlchemy with async support
- **Authentication**: JWT-based authentication
- **API Documentation**: Automatic OpenAPI/Swagger generation
- **Background Tasks**: Celery with Redis
- **ML/AI**: Advanced ML pipeline with TensorFlow, PyTorch, and Scikit-learn
  - **Deep Learning Models**: LSTM for network traffic analysis, CNN for protocol analysis
  - **Traditional ML**: Isolation Forest, Random Forest, DBSCAN clustering
  - **Model Management**: Automated training, validation, and deployment
  - **Real-time Inference**: Optimized inference pipeline for threat detection

#### Database Layer
- **Primary Database**: PostgreSQL 15
- **Cache Layer**: Redis 7
- **Data Models**: Comprehensive schema for devices, threats, packets, users
- **Migrations**: Alembic for database versioning

#### Monitoring & Observability
- **Metrics**: Prometheus for metrics collection
- **Visualization**: Grafana dashboards
- **Logging**: Structured logging with Loguru
- **Health Checks**: Comprehensive health monitoring

---

## Installation & Deployment

### Prerequisites

#### System Requirements
- **Minimum**: 4 CPU cores, 8GB RAM, 100GB storage
- **Recommended**: 8 CPU cores, 16GB RAM, 500GB SSD storage
- **Operating System**: Linux (Ubuntu 20.04+), Windows 10+, macOS 11+

#### Software Dependencies
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for development)
- Python 3.11+ (for development)
- PostgreSQL 15+ (if not using Docker)

### Quick Start with Docker

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ics-cybersecurity-platform-production
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Grafana: http://localhost:3001

### Production Deployment

Refer to the detailed [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment instructions including:
- SSL/TLS configuration
- Load balancing setup
- Database clustering
- Security hardening
- Backup strategies

---

## Configuration

### Environment Variables

#### Database Configuration
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ics_cybersecurity
REDIS_URL=redis://:password@localhost:6379/0
```

#### Security Configuration
```env
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

#### Application Configuration
```env
ENVIRONMENT=production
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
LOG_LEVEL=INFO
PCAP_STORAGE_DIR=/app/data/pcap
ML_MODEL_DIR=/app/data/models
```

### Configuration Files

#### Backend Configuration
- `backend/core/config.py`: Main configuration settings
- `backend/database/database.py`: Database connection settings
- `backend/auth/config.py`: Authentication configuration

#### Frontend Configuration
- `frontend/vite.config.js`: Vite build configuration
- `frontend/tailwind.config.js`: Tailwind CSS configuration
- `frontend/components.json`: UI component configuration

---

## API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/login
Authenticate user and obtain access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "analyst",
    "is_active": true
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "session_id": "abc123def456"
}
```

### Device Management Endpoints

#### GET /api/v1/devices
Retrieve list of industrial devices.

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records (default: 100)
- `device_type`: Filter by device type
- `status`: Filter by device status

**Response:**
```json
{
  "devices": [
    {
      "id": "uuid",
      "name": "PLC-001",
      "device_type": "PLC",
      "ip_address": "192.168.1.100",
      "status": "online",
      "last_seen": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

#### POST /api/v1/devices
Create a new device entry.

**Request Body:**
```json
{
  "name": "PLC-002",
  "device_type": "PLC",
  "ip_address": "192.168.1.101",
  "manufacturer": "Schneider Electric",
  "location": "Production Line 1"
}
```

### Threat Detection Endpoints

#### GET /api/v1/threats
Retrieve threat alerts.

**Query Parameters:**
- `severity`: Filter by severity level
- `status`: Filter by alert status
- `start_date`: Start date for filtering
- `end_date`: End date for filtering

#### POST /api/v1/threats/{threat_id}/acknowledge
Acknowledge a threat alert.

### PCAP Analysis Endpoints

#### POST /api/v1/pcap/upload
Upload PCAP file for analysis.

**Request:** Multipart form data with PCAP file

**Response:**
```json
{
  "file_id": "uuid",
  "filename": "capture.pcap",
  "size": 1024000,
  "status": "processing"
}
```

#### GET /api/v1/pcap/{file_id}/analysis
Get analysis results for a PCAP file.

### Network Monitoring Endpoints

#### GET /api/v1/network/topology
Retrieve network topology data.

#### GET /api/v1/network/traffic
Get real-time network traffic statistics.

### AI/ML Model Endpoints

#### GET /api/v1/ml/models
Retrieve list of available ML models.

**Response:**
```json
{
  "models": [
    {
      "id": "lstm-traffic-v1",
      "name": "Network Traffic LSTM",
      "type": "anomaly_detection",
      "status": "active",
      "accuracy": 0.95,
      "last_trained": "2024-01-01T12:00:00Z",
      "version": "1.2.0"
    },
    {
      "id": "cnn-protocol-v1",
      "name": "Industrial Protocol CNN",
      "type": "classification",
      "status": "active",
      "accuracy": 0.92,
      "last_trained": "2024-01-01T10:00:00Z",
      "version": "1.1.0"
    }
  ],
  "total": 2
}
```

#### POST /api/v1/ml/models/{model_id}/predict
Make predictions using a specific ML model.

**Request Body:**
```json
{
  "data": {
    "network_traffic": [0.1, 0.2, 0.3],
    "protocol_data": "modbus_packet_data"
  },
  "model_params": {
    "threshold": 0.8
  }
}
```

**Response:**
```json
{
  "prediction": {
    "anomaly_score": 0.85,
    "is_anomaly": true,
    "confidence": 0.92,
    "classification": "suspicious_activity"
  },
  "model_info": {
    "model_id": "lstm-traffic-v1",
    "inference_time_ms": 15
  }
}
```

#### POST /api/v1/ml/models/{model_id}/retrain
Trigger model retraining with new data.

**Request Body:**
```json
{
  "training_config": {
    "epochs": 100,
    "batch_size": 32,
    "learning_rate": 0.001
  },
  "data_source": "recent_network_data"
}
```

### Admin Management Endpoints

#### GET /api/v1/admin/users
Retrieve list of system users (Admin only).

**Query Parameters:**
- `role`: Filter by user role
- `status`: Filter by user status
- `skip`: Number of records to skip
- `limit`: Maximum number of records

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@company.com",
      "full_name": "System Administrator",
      "role": "admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-01-15T08:30:00Z"
    }
  ],
  "total": 1
}
```

#### POST /api/v1/admin/users
Create a new user account (Admin only).

**Request Body:**
```json
{
  "email": "newuser@company.com",
  "full_name": "New User",
  "password": "secure_password",
  "role": "analyst",
  "permissions": ["read_threats", "manage_devices"]
}
```

#### PUT /api/v1/admin/users/{user_id}
Update user information and permissions (Admin only).

#### DELETE /api/v1/admin/users/{user_id}
Deactivate or delete a user account (Admin only).

#### GET /api/v1/admin/system/status
Retrieve system health and status information (Admin only).

**Response:**
```json
{
  "system_status": "healthy",
  "services": {
    "database": "online",
    "redis": "online",
    "ml_service": "online",
    "pcap_service": "online"
  },
  "metrics": {
    "active_users": 15,
    "total_devices": 250,
    "active_threats": 3,
    "system_uptime": "15d 8h 30m"
  },
  "resource_usage": {
    "cpu_percent": 45.2,
    "memory_percent": 62.8,
    "disk_percent": 35.1
  }
}
```

#### POST /api/v1/admin/system/backup
Initiate system backup (Admin only).

#### GET /api/v1/admin/audit-logs
Retrieve system audit logs (Admin only).

**Query Parameters:**
- `user_id`: Filter by user
- `action`: Filter by action type
- `start_date`: Start date for filtering
- `end_date`: End date for filtering

---

## Frontend Components

### Core Components

#### App.jsx
Main application component with routing and layout management.

**Key Features:**
- React Router setup
- Global state management
- Theme provider integration
- Error boundary handling

#### Sidebar.jsx
Navigation sidebar component.

**Features:**
- Responsive navigation menu
- Active route highlighting
- Role-based menu items
- Collapsible design

#### Dashboard.jsx
Main dashboard with security overview.

**Components:**
- Real-time metrics cards
- Threat alert summary
- Network status indicators
- Quick action buttons

### Feature Components

#### DeviceManagement.jsx
Industrial device management interface.

**Features:**
- Device inventory table
- Device status monitoring
- Add/edit device forms
- Device configuration management

#### ThreatIntelligence.jsx
Threat detection and analysis interface.

**Features:**
- Threat alert dashboard
- Alert filtering and sorting
- Threat details modal
- Incident response actions

#### PCAPManagement.jsx
PCAP file analysis interface.

**Features:**
- File upload functionality
- Analysis progress tracking
- Results visualization
- Export capabilities

#### NetworkTopology.jsx
Interactive network visualization.

**Features:**
- D3.js-based network graph
- Device relationship mapping
- Real-time status updates
- Zoom and pan controls

#### AIModels.jsx
AI/ML model management and monitoring interface.

**Features:**
- Model performance metrics (accuracy, precision, recall, F1-score)
- Real-time model status monitoring
- Training progress tracking
- Model configuration and deployment
- Performance visualization with charts
- Model comparison and analysis
- Export/import model configurations

**Supported Model Types:**
- Anomaly Detection Engine (Isolation Forest + Autoencoder)
- Threat Classification Model (Random Forest + CNN)
- Behavioral Analysis Engine (LSTM + Attention)
- Network Traffic Analyzer (Deep Neural Network)
- Protocol Analysis Model (CNN-based)

#### AdminDashboard.jsx
Comprehensive administrative interface for system management.

**Features:**
- User management (add, edit, delete users)
- Role-based access control (Admin, Engineer, Operator, Analyst)
- System configuration management
- Audit log viewing
- Security policy management
- Data export/import capabilities
- Authentication and authorization controls

**Role Permissions:**
- **Admin**: Full system access
- **Engineer**: User management and system configuration
- **Operator**: Limited operational access
- **Analyst**: Read-only access with export capabilities

#### ChatBot.jsx
AI-powered cybersecurity assistant for interactive support.

**Features:**
- Natural language query processing
- Contextual security recommendations
- Real-time threat analysis assistance
- Device status inquiries
- Quick action suggestions
- Security best practices guidance
- Integration with system status and alerts

**Capabilities:**
- Threat analysis and recommendations
- Device health monitoring assistance
- Security policy guidance
- Network topology explanations
- Incident response support

#### SecurityMonitoring.jsx
Real-time security event monitoring and analysis.

**Features:**
- Live security event stream
- Event filtering and categorization
- Severity-based alert management
- Protocol-specific monitoring (Modbus, OPC-UA, DNP3, etc.)
- Real-time charts and visualizations
- Event export and reporting
- Customizable time range analysis

**Event Types:**
- Authentication failures
- Anomalous traffic patterns
- Unauthorized access attempts
- Configuration changes
- Malware detection
- Protocol violations

#### NotificationCenter.jsx
Centralized notification management system.

**Features:**
- Real-time notification display
- Notification categorization (error, warning, success, info)
- Mark as read/unread functionality
- Bulk notification management
- Timestamp tracking
- Notification filtering and search
- Integration with all system components

### UI Components

The application uses a comprehensive set of UI components based on Radix UI:

- **Forms**: Input, Select, Checkbox, Radio, Switch
- **Navigation**: Tabs, Accordion, Dropdown Menu
- **Feedback**: Alert, Toast, Progress, Loading
- **Overlay**: Dialog, Popover, Tooltip, Context Menu
- **Data Display**: Table, Card, Badge, Avatar

---

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Devices Table
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    ip_address INET NOT NULL,
    mac_address VARCHAR(17),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'offline',
    configuration JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Threat Alerts Table
```sql
CREATE TABLE threat_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    source_ip INET,
    destination_ip INET,
    affected_device_id UUID REFERENCES devices(id),
    status VARCHAR(20) DEFAULT 'open',
    confidence_score FLOAT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Network Packets Table
```sql
CREATE TABLE network_packets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pcap_file_id UUID REFERENCES pcap_files(id),
    source_device_id UUID REFERENCES devices(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    packet_size INTEGER NOT NULL,
    protocol VARCHAR(20) NOT NULL,
    source_ip INET,
    destination_ip INET,
    source_port INTEGER,
    destination_port INTEGER,
    is_industrial_protocol BOOLEAN DEFAULT FALSE,
    industrial_protocol_type VARCHAR(20),
    payload_data BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relationships

- **Users** → **User Sessions** (1:N)
- **Devices** → **Network Packets** (1:N)
- **Devices** → **Threat Alerts** (1:N)
- **Devices** → **Device Metrics** (1:N)
- **PCAP Files** → **Network Packets** (1:N)
- **Threat Alerts** → **Alert Actions** (1:N)

---

## Security Features

### Authentication & Authorization

#### JWT-Based Authentication
- Secure token-based authentication
- Refresh token mechanism
- Configurable token expiration
- Role-based access control (RBAC)

#### User Roles
- **Admin**: Full system access
- **Analyst**: Security analysis and monitoring
- **Operator**: Device monitoring and basic operations
- **Viewer**: Read-only access

### Data Security

#### Encryption
- Database encryption at rest
- TLS/SSL for data in transit
- Password hashing with bcrypt
- Sensitive data encryption in database

#### Input Validation
- Comprehensive input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

#### Security Validation Utilities (SecurityValidator)

**HTML Sanitization**
- XSS prevention through HTML escaping
- Safe handling of user-generated content
- Quote escaping for attribute values

**Email Validation**
- RFC-compliant email format validation
- Length restrictions (max 254 characters)
- Pattern matching for security

**Network Security Validation**
- IP address format validation (IPv4/IPv6)
- Network range validation (CIDR notation)
- Port number validation (1-65535)
- Network security boundary checks

**File Security**
- Filename sanitization for path traversal prevention
- Dangerous character removal
- Length limitations
- Extension validation

**SQL Security**
- SQL identifier sanitization
- Keyword blacklisting
- Alphanumeric validation
- Injection attack prevention

**Password Security**
- Password strength validation
- Complexity requirements enforcement
- Common password detection
- Secure password hashing with bcrypt

### Network Security

#### Firewall Configuration
- Restrictive default policies
- Port-based access control
- IP whitelisting support
- Network segmentation

#### Monitoring & Logging
- Comprehensive audit logging
- Security event monitoring
- Failed login attempt tracking
- Suspicious activity detection

---

## User Manual

### Getting Started

#### First Login
1. Navigate to the application URL
2. Enter your credentials
3. Complete initial setup wizard
4. Configure your dashboard preferences

#### Dashboard Overview
The main dashboard provides:
- **System Status**: Overall system health indicators
- **Active Threats**: Current security alerts
- **Device Status**: Industrial device monitoring
- **Network Activity**: Real-time traffic statistics

### Device Management

#### Adding Devices
1. Navigate to Device Management
2. Click "Add Device"
3. Fill in device information:
   - Name and description
   - IP address and network details
   - Device type and manufacturer
   - Location information
4. Save the device configuration

#### Monitoring Devices
- View device status in real-time
- Monitor device metrics and performance
- Configure alerting thresholds
- Track device communication patterns

### Threat Analysis

#### Viewing Alerts
1. Navigate to Threat Intelligence
2. Review active alerts by severity
3. Filter alerts by:
   - Time range
   - Severity level
   - Device or network segment
   - Alert category

#### Responding to Threats
1. Select a threat alert
2. Review detailed analysis
3. Take appropriate actions:
   - Acknowledge alert
   - Assign to team member
   - Create incident ticket
   - Implement mitigation

### PCAP Analysis

#### Uploading Files
1. Navigate to PCAP Management
2. Click "Upload PCAP"
3. Select file from local system
4. Wait for processing to complete

#### Analyzing Results
- View packet statistics
- Examine protocol distribution
- Identify suspicious patterns
- Export analysis reports

### Network Topology

#### Viewing Network Map
- Interactive network visualization
- Device relationship mapping
- Real-time status indicators
- Zoom and navigation controls

#### Customizing Views
- Filter by device type
- Adjust layout algorithms
- Configure display options
- Save custom views

---

## Development Guide

### Development Environment Setup

#### Backend Development
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Code Structure

#### Backend Structure
```
backend/
├── main.py                 # FastAPI application entry point
├── core/
│   ├── config.py          # Configuration settings
│   └── security.py        # Security utilities
├── database/
│   ├── models.py          # SQLAlchemy models
│   └── database.py        # Database connection
├── routers/
│   ├── auth.py            # Authentication endpoints
│   ├── devices.py         # Device management endpoints
│   ├── threats.py         # Threat detection endpoints
│   ├── pcap.py            # PCAP analysis endpoints
│   └── network.py         # Network monitoring endpoints
├── services/
│   ├── ml_service.py      # Machine learning services
│   ├── pcap_service.py    # PCAP processing services
│   └── threat_service.py  # Threat detection services
├── utils/
│   └── security.py        # Security validation utilities
└── auth/
    ├── models.py          # Authentication models
    ├── middleware.py      # Authentication middleware
    └── jwt_handler.py     # JWT token handling
```

### Machine Learning Service (ml_service.py)

The ML service provides advanced AI/ML capabilities for cybersecurity analysis:

#### Deep Learning Models

**NetworkTrafficLSTM**
- **Purpose**: Network traffic anomaly detection
- **Architecture**: Multi-layer LSTM with attention mechanism
- **Input**: Sequential network traffic data
- **Output**: Anomaly probability scores
- **Features**: 
  - Configurable hidden layers and dropout
  - Batch processing support
  - Real-time inference capability

**IndustrialProtocolCNN**
- **Purpose**: Industrial protocol analysis and classification
- **Architecture**: 1D CNN with adaptive pooling
- **Input**: Protocol packet sequences
- **Output**: Protocol classification (5 classes)
- **Features**:
  - Multi-scale feature extraction
  - Adaptive pooling for variable-length inputs
  - Support for Modbus, OPC-UA, DNP3, EtherNet/IP protocols

#### Traditional ML Models

**Anomaly Detection**
- **Isolation Forest**: Unsupervised anomaly detection
- **DBSCAN Clustering**: Density-based anomaly identification
- **Autoencoder**: Neural network-based reconstruction errors

**Classification Models**
- **Random Forest**: Ensemble-based threat classification
- **Support Vector Machine**: High-dimensional threat detection
- **Gradient Boosting**: Advanced ensemble methods

#### Model Management Features

- **Automated Training**: Scheduled model retraining
- **Model Versioning**: Track model versions and performance
- **A/B Testing**: Compare model performance
- **Model Deployment**: Seamless production deployment
- **Performance Monitoring**: Real-time model metrics
- **Data Pipeline**: Automated feature engineering

#### Supported Frameworks

- **PyTorch**: Deep learning models (LSTM, CNN)
- **TensorFlow/Keras**: Alternative deep learning backend
- **Scikit-learn**: Traditional ML algorithms
- **NumPy/Pandas**: Data processing and analysis
- **Joblib**: Model serialization and persistence

#### Frontend Structure
```
frontend/src/
├── App.jsx                # Main application component
├── components/
│   ├── Dashboard.jsx      # Main dashboard
│   ├── DeviceManagement.jsx
│   ├── ThreatIntelligence.jsx
│   ├── PCAPManagement.jsx
│   ├── NetworkTopology.jsx
│   └── ui/               # Reusable UI components
├── lib/
│   ├── api.js            # API client utilities
│   └── utils.js          # Utility functions
└── styles/
    └── App.css           # Global styles
```

### Testing

#### Backend Testing
```bash
# Run unit tests
pytest tests/

# Run with coverage
pytest --cov=. tests/

# Run specific test file
pytest tests/test_auth.py
```

#### Frontend Testing
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

---

## Troubleshooting

### Common Issues

#### Database Connection Issues
**Problem**: Cannot connect to PostgreSQL database

**Solutions**:
1. Verify database service is running
2. Check connection string in environment variables
3. Ensure database user has proper permissions
4. Verify network connectivity

#### Authentication Problems
**Problem**: JWT token validation fails

**Solutions**:
1. Check JWT secret key configuration
2. Verify token expiration settings
3. Clear browser cache and cookies
4. Check system clock synchronization

#### PCAP Upload Failures
**Problem**: PCAP files fail to upload or process

**Solutions**:
1. Check file size limits
2. Verify PCAP file format
3. Ensure sufficient disk space
4. Check processing service logs

### Log Analysis

#### Backend Logs
```bash
# View application logs
tail -f /app/logs/application.log

# View error logs
tail -f /app/logs/error.log

# Search for specific errors
grep "ERROR" /app/logs/application.log
```

#### Frontend Logs
- Browser developer console
- Network tab for API requests
- Application tab for local storage

### Performance Issues

#### Database Performance
- Monitor query execution times
- Check index usage
- Analyze slow query logs
- Consider connection pooling

#### Application Performance
- Monitor memory usage
- Check CPU utilization
- Analyze response times
- Review caching strategies

---

## Performance & Monitoring

### Metrics Collection

#### Application Metrics
- Request/response times
- Error rates
- Throughput metrics
- Resource utilization

#### Business Metrics
- Active devices count
- Threat detection rate
- PCAP processing volume
- User activity metrics

### Monitoring Setup

#### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ics-backend'
    static_configs:
      - targets: ['backend:8000']
  
  - job_name: 'ics-frontend'
    static_configs:
      - targets: ['frontend:3000']
```

#### Grafana Dashboards
- System overview dashboard
- Application performance dashboard
- Security metrics dashboard
- Infrastructure monitoring dashboard

### Alerting

#### Alert Rules
- High error rate alerts
- Performance degradation alerts
- Security incident alerts
- Infrastructure failure alerts

#### Notification Channels
- Email notifications
- Slack integration
- PagerDuty integration
- SMS alerts for critical issues

---

## Conclusion

This comprehensive documentation provides a complete guide to the ICS Cybersecurity Platform. For additional support or questions, please refer to:

- **Issue Tracker**: Report bugs and feature requests
- **Community Forum**: Get help from other users
- **Professional Support**: Contact for enterprise support
- **Documentation Updates**: Check for latest documentation versions

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintainers**: ICS Security Team