import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import DeviceManagement from './components/DeviceManagement'
import ThreatIntelligence from './components/ThreatIntelligence'
import SecurityMonitoring from './components/SecurityMonitoring'
import AIModels from './components/AIModels'
import NetworkTopology from './components/NetworkTopology'
import ChatBot from './components/ChatBot'
import NotificationCenter from './components/NotificationCenter'
import AdminDashboard from './components/AdminDashboard'
// Response Workflows Component
const ResponseWorkflows = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [workflowInstances, setWorkflowInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    threat_type: 'malware',
    actions: [{ type: '', target: '', description: '' }]
  });

  // Pre-load API module to avoid dynamic imports in event handlers
  const [apiModule, setApiModule] = useState(null);
  
  // Load API module once on component mount
  useEffect(() => {
    const loadApiModule = async () => {
      try {
        const module = await import('./lib/api/api');
        setApiModule(module);
      } catch (error) {
        console.error('Error loading API module:', error);
      }
    };
    
    loadApiModule();
  }, []);
  
  // Fetch workflow data when API module is loaded
  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        setIsLoading(true);
        
        if (!apiModule) {
          throw new Error('API module not loaded');
        }
        
        const { api } = apiModule;
        
        // Fetch templates and instances
        const [templatesResponse, instancesResponse] = await Promise.all([
          api.get('/api/workflows/templates'),
          api.get('/api/workflows/instances')
        ]);
        
        setWorkflowTemplates(templatesResponse.data || []);
        setWorkflowInstances(instancesResponse.data || []);
      } catch (error) {
        console.error('Error fetching workflow data:', error);
        // Fallback to static data if API fails
        setWorkflowTemplates([
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
          }
        ]);
        
        setWorkflowInstances([
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
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (apiModule) {
      fetchWorkflowData();
    }
  }, [apiModule]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle action input changes
  const handleActionChange = (index, field, value) => {
    setFormData(prev => {
      const updatedActions = [...prev.actions];
      updatedActions[index] = {
        ...updatedActions[index],
        [field]: value
      };
      return {
        ...prev,
        actions: updatedActions
      };
    });
  };
  
  // Add new action
  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: '', target: '', description: '' }]
    }));
  };
  
  // Remove action
  const removeAction = (index) => {
    setFormData(prev => {
      const updatedActions = prev.actions.filter((_, i) => i !== index);
      return {
        ...prev,
        actions: updatedActions.length ? updatedActions : [{ type: '', target: '', description: '' }]
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!apiModule) {
        throw new Error('API module not loaded');
      }
      
      const { api } = apiModule;
      
      // Create new template
      await api.post('/api/workflows/templates', formData);
      
      // Refresh templates
      const response = await api.get('/api/workflows/templates');
      setWorkflowTemplates(response.data || []);
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        threat_type: 'malware',
        actions: [{ type: '', target: '', description: '' }]
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating workflow template:', error);
      alert('Failed to create workflow template. Please try again.');
    }
  };
  
  // This section was removed to fix duplicate Hook declarations
  
  // Execute workflow
  const executeWorkflow = async (templateId) => {
    try {
      if (!apiModule) {
        throw new Error('API module not loaded');
      }
      
      const { api } = apiModule;
      
      // Create new instance
      await api.post('/api/workflows/instances', {
        template_id: templateId,
        target_device: 'PLC-001' // This would typically be selected by the user
      });
      
      // Refresh instances
      const response = await api.get('/api/workflows/instances');
      setWorkflowInstances(response.data || []);
      
      // Switch to active tab
      setActiveTab('active');
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Failed to execute workflow. Please try again.');
    }
  };
  
  // Cancel workflow
  const cancelWorkflow = async (instanceId) => {
    try {
      if (!apiModule) {
        throw new Error('API module not loaded');
      }
      
      const { api } = apiModule;
      
      // Cancel instance
      await api.put(`/api/workflows/instances/${instanceId}/cancel`);
      
      // Refresh instances
      const response = await api.get('/api/workflows/instances');
      setWorkflowInstances(response.data || []);
    } catch (error) {
      console.error('Error canceling workflow:', error);
      alert('Failed to cancel workflow. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Response Workflows</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="mb-4">Create and manage automated response workflows for security incidents.</p>
        <div className="flex justify-between mb-6">
          <div className="flex space-x-2">
            <button 
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'templates' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              onClick={() => setActiveTab('templates')}
            >
              Templates
            </button>
            <button 
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              onClick={() => setActiveTab('active')}
            >
              Active Workflows
            </button>
          </div>
          {activeTab === 'templates' && (
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
              onClick={() => setShowCreateModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Template
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading workflows...</span>
          </div>
        ) : (
          <>
            {activeTab === 'templates' && (
              <div className="space-y-4">
                {workflowTemplates.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-gray-500">No workflow templates found. Create your first template!</p>
                  </div>
                ) : (
                  workflowTemplates.map(template => (
                    <Card key={template.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{template.name}</CardTitle>
                            <CardDescription className="mt-1">{template.description}</CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2">{template.threat_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-sm text-gray-500">
                          <span>Created by {template.created_by} on {new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2 pt-2">
                        <Button variant="outline" size="sm">View Details</Button>
                        <Button size="sm" onClick={() => executeWorkflow(template.id)}>Execute</Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'active' && (
              <div className="space-y-4">
                {workflowInstances.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-gray-500">No active workflows found.</p>
                  </div>
                ) : (
                  workflowInstances.map(instance => (
                    <Card key={instance.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{instance.template_name}</CardTitle>
                            <CardDescription className="mt-1">Target: {instance.target_device}</CardDescription>
                          </div>
                          <Badge 
                            variant={instance.status === 'completed' ? 'success' : instance.status === 'in_progress' ? 'default' : 'destructive'}
                            className="ml-2"
                          >
                            {instance.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(instance.current_step / instance.total_steps) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Step {instance.current_step} of {instance.total_steps}</span>
                          <span>Started: {new Date(instance.started_at).toLocaleString()}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2 pt-2">
                        <Button variant="outline" size="sm">View Details</Button>
                        {instance.status === 'in_progress' && (
                          <Button variant="destructive" size="sm" onClick={() => cancelWorkflow(instance.id)}>Cancel</Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Create Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Workflow Template</DialogTitle>
            <DialogDescription>
              Define a new response workflow template for security incidents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input 
                id="name" 
                name="name"
                value={formData.name} 
                onChange={handleInputChange} 
                className="col-span-3" 
                placeholder="e.g., Malware Containment"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea 
                id="description" 
                name="description"
                value={formData.description} 
                onChange={handleInputChange} 
                className="col-span-3" 
                placeholder="Describe the purpose of this workflow"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="threat_type" className="text-right">Threat Type</Label>
              <Select 
                name="threat_type"
                value={formData.threat_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, threat_type: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select threat type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="malware">Malware</SelectItem>
                  <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                  <SelectItem value="dos_attack">DoS Attack</SelectItem>
                  <SelectItem value="data_breach">Data Breach</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right pt-2">Actions</Label>
              <div className="col-span-3 space-y-4">
                {formData.actions.map((action, index) => (
                  <div key={index} className="grid gap-2 p-3 border rounded-md relative">
                    <button 
                      type="button" 
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                      onClick={() => removeAction(index)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`action-type-${index}`}>Type</Label>
                        <Select 
                          value={action.type} 
                          onValueChange={(value) => handleActionChange(index, 'type', value)}
                        >
                          <SelectTrigger id={`action-type-${index}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="network_isolation">Network Isolation</SelectItem>
                            <SelectItem value="threat_scan">Threat Scan</SelectItem>
                            <SelectItem value="notification">Notification</SelectItem>
                            <SelectItem value="log_collection">Log Collection</SelectItem>
                            <SelectItem value="account_lock">Account Lock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`action-target-${index}`}>Target</Label>
                        <Select 
                          value={action.target} 
                          onValueChange={(value) => handleActionChange(index, 'target', value)}
                        >
                          <SelectTrigger id={`action-target-${index}`}>
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="device">Device</SelectItem>
                            <SelectItem value="network">Network</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="team">Team</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`action-description-${index}`}>Description</Label>
                        <Input 
                          id={`action-description-${index}`} 
                          value={action.description} 
                          onChange={(e) => handleActionChange(index, 'description', e.target.value)} 
                          placeholder="Brief description"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={addAction}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Action
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Workflow management will be implemented in a future update

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatBotOpen, setChatBotOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [systemStatus, setSystemStatus] = useState({
    devices: { total: 0, online: 0, critical: 0 },
    threats: { active: 0, resolved: 0, investigating: 0 },
    models: { active: 0, training: 0, accuracy: 0 }
  })

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update system status
      setSystemStatus(prev => ({
        devices: {
          total: Math.floor(Math.random() * 50) + 100,
          online: Math.floor(Math.random() * 40) + 80,
          critical: Math.floor(Math.random() * 5) + 2
        },
        threats: {
          active: Math.floor(Math.random() * 10) + 5,
          resolved: Math.floor(Math.random() * 20) + 30,
          investigating: Math.floor(Math.random() * 8) + 3
        },
        models: {
          active: Math.floor(Math.random() * 5) + 8,
          training: Math.floor(Math.random() * 3) + 1,
          accuracy: (Math.random() * 0.1 + 0.9).toFixed(3)
        }
      }))

      // Add random notifications
      if (Math.random() > 0.8) {
        const notificationTypes = [
          { type: 'warning', title: 'Anomaly Detected', message: 'Unusual network traffic detected on PLC-001' },
          { type: 'error', title: 'Critical Alert', message: 'Unauthorized access attempt on HMI-Station-03' },
          { type: 'info', title: 'Model Update', message: 'Anomaly detection model retrained successfully' },
          { type: 'success', title: 'Threat Resolved', message: 'Security incident INC-2024-001 has been resolved' }
        ]
        
        const notification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
        setNotifications(prev => [
          {
            id: Date.now(),
            ...notification,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 9) // Keep only last 10 notifications
        ])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const renderCurrentPage = () => {
    const pageProps = {
      systemStatus,
      notifications,
      setNotifications
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} />
      case 'devices':
        return <DeviceManagement {...pageProps} />
      case 'threats':
        return <ThreatIntelligence {...pageProps} />
      case 'threat-intel':
        return <ThreatIntelligence activeTab="feeds" {...pageProps} />
      case 'monitoring':
        return <SecurityMonitoring {...pageProps} />
      case 'ai-models':
        return <AIModels {...pageProps} />
      case 'topology':
        return <NetworkTopology {...pageProps} />
      case 'workflows':
        return (() => {
          const [activeTab, setActiveTab] = React.useState('templates');
          const [showCreateModal, setShowCreateModal] = React.useState(false);
          const [workflowTemplates, setWorkflowTemplates] = React.useState([
            {
              id: '1',
              name: 'Malware Containment',
              description: 'Isolate infected devices and scan network',
              threat_type: 'malware'
            },
            {
              id: '2',
              name: 'Unauthorized Access Response',
              description: 'Lock accounts and analyze access patterns',
              threat_type: 'unauthorized_access'
            },
            {
              id: '3',
              name: 'DoS Attack Mitigation',
              description: 'Apply traffic filtering and notify team',
              threat_type: 'dos_attack'
            }
          ]);
          const [workflowInstances, setWorkflowInstances] = React.useState([
            {
              id: '1',
              template_name: 'Malware Scan',
              target_device: 'PLC-003',
              status: 'in_progress',
              current_step: 2,
              total_steps: 4
            },
            {
              id: '2',
              template_name: 'Network Isolation',
              target_device: 'HMI-002',
              status: 'completed',
              current_step: 3,
              total_steps: 3
            }
          ]);
          const [loading, setLoading] = React.useState(false);
          const [formData, setFormData] = React.useState({
            name: '',
            description: '',
            threat_type: 'malware',
            actions: [{ type: '', target: '', description: '' }]
          });
          
          // Fetch workflow data from API - temporarily disabled
          /*
          React.useEffect(() => {
            const fetchWorkflowData = async () => {
              setLoading(true);
              try {
                // Import the API service
                const { api } = await import('./lib/api/api');
                
                // Fetch templates
                const templatesResponse = await api.get('/api/workflows/templates');
                setWorkflowTemplates(templatesResponse.data || []);
                
                // Fetch instances
                const instancesResponse = await api.get('/api/workflows/instances');
                setWorkflowInstances(instancesResponse.data || []);
              } catch (error) {
                console.error('Error fetching workflow data:', error);
              } finally {
                setLoading(false);
              }
            };
            
            fetchWorkflowData();
          }, []);
          */
          
          // Handle form input changes
          const handleInputChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({
              ...prev,
              [name]: value
            }));
          };
          
          // Handle action input changes
          const handleActionChange = (index, field, value) => {
            setFormData(prev => {
              const updatedActions = [...prev.actions];
              updatedActions[index] = {
                ...updatedActions[index],
                [field]: value
              };
              return {
                ...prev,
                actions: updatedActions
              };
            });
          };
          
          // Add new action
          const addAction = () => {
            setFormData(prev => ({
              ...prev,
              actions: [...prev.actions, { type: '', target: '', description: '' }]
            }));
          };
          
          // Remove action
          const removeAction = (index) => {
            setFormData(prev => {
              const updatedActions = prev.actions.filter((_, i) => i !== index);
              return {
                ...prev,
                actions: updatedActions.length ? updatedActions : [{ type: '', target: '', description: '' }]
              };
            });
          };
          
          // Handle form submission
          const handleSubmit = async () => {
            try {
              // Import the API service
              const { api } = await import('./lib/api/api');
              
              // Create new template
              await api.post('/api/workflows/templates', formData);
              
              // Refresh templates
              const response = await api.get('/api/workflows/templates');
              setWorkflowTemplates(response.data || []);
              
              // Reset form and close modal
              setFormData({
                name: '',
                description: '',
                threat_type: 'malware',
                actions: [{ type: '', target: '', description: '' }]
              });
              setShowCreateModal(false);
            } catch (error) {
              console.error('Error creating workflow template:', error);
              alert('Failed to create workflow template. Please try again.');
            }
          };
          
          // Execute workflow
          const executeWorkflow = async (templateId) => {
            try {
              // Import the API service
              const { api } = await import('./lib/api/api');
              
              // Create new instance
              await api.post('/api/workflows/instances', {
                template_id: templateId,
                target_device: 'PLC-001' // This would typically be selected by the user
              });
              
              // Refresh instances
              const response = await api.get('/api/workflows/instances');
              setWorkflowInstances(response.data || []);
              
              // Switch to active tab
              setActiveTab('active');
            } catch (error) {
              console.error('Error executing workflow:', error);
              alert('Failed to execute workflow. Please try again.');
            }
          };
          
          // Cancel workflow
          const cancelWorkflow = async (instanceId) => {
            try {
              // Import the API service
              const { api } = await import('./lib/api/api');
              
              // Cancel instance
              await api.put(`/api/workflows/instances/${instanceId}/cancel`);
              
              // Refresh instances
              const response = await api.get('/api/workflows/instances');
              setWorkflowInstances(response.data || []);
            } catch (error) {
              console.error('Error cancelling workflow:', error);
              alert('Failed to cancel workflow. Please try again.');
            }
          };
          
          // Simple modal for creating a new workflow template
          const CreateTemplateModal = () => (
            <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showCreateModal ? 'block' : 'hidden'}`}>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Create Workflow Template</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Template Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded" 
                      placeholder="Enter template name" 
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded" 
                      rows="3" 
                      placeholder="Describe the workflow"
                      required
                    ></textarea>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Threat Type</label>
                    <select 
                      name="threat_type"
                      value={formData.threat_type}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="malware">Malware</option>
                      <option value="unauthorized_access">Unauthorized Access</option>
                      <option value="dos_attack">DoS Attack</option>
                      <option value="data_breach">Data Breach</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Actions</label>
                    {formData.actions.map((action, index) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Action {index + 1}</span>
                          {formData.actions.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeAction(index)}
                              className="text-red-500 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input 
                          type="text" 
                          value={action.type}
                          onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                          className="w-full p-2 border rounded mb-2" 
                          placeholder="Action Type (e.g., network_isolation)" 
                          required
                        />
                        <input 
                          type="text" 
                          value={action.target}
                          onChange={(e) => handleActionChange(index, 'target', e.target.value)}
                          className="w-full p-2 border rounded mb-2" 
                          placeholder="Target (e.g., device, network)" 
                          required
                        />
                        <input 
                          type="text" 
                          value={action.description}
                          onChange={(e) => handleActionChange(index, 'description', e.target.value)}
                          className="w-full p-2 border rounded" 
                          placeholder="Description" 
                          required
                        />
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={addAction}
                      className="text-blue-600 text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Action
                    </button>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button 
                      type="button" 
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
          
          return (
            <div className="container mx-auto p-6">
              <h1 className="text-2xl font-bold mb-4 text-white">Response Workflows</h1>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Automated Response Workflows</h2>
                  <p className="mb-4">Create and manage automated response workflows for security incidents.</p>
                  
                  {/* Create Template Modal */}
                  <CreateTemplateModal />
                  
                  <div className="flex justify-between mb-6">
                    <div className="flex space-x-2">
                      <button 
                        className={`px-4 py-2 rounded transition-colors ${activeTab === 'templates' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                        onClick={() => setActiveTab('templates')}
                      >
                        Templates
                      </button>
                      <button 
                        className={`px-4 py-2 rounded transition-colors ${activeTab === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                        onClick={() => setActiveTab('active')}
                      >
                        Active Workflows
                      </button>
                    </div>
                    <button 
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Template
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {activeTab === 'templates' && (
                        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 col-span-2">
                          <h3 className="text-lg font-medium mb-2">Workflow Templates</h3>
                          {workflowTemplates.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-300 py-4 text-center">No workflow templates found. Create one to get started.</p>
                          ) : (
                            <ul className="space-y-2">
                              {workflowTemplates.map(template => (
                                <li key={template.id} className="p-3 bg-white dark:bg-gray-600 rounded shadow-sm hover:bg-blue-50 cursor-pointer transition-colors">
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-300">{template.description}</div>
                                  <div className="mt-1">
                                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                      {template.threat_type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <div className="flex justify-end mt-2">
                                    <button 
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
                                      onClick={() => executeWorkflow(template.id)}
                                    >
                                      Execute
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'active' && (
                        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 col-span-2">
                          <h3 className="text-lg font-medium mb-2">Active Workflows</h3>
                          {workflowInstances.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-300 py-4 text-center">No active workflows. Execute a template to start a workflow.</p>
                          ) : (
                            <ul className="space-y-2">
                              {workflowInstances.map(instance => (
                                <li key={instance.id} className="p-3 bg-white dark:bg-gray-600 rounded shadow-sm hover:bg-blue-50 cursor-pointer transition-colors">
                                  <div className="font-medium">{instance.template_name} - {instance.target_device}</div>
                                  <div className="flex items-center mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          instance.status === 'completed' ? 'bg-green-600' : 
                                          instance.status === 'failed' ? 'bg-red-600' : 'bg-blue-600'
                                        }`} 
                                        style={{ width: `${(instance.current_step / instance.total_steps) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs whitespace-nowrap">{instance.current_step}/{instance.total_steps}</span>
                                  </div>
                                  <div className="flex justify-between mt-2">
                                    <span className={`text-xs font-medium ${
                                      instance.status === 'completed' ? 'text-green-600' : 
                                      instance.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                      {instance.status.charAt(0).toUpperCase() + instance.status.slice(1)}
                                    </span>
                                    {instance.status === 'in_progress' ? (
                                      <button 
                                        className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded hover:bg-red-200 transition-colors"
                                        onClick={() => cancelWorkflow(instance.id)}
                                      >
                                        Cancel
                                      </button>
                                    ) : (
                                      <button 
                                        className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded hover:bg-gray-200 transition-colors"
                                        onClick={() => alert('Workflow details will be implemented soon!')}
                                      >
                                        View Details
                                      </button>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      default:
        return <Dashboard {...pageProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative flex h-screen">
        {/* Sidebar */}
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          {/* Header */}
          <Header
            systemStatus={systemStatus}
            notifications={notifications}
            notificationsOpen={notificationsOpen}
            setNotificationsOpen={setNotificationsOpen}
            setChatBotOpen={setChatBotOpen}
            setAdminDashboardOpen={setAdminDashboardOpen}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderCurrentPage()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Notification Center */}
        <NotificationCenter
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          setNotifications={setNotifications}
          setCurrentPage={setCurrentPage}
        />

        {/* AI ChatBot */}
        <ChatBot
          isOpen={chatBotOpen}
          onClose={() => setChatBotOpen(false)}
          systemStatus={systemStatus}
        />

        {/* Admin Dashboard */}
        {adminDashboardOpen && (
          <AdminDashboard
            onClose={() => setAdminDashboardOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default App

