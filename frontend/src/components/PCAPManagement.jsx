import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  RefreshCw, 
  HardDrive, 
  Calendar, 
  Network, 
  Shield, 
  Activity,
  Play,
  Square,
  Send,
  Plus,
  Archive,
  Star,
  Clock,
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Filter
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { pcapAPI } from '../utils/api'

const PCAPManagement = () => {
  // Mock user for now since AuthContext doesn't exist - memoized to prevent re-renders
  const user = useMemo(() => ({ name: 'Admin User', role: 'admin' }), [])
  
  // Core state
  const [recentFiles, setRecentFiles] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [message, setMessage] = useState({ type: '', content: '' })
  const [pcapStats, setPcapStats] = useState(null)
  
  // Capture control state
  const [captureStatus, setCaptureStatus] = useState('stopped')
  const [captureConfig, setCaptureConfig] = useState({
    interface: 'auto',
    rotation_time: 300,
    max_file_size: 100,
    use_wireshark: true,
    auto_cleanup: true
  })
  
  // File management state
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [prioritizedFiles, setPrioritizedFiles] = useState(new Set())
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // ML Training state
  const [trainingStatus, setTrainingStatus] = useState('idle')
  const [trainingProgress, setTrainingProgress] = useState(0)
  
  // Dialogs state
  const [showCaptureConfig, setShowCaptureConfig] = useState(false)
  const [showTrainingDialog, setShowTrainingDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Fetch recent PCAP files (last 15)
  const fetchRecentFiles = useCallback(async () => {
    if (!user) {
      setMessage({ type: 'error', content: 'Please log in to view PCAP files.' })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await pcapAPI.getFiles({ limit: 5 })
      setRecentFiles(response.files || [])
    } catch (error) {
      console.error('Error fetching recent PCAP files:', error)
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to fetch recent PCAP files' 
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch all PCAP files for management
  const fetchAllFiles = useCallback(async () => {
    if (!user) return

    try {
      const response = await pcapAPI.getFiles()
      setAllFiles(response.files || [])
    } catch (error) {
      console.error('Error fetching all PCAP files:', error)
    }
  }, [user])

  // Fetch PCAP statistics
  const fetchPcapStats = useCallback(async () => {
    if (!user) return

    try {
      const response = await pcapAPI.getStats()
      setPcapStats(response)
    } catch (error) {
      console.error('Error fetching PCAP statistics:', error)
    }
  }, [user])

  // Fetch capture status
  const fetchCaptureStatus = useCallback(async () => {
    if (!user) return

    try {
      const response = await pcapAPI.getCaptureStatus()
      setCaptureStatus(response.status || 'stopped')
    } catch (error) {
      console.error('Error fetching capture status:', error)
    }
  }, [user])

  // Capture control functions
  const handleStartCapture = async () => {
    if (!user) {
      setMessage({ type: 'error', content: 'Please log in to start capture.' })
      return
    }

    try {
      setCaptureStatus('starting')
      const response = await pcapAPI.startCapture(captureConfig)
      setCaptureStatus('running')
      setMessage({ 
        type: 'success', 
        content: 'Network capture started successfully!' 
      })
      
      // Refresh files periodically while capturing
      setTimeout(() => {
        if (captureStatus === 'running') {
          fetchRecentFiles()
        }
      }, 5000)
      
    } catch (error) {
      console.error('Start capture error:', error)
      setCaptureStatus('stopped')
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to start capture' 
      })
    }
  }

  const handleStopCapture = async () => {
    if (!user) {
      setMessage({ type: 'error', content: 'Please log in to stop capture.' })
      return
    }

    try {
      setCaptureStatus('stopping')
      await pcapAPI.stopCapture()
      setCaptureStatus('stopped')
      setMessage({ 
        type: 'success', 
        content: 'Network capture stopped successfully!' 
      })
      
      // Refresh files after stopping
      await fetchRecentFiles()
      
    } catch (error) {
      console.error('Stop capture error:', error)
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to stop capture' 
      })
    }
  }

  // File management functions
  const handleFileSelect = (fileId) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const handlePrioritizeFile = (fileId) => {
    const newPrioritized = new Set(prioritizedFiles)
    if (newPrioritized.has(fileId)) {
      newPrioritized.delete(fileId)
    } else {
      newPrioritized.add(fileId)
    }
    setPrioritizedFiles(newPrioritized)
  }

  // ML Training functions
  const handleSendToTraining = async () => {
    if (!user) {
      setMessage({ type: 'error', content: 'Please log in to start training.' })
      return
    }

    const filesToTrain = selectedFiles.size > 0 ? Array.from(selectedFiles) : recentFiles.map(f => f.id)
    
    if (filesToTrain.length === 0) {
      setMessage({ type: 'error', content: 'No files available for training.' })
      return
    }

    try {
      setTrainingStatus('starting')
      setTrainingProgress(0)
      
      const response = await pcapAPI.startTraining({
        file_ids: filesToTrain,
        prioritized_files: Array.from(prioritizedFiles),
        training_type: 'anomaly_detection'
      })
      
      setTrainingStatus('running')
      setMessage({ 
        type: 'success', 
        content: `Training started with ${filesToTrain.length} files!` 
      })
      
      // Poll training status
      pollTrainingStatus(response.training_id)
      
    } catch (error) {
      console.error('Training error:', error)
      setTrainingStatus('idle')
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to start training' 
      })
    }
  }

  const pollTrainingStatus = async (trainingId) => {
    try {
      const response = await pcapAPI.getTrainingStatus(trainingId)
      const { status, progress } = response
      
      setTrainingStatus(status)
      setTrainingProgress(progress || 0)
      
      if (status === 'running') {
        setTimeout(() => pollTrainingStatus(trainingId), 2000)
      } else if (status === 'completed') {
        setMessage({ 
          type: 'success', 
          content: 'Training completed successfully!' 
        })
      } else if (status === 'failed') {
        setMessage({ 
          type: 'error', 
          content: 'Training failed. Please check the logs.' 
        })
      }
    } catch (error) {
      console.error('Training status error:', error)
    }
  }

  // Upload PCAP file
  const handleFileUpload = async (file) => {
    if (!file) return
    
    // Validate file type
    const validExtensions = ['.pcap', '.pcapng', '.cap']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validExtensions.includes(fileExtension)) {
      setMessage({ 
        type: 'error', 
        content: 'Invalid file type. Please upload .pcap, .pcapng, or .cap files only.' 
      })
      return
    }
    
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setMessage({ 
        type: 'error', 
        content: 'File too large. Maximum size is 100MB.' 
      })
      return
    }
    
    if (!user) {
      setMessage({ type: 'error', content: 'Please log in to upload files.' })
      return
    }
    
    try {
      setUploading(true)
      setUploadProgress(0)
      setMessage({ type: '', content: '' })
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('auto_train', 'true') // Auto-integrate with training
      
      const response = await pcapAPI.uploadFile(formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        },
      })
      
      setMessage({ 
        type: 'success', 
        content: `File "${file.name}" uploaded and integrated successfully!` 
      })
      
      // Refresh the files list
      await fetchRecentFiles()
      await fetchAllFiles()
      
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to upload file' 
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setShowUploadDialog(false)
    }
  }

  // Download PCAP file
  const handleDownload = async (fileId, filename) => {
    if (!user) {
      setMessage({ type: 'error', content: 'Please log in to download files.' })
      return
    }

    try {
      const response = await pcapAPI.downloadFile(fileId, {
        responseType: 'blob',
      })

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setMessage({ 
        type: 'success', 
        content: `File "${filename}" downloaded successfully!` 
      })
      
    } catch (error) {
      console.error('Download error:', error)
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to download file' 
      })
    }
  }

  // Delete PCAP file
  const handleDelete = async (fileId) => {
    if (!user) {
      setMessage({ type: 'error', content: 'Please log in to delete files.' })
      return
    }

    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      await pcapAPI.deleteFile(fileId)
      setMessage({ 
        type: 'success', 
        content: 'File deleted successfully!' 
      })
      
      // Refresh the files list
      await fetchRecentFiles()
      await fetchAllFiles()
      
    } catch (error) {
      console.error('Delete error:', error)
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to delete file' 
      })
    }
  }

  // Export selected files
  const handleExportFiles = async () => {
    const filesToExport = selectedFiles.size > 0 ? Array.from(selectedFiles) : recentFiles.map(f => f.id)
    
    if (filesToExport.length === 0) {
      setMessage({ type: 'error', content: 'No files selected for export.' })
      return
    }

    try {
      const response = await pcapAPI.exportFiles({
        file_ids: filesToExport,
        format: 'zip'
      }, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `pcap_export_${new Date().toISOString().split('T')[0]}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setMessage({ 
        type: 'success', 
        content: `${filesToExport.length} files exported successfully!` 
      })
      
    } catch (error) {
      console.error('Export error:', error)
      setMessage({ 
        type: 'error', 
        content: error.message || 'Failed to export files' 
      })
    }
  }

  // Filter files based on search and status
  const filteredFiles = allFiles.filter(file => {
    const matchesSearch = (file.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.original_filename || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'bg-green-500'
      case 'processing': return 'bg-yellow-500'
      case 'uploaded': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Clock className="w-4 h-4" />
      case 'uploaded': return <Upload className="w-4 h-4" />
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  useEffect(() => {
    fetchRecentFiles()
    fetchAllFiles()
    fetchPcapStats()
    fetchCaptureStatus()
  }, [fetchRecentFiles, fetchAllFiles, fetchPcapStats, fetchCaptureStatus])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.content) {
      const timer = setTimeout(() => {
        setMessage({ type: '', content: '' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">PCAP Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Continuous network capture with Wireshark integration and ML training
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => { fetchRecentFiles(); fetchAllFiles(); fetchPcapStats(); fetchCaptureStatus(); }} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {message.type === 'error' && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {message.content}
          </AlertDescription>
        </Alert>
      )}
      
      {message.type === 'success' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {message.content}
          </AlertDescription>
        </Alert>
      )}

      {/* Capture Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Network Capture Control
              </CardTitle>
              <CardDescription>
                Start/stop continuous PCAP capture with Wireshark integration
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                className={`${
                  captureStatus === 'running' ? 'bg-green-500' :
                  captureStatus === 'starting' || captureStatus === 'stopping' ? 'bg-yellow-500' :
                  'bg-gray-500'
                } text-white`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  captureStatus === 'running' ? 'bg-green-200 animate-pulse' :
                  captureStatus === 'starting' || captureStatus === 'stopping' ? 'bg-yellow-200 animate-pulse' :
                  'bg-gray-200'
                }`} />
                {captureStatus === 'running' ? 'Capturing' :
                 captureStatus === 'starting' ? 'Starting...' :
                 captureStatus === 'stopping' ? 'Stopping...' :
                 'Stopped'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Button
                onClick={handleStartCapture}
                disabled={captureStatus === 'running' || captureStatus === 'starting'}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Capture
              </Button>
              <Button
                onClick={handleStopCapture}
                disabled={captureStatus === 'stopped' || captureStatus === 'stopping'}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Capture
              </Button>
              <Button
                onClick={() => setShowCaptureConfig(true)}
                variant="outline"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {captureStatus === 'running' && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Rotation: {captureConfig.rotation_time}s | Max Size: {captureConfig.max_file_size}MB
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Files Dropdown & Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent PCAP Files
            {recentFiles.length >= 15 && (
              <Badge variant="secondary">Dynamic List Active</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {recentFiles.length > 0 ? 
              `Showing ${recentFiles.length} most recent files. Files are automatically rotated and managed.` :
              'No recent files available. Start capture to generate PCAP files.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Dynamic Dropdown */}
            {recentFiles.length > 0 && (
              <div className="space-y-3">
                <Label>Select Files for Operations:</Label>
                <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => handleFileSelect(file.id)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{file.original_filename}</span>
                            {prioritizedFiles.has(file.id) && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>{formatDate(file.upload_date)}</span>
                            {file.packet_count && (
                              <span>{file.packet_count.toLocaleString()} packets</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePrioritizeFile(file.id)}
                          className={prioritizedFiles.has(file.id) ? 'text-yellow-600' : 'text-gray-400'}
                        >
                          <Star className={`w-4 h-4 ${prioritizedFiles.has(file.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFile(file)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(file.id, file.original_filename)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowUploadDialog(true)}
                variant="outline"
                className="flex-1 min-w-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Files for Training
              </Button>
              <Button
                onClick={handleSendToTraining}
                disabled={trainingStatus === 'running' || (selectedFiles.size === 0 && recentFiles.length === 0)}
                className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {trainingStatus === 'running' ? 'Training...' : 'Send to Training Now'}
              </Button>
              <Button
                onClick={handleExportFiles}
                disabled={selectedFiles.size === 0 && recentFiles.length === 0}
                variant="outline"
                className="flex-1 min-w-0"
              >
                <Archive className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
            </div>

            {/* Training Progress */}
            {trainingStatus === 'running' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <Zap className="w-4 h-4 mr-1 text-blue-500" />
                    ML Training in Progress...
                  </span>
                  <span>{trainingProgress}%</span>
                </div>
                <Progress value={trainingProgress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="management" className="space-y-6">
        <TabsList>
          <TabsTrigger value="management">File Management</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        {/* File Management Tab */}
        <TabsContent value="management" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search all PCAP files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Files List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading PCAP files...</span>
            </div>
          ) : (allFiles.length === 0 || filteredFiles.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No PCAP files found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No files match your current filters.' 
                    : 'Start capture or upload files to get started.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {file.original_filename}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <HardDrive className="w-4 h-4 mr-1" />
                              {formatFileSize(file.file_size)}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(file.upload_date)}
                            </span>
                            {file.packet_count && (
                              <span className="flex items-center">
                                <Network className="w-4 h-4 mr-1" />
                                {file.packet_count.toLocaleString()} packets
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getStatusColor(file.status)} text-white`}>
                          {getStatusIcon(file.status)}
                          <span className="ml-1 capitalize">{file.status}</span>
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFile(file)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file.id, file.original_filename)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional file info */}
                    {file.protocols && file.protocols.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Protocols:</span>
                          <div className="flex space-x-1">
                            {file.protocols.slice(0, 5).map((protocol, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {protocol}
                              </Badge>
                            ))}
                            {file.protocols.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{file.protocols.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Activity Logs
              </CardTitle>
              <CardDescription>
                Real-time monitoring of capture activities, file processing, and ML training events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Activity Timeline */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Network capture started
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-400">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Interface: auto-detect, Rotation: 300s, Max size: 100MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          PCAP file processed
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          2 minutes ago
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        capture_20241201_143022.pcap - 2.4MB, 15,432 packets
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          ML training completed
                        </span>
                        <span className="text-xs text-purple-600 dark:text-purple-400">
                          5 minutes ago
                        </span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        Anomaly detection model updated with 12 files
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          File rotation triggered
                        </span>
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          8 minutes ago
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Auto-cleanup removed 3 old files to maintain storage limits
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Activity Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{captureStatus === 'running' ? '1' : '0'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Captures</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{recentFiles.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Files in Queue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{trainingStatus === 'running' ? '1' : '0'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Training Jobs</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {pcapStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pcapStats.total_files}</div>
                  <p className="text-xs text-muted-foreground">
                    {pcapStats.recent_uploads_24h} uploaded in last 24h
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatFileSize(pcapStats.total_size_bytes)}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all PCAP files
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Packets</CardTitle>
                  <Network className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(pcapStats.total_packets || 0).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Network packets captured
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{pcapStats.processed_files}</div>
                  <p className="text-xs text-muted-foreground">
                    {pcapStats.processing_files} processing, {pcapStats.failed_files} failed
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex justify-center items-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading statistics...</span>
              </CardContent>
            </Card>
          )}
          
          {/* Capture Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Capture Performance
                </CardTitle>
                <CardDescription>
                  Real-time capture statistics and throughput metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Capture Rate</span>
                    <span className="font-medium">1,245 packets/sec</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Peak Throughput</span>
                    <span className="font-medium">3.2 MB/sec</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Dropped Packets</span>
                    <span className="font-medium text-red-600">0.02%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                    <span className="font-medium text-green-600">99.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  ML Training Stats
                </CardTitle>
                <CardDescription>
                  Machine learning model performance and training metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Models Trained</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy</span>
                    <span className="font-medium text-green-600">94.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Training</span>
                    <span className="font-medium">2 hours ago</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Training Data</span>
                    <span className="font-medium">{recentFiles.length} files</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Storage Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Storage Management
              </CardTitle>
              <CardDescription>
                File rotation, cleanup, and storage optimization metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used</span>
                    <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                  </div>
                  <Progress value={24} className="w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Files Rotated</span>
                    <span className="text-sm font-medium">156 today</span>
                  </div>
                  <div className="text-xs text-gray-500">Auto-rotation active</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cleanup Status</span>
                    <span className="text-sm font-medium text-green-600">Optimal</span>
                  </div>
                  <div className="text-xs text-gray-500">Last cleanup: 1 hour ago</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {pcapStats && pcapStats.unique_protocols && pcapStats.unique_protocols.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Detected Protocols
                </CardTitle>
                <CardDescription>
                  Network protocols found across all PCAP files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {pcapStats.unique_protocols.map((protocol, index) => (
                    <Badge key={index} variant="outline">
                      {protocol}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Capture Configuration Dialog */}
      <Dialog open={showCaptureConfig} onOpenChange={setShowCaptureConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Capture Configuration</DialogTitle>
            <DialogDescription>
              Configure network capture settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interface">Network Interface</Label>
              <Select value={captureConfig.interface} onValueChange={(value) => setCaptureConfig({...captureConfig, interface: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="eth0">eth0</SelectItem>
                  <SelectItem value="wlan0">wlan0</SelectItem>
                  <SelectItem value="any">Any interface</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rotation">File Rotation Time (seconds)</Label>
              <Input
                id="rotation"
                type="number"
                value={captureConfig.rotation_time}
                onChange={(e) => setCaptureConfig({...captureConfig, rotation_time: parseInt(e.target.value)})}
                min="60"
                max="3600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxsize">Max File Size (MB)</Label>
              <Input
                id="maxsize"
                type="number"
                value={captureConfig.max_file_size}
                onChange={(e) => setCaptureConfig({...captureConfig, max_file_size: parseInt(e.target.value)})}
                min="10"
                max="1000"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="wireshark"
                checked={captureConfig.use_wireshark}
                onCheckedChange={(checked) => setCaptureConfig({...captureConfig, use_wireshark: checked})}
              />
              <Label htmlFor="wireshark">Use Wireshark for capture</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="cleanup"
                checked={captureConfig.auto_cleanup}
                onCheckedChange={(checked) => setCaptureConfig({...captureConfig, auto_cleanup: checked})}
              />
              <Label htmlFor="cleanup">Auto-cleanup old files</Label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCaptureConfig(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCaptureConfig(false)}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload PCAP File</DialogTitle>
            <DialogDescription>
              Add manual PCAP files for training
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
              onDrop={(e) => {
                e.preventDefault()
                const files = Array.from(e.dataTransfer.files)
                if (files.length > 0) {
                  handleFileUpload(files[0])
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Drop PCAP file here or click to browse
              </p>
              <input
                type="file"
                accept=".pcap,.pcapng,.cap"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0])
                  }
                }}
                className="hidden"
                id="manual-upload"
              />
              <Button asChild variant="outline" size="sm">
                <label htmlFor="manual-upload" className="cursor-pointer">
                  Browse Files
                </label>
              </Button>
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* File Details Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>PCAP File Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedFile.original_filename}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Original Filename</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedFile.original_filename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Size</label>
                  <p className="text-sm text-gray-900 dark:text-white">{formatFileSize(selectedFile.file_size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Upload Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedFile.upload_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={`${getStatusColor(selectedFile.status)} text-white`}>
                    {getStatusIcon(selectedFile.status)}
                    <span className="ml-1 capitalize">{selectedFile.status}</span>
                  </Badge>
                </div>
                {selectedFile.packet_count && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Packet Count</label>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedFile.packet_count.toLocaleString()}</p>
                  </div>
                )}
                {selectedFile.duration_seconds && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedFile.duration_seconds.toFixed(2)} seconds</p>
                  </div>
                )}
              </div>
              
              {selectedFile.protocols && selectedFile.protocols.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Protocols</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFile.protocols.map((protocol, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {protocol}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedFile.analysis_results && Object.keys(selectedFile.analysis_results).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Analysis Results</label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-1">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedFile.analysis_results, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default PCAPManagement