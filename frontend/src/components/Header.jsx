import { motion } from 'framer-motion'
import {
  Bell,
  MessageCircle,
  Search,
  Settings,
  User,
  Shield,
  Activity,
  Cpu,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const Header = ({ 
  systemStatus, 
  notifications, 
  notificationsOpen, 
  setNotificationsOpen, 
  setChatBotOpen,
  setAdminDashboardOpen 
}) => {
  const unreadNotifications = notifications.filter(n => !n.read).length

  const getStatusColor = (value, type) => {
    if (type === 'critical') {
      return value > 5 ? 'text-red-400' : value > 2 ? 'text-yellow-400' : 'text-green-400'
    }
    if (type === 'accuracy') {
      return value > 0.95 ? 'text-green-400' : value > 0.9 ? 'text-yellow-400' : 'text-red-400'
    }
    return 'text-blue-400'
  }

  const handleSecurityAdminClick = () => {
    console.log('Security Admin profile clicked - opening admin dashboard...')
    setAdminDashboardOpen(true)
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search devices, threats, or events..."
              className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>
        </div>

        {/* Center Section - System Status */}
        <div className="flex items-center space-x-6">
          {/* Devices Status */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/30"
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <div className="text-xs">
              <div className="text-slate-300">Devices</div>
              <div className="text-white font-medium">
                {systemStatus.devices.online}/{systemStatus.devices.total}
              </div>
            </div>
            {systemStatus.devices.critical > 0 && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </motion.div>

          {/* Threats Status */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/30"
          >
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <div className="text-xs">
              <div className="text-slate-300">Active Threats</div>
              <div className={`font-medium ${getStatusColor(systemStatus.threats.active, 'critical')}`}>
                {systemStatus.threats.active}
              </div>
            </div>
          </motion.div>

          {/* AI Models Status */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/30"
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <div className="text-xs">
              <div className="text-slate-300">AI Accuracy</div>
              <div className={`font-medium ${getStatusColor(systemStatus.models.accuracy, 'accuracy')}`}>
                {(systemStatus.models.accuracy * 100).toFixed(1)}%
              </div>
            </div>
          </motion.div>

          {/* System Activity */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 bg-slate-700/30 px-3 py-2 rounded-lg border border-slate-600/30"
          >
            <Activity className="w-4 h-4 text-green-400" />
            <div className="text-xs">
              <div className="text-slate-300">System</div>
              <div className="text-green-400 font-medium">Healthy</div>
            </div>
          </motion.div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* AI ChatBot Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChatBotOpen(true)}
            className="relative p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 bg-slate-700/50 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600/50 transition-all duration-200"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs font-bold">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              </motion.div>
            )}
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-700/50 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600/50 transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          {/* User Profile */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            onClick={handleSecurityAdminClick}
            className="flex items-center space-x-2 bg-slate-700/50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-600/50 transition-all duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm">
              <div className="text-white font-medium">Security Admin</div>
              <div className="text-slate-400 text-xs">Administrator</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Real-time Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 flex items-center justify-between text-xs"
      >
        <div className="flex items-center space-x-4 text-slate-400">
          <span>Last Update: {new Date().toLocaleTimeString()}</span>
          <span>•</span>
          <span>Monitoring {systemStatus.devices.total} devices</span>
          <span>•</span>
          <span>{systemStatus.models.active} AI models active</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs">Real-time monitoring active</span>
        </div>
      </motion.div>
    </motion.header>
  )
}

export default Header

