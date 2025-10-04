// API utility functions for making authenticated requests

const API_BASE_URL = 'http://localhost:8000/api/v1'

// Get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  // Only include Authorization if a token exists; avoid setting Content-Type on GET to prevent unnecessary CORS preflights
  if (!token) {
    return {}
  }
  return {
    'Authorization': `Bearer ${token}`
  }
}

// Get authentication headers for file upload (without Content-Type)
const getAuthHeadersForUpload = () => {
  const token = localStorage.getItem('token')
  // For simple server, don't send auth headers if no token
  if (!token) {
    return {}
  }
  return {
    'Authorization': `Bearer ${token}`
  }
}

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred'
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
    throw new Error(errorMessage)
  }
  
  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return await response.json()
  }
  return response
}

// PCAP API functions
export const pcapAPI = {
  // Get all PCAP files
  async getFiles(params = {}) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })
    
    const url = `${API_BASE_URL}/pcap/${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await fetch(url, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Get PCAP statistics
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/pcap/stats`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Upload PCAP file
  async uploadFile(file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE_URL}/pcap/upload`, {
      method: 'POST',
      headers: getAuthHeadersForUpload(),
      body: formData
    })
    return handleResponse(response)
  },

  // Get specific PCAP file
  async getFile(fileId) {
    const response = await fetch(`${API_BASE_URL}/pcap/${fileId}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Download PCAP file
  async downloadFile(fileId) {
    const response = await fetch(`${API_BASE_URL}/pcap/${fileId}/download`, {
      headers: getAuthHeadersForUpload() // No Content-Type for file download
    })
    
    if (!response.ok) {
      throw new Error('Download failed')
    }
    
    return response // Return response for blob handling
  },

  // Delete PCAP file
  async deleteFile(fileId) {
    const response = await fetch(`${API_BASE_URL}/pcap/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Analyze PCAP file
  async analyzeFile(fileId, analysisRequest) {
    const response = await fetch(`${API_BASE_URL}/pcap/${fileId}/analyze`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analysisRequest)
    })
    return handleResponse(response)
  },

  // Get capture status
  async getCaptureStatus() {
    const response = await fetch(`${API_BASE_URL}/pcap/capture/status`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Start packet capture
  async startCapture(captureConfig) {
    const response = await fetch(`${API_BASE_URL}/pcap/capture/start`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(captureConfig)
    })
    return handleResponse(response)
  },

  // Stop packet capture
  async stopCapture() {
    const response = await fetch(`${API_BASE_URL}/pcap/capture/stop`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Start ML training
  async startTraining(trainingConfig) {
    const response = await fetch(`${API_BASE_URL}/pcap/training/start`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trainingConfig)
    })
    return handleResponse(response)
  },

  // Get training status
  async getTrainingStatus() {
    const response = await fetch(`${API_BASE_URL}/pcap/training/status`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Export PCAP files
  async exportFiles(exportConfig) {
    const response = await fetch(`${API_BASE_URL}/pcap/export`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(exportConfig)
    })
    return handleResponse(response)
  }
}

// General API utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  // Handle authentication errors
  handleAuthError(error) {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return true
    }
    return false
  },

  // Format error message for display
  formatError(error) {
    if (typeof error === 'string') {
      return error
    }
    return error.message || 'An unexpected error occurred'
  }
}

export const networkAPI = {
  scanHost: async ({ target_ip, ports = [], arguments: args } = {}) => {
    const headers = {
      ...(await getAuthHeaders()),
      'Content-Type': 'application/json',
    };
    const res = await fetch(`${API_BASE_URL}/network/scan/host`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ target_ip, ports, arguments: args }),
    });
    return handleResponse(res);
  },

  scanSubnet: async ({ subnet_cidr, arguments: args } = {}) => {
    const headers = {
      ...(await getAuthHeaders()),
      'Content-Type': 'application/json',
    };
    const res = await fetch(`${API_BASE_URL}/network/scan/subnet`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ subnet_cidr, arguments: args }),
    });
    return handleResponse(res);
  },

  listScans: async ({ status, limit = 20 } = {}) => {
    const qs = new URLSearchParams();
    if (status) qs.append('status_filter', status);
    if (limit) qs.append('limit', String(limit));
    const res = await fetch(`${API_BASE_URL}/network/scans?${qs.toString()}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getScan: async (scan_id) => {
    const res = await fetch(`${API_BASE_URL}/network/scans/${scan_id}` , {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export default { apiUtils }