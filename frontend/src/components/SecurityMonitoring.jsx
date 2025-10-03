import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Network,
  Server,
  Lock,
  Unlock,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const SecurityMonitoring = ({ systemStatus, notifications }) => {
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [securityEvents, setSecurityEvents] = useState([])
  const [realTimeData, setRealTimeData] = useState([])

  // Sample security events
  useEffect(() => {
    const sampleEvents = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        type: 'Authentication Failure',
        severity: 'High',
        source: '192.168.1.50',
        target: 'PLC-001',
        description: 'Multiple failed login attempts detected',
        status: 'Active',
        protocol: 'Modbus',
        port: 502
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'Anomalous Traffic',
        severity: 'Medium',
        source: '10.0.0.25',
        target: 'HMI-Station-01',
        description: 'Unusual data transfer pattern detected',
        status: 'Investigating',
        protocol: 'OPC-UA',
        port: 4840
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        type: 'Unauthorized Access',
        severity: 'Critical',
        source: 'External',
        target: 'SCADA-Server-01',
        description: 'Unauthorized access attempt from external IP',
        status: 'Blocked',
        protocol: 'HTTPS',
        port: 443
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 900000).toISOString(),
        type: 'Configuration Change',
        severity: 'Low',
        source: 'Admin-Workstation',
        target: 'Switch-Core-01',
        description: 'Network configuration modified',
        status: 'Acknowledged',
        protocol: 'SSH',
        port: 22
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        type: 'Malware Detection',
        severity: 'Critical',
        source: 'Unknown',
        target: 'Engineering-WS-02',
        description: 'Suspicious file execution detected',
        status: 'Quarantined',
        protocol: 'SMB',
        port: 445
      }
    ]
    setSecurityEvents(sampleEvents)
  }, [])

  // Generate real-time monitoring data based on selected time range
  const generateRealTimeData = () => {
    const now = new Date()
    const data = []
    let intervals, timeUnit, timeFormat
    
    switch (selectedTimeRange) {
      case '1h':
        intervals = 12 // 5-minute intervals
        timeUnit = 5 * 60 * 1000 // 5 minutes
        timeFormat = { hour: '2-digit', minute: '2-digit' }
        break
      case '24h':
        intervals = 24 // hourly intervals
        timeUnit = 60 * 60 * 1000 // 1 hour
        timeFormat = { hour: '2-digit', minute: '2-digit' }
        break
      case '7d':
        intervals = 7 // daily intervals
        timeUnit = 24 * 60 * 60 * 1000 // 1 day
        timeFormat = { month: 'short', day: 'numeric' }
        break
      default:
        intervals = 24
        timeUnit = 60 * 60 * 1000
        timeFormat = { hour: '2-digit', minute: '2-digit' }
    }
    
    for (let i = intervals - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * timeUnit)
      data.push({
        time: time.toLocaleTimeString([], timeFormat),
        events: Math.floor(Math.random() * 20) + 5,
        threats: Math.floor(Math.random() * 8) + 1,
        blocked: Math.floor(Math.random() * 15) + 2,
        network_traffic: Math.floor(Math.random() * 100) + 50
      })
    }
    
    setRealTimeData(data)
  }

  // Generate real-time monitoring data
  useEffect(() => {
    generateRealTimeData()
    
    if (isMonitoring) {
      const interval = setInterval(() => {
        generateRealTimeData()
      }, 30000) // Update every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [isMonitoring, selectedTimeRange])

  const getSeverityColor = (severity) => {
    switch (severity) {
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

  // Handler functions for refresh and time range changes
  const handleRefreshData = () => {
    generateRealTimeData()
    // Also refresh security events with new timestamps
    const refreshedEvents = securityEvents.map(event => ({
      ...event,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString() // Random time within last hour
    }))
    setSecurityEvents(refreshedEvents)
  }

  const handleTimeRangeChange = (newRange) => {
    setSelectedTimeRange(newRange)
    // Data will be refreshed automatically via useEffect dependency
  }

  const handleExportReport = () => {
    const timestamp = new Date().toISOString()
    const dateStr = new Date().toLocaleDateString()
    const timeStr = new Date().toLocaleTimeString()
    
    // Generate comprehensive security report
    const reportContent = [
      '=== SECURITY MONITORING REPORT ===',
      `Generated: ${dateStr} at ${timeStr}`,
      `Time Range: ${selectedTimeRange}`,
      `Monitoring Status: ${isMonitoring ? 'Active' : 'Paused'}`,
      '',
      '=== SYSTEM OVERVIEW ===',
      `Total Security Events: ${securityEvents.length}`,
      `Active Threats: ${systemStatus?.threats?.active || 'N/A'}`,
      `Network Health: ${systemStatus?.network?.health || 'N/A'}`,
      '',
      '=== SECURITY EVENTS ===',
      ...securityEvents.map((event, index) => [
        `Event ${index + 1}:`,
        `  Timestamp: ${new Date(event.timestamp).toLocaleString()}`,
        `  Type: ${event.type}`,
        `  Severity: ${event.severity}`,
        `  Status: ${event.status}`,
        `  Source: ${event.source}`,
        `  Target: ${event.target}`,
        `  Protocol: ${event.protocol}`,
        `  Port: ${event.port}`,
        `  Description: ${event.description}`,
        ''
      ]).flat(),
      '=== REAL-TIME DATA SUMMARY ===',
      ...realTimeData.slice(-5).map((data, index) => [
        `Time ${data.time}:`,
        `  Events: ${data.events}`,
        `  Threats: ${data.threats}`,
        `  Blocked: ${data.blocked}`,
        `  Network Traffic: ${data.network_traffic}`,
        ''
      ]).flat(),
      '=== REPORT END ==='
    ].join('\n')
    
    // Create and download the report
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-monitoring-report-${new Date().toISOString().split('T')[0]}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'text-red-400 bg-red-500/20'
      case 'Investigating':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'Blocked':
        return 'text-blue-400 bg-blue-500/20'
      case 'Acknowledged':
        return 'text-green-400 bg-green-500/20'
      case 'Quarantined':
        return 'text-purple-400 bg-purple-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'High':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case 'Medium':
        return <Eye className="w-4 h-4 text-yellow-400" />
      case 'Low':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Eye className="w-4 h-4 text-gray-400" />
    }
  }

  const MonitoringCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 backdrop-blur-sm border border-${color}-500/30 rounded-xl p-6 hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`text-sm ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-slate-300 font-medium">{title}</p>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  )

  const EventRow = ({ event }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center space-x-4 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-600/30 transition-colors"
    >
      {getSeverityIcon(event.severity)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-white font-medium">{event.type}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
            {event.severity}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>
        <p className="text-slate-400 text-sm">{event.description}</p>
        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500">
          <span>Source: {event.source}</span>
          <span>Target: {event.target}</span>
          <span>Protocol: {event.protocol}</span>
          <span>Port: {event.port}</span>
        </div>
      </div>
      <div className="text-xs text-slate-500">
        <Clock className="w-3 h-3 inline mr-1" />
        {new Date(event.timestamp).toLocaleTimeString()}
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
          <h1 className="text-3xl font-bold text-white mb-2">Security Monitoring</h1>
          <p className="text-slate-400">Real-time security event monitoring and analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-slate-300 text-sm">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
            </span>
          </div>
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? 'outline' : 'default'}
            className={isMonitoring ? 'text-orange-400 border-orange-400' : 'bg-green-600 hover:bg-green-700'}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Monitoring Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MonitoringCard
          title="Security Events"
          value="247"
          subtitle="Last 24 hours"
          icon={Shield}
          color="blue"
          trend={12}
        />
        <MonitoringCard
          title="Active Threats"
          value={systemStatus.threats.active}
          subtitle="Requires attention"
          icon={AlertTriangle}
          color="red"
          trend={-5}
        />
        <MonitoringCard
          title="Blocked Attempts"
          value="89"
          subtitle="Auto-blocked"
          icon={Lock}
          color="green"
          trend={8}
        />
        <MonitoringCard
          title="Network Health"
          value="98.7%"
          subtitle="Uptime"
          icon={Network}
          color="purple"
          trend={-0.2}
        />
      </motion.div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Events Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Security Events Timeline</h3>
            <div className="flex items-center space-x-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="px-3 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              <Button variant="ghost" size="sm" onClick={handleRefreshData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={realTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Area type="monotone" dataKey="events" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="threats" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              <Area type="monotone" dataKey="blocked" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Network Traffic Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Network Traffic Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Line type="monotone" dataKey="network_traffic" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Security Events Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Recent Security Events</h3>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRefreshData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {securityEvents.map((event, index) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      </motion.div>

      {/* System Health Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Firewall Status */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Firewall Status</h4>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Rules Active</span>
              <span className="text-white font-medium">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Blocked Today</span>
              <span className="text-white font-medium">89</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Update</span>
              <span className="text-white font-medium">2 min ago</span>
            </div>
          </div>
        </div>

        {/* IDS/IPS Status */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">IDS/IPS Status</h4>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Signatures</span>
              <span className="text-white font-medium">45,892</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Detections</span>
              <span className="text-white font-medium">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">False Positives</span>
              <span className="text-white font-medium">2</span>
            </div>
          </div>
        </div>

        {/* Endpoint Protection */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Endpoint Protection</h4>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Protected Devices</span>
              <span className="text-white font-medium">127/132</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quarantined</span>
              <span className="text-white font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Scan</span>
              <span className="text-white font-medium">1 hour ago</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SecurityMonitoring

