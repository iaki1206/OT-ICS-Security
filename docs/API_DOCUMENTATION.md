# ICS Cybersecurity Platform API Documentation

## Overview

This document provides comprehensive documentation for the ICS Cybersecurity Platform API. The API is built using FastAPI and provides endpoints for device management, threat detection, network monitoring, authentication, and automated response workflows.

## Base URL

```
http://localhost:8000/api
```

## Authentication

Most API endpoints require authentication. The API uses JWT (JSON Web Token) for authentication.

### Authentication Flow

1. Obtain a JWT token by sending credentials to the `/auth/login` endpoint
2. Include the token in the `Authorization` header of subsequent requests:
   ```
   Authorization: Bearer <your_token>
   ```
3. Refresh tokens when they expire using the `/auth/refresh` endpoint

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user and get JWT token |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/register` | Register a new user |
| GET | `/auth/me` | Get current user information |
| POST | `/auth/change-password` | Change user password |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password using token |
| GET | `/auth/sessions` | Get user active sessions |
| DELETE | `/auth/sessions/{session_id}` | Terminate a specific session |

### Device Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/devices/` | Get list of devices with filtering options |
| POST | `/devices/` | Create a new device |
| GET | `/devices/{device_id}` | Get device details |
| PUT | `/devices/{device_id}` | Update device information |
| DELETE | `/devices/{device_id}` | Delete a device |
| GET | `/devices/stats` | Get device statistics |
| GET | `/devices/types` | Get available device types |
| GET | `/devices/status` | Get device status information |

### Threat Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/threats/` | Get list of threats with filtering options |
| POST | `/threats/analyze` | Analyze data for potential threats |
| GET | `/threats/{threat_id}` | Get threat details |
| PUT | `/threats/{threat_id}` | Update threat information |
| GET | `/threats/stats` | Get threat statistics |
| GET | `/threats/severity` | Get threat severity levels |

### Network Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/network/stats` | Get network statistics |
| GET | `/network/traffic` | Get traffic patterns |
| GET | `/network/alerts` | Get network alerts |
| POST | `/network/scan/host` | Scan a specific host |
| POST | `/network/scan/subnet` | Scan a subnet |
| GET | `/network/scan/{scan_id}` | Get scan results |
| GET | `/network/live` | WebSocket endpoint for live network data |

### Response Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows/templates` | Get list of workflow templates |
| POST | `/api/workflows/templates` | Create a new workflow template |
| GET | `/api/workflows/templates/{template_id}` | Get workflow template details |
| PUT | `/api/workflows/templates/{template_id}` | Update workflow template |
| DELETE | `/api/workflows/templates/{template_id}` | Delete workflow template |
| GET | `/api/workflows/instances` | Get list of workflow instances |
| POST | `/api/workflows/templates/{template_id}/execute` | Execute a workflow template |
| GET | `/api/workflows/instances/{instance_id}` | Get workflow instance details |
| PUT | `/api/workflows/instances/{instance_id}/cancel` | Cancel a workflow instance |
| GET | `/api/workflows/instances/{instance_id}/actions` | Get workflow instance actions |

### Threat Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/threat-intel/indicators` | Get threat intelligence indicators |
| GET | `/api/threat-intel/indicators/{indicator_id}` | Get indicator details |
| POST | `/api/threat-intel/indicators/search` | Search for indicators |
| GET | `/api/threat-intel/feeds` | Get available threat intelligence feeds |

## Request and Response Examples

### Authentication

