import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Network,
  Server,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings,
  RefreshCw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const NetworkTopology = ({ systemStatus }) => {
  const [selectedNode, setSelectedNode] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [networkData, setNetworkData] = useState({})
  const [isScanning, setIsScanning] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showMonitorModal, setShowMonitorModal] = useState(false)
  const [selectedConfigOption, setSelectedConfigOption] = useState('')
  const [monitoringData, setMonitoringData] = useState(null)

  // Sample network topology data
  useEffect(() => {
    const sampleNetwork = {
      nodes: [
        {
          id: 'internet',
          type: 'internet',
          name: 'Internet',
          x: 400,
          y: 50,
          status: 'online',
          connections: ['firewall']
        },
        {
          id: 'firewall',
          type: 'firewall',
          name: 'Firewall',
          x: 400,
          y: 150,
          status: 'online',
          connections: ['switch-dmz', 'switch-corp']
        },
        {
          id: 'switch-dmz',
          type: 'switch',
          name: 'DMZ Switch',
          x: 200,
          y: 250,
          status: 'online',
          connections: ['web-server', 'mail-server']
        },
        {
          id: 'switch-corp',
          type: 'switch',
          name: 'Corporate Switch',
          x: 600,
          y: 250,
          status: 'online',
          connections: ['switch-ot', 'workstation-1', 'workstation-2']
        },
        {
          id: 'switch-ot',
          type: 'switch',
          name: 'OT Network Switch',
          x: 600,
          y: 400,
          status: 'online',
          connections: ['plc-1', 'plc-2', 'hmi-1', 'scada-server']
        },
        {
          id: 'web-server',
          type: 'server',
          name: 'Web Server',
          x: 100,
          y: 350,
          status: 'online',
          ip: '192.168.1.10',
          criticality: 'Medium'
        },
        {
          id: 'mail-server',
          type: 'server',
          name: 'Mail Server',
          x: 300,
          y: 350,
          status: 'online',
          ip: '192.168.1.11',
          criticality: 'Medium'
        },
        {
          id: 'workstation-1',
          type: 'workstation',
          name: 'Admin Workstation',
          x: 500,
          y: 350,
          status: 'online',
          ip: '192.168.2.10',
          criticality: 'High'
        },
        {
          id: 'workstation-2',
          type: 'workstation',
          name: 'Engineering WS',
          x: 700,
          y: 350,
          status: 'online',
          ip: '192.168.2.11',
          criticality: 'High'
        },
        {
          id: 'scada-server',
          type: 'server',
          name: 'SCADA Server',
          x: 450,
          y: 500,
          status: 'online',
          ip: '192.168.3.100',
          criticality: 'Critical'
        },
        {
          id: 'plc-1',
          type: 'plc',
          name: 'PLC-001',
          x: 550,
          y: 500,
          status: 'online',
          ip: '192.168.3.10',
          criticality: 'Critical'
        },
        {
          id: 'plc-2',
          type: 'plc',
          name: 'PLC-002',
          x: 650,
          y: 500,
          status: 'online',
          ip: '192.168.3.11',
          criticality: 'Critical'
        },
        {
          id: 'hmi-1',
          type: 'hmi',
          name: 'HMI Station',
          x: 750,
          y: 500,
          status: 'online',
          ip: '192.168.3.15',
          criticality: 'High'
        },
        {
          id: 'rtu-1',
          type: 'rtu',
          name: 'RTU-North',
          x: 350,
          y: 600,
          status: 'offline',
          ip: '192.168.4.20',
          criticality: 'Critical'
        }
      ],
      connections: [
        { from: 'internet', to: 'firewall' },
        { from: 'firewall', to: 'switch-dmz' },
        { from: 'firewall', to: 'switch-corp' },
        { from: 'switch-dmz', to: 'web-server' },
        { from: 'switch-dmz', to: 'mail-server' },
        { from: 'switch-corp', to: 'switch-ot' },
        { from: 'switch-corp', to: 'workstation-1' },
        { from: 'switch-corp', to: 'workstation-2' },
        { from: 'switch-ot', to: 'scada-server' },
        { from: 'switch-ot', to: 'plc-1' },
        { from: 'switch-ot', to: 'plc-2' },
        { from: 'switch-ot', to: 'hmi-1' },
        { from: 'scada-server', to: 'rtu-1' }
      ]
    }
    setNetworkData(sampleNetwork)
  }, [])

  const getNodeIcon = (type) => {
    switch (type) {
      case 'internet':
        return <Wifi className="w-6 h-6" />
      case 'firewall':
        return <Shield className="w-6 h-6" />
      case 'switch':
        return <Network className="w-6 h-6" />
      case 'server':
        return <Server className="w-6 h-6" />
      case 'workstation':
        return <Monitor className="w-6 h-6" />
      case 'plc':
        return <Cpu className="w-6 h-6" />
      case 'hmi':
        return <Monitor className="w-6 h-6" />
      case 'rtu':
        return <HardDrive className="w-6 h-6" />
      default:
        return <Server className="w-6 h-6" />
    }
  }

  const getNodeColor = (node) => {
    if (node.status === 'offline') return 'text-red-400 bg-red-500/20 border-red-500'
    
    switch (node.criticality) {
      case 'Critical':
        return 'text-red-400 bg-red-500/20 border-red-500'
      case 'High':
        return 'text-orange-400 bg-orange-500/20 border-orange-500'
      case 'Medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500'
      case 'Low':
        return 'text-green-400 bg-green-500/20 border-green-500'
      default:
        return 'text-blue-400 bg-blue-500/20 border-blue-500'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      case 'offline':
        return <AlertTriangle className="w-3 h-3 text-red-400" />
      default:
        return <AlertTriangle className="w-3 h-3 text-yellow-400" />
    }
  }

  const filteredNodes = networkData.nodes?.filter(node => {
    if (filterType === 'all') return true
    if (filterType === 'critical') return node.criticality === 'Critical'
    if (filterType === 'offline') return node.status === 'offline'
    if (filterType === 'ot') return ['plc', 'hmi', 'rtu', 'scada'].includes(node.type)
    return node.type === filterType
  }) || []

  // Handler functions for buttons
  const handleRefresh = () => {
    console.log('Refreshing network topology...')
    // Simulate network refresh
    setIsScanning(true)
    setTimeout(() => {
      // Update network data with fresh timestamps
      const updatedNodes = networkData.nodes?.map(node => ({
        ...node,
        lastSeen: new Date().toISOString()
      })) || []
      
      setNetworkData(prev => ({
        ...prev,
        nodes: updatedNodes,
        lastRefresh: new Date().toISOString()
      }))
      setIsScanning(false)
    }, 2000)
  }

  const handleScanNetwork = () => {
    console.log('Scanning network for new devices...')
    setIsScanning(true)
    setTimeout(() => {
      // Simulate discovering new devices
      const newDevice = {
        id: `device-${Date.now()}`,
        type: 'workstation',
        name: `New Device ${Math.floor(Math.random() * 100)}`,
        x: 300 + Math.random() * 200,
        y: 300 + Math.random() * 200,
        status: 'online',
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        criticality: 'Medium'
      }
      
      setNetworkData(prev => ({
        ...prev,
        nodes: [...(prev.nodes || []), newDevice]
      }))
      setIsScanning(false)
    }, 3000)
  }

  const handleExportTopology = () => {
    console.log('Exporting network topology...')
    const topologyData = {
      exportDate: new Date().toISOString(),
      networkName: 'Industrial Control System Network',
      totalDevices: networkData.nodes?.length || 0,
      onlineDevices: networkData.nodes?.filter(n => n.status === 'online').length || 0,
      criticalAssets: networkData.nodes?.filter(n => n.criticality === 'Critical').length || 0,
      nodes: networkData.nodes || [],
      connections: networkData.connections || [],
      zones: [
        { name: 'DMZ', type: 'demilitarized', devices: networkData.nodes?.filter(n => ['web-server', 'mail-server'].includes(n.id)).length || 0 },
        { name: 'Corporate', type: 'corporate', devices: networkData.nodes?.filter(n => n.id.includes('workstation')).length || 0 },
        { name: 'OT Network', type: 'operational', devices: networkData.nodes?.filter(n => ['plc', 'hmi', 'rtu', 'scada'].includes(n.type)).length || 0 }
      ]
    }
    
    const dataStr = JSON.stringify(topologyData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `network-topology-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true)
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false)
      })
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [])

  // Device management handlers
  const handleConfigureDevice = (device) => {
    console.log('Configuring device:', device.name)
    setShowConfigModal(true)
  }

  const applyDeviceConfiguration = () => {
    if (!selectedConfigOption) {
      alert('Please select a configuration option')
      return
    }
    
    console.log(`Applying configuration: ${selectedConfigOption} to ${selectedNode.name}`)
    alert(`Configuration "${selectedConfigOption}" applied successfully to ${selectedNode.name}!`)
    setShowConfigModal(false)
    setSelectedConfigOption('')
  }

  const handleMonitorDevice = (device) => {
    console.log('Starting monitoring for device:', device.name)
    // Generate real-time monitoring data
    const newMonitoringData = {
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      networkTraffic: Math.floor(Math.random() * 1000),
      uptime: Math.floor(Math.random() * 365) + ' days',
      lastSeen: new Date().toLocaleString(),
      temperature: Math.floor(Math.random() * 40) + 20 + '°C',
      diskUsage: Math.floor(Math.random() * 100),
      connectionStatus: 'Active'
    }
    
    setMonitoringData(newMonitoringData)
    setShowMonitorModal(true)
  }

  const NetworkNode = ({ node }) => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: zoomLevel }}
      whileHover={{ scale: zoomLevel * 1.1 }}
      className={`absolute cursor-pointer ${getNodeColor(node)} border-2 rounded-xl p-3 backdrop-blur-sm transition-all duration-300`}
      style={{
        left: node.x * zoomLevel,
        top: node.y * zoomLevel,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={() => setSelectedNode(node)}
    >
      <div className="flex flex-col items-center space-y-1">
        {getNodeIcon(node.type)}
        {showLabels && (
          <div className="text-center">
            <div className="text-xs font-medium text-white">{node.name}</div>
            {node.ip && <div className="text-xs text-slate-400">{node.ip}</div>}
          </div>
        )}
        <div className="absolute -top-1 -right-1">
          {getStatusIcon(node.status)}
        </div>
      </div>
    </motion.div>
  )

  const ConnectionLine = ({ connection }) => {
    const fromNode = networkData.nodes?.find(n => n.id === connection.from)
    const toNode = networkData.nodes?.find(n => n.id === connection.to)
    
    if (!fromNode || !toNode) return null

    return (
      <line
        x1={fromNode.x * zoomLevel}
        y1={fromNode.y * zoomLevel}
        x2={toNode.x * zoomLevel}
        y2={toNode.y * zoomLevel}
        stroke="#475569"
        strokeWidth="2"
        strokeDasharray={fromNode.status === 'offline' || toNode.status === 'offline' ? '5,5' : 'none'}
        opacity={0.6}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Network Topology</h1>
          <p className="text-slate-400">Visualize and monitor your network infrastructure</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-800/50 rounded-lg p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm px-2">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowLabels(!showLabels)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showLabels ? 'Hide' : 'Show'} Labels
          </Button>
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isScanning}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center space-x-4"
      >
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Devices</option>
          <option value="critical">Critical Only</option>
          <option value="offline">Offline Only</option>
          <option value="ot">OT Devices</option>
          <option value="server">Servers</option>
          <option value="switch">Switches</option>
        </select>

        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-400">Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-400">Offline</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-400">Critical</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-slate-400">High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-slate-400">Medium</span>
          </div>
        </div>
      </motion.div>

      {/* Network Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Topology Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 overflow-auto"
          style={{ minHeight: '600px' }}
        >
          <div className="relative" style={{ width: '800px', height: '700px' }}>
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {networkData.connections?.map((connection, index) => (
                <ConnectionLine key={index} connection={connection} />
              ))}
            </svg>

            {/* Network Nodes */}
            {filteredNodes.map((node) => (
              <NetworkNode key={node.id} node={node} />
            ))}

            {/* Network Zones */}
            <div className="absolute inset-0 pointer-events-none">
              {/* DMZ Zone */}
              <div
                className="absolute border-2 border-dashed border-blue-500/30 bg-blue-500/5 rounded-lg"
                style={{
                  left: 50 * zoomLevel,
                  top: 200 * zoomLevel,
                  width: 300 * zoomLevel,
                  height: 200 * zoomLevel
                }}
              >
                <div className="absolute top-2 left-2 text-blue-400 text-sm font-medium">DMZ</div>
              </div>

              {/* Corporate Zone */}
              <div
                className="absolute border-2 border-dashed border-green-500/30 bg-green-500/5 rounded-lg"
                style={{
                  left: 450 * zoomLevel,
                  top: 200 * zoomLevel,
                  width: 300 * zoomLevel,
                  height: 200 * zoomLevel
                }}
              >
                <div className="absolute top-2 left-2 text-green-400 text-sm font-medium">Corporate</div>
              </div>

              {/* OT Zone */}
              <div
                className="absolute border-2 border-dashed border-red-500/30 bg-red-500/5 rounded-lg"
                style={{
                  left: 300 * zoomLevel,
                  top: 450 * zoomLevel,
                  width: 500 * zoomLevel,
                  height: 200 * zoomLevel
                }}
              >
                <div className="absolute top-2 left-2 text-red-400 text-sm font-medium">OT Network</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Device Details Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Selected Device */}
          {selectedNode ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Device Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getNodeColor(selectedNode)}`}>
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{selectedNode.name}</h4>
                    <p className="text-slate-400 text-sm capitalize">{selectedNode.type}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedNode.status)}
                      <span className="text-white capitalize">{selectedNode.status}</span>
                    </div>
                  </div>
                  {selectedNode.ip && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Address</span>
                      <span className="text-white">{selectedNode.ip}</span>
                    </div>
                  )}
                  {selectedNode.criticality && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Criticality</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedNode.criticality === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        selectedNode.criticality === 'High' ? 'bg-orange-500/20 text-orange-400' :
                        selectedNode.criticality === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {selectedNode.criticality}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <Button 
                    className="w-full mb-2" 
                    size="sm"
                    onClick={() => handleConfigureDevice(selectedNode)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => handleMonitorDevice(selectedNode)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Monitor
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Device Details</h3>
              <p className="text-slate-400 text-center">Click on a device to view details</p>
            </div>
          )}

          {/* Network Statistics */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Network Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Devices</span>
                <span className="text-white font-medium">{networkData.nodes?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Online</span>
                <span className="text-green-400 font-medium">
                  {networkData.nodes?.filter(n => n.status === 'online').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Offline</span>
                <span className="text-red-400 font-medium">
                  {networkData.nodes?.filter(n => n.status === 'offline').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Critical Assets</span>
                <span className="text-red-400 font-medium">
                  {networkData.nodes?.filter(n => n.criticality === 'Critical').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Connections</span>
                <span className="text-white font-medium">{networkData.connections?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                onClick={handleScanNetwork}
                disabled={isScanning}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Network'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                onClick={handleExportTopology}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Topology
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                onClick={handleFullScreen}
              >
                <Maximize className="w-4 h-4 mr-2" />
                {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Configure Device Modal */}
      {showConfigModal && selectedNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Configure {selectedNode.name}</h3>
            <p className="text-slate-400 mb-4">Select a configuration option for this {selectedNode.type}:</p>
            <div className="space-y-2 mb-6">
              {[
                'Update firmware',
                'Modify network settings',
                'Configure security policies',
                'Set operational parameters',
                'Adjust monitoring thresholds',
                'Update access controls'
              ].map((option) => (
                <label key={option} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="configOption"
                    value={option}
                    checked={selectedConfigOption === option}
                    onChange={(e) => setSelectedConfigOption(e.target.value)}
                    className="text-blue-500"
                  />
                  <span className="text-white">{option}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-3">
              <Button onClick={applyDeviceConfiguration} className="flex-1">
                Apply Configuration
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfigModal(false)
                  setSelectedConfigOption('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Monitor Device Modal */}
      {showMonitorModal && selectedNode && monitoringData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Monitor {selectedNode.name}</h3>
            <p className="text-slate-400 mb-4">Real-time monitoring dashboard</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-400 text-sm">CPU Usage</div>
                <div className="text-2xl font-bold text-white">{monitoringData.cpuUsage}%</div>
                <div className={`w-full bg-slate-600 rounded-full h-2 mt-1`}>
                  <div 
                    className={`h-2 rounded-full ${
                      monitoringData.cpuUsage > 80 ? 'bg-red-500' : 
                      monitoringData.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${monitoringData.cpuUsage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-400 text-sm">Memory Usage</div>
                <div className="text-2xl font-bold text-white">{monitoringData.memoryUsage}%</div>
                <div className={`w-full bg-slate-600 rounded-full h-2 mt-1`}>
                  <div 
                    className={`h-2 rounded-full ${
                      monitoringData.memoryUsage > 80 ? 'bg-red-500' : 
                      monitoringData.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${monitoringData.memoryUsage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-400 text-sm">Network Traffic</div>
                <div className="text-2xl font-bold text-white">{monitoringData.networkTraffic}</div>
                <div className="text-slate-400 text-xs">MB/s</div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-400 text-sm">Temperature</div>
                <div className="text-2xl font-bold text-white">{monitoringData.temperature}</div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-400 text-sm">Disk Usage</div>
                <div className="text-2xl font-bold text-white">{monitoringData.diskUsage}%</div>
                <div className={`w-full bg-slate-600 rounded-full h-2 mt-1`}>
                  <div 
                    className={`h-2 rounded-full ${
                      monitoringData.diskUsage > 80 ? 'bg-red-500' : 
                      monitoringData.diskUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${monitoringData.diskUsage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-400 text-sm">Uptime</div>
                <div className="text-lg font-bold text-white">{monitoringData.uptime}</div>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Last Seen:</span>
                <span className="text-white">{monitoringData.lastSeen}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-400">Connection:</span>
                <span className="text-green-400">{monitoringData.connectionStatus}</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={() => {
                  // Refresh monitoring data
                  handleMonitorDevice(selectedNode)
                }}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMonitorModal(false)
                  setMonitoringData(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NetworkTopology

