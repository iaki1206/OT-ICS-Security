import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Settings,
  Shield,
  FileText,
  Key,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  Save,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { 
  validateEmail, 
  validatePassword, 
  sanitizeInput, 
  sanitizeFilename,
  sanitizeSearchQuery,
  RateLimiter 
} from '@/utils/security'

const AdminDashboard = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('users')
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [userToEdit, setUserToEdit] = useState(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState('Admin') // Set after authentication
  
  // Admin password - loaded from environment variables
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'DefaultAdmin123!' // Fallback for development only
  
  // Role-based permissions
  const rolePermissions = {
    Admin: {
      canDeleteUsers: true,
      canAddUsers: true,
      canEditUsers: true,
      canViewAuditLogs: true,
      canModifySystemConfig: true,
      canManagePolicies: true,
      canExportData: true
    },
    Engineer: {
      canDeleteUsers: false,
      canAddUsers: true,
      canEditUsers: true,
      canViewAuditLogs: true,
      canModifySystemConfig: false,
      canManagePolicies: false,
      canExportData: true
    },
    Operator: {
      canDeleteUsers: false,
      canAddUsers: false,
      canEditUsers: false,
      canViewAuditLogs: true,
      canModifySystemConfig: false,
      canManagePolicies: false,
      canExportData: false
    },
    Analyst: {
      canDeleteUsers: false,
      canAddUsers: false,
      canEditUsers: false,
      canViewAuditLogs: true,
      canModifySystemConfig: false,
      canManagePolicies: false,
      canExportData: true
    }
  }
  
  const hasPermission = (permission) => {
    return rolePermissions[currentUserRole]?.[permission] || false
  }
  const [users, setUsers] = useState([
    { id: 1, name: 'John Smith', email: 'john.smith@company.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-15 09:30' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Operator', status: 'Active', lastLogin: '2024-01-15 08:45' },
    { id: 3, name: 'Mike Chen', email: 'mike.chen@company.com', role: 'Engineer', status: 'Inactive', lastLogin: '2024-01-10 16:20' },
    { id: 4, name: 'Lisa Rodriguez', email: 'lisa.rodriguez@company.com', role: 'Analyst', status: 'Active', lastLogin: '2024-01-15 10:15' }
  ])
  
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      role: 'Operator'
    }
  })
  
  const editForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      role: 'Operator'
    }
  })
  
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, timestamp: '2024-01-15 15:30:25', user: 'John Smith', action: 'User Login', resource: 'System', status: 'Success', ip: '192.168.1.100' },
    { id: 2, timestamp: '2024-01-15 15:25:10', user: 'Sarah Johnson', action: 'Device Configuration', resource: 'PLC-001', status: 'Success', ip: '192.168.1.105' },
    { id: 3, timestamp: '2024-01-15 15:20:45', user: 'Mike Wilson', action: 'Security Policy Update', resource: 'Firewall Rules', status: 'Failed', ip: '192.168.1.110' },
    { id: 4, timestamp: '2024-01-15 15:15:30', user: 'Lisa Chen', action: 'Threat Analysis', resource: 'Alert-2024-001', status: 'Success', ip: '192.168.1.115' }
  ])

  const [systemConfig, setSystemConfig] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 3,
    passwordExpiry: 90,
    enableTwoFactor: true,
    logRetention: 365,
    alertThreshold: 5
  })

  const [securityPolicies, setSecurityPolicies] = useState([
    { id: 1, name: 'Password Policy', description: 'Minimum 8 characters, special chars required', status: 'Active', lastModified: '2024-01-10' },
    { id: 2, name: 'Access Control Policy', description: 'Role-based access control rules', status: 'Active', lastModified: '2024-01-12' },
    { id: 3, name: 'Network Security Policy', description: 'Firewall and network segmentation rules', status: 'Active', lastModified: '2024-01-14' },
    { id: 4, name: 'Incident Response Policy', description: 'Security incident handling procedures', status: 'Draft', lastModified: '2024-01-15' }
  ])

  const handleUserAction = (action, userId) => {
    if (action === 'Delete') {
      if (!hasPermission('canDeleteUsers')) {
        alert('Access Denied: You do not have permission to delete users.')
        return
      }
      const user = users.find(u => u.id === userId)
      setUserToDelete(user)
      setIsDeleteModalOpen(true)
    } else if (action === 'Edit') {
      if (!hasPermission('canEditUsers')) {
        alert('Access Denied: You do not have permission to edit users.')
        return
      }
      const user = users.find(u => u.id === userId)
      setUserToEdit(user)
      editForm.reset({
        name: user.name,
        email: user.email,
        role: user.role
      })
      setIsEditUserModalOpen(true)
    }
  }
  
  const handleLogin = async () => {
    try {
      // Sanitize password input
      const sanitizedPassword = sanitizeInput(adminPassword)
      
      // Validate password strength (basic check)
      if (!validatePassword(sanitizedPassword)) {
        setLoginError('Password does not meet security requirements.')
        return
      }
      
      // In production, this should authenticate against a secure backend API
      if (sanitizedPassword === ADMIN_PASSWORD) {
        setIsAuthenticated(true)
        setIsLoginModalOpen(false)
        setLoginError('')
        setAdminPassword('')
        
        // Log authentication attempt (in production, log to secure audit system)
        console.log('Admin authentication successful at:', new Date().toISOString())
      } else {
        setLoginError('Invalid password. Please try again.')
        // Log failed authentication attempt
        console.warn('Failed admin authentication attempt at:', new Date().toISOString())
      }
    } catch (error) {
      setLoginError('Authentication error. Please try again.')
      console.error('Authentication error:', error)
    }
  }
  
  const handleDeleteUser = () => {
    if (userToDelete) {
      const updatedUsers = users.filter(user => user.id !== userToDelete.id)
      setUsers(updatedUsers)
      console.log(`User ${userToDelete.name} deleted successfully`)
      alert(`User "${userToDelete.name}" has been successfully deleted from the system.`)
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    }
  }
  
  const onSubmitEditUser = (data) => {
    if (userToEdit) {
      try {
        // Validate and sanitize input data
        const sanitizedName = sanitizeInput(data.name)
        const sanitizedEmail = sanitizeInput(data.email)
        
        // Validate email format
        if (!validateEmail(sanitizedEmail)) {
          alert('Please enter a valid email address.')
          return
        }
        
        // Check for duplicate email (excluding current user)
        if (users.some(user => user.id !== userToEdit.id && user.email.toLowerCase() === sanitizedEmail.toLowerCase())) {
          alert('A user with this email already exists.')
          return
        }
        
        // Validate name (basic check)
        if (sanitizedName.length < 2 || sanitizedName.length > 50) {
          alert('Name must be between 2 and 50 characters.')
          return
        }
        
        const updatedUsers = users.map(user => 
          user.id === userToEdit.id 
            ? { ...user, name: sanitizedName, email: sanitizedEmail, role: data.role }
            : user
        )
        setUsers(updatedUsers)
        console.log('User updated:', { ...userToEdit, name: sanitizedName, email: sanitizedEmail, role: data.role })
        alert(`User "${sanitizedName}" has been successfully updated!`)
        
        // Reset form and close modal
        editForm.reset()
        setIsEditUserModalOpen(false)
        setUserToEdit(null)
      } catch (error) {
        console.error('Error updating user:', error)
        alert('An error occurred while updating the user. Please try again.')
      }
    }
  }
  
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setUserToDelete(null)
  }

  const handlePolicyAction = (action, policyId) => {
    console.log(`${action} action for policy ID: ${policyId}`)
    alert(`${action} action would be performed for policy ID: ${policyId}`)
  }

  const handleConfigSave = () => {
    if (!hasPermission('canModifySystemConfig')) {
      alert('Access Denied: You do not have permission to modify system configuration.')
      return
    }
    console.log('Saving system configuration:', systemConfig)
    alert('System configuration saved successfully!')
  }

  const handleExportLogs = () => {
    if (!hasPermission('canExportData')) {
      alert('Access Denied: You do not have permission to export data.')
      return
    }
    console.log('Exporting audit logs...')
    alert('Audit logs exported successfully!')
  }

  const handleAddUser = () => {
    if (!hasPermission('canAddUsers')) {
      alert('Access Denied: You do not have permission to add users.')
      return
    }
    setIsAddUserModalOpen(true)
  }
  
  const onSubmitUser = (data) => {
    try {
      // Validate and sanitize input data
      const sanitizedName = sanitizeInput(data.name)
      const sanitizedEmail = sanitizeInput(data.email)
      
      // Validate email format
      if (!validateEmail(sanitizedEmail)) {
        alert('Please enter a valid email address.')
        return
      }
      
      // Check for duplicate email
      if (users.some(user => user.email.toLowerCase() === sanitizedEmail.toLowerCase())) {
        alert('A user with this email already exists.')
        return
      }
      
      // Validate name (basic check)
      if (sanitizedName.length < 2 || sanitizedName.length > 50) {
        alert('Name must be between 2 and 50 characters.')
        return
      }
      
      const newUser = {
        id: users.length + 1,
        name: sanitizedName,
        email: sanitizedEmail,
        role: data.role, // Role is from dropdown, should be safe
        status: 'Active',
        lastLogin: 'Never'
      }
      
      setUsers([...users, newUser])
      console.log('New user added:', newUser)
      alert(`User "${sanitizedName}" has been successfully added to the system!`)
      
      // Reset form and close modal
      form.reset()
      setIsAddUserModalOpen(false)
    } catch (error) {
      console.error('Error adding user:', error)
      alert('An error occurred while adding the user. Please try again.')
    }
  }

  const handleExportUsers = () => {
    if (!hasPermission('canExportData')) {
      alert('Access Denied: You do not have permission to export data.')
      return
    }
    
    console.log('Exporting user data...')
    
    // Create CSV content
    const csvHeader = 'Name,Email,Role,Status,Last Login\n'
    const csvContent = users.map(user => 
      `"${user.name}","${user.email}","${user.role}","${user.status}","${user.lastLogin}"`
    ).join('\n')
    
    const csvData = csvHeader + csvContent
    
    // Create and download file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    alert('User data exported successfully as CSV file!')
  }

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'config', label: 'System Configuration', icon: Settings },
    { id: 'policies', label: 'Security Policies', icon: Shield },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'permissions', label: 'Role Permissions', icon: Key }
  ]

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">User Management</h3>
        <div className="flex space-x-3">
          {hasPermission('canAddUsers') && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAddUser}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
          {hasPermission('canExportData') && (
            <Button variant="outline" onClick={handleExportUsers}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      <div className="bg-slate-700/50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-600/50">
            <tr>
              <th className="px-4 py-3 text-left text-white font-medium">Name</th>
              <th className="px-4 py-3 text-left text-white font-medium">Email</th>
              <th className="px-4 py-3 text-left text-white font-medium">Role</th>
              <th className="px-4 py-3 text-left text-white font-medium">Status</th>
              <th className="px-4 py-3 text-left text-white font-medium">Last Login</th>
              <th className="px-4 py-3 text-left text-white font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-600/50">
                <td className="px-4 py-3 text-white">{user.name}</td>
                <td className="px-4 py-3 text-slate-300">{user.email}</td>
                <td className="px-4 py-3 text-slate-300">{user.role}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{user.lastLogin}</td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    {hasPermission('canEditUsers') && (
                      <Button variant="ghost" size="sm" onClick={() => handleUserAction('Edit', user.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {hasPermission('canDeleteUsers') && (
                      <Button variant="ghost" size="sm" onClick={() => handleUserAction('Delete', user.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {!hasPermission('canEditUsers') && !hasPermission('canDeleteUsers') && (
                      <span className="text-slate-500 text-sm px-2 py-1">No actions available</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderSystemConfiguration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">System Configuration</h3>
        {hasPermission('canModifySystemConfig') && (
          <Button onClick={handleConfigSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
        {!hasPermission('canModifySystemConfig') && (
          <div className="flex items-center space-x-2 text-slate-400">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Read-only access</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-white mb-4">Security Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value={systemConfig.sessionTimeout}
                onChange={(e) => setSystemConfig({...systemConfig, sessionTimeout: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">Max Login Attempts</label>
              <input
                type="number"
                value={systemConfig.maxLoginAttempts}
                onChange={(e) => setSystemConfig({...systemConfig, maxLoginAttempts: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">Password Expiry (days)</label>
              <input
                type="number"
                value={systemConfig.passwordExpiry}
                onChange={(e) => setSystemConfig({...systemConfig, passwordExpiry: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-white mb-4">System Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 text-sm">Enable Two-Factor Authentication</label>
              <button
                onClick={() => setSystemConfig({...systemConfig, enableTwoFactor: !systemConfig.enableTwoFactor})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  systemConfig.enableTwoFactor ? 'bg-green-500' : 'bg-slate-500'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  systemConfig.enableTwoFactor ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">Log Retention (days)</label>
              <input
                type="number"
                value={systemConfig.logRetention}
                onChange={(e) => setSystemConfig({...systemConfig, logRetention: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2">Alert Threshold</label>
              <input
                type="number"
                value={systemConfig.alertThreshold}
                onChange={(e) => setSystemConfig({...systemConfig, alertThreshold: parseInt(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecurityPolicies = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Security Policies</h3>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          New Policy
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityPolicies.map((policy) => (
          <div key={policy.id} className="bg-slate-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white">{policy.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                policy.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {policy.status}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-4">{policy.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Modified: {policy.lastModified}</span>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handlePolicyAction('Edit', policy.id)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handlePolicyAction('View', policy.id)}>
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAuditLogs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Audit Logs</h3>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="bg-slate-700/50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-600/50">
            <tr>
              <th className="px-4 py-3 text-left text-white font-medium">Timestamp</th>
              <th className="px-4 py-3 text-left text-white font-medium">User</th>
              <th className="px-4 py-3 text-left text-white font-medium">Action</th>
              <th className="px-4 py-3 text-left text-white font-medium">Resource</th>
              <th className="px-4 py-3 text-left text-white font-medium">Status</th>
              <th className="px-4 py-3 text-left text-white font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-t border-slate-600/50">
                <td className="px-4 py-3 text-slate-300 text-sm">{log.timestamp}</td>
                <td className="px-4 py-3 text-white">{log.user}</td>
                <td className="px-4 py-3 text-slate-300">{log.action}</td>
                <td className="px-4 py-3 text-slate-300">{log.resource}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.status === 'Success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300 text-sm">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderRolePermissions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Role Permissions</h3>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Role
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['Security Admin', 'Operator', 'Engineer', 'Analyst'].map((role) => (
          <div key={role} className="bg-slate-700/50 rounded-lg p-6">
            <h4 className="text-lg font-medium text-white mb-4">{role}</h4>
            <div className="space-y-3">
              {[
                'View Dashboard',
                'Manage Users',
                'Configure Devices',
                'View Audit Logs',
                'Manage Policies',
                'Export Data',
                'System Configuration'
              ].map((permission) => (
                <div key={permission} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{permission}</span>
                  <button className="w-8 h-4 bg-green-500 rounded-full flex items-center justify-end px-1">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUserManagement()
      case 'config':
        return renderSystemConfiguration()
      case 'policies':
        return renderSecurityPolicies()
      case 'audit':
        return renderAuditLogs()
      case 'permissions':
        return renderRolePermissions()
      default:
        return renderUserManagement()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Show login modal if not authenticated */}
        {!isAuthenticated && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-md mx-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Admin Authentication Required</h3>
                <p className="text-slate-400">Please enter the admin password to access the Security Dashboard</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Admin Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter admin password"
                    autoFocus
                  />
                  {loginError && (
                    <p className="text-red-400 text-sm mt-2">{loginError}</p>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Button onClick={handleLogin} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Unlock className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                </div>
                
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Hint: SecureAdmin2024!</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Security Admin Dashboard</h2>
                <p className="text-slate-400">Comprehensive system administration and security management</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-slate-500">Logged in as:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentUserRole === 'Admin' ? 'bg-red-500/20 text-red-400' :
                    currentUserRole === 'Engineer' ? 'bg-blue-500/20 text-blue-400' :
                    currentUserRole === 'Operator' ? 'bg-green-500/20 text-green-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {currentUserRole}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
              ×
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </motion.div>
      
      {/* Delete User Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <span>Confirm User Deletion</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-300 mb-4">
              Are you sure you want to delete the following user? This action cannot be undone.
            </p>
            {userToDelete && (
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{userToDelete.name}</h4>
                    <p className="text-slate-400 text-sm">{userToDelete.email}</p>
                    <p className="text-slate-400 text-sm">Role: {userToDelete.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-500" />
              <span>Edit User</span>
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} className="bg-slate-700 border-slate-600 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                rules={{ 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} className="bg-slate-700 border-slate-600 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white">
                        <option value="Operator">Operator</option>
                        <option value="Engineer">Engineer</option>
                        <option value="Admin">Admin</option>
                        <option value="Analyst">Analyst</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} className="bg-slate-700 border-slate-600 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                rules={{ 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} className="bg-slate-700 border-slate-600 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white">
                        <option value="Operator">Operator</option>
                        <option value="Engineer">Engineer</option>
                        <option value="Admin">Admin</option>
                        <option value="Analyst">Analyst</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Add User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default AdminDashboard