#### Login

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "role": "admin",
    "is_active": true
  }
}
```

### Device Management

#### Get Devices

**Request:**
```http
GET /devices?limit=10&device_type=PLC
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "PLC-001",
    "description": "Main control PLC",
    "ip_address": "192.168.1.10",
    "device_type": "PLC",
    "vendor": "Siemens",
    "model": "S7-1200",
    "firmware_version": "4.2.1",
    "status": "online",
    "location": "Building A, Floor 1",
    "last_seen": "2023-06-15T10:30:45Z",
    "tags": ["critical", "production"],
    "created_at": "2023-01-10T08:15:30Z",
    "updated_at": "2023-06-15T10:30:45Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "PLC-002",
    "description": "Secondary control PLC",
    "ip_address": "192.168.1.11",
    "device_type": "PLC",
    "vendor": "Allen-Bradley",
    "model": "ControlLogix",
    "firmware_version": "32.11",
    "status": "online",
    "location": "Building A, Floor 1",
    "last_seen": "2023-06-15T10:29:12Z",
    "tags": ["production"],
    "created_at": "2023-01-15T09:20:10Z",
    "updated_at": "2023-06-15T10:29:12Z"
  }
]
```

### Threat Detection

#### Analyze Data

**Request:**
```http
POST /threats/analyze
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "data_source": "network_traffic",
  "time_range": 3600,
  "device_ids": ["550e8400-e29b-41d4-a716-446655440001"],
  "analysis_type": "anomaly_detection"
}
```

**Response:**
```json
{
  "analysis_id": "550e8400-e29b-41d4-a716-446655440010",
  "status": "completed",
  "threats_detected": 2,
  "results": [
    {
      "threat_id": "550e8400-e29b-41d4-a716-446655440011",
      "device_id": "550e8400-e29b-41d4-a716-446655440001",
      "threat_type": "unusual_traffic_pattern",
      "severity": "medium",
      "confidence": 0.85,
      "description": "Unusual traffic pattern detected from PLC-001",
      "detected_at": "2023-06-15T11:05:22Z"
    },
    {
      "threat_id": "550e8400-e29b-41d4-a716-446655440012",
      "device_id": "550e8400-e29b-41d4-a716-446655440001",
      "threat_type": "unauthorized_access_attempt",
      "severity": "high",
      "confidence": 0.92,
      "description": "Unauthorized access attempt detected on PLC-001",
      "detected_at": "2023-06-15T11:02:15Z"
    }
  ]
}
```

### Response Workflows

#### Get Workflow Templates

**Request:**
```http
GET /api/workflows/templates
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "name": "Isolate Compromised Device",
    "description": "Workflow to isolate a potentially compromised device",
    "threat_type": "malware_infection",
    "created_at": "2023-05-10T14:25:30Z",
    "updated_at": "2023-06-01T09:12:45Z",
    "actions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440021",
        "name": "Disable Network Access",
        "description": "Disable network access for the compromised device",
        "action_type": "network_isolation",
        "parameters": {
          "isolation_method": "acl_block"
        },
        "order": 1
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440022",
        "name": "Create Security Alert",
        "description": "Create high-priority security alert",
        "action_type": "create_alert",
        "parameters": {
          "alert_severity": "high",
          "alert_message": "Device isolated due to potential compromise"
        },
        "order": 2
      }
    ]
  }
]
```

#### Execute Workflow

**Request:**
```http
POST /api/workflows/templates/550e8400-e29b-41d4-a716-446655440020/execute
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "device_id": "550e8400-e29b-41d4-a716-446655440001",
  "threat_id": "550e8400-e29b-41d4-a716-446655440011",
  "parameters": {
    "additional_notes": "Executed as part of incident response"
  }
}
```

**Response:**
```json
{
  "instance_id": "550e8400-e29b-41d4-a716-446655440030",
  "template_id": "550e8400-e29b-41d4-a716-446655440020",
  "status": "running",
  "started_at": "2023-06-15T11:10:22Z",
  "device_id": "550e8400-e29b-41d4-a716-446655440001",
  "threat_id": "550e8400-e29b-41d4-a716-446655440011",
  "message": "Workflow execution started"
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200 OK`: The request was successful
- `201 Created`: A new resource was successfully created
- `400 Bad Request`: The request was invalid or cannot be served
- `401 Unauthorized`: Authentication is required or failed
- `403 Forbidden`: The authenticated user doesn't have permission
- `404 Not Found`: The requested resource doesn't exist
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: An error occurred on the server

Error responses include a JSON object with details:

```json
{
  "detail": "Error message describing what went wrong"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

## API Versioning

The current API version is v1. The version is included in the URL path.

## Support

For API support, please contact the development team at support@ics-security.example.com.