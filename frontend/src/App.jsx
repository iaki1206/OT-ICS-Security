import { useState, useEffect } from 'react'
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
      case 'monitoring':
        return <SecurityMonitoring {...pageProps} />
      case 'ai-models':
        return <AIModels {...pageProps} />
      case 'topology':
        return <NetworkTopology {...pageProps} />
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

