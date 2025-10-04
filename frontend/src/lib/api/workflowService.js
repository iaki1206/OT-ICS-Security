import { api } from './api';

export const workflowService = {
  // Template management
  getTemplates: async (params = {}) => {
    const response = await api.get('/api/workflows/templates', { params });
    return response.data;
  },

  getTemplateById: async (id) => {
    const response = await api.get(`/api/workflows/templates/${id}`);
    return response.data;
  },

  createTemplate: async (templateData) => {
    const response = await api.post('/api/workflows/templates', templateData);
    return response.data;
  },

  updateTemplate: async (id, templateData) => {
    const response = await api.put(`/api/workflows/templates/${id}`, templateData);
    return response.data;
  },

  deleteTemplate: async (id) => {
    await api.delete(`/api/workflows/templates/${id}`);
    return true;
  },

  // Instance management
  getInstances: async (params = {}) => {
    const response = await api.get('/api/workflows/instances', { params });
    return response.data;
  },

  getInstanceById: async (id) => {
    const response = await api.get(`/api/workflows/instances/${id}`);
    return response.data;
  },

  createInstance: async (instanceData) => {
    const response = await api.post('/api/workflows/instances', instanceData);
    return response.data;
  },

  cancelInstance: async (id) => {
    const response = await api.post(`/api/workflows/instances/${id}/cancel`);
    return response.data;
  },

  getInstanceActions: async (id) => {
    const response = await api.get(`/api/workflows/instances/${id}/actions`);
    return response.data;
  },

  executeForAlert: async (alertId, templateId) => {
    const response = await api.post(`/api/workflows/execute-for-alert/${alertId}`, { template_id: templateId });
    return response.data;
  }
};

export default workflowService;