import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Shield,
  Network,
  AlertTriangle,
  Brain,
  Radar,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react'

const Sidebar = ({ currentPage, setCurrentPage, collapsed, setCollapsed }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'System Overview'
    },
    {
      id: 'devices',
      label: 'Device Management',
      icon: Network,
      description: 'ICS/OT Assets'
    },
    {
      id: 'threats',
      label: 'Threat Intelligence',
      icon: Shield,
      description: 'Security Threats'
    },
    {
      id: 'monitoring',
      label: 'Security Monitoring',
      icon: Radar,
      description: 'Real-time Monitoring'
    },
    {
      id: 'ai-models',
      label: 'AI Models',
      icon: Brain,
      description: 'ML/DL Analytics'
    },
    {
      id: 'topology',
      label: 'Network Topology',
      icon: AlertTriangle,
      description: 'Network Visualization'
    },
  ]

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={`fixed left-0 top-0 h-full bg-slate-800/95 backdrop-blur-sm border-r border-slate-700/50 z-50 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">ICS Security</h1>
                <p className="text-slate-400 text-xs">AI Platform</p>
              </div>
            </motion.div>
          )}
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : item.id === 'pcap' ? 'text-white hover:text-white hover:bg-slate-700/50' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                  initial={false}
                />
              )}

              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 text-left"
                >
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {item.description}
                  </div>
                </motion.div>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Status Indicator */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-300 text-xs font-medium">System Status</span>
            </div>
            <div className="text-green-400 text-xs">All Systems Operational</div>
            <div className="text-slate-500 text-xs mt-1">AI Models: Active</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Sidebar

