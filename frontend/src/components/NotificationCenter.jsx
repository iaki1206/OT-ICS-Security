import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
  Clock,
  Trash2,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const NotificationCenter = ({ isOpen, onClose, notifications, setNotifications, setCurrentPage }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getNotificationBorderColor = (type) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'success':
        return 'border-l-green-500'
      case 'info':
      default:
        return 'border-l-blue-500'
    }
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 z-40 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="flex-1 text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="flex-1 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Bell className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">No notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={`p-3 bg-slate-700/30 rounded-lg border-l-4 ${getNotificationBorderColor(notification.type)} ${
                      !notification.read ? 'bg-slate-600/30' : ''
                    } hover:bg-slate-600/40 transition-colors cursor-pointer group`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-white' : 'text-slate-300'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            {notification.acknowledged && (
                              <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/30">
                                Acknowledged
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimestamp(notification.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400 p-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Additional Actions for specific notification types */}
                    {notification.type === 'error' && (
                      <div className="mt-2 pt-2 border-t border-slate-600/50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Navigate to threat intelligence page for investigation
                            setCurrentPage('threats')
                            onClose() // Close notification center after navigation
                          }}
                        >
                          Investigate
                        </Button>
                      </div>
                    )}

                    {notification.type === 'warning' && (
                      <div className="mt-2 pt-2 border-t border-slate-600/50">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Mark notification as acknowledged
                              setNotifications(prev => 
                                prev.map(n => 
                                  n.id === notification.id 
                                    ? { ...n, acknowledged: true, read: true }
                                    : n
                                )
                              )
                            }}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Remove notification (resolve it)
                              setNotifications(prev => 
                                prev.filter(n => n.id !== notification.id)
                              )
                            }}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-500 text-center">
              Real-time notifications enabled
            </div>
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-xs text-green-400">Live monitoring active</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NotificationCenter

