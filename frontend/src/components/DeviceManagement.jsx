import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Network,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Server,
  Monitor,
  Cpu,
  HardDrive,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  validateIP, 
  validateMACAddress, 
  sanitizeInput, 
  sanitizeSearchQuery, 
  sanitizeFilename,
  RateLimiter 
} from '@/utils/security'

const DeviceManagement = ({ systemStatus }) => {
  const [devices, setDevices] = useState([])
  const [filteredDevices, setFilteredDevices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false)
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Rate limiter for device operations
  const deviceRateLimiter = new RateLimiter(10, 60000) // 10 operations per minute
  const [newDevice, setNewDevice] = useState({
    name: '',
    ip: '',
    mac: '',
    type: 'PLC',
    vendor: '',
    model: '',
    location: '',
    criticality: 'Low'
  })
  const [editDevice, setEditDevice] = useState({
    name: '',
    ip: '',
    mac: '',
    type: 'PLC',
    vendor: '',
    model: '',
    location: '',
    criticality: 'Low'
  })

  // Sample device data
  useEffect(() => {
    const sampleDevices = [
      {
        id: 1,
        name: 'PLC-001',
        ip: '192.168.1.10',
        mac: '00:1B:1B:12:34:56',
        type: 'PLC',
        vendor: 'Siemens',
        model: 'S7-1200',
        status: 'online',
        lastSeen: new Date().toISOString(),
        protocols: ['Modbus', 'Profinet'],
        ports: [502, 34962],
        criticality: 'High',
        location: 'Production Line A',
        firmware: 'v4.2.1'
      },
      {
        id: 2,
        name: 'HMI-Station-01',
        ip: '192.168.1.15',
        mac: '00:50:C2:78:90:AB',
        type: 'HMI',
        vendor: 'Schneider Electric',
        model: 'Magelis GTO',
        status: 'online',
        lastSeen: new Date().toISOString(),
        protocols: ['OPC-UA', 'Modbus'],
        ports: [4840, 502],
        criticality: 'Medium',
        location: 'Control Room',
        firmware: 'v2.1.5'
      },
      {
        id: 3,
        name: 'RTU-North-01',
        ip: '192.168.2.20',
        mac: '00:A0:45:CD:EF:12',
        type: 'RTU',
        vendor: 'General Electric',
        model: 'D20MX',
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        protocols: ['DNP3'],
        ports: [20000],
        criticality: 'Critical',
        location: 'Substation North',
        firmware: 'v1.8.3'
      },
      {
        id: 4,
        name: 'SCADA-Server-01',
        ip: '192.168.1.100',
        mac: '00:15:5D:AB:CD:EF',
        type: 'Server',
        vendor: 'Dell',
        model: 'PowerEdge R740',
        status: 'online',
        lastSeen: new Date().toISOString(),
        protocols: ['HTTP', 'HTTPS', 'OPC-UA'],
        ports: [80, 443, 4840],
        criticality: 'Critical',
        location: 'Data Center',
        firmware: 'BIOS 2.8.1'
      },
      {
        id: 5,
        name: 'Switch-Core-01',
        ip: '192.168.1.1',
        mac: '00:23:04:12:34:56',
        type: 'Network',
        vendor: 'Cisco',
        model: 'Catalyst 2960',
        status: 'online',
        lastSeen: new Date().toISOString(),
        protocols: ['SNMP', 'SSH'],
        ports: [22, 161],
        criticality: 'High',
        location: 'Network Closet',
        firmware: 'IOS 15.2(4)E'
      }
    ]
    setDevices(sampleDevices)
    setFilteredDevices(sampleDevices)
  }, [])

  // Filter devices based on search and filter criteria
  useEffect(() => {
    let filtered = devices

    if (searchTerm) {
      // Sanitize search term to prevent XSS
      const sanitizedSearchTerm = sanitizeSearchQuery(searchTerm)
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(sanitizedSearchTerm.toLowerCase()) ||
        device.ip.includes(sanitizedSearchTerm) ||
        device.vendor.toLowerCase().includes(sanitizedSearchTerm.toLowerCase()) ||
        device.type.toLowerCase().includes(sanitizedSearchTerm.toLowerCase())
      )
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(device => {
        switch (selectedFilter) {
          case 'online':
            return device.status === 'online'
          case 'offline':
            return device.status === 'offline'
          case 'critical':
            return device.criticality === 'Critical'
          case 'plc':
            return device.type === 'PLC'
          case 'hmi':
            return device.type === 'HMI'
          case 'server':
            return device.type === 'Server'
          default:
            return true
        }
      })
    }

    setFilteredDevices(filtered)
  }, [devices, searchTerm, selectedFilter])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PLC':
        return <Cpu className="w-4 h-4 text-blue-400" />
      case 'HMI':
        return <Monitor className="w-4 h-4 text-purple-400" />
      case 'RTU':
        return <Server className="w-4 h-4 text-green-400" />
      case 'Server':
        return <HardDrive className="w-4 h-4 text-orange-400" />
      case 'Network':
        return <Network className="w-4 h-4 text-cyan-400" />
      default:
        return <Server className="w-4 h-4 text-gray-400" />
    }
  }

  const getCriticalityColor = (criticality) => {
    switch (criticality) {
      case 'Critical':
        return 'text-red-400 bg-red-500/20'
      case 'High':
        return 'text-orange-400 bg-orange-500/20'
      case 'Medium':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'Low':
        return 'text-green-400 bg-green-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const handleScanNetwork = () => {
    setIsScanning(true)
    // Simulate network scan
    setTimeout(() => {
      setIsScanning(false)
      // Add a new discovered device
      const discoveredDevice = {
        id: devices.length + 1,
        name: `Device-${Math.floor(Math.random() * 1000)}`,
        ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        mac: '00:XX:XX:XX:XX:XX',
        type: 'Unknown',
        vendor: 'Unknown',
        model: 'Unknown',
        status: 'online',
        lastSeen: new Date().toISOString(),
        protocols: [],
        ports: [],
        criticality: 'Low',
        location: 'Unknown',
        firmware: 'Unknown'
      }
      setDevices(prev => [...prev, discoveredDevice])
    }, 3000)
  }

  const handleAddDevice = () => {
    setShowAddDeviceModal(true)
  }

  const handleSaveDevice = () => {
    // Rate limiting check
    if (!deviceRateLimiter.isAllowed()) {
      setErrors({ general: 'Too many device operations. Please wait before trying again.' })
      return
    }

    // Clear previous errors
    setErrors({})
    const validationErrors = {}

    // Sanitize and validate inputs
    const sanitizedName = sanitizeInput(newDevice.name)
    const sanitizedIP = sanitizeInput(newDevice.ip)
    const sanitizedMAC = sanitizeInput(newDevice.mac)
    const sanitizedVendor = sanitizeInput(newDevice.vendor)
    const sanitizedModel = sanitizeInput(newDevice.model)
    const sanitizedLocation = sanitizeInput(newDevice.location)

    // Validate required fields
    if (!sanitizedName.trim()) {
      validationErrors.name = 'Device name is required'
    }
    if (!sanitizedIP.trim()) {
      validationErrors.ip = 'IP address is required'
    } else if (!validateIP(sanitizedIP)) {
      validationErrors.ip = 'Invalid IP address format'
    }
    if (sanitizedMAC && !validateMACAddress(sanitizedMAC)) {
      validationErrors.mac = 'Invalid MAC address format'
    }

    // Check for duplicate IP
    if (devices.some(device => device.ip === sanitizedIP)) {
      validationErrors.ip = 'IP address already exists'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const deviceToAdd = {
      id: devices.length + 1,
      name: sanitizedName,
      ip: sanitizedIP,
      mac: sanitizedMAC,
      type: newDevice.type,
      vendor: sanitizedVendor,
      model: sanitizedModel,
      location: sanitizedLocation,
      criticality: newDevice.criticality,
      status: 'online',
      lastSeen: new Date().toISOString(),
      protocols: [],
      ports: [],
      firmware: 'Unknown'
    }
    setDevices(prev => [...prev, deviceToAdd])
    setNewDevice({
      name: '',
      ip: '',
      mac: '',
      type: 'PLC',
      vendor: '',
      model: '',
      location: '',
      criticality: 'Low'
    })
    setShowAddDeviceModal(false)
  }

  const handleExportDevices = () => {
    // Rate limiting check
    if (!deviceRateLimiter.isAllowed()) {
      setErrors({ general: 'Too many operations. Please wait before trying again.' })
      return
    }

    const csvContent = [
      ['Name', 'IP Address', 'MAC Address', 'Type', 'Vendor', 'Model', 'Status', 'Criticality', 'Location', 'Last Seen'],
      ...filteredDevices.map(device => [
        sanitizeInput(device.name),
        sanitizeInput(device.ip),
        sanitizeInput(device.mac),
        sanitizeInput(device.type),
        sanitizeInput(device.vendor),
        sanitizeInput(device.model),
        sanitizeInput(device.status),
        sanitizeInput(device.criticality),
        sanitizeInput(device.location),
        new Date(device.lastSeen).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Sanitize filename
    const baseFilename = `devices_export_${new Date().toISOString().split('T')[0]}`
    const sanitizedFilename = sanitizeFilename(baseFilename)
    link.download = `${sanitizedFilename}.csv`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Handler functions for device detail actions
  const handleEditDevice = () => {
    if (!selectedDevice) return
    
    setEditDevice({
      name: selectedDevice.name,
      ip: selectedDevice.ip,
      mac: selectedDevice.mac,
      type: selectedDevice.type,
      vendor: selectedDevice.vendor,
      model: selectedDevice.model,
      location: selectedDevice.location,
      criticality: selectedDevice.criticality
    })
    setShowEditDeviceModal(true)
  }

  const handleSaveEditDevice = () => {
    setDevices(prev => prev.map(device => 
      device.id === selectedDevice.id 
        ? { ...device, ...editDevice, lastSeen: new Date().toISOString() }
        : device
    ))
    setShowEditDeviceModal(false)
    setSelectedDevice(null)
  }

  const handleScanDevice = () => {
    if (!selectedDevice) return
    
    // Simulate device scanning
    const scanResults = {
      status: Math.random() > 0.2 ? 'online' : 'offline',
      lastSeen: new Date().toISOString(),
      ports: [502, 4840, 34962, 44818].filter(() => Math.random() > 0.5),
      protocols: ['Modbus', 'OPC-UA', 'Profinet', 'EtherNet/IP'].filter(() => Math.random() > 0.6),
      firmware: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`
    }
    
    setDevices(prev => prev.map(device => 
      device.id === selectedDevice.id 
        ? { ...device, ...scanResults }
        : device
    ))
    
    // Update selected device to reflect changes
    setSelectedDevice(prev => ({ ...prev, ...scanResults }))
    
    alert(`Device scan completed!\nStatus: ${scanResults.status}\nPorts found: ${scanResults.ports.join(', ') || 'None'}\nProtocols: ${scanResults.protocols.join(', ') || 'None'}`)
  }

  const handleDeleteDevice = () => {
    if (!selectedDevice) return
    
    if (window.confirm(`Are you sure you want to delete device "${selectedDevice.name}"? This action cannot be undone.`)) {
      setDevices(prev => prev.filter(device => device.id !== selectedDevice.id))
      setSelectedDevice(null)
    }
  }

  const DeviceCard = ({ device }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getTypeIcon(device.type)}
          <div>
            <h3 className="text-white font-semibold">{device.name}</h3>
            <p className="text-slate-400 text-sm">{device.ip}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(device.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCriticalityColor(device.criticality)}`}>
            {device.criticality}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-slate-400">Vendor:</span>
          <span className="text-white ml-2">{device.vendor}</span>
        </div>
        <div>
          <span className="text-slate-400">Model:</span>
          <span className="text-white ml-2">{device.model}</span>
        </div>
        <div>
          <span className="text-slate-400">Location:</span>
          <span className="text-white ml-2">{device.location}</span>
        </div>
        <div>
          <span className="text-slate-400">Protocols:</span>
          <span className="text-white ml-2">{device.protocols.join(', ') || 'None'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Last seen: {new Date(device.lastSeen).toLocaleString()}
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDevice(device)}
            className="text-blue-400 hover:text-blue-300"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDevice(device)
              handleEditDevice()
            }}
            className="text-green-400 hover:text-green-300"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDevice(device)
              handleDeleteDevice()
            }}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Device Management</h1>
          <p className="text-slate-400">Monitor and manage your ICS/OT infrastructure</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleScanNetwork}
            disabled={isScanning}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {isScanning ? 'Scanning...' : 'Scan Network'}
          </Button>
          <Button variant="outline" onClick={handleAddDevice}>
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{devices.length}</p>
              <p className="text-slate-400 text-sm">Total Devices</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {devices.filter(d => d.status === 'online').length}
              </p>
              <p className="text-slate-400 text-sm">Online</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {devices.filter(d => d.status === 'offline').length}
              </p>
              <p className="text-slate-400 text-sm">Offline</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {devices.filter(d => d.criticality === 'Critical').length}
              </p>
              <p className="text-slate-400 text-sm">Critical</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search devices by name, IP, vendor, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Devices</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="critical">Critical</option>
            <option value="plc">PLCs</option>
            <option value="hmi">HMIs</option>
            <option value="server">Servers</option>
          </select>

          <Button variant="outline" onClick={handleExportDevices}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Device Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {filteredDevices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </motion.div>

      {/* Device Details Modal */}
      {selectedDevice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDevice(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Device Details</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedDevice(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">Device Name</label>
                  <p className="text-white font-medium">{selectedDevice.name}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">IP Address</label>
                  <p className="text-white font-medium">{selectedDevice.ip}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">MAC Address</label>
                  <p className="text-white font-medium">{selectedDevice.mac}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Device Type</label>
                  <p className="text-white font-medium">{selectedDevice.type}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Vendor</label>
                  <p className="text-white font-medium">{selectedDevice.vendor}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Model</label>
                  <p className="text-white font-medium">{selectedDevice.model}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">Status</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedDevice.status)}
                    <span className="text-white font-medium capitalize">{selectedDevice.status}</span>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Criticality</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCriticalityColor(selectedDevice.criticality)}`}>
                    {selectedDevice.criticality}
                  </span>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Location</label>
                  <p className="text-white font-medium">{selectedDevice.location}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Firmware</label>
                  <p className="text-white font-medium">{selectedDevice.firmware}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Protocols</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDevice.protocols.map((protocol, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {protocol}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Open Ports</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDevice.ports.map((port, index) => (
                      <span key={index} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        {port}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700 flex space-x-3">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEditDevice}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Device
              </Button>
              <Button variant="outline" onClick={handleScanDevice}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Scan Device
              </Button>
              <Button variant="outline" className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white" onClick={handleDeleteDevice}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Add Device Modal */}
      {showAddDeviceModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddDeviceModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Device</h2>
              <Button
                variant="ghost"
                onClick={() => setShowAddDeviceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Device Name *</label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter device name"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">IP Address *</label>
                <input
                  type="text"
                  value={newDevice.ip}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, ip: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">MAC Address</label>
                <input
                  type="text"
                  value={newDevice.mac}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, mac: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00:11:22:33:44:55"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Device Type *</label>
                <select
                  value={newDevice.type}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PLC">PLC</option>
                  <option value="HMI">HMI</option>
                  <option value="Server">Server</option>
                  <option value="Network">Network Device</option>
                  <option value="Sensor">Sensor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Vendor</label>
                <input
                  type="text"
                  value={newDevice.vendor}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, vendor: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Device vendor"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Model</label>
                <input
                  type="text"
                  value={newDevice.model}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Device model"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Location</label>
                <input
                  type="text"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Physical location"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Criticality *</label>
                <select
                  value={newDevice.criticality}
                  onChange={(e) => setNewDevice(prev => ({ ...prev, criticality: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleSaveDevice}
                disabled={!newDevice.name || !newDevice.ip || !newDevice.type}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Device
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDeviceModal(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Device Modal */}
      {showEditDeviceModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowEditDeviceModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-6">Edit Device</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Device Name *</label>
                <input
                  type="text"
                  value={editDevice.name}
                  onChange={(e) => setEditDevice(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter device name"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">IP Address *</label>
                <input
                  type="text"
                  value={editDevice.ip}
                  onChange={(e) => setEditDevice(prev => ({ ...prev, ip: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">MAC Address</label>
                <input
                  type="text"
                  value={editDevice.mac}
                  onChange={(e) => setEditDevice(prev => ({ ...prev, mac: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00:11:22:33:44:55"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Device Type *</label>
                <select
                  value={editDevice.type}
                  onChange={(e) => setEditDevice(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PLC">PLC</option>
                  <option value="HMI">HMI</option>
                  <option value="Server">Server</option>
                  <option value="Network">Network Device</option>
                  <option value="Sensor">Sensor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Vendor</label>
                <input
                  type="text"
                  value={editDevice.vendor}
                  onChange={(e) => setEditDevice(prev => ({ ...prev, vendor: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Device vendor"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Model</label>
                <input
                  type="text"
                  value={editDevice.model}
                  onChange={(e) => setEditDevice(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Device model"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Location</label>
                <input
                  type="text"
                  value={editDevice.location}
                  onChange={(e) => setEditDevice(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Physical location"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Criticality *</label>
                <select
                  value={editDevice.criticality}
                  onChange={(e) => setEditDevice(prev => ({ ...prev, criticality: e.target.value }))}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button 
                onClick={handleSaveEditDevice}
                disabled={!editDevice.name || !editDevice.ip || !editDevice.type}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditDeviceModal(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default DeviceManagement

