// Hybrid API service - uses Axios for real API calls with fallback to mock data
// This allows the frontend to work with or without a backend connection

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to determine if the backend is available
const checkBackendAvailability = async () => {
  try {
    const response = await axiosInstance.get('/health', { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    console.log('Backend not available, using mock data');
    return false;
  }
};

// Mock data for fallback
const mockData = {
  workflowTemplates: [
    {
      id: '1',
      name: 'Malware Containment',
      description: 'Isolate infected devices and scan network',
      threat_type: 'malware',
      created_by: 'admin',
      created_at: '2023-10-15T10:30:00Z',
      actions: [
        { type: 'network_isolation', target: 'device', description: 'Isolate infected device' },
        { type: 'threat_scan', target: 'network', description: 'Scan network for threats' },
        { type: 'notification', target: 'team', description: 'Notify security team' }
      ]
    },
    {
      id: '2',
      name: 'Unauthorized Access Response',
      description: 'Lock accounts and analyze access patterns',
      threat_type: 'unauthorized_access',
      created_by: 'admin',
      created_at: '2023-09-20T14:15:00Z',
      actions: [
        { type: 'account_lock', target: 'user', description: 'Lock compromised accounts' },
        { type: 'log_collection', target: 'system', description: 'Collect access logs' },
        { type: 'notification', target: 'team', description: 'Notify security team' }
      ]
    },
    {
      id: '3',
      name: 'DoS Attack Mitigation',
      description: 'Apply traffic filtering and notify team',
      threat_type: 'dos_attack',
      created_by: 'admin',
      created_at: '2023-11-05T09:45:00Z',
      actions: [
        { type: 'traffic_filter', target: 'network', description: 'Apply traffic filtering rules' },
        { type: 'notification', target: 'team', description: 'Notify security team' }
      ]
    }
  ],
  workflowInstances: [
    {
      id: '101',
      template_id: '1',
      template_name: 'Malware Containment',
      status: 'in_progress',
      current_step: 2,
      total_steps: 4,
      target_device: 'PLC-003',
      started_at: '2023-12-10T08:30:00Z',
      started_by: 'admin'
    },
    {
      id: '102',
      template_id: '2',
      template_name: 'Network Isolation',
      status: 'completed',
      current_step: 3,
      total_steps: 3,
      target_device: 'HMI-002',
      started_at: '2023-12-09T14:20:00Z',
      completed_at: '2023-12-09T14:35:00Z',
      started_by: 'admin'
    }
  ]
};

// API service with real API calls and mock fallback
export const api = {
  get: async (url, options = {}) => {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      try {
        // Real API call with Axios
        const apiUrl = url.startsWith('/') ? url : `/${url}`;
        const response = await axiosInstance.get(apiUrl, {
          headers: options.headers || {},
          withCredentials: true,
          ...options
        });
        
        return { data: response.data };
      } catch (error) {
        console.error('API call failed:', error);
        // Fall back to mock data on error
      }
    }
    
    // Mock data fallback
    console.log(`Using mock data for GET: ${url}`);
    
    if (url === '/api/workflows/templates') {
      return { data: mockData.workflowTemplates };
    }
    
    if (url === '/api/workflows/instances') {
      return { data: mockData.workflowInstances };
    }
    
    return { data: [] };
  },
  
  post: async (url, data, options = {}) => {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      try {
        // Real API call with Axios
        const apiUrl = url.startsWith('/') ? url : `/${url}`;
        const response = await axiosInstance.post(apiUrl, data, {
          headers: options.headers || {},
          withCredentials: true,
          ...options
        });
        
        return { data: response.data };
      } catch (error) {
        console.error('API call failed:', error);
        // Fall back to mock response on error
      }
    }
    
    // Mock response
    console.log(`Using mock data for POST: ${url}`, data);
    return { data: { id: Date.now().toString(), ...data } };
  },
  
  put: async (url, data, options = {}) => {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      try {
        // Real API call with Axios
        const apiUrl = url.startsWith('/') ? url : `/${url}`;
        const response = await axiosInstance.put(apiUrl, data, {
          headers: options.headers || {},
          withCredentials: true,
          ...options
        });
        
        return { data: response.data };
      } catch (error) {
        console.error('API call failed:', error);
        // Fall back to mock response on error
      }
    }
    
    // Mock response
    console.log(`Using mock data for PUT: ${url}`, data);
    return { data };
  },
  
  delete: async (url, options = {}) => {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      try {
        // Real API call with Axios
        const apiUrl = url.startsWith('/') ? url : `/${url}`;
        const response = await axiosInstance.delete(apiUrl, {
          headers: options.headers || {},
          withCredentials: true,
          ...options
        });
        
        return { data: response.data };
      } catch (error) {
        console.error('API call failed:', error);
        // Fall back to mock response on error
      }
    }
    
    // Mock response
    console.log(`Using mock data for DELETE: ${url}`);
    return { data: { success: true } };
  }
};

// Export the axios instance for direct use if needed
export { axiosInstance };