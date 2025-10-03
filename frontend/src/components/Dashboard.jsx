import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Network,
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  Eye,
  Server,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const Dashboard = ({ systemStatus, notifications }) => {
  // Sample data for charts
  const threatTrendData = [
    { time: '00:00', threats: 12, resolved: 8 },
    { time: '04:00', threats: 15, resolved: 10 },
    { time: '08:00', threats: 23, resolved: 18 },
    { time: '12:00', threats: 18, resolved: 15 },
    { time: '16:00', threats: 25, resolved: 20 },
    { time: '20:00', threats: 20, resolved: 16 },
    { time: '24:00', threats: 14, resolved: 12 }
  ]

  const deviceStatusData = [
    { name: 'PLCs', value: 45, status: 'online' },
    { name: 'HMIs', value: 12, status: 'online' },
    { name: 'RTUs', value: 8, status: 'online' },
    { name: 'Servers', value: 23, status: 'mixed' },
    { name: 'Workstations', value: 34, status: 'mixed' }
  ]

  const aiPerformanceData = [
    { model: 'Anomaly Detection', accuracy: 95.2, predictions: 1247 },
    { model: 'Threat Classification', accuracy: 97.8, predictions: 892 },
    { model: 'Behavioral Analysis', accuracy: 93.4, predictions: 2156 },
    { model: 'Network Analysis', accuracy: 96.1, predictions: 1834 }
  ]

  const networkTrafficData = [
    { time: '00:00', normal: 85, suspicious: 10, blocked: 5 },
    { time: '04:00', normal: 90, suspicious: 7, blocked: 3 },
    { time: '08:00', normal: 75, suspicious: 20, blocked: 5 },
    { time: '12:00', normal: 82, suspicious: 15, blocked: 3 },
    { time: '16:00', normal: 78, suspicious: 18, blocked: 4 },
    { time: '20:00', normal: 88, suspicious: 8, blocked: 4 },
    { time: '24:00', normal: 92, suspicious: 6, blocked: 2 }
  ]

  const COLORS = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4'
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      green: 'from-green-500/20 to-green-600/20 border-green-500/30',
      yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      red: 'from-red-500/20 to-red-600/20 border-red-500/30'
    }

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm border rounded-xl p-6 hover:shadow-lg transition-all duration-300`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(trend)}%</span>
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
  }

  const recentAlerts = notifications.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
          <p className="text-slate-400">Real-time overview of your ICS/OT cybersecurity posture</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live monitoring active</span>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Devices"
          value={systemStatus.devices.total}
          subtitle={`${systemStatus.devices.online} online`}
          icon={Network}
          trend={2.5}
          color="blue"
        />
        <StatCard
          title="Active Threats"
          value={systemStatus.threats.active}
          subtitle="Requires attention"
          icon={AlertTriangle}
          trend={-12.3}
          color="red"
        />
        <StatCard
          title="AI Accuracy"
          value={`${(systemStatus.models.accuracy * 100).toFixed(1)}%`}
          subtitle={`${systemStatus.models.active} models active`}
          icon={Brain}
          trend={1.8}
          color="purple"
        />
        <StatCard
          title="System Health"
          value="Optimal"
          subtitle="All systems operational"
          icon={CheckCircle}
          color="green"
        />
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Threat Trends (24h)</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-400">Threats</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">Resolved</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={threatTrendData}>
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
              <Area type="monotone" dataKey="threats" stackId="1" stroke={COLORS.danger} fill={COLORS.danger} fillOpacity={0.6} />
              <Area type="monotone" dataKey="resolved" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Device Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Device Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceStatusData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {deviceStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Model Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">AI Model Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aiPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="model" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} fontSize={10} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="accuracy" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Network Traffic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Network Traffic Analysis</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-400">Normal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-slate-400">Suspicious</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-400">Blocked</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={networkTrafficData}>
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
              <Line type="monotone" dataKey="normal" stroke={COLORS.success} strokeWidth={2} />
              <Line type="monotone" dataKey="suspicious" stroke={COLORS.warning} strokeWidth={2} />
              <Line type="monotone" dataKey="blocked" stroke={COLORS.danger} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Alerts & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Security Alerts</h3>
            <button className="text-blue-400 hover:text-blue-300 text-sm">View All</button>
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-600/30 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  alert.type === 'error' ? 'bg-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-500' :
                  alert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{alert.title}</p>
                  <p className="text-slate-400 text-xs">{alert.message}</p>
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* System Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">System Information</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 text-sm">CPU Usage</span>
              </div>
              <span className="text-white font-medium">23%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-green-400" />
                <span className="text-slate-300 text-sm">Memory</span>
              </div>
              <span className="text-white font-medium">67%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300 text-sm">Network</span>
              </div>
              <span className="text-white font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-300 text-sm">Uptime</span>
              </div>
              <span className="text-white font-medium">99.9%</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">99.9%</div>
              <div className="text-slate-400 text-sm">System Availability</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard

