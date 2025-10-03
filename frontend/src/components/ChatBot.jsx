import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Brain,
  Network,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { sanitizeInput, sanitizeSearchQuery, RateLimiter } from '@/utils/security'

const ChatBot = ({ isOpen, onClose, systemStatus }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI cybersecurity assistant. I can help you with threat analysis, device management, security recommendations, and system monitoring. How can I assist you today?',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Analyze current threats',
        'Check device status',
        'Security recommendations',
        'Network topology overview'
      ]
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [quickActions, setQuickActions] = useState([
    { icon: Shield, label: 'Security Status', action: 'security-status' },
    { icon: AlertTriangle, label: 'Active Threats', action: 'active-threats' },
    { icon: Network, label: 'Device Health', action: 'device-health' },
    { icon: Brain, label: 'AI Insights', action: 'ai-insights' }
  ])
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase()
    
    // Predefined responses based on keywords
    if (message.includes('threat') || message.includes('security')) {
      return {
        content: `Based on current analysis, I've detected ${systemStatus.threats.active} active threats. Here's the breakdown:

🔴 Critical: ${Math.floor(systemStatus.threats.active * 0.2)} threats requiring immediate attention
🟡 Medium: ${Math.floor(systemStatus.threats.active * 0.5)} threats under investigation  
🟢 Low: ${Math.floor(systemStatus.threats.active * 0.3)} threats being monitored

**Recommendations:**
• Prioritize critical threats for immediate response
• Review security policies for medium-risk items
• Implement additional monitoring for low-risk threats`,
        suggestions: ['Show threat details', 'Generate security report', 'Recommend mitigations']
      }
    }
    
    if (message.includes('device') || message.includes('asset')) {
      return {
        content: `Device Status Overview:

📊 **Total Devices:** ${systemStatus.devices.total}
✅ **Online:** ${systemStatus.devices.online} (${Math.round((systemStatus.devices.online/systemStatus.devices.total)*100)}%)
⚠️ **Critical Issues:** ${systemStatus.devices.critical}

**Device Categories:**
• PLCs: 45 devices (42 online)
• HMIs: 12 devices (11 online)  
• RTUs: 8 devices (8 online)
• Servers: 23 devices (19 online)

**Recent Changes:**
• 3 devices came online in the last hour
• 1 device requires firmware update`,
        suggestions: ['Scan network', 'Device details', 'Update firmware', 'Security assessment']
      }
    }
    
    if (message.includes('ai') || message.includes('model') || message.includes('machine learning')) {
      return {
        content: `AI Models Performance:

🧠 **Active Models:** ${systemStatus.models.active}
📈 **Average Accuracy:** ${(systemStatus.models.accuracy * 100).toFixed(1)}%
🔄 **Training:** ${systemStatus.models.training} models

**Model Types:**
• Anomaly Detection: 95.2% accuracy
• Threat Classification: 97.8% accuracy
• Behavioral Analysis: 93.4% accuracy
• Network Analysis: 96.1% accuracy

**Recent Insights:**
• Detected 12 anomalies in the last 24 hours
• Prevented 3 potential security incidents
• Identified 5 optimization opportunities`,
        suggestions: ['Model details', 'Retrain models', 'View predictions', 'Performance metrics']
      }
    }
    
    if (message.includes('recommendation') || message.includes('suggest') || message.includes('advice')) {
      return {
        content: `🛡️ **Security Recommendations:**

**Immediate Actions:**
1. Update firmware on 3 critical devices
2. Review access controls for HMI stations
3. Implement network segmentation for OT devices

**Short-term (1-2 weeks):**
1. Deploy additional monitoring sensors
2. Conduct penetration testing
3. Update security policies

**Long-term (1-3 months):**
1. Implement zero-trust architecture
2. Enhance AI model training data
3. Establish incident response procedures

**Compliance:**
• NIST Cybersecurity Framework: 87% compliant
• IEC 62443: 92% compliant
• NERC CIP: 95% compliant`,
        suggestions: ['Implementation guide', 'Compliance report', 'Risk assessment', 'Training plan']
      }
    }
    
    if (message.includes('network') || message.includes('topology')) {
      return {
        content: `🌐 **Network Topology Analysis:**

**Network Segments:**
• Corporate Network: 45 devices
• OT Network: 67 devices  
• DMZ: 12 devices
• Management Network: 8 devices

**Communication Patterns:**
• Normal traffic: 94%
• Suspicious patterns: 3%
• Blocked attempts: 3%

**Security Zones:**
• Level 0 (Process): 23 devices
• Level 1 (Control): 18 devices
• Level 2 (Supervision): 12 devices
• Level 3 (Operations): 14 devices

**Recommendations:**
• Implement micro-segmentation
• Deploy additional firewalls
• Monitor east-west traffic`,
        suggestions: ['View topology map', 'Traffic analysis', 'Segmentation plan', 'Security zones']
      }
    }
    
    // Default response
    return {
      content: `I understand you're asking about "${userMessage}". I can help you with:

🔍 **Security Analysis:** Threat detection, vulnerability assessment, risk analysis
🖥️ **Device Management:** Asset inventory, health monitoring, configuration
🤖 **AI Insights:** Model performance, predictions, anomaly detection
🌐 **Network Security:** Topology analysis, traffic monitoring, segmentation

Please let me know which area you'd like to explore, or ask me a specific question about your cybersecurity environment.`,
      suggestions: ['Security overview', 'Device status', 'AI performance', 'Network analysis']
    }
  }

  // Rate limiter for chat messages
  const chatRateLimiter = useRef(new RateLimiter(10, 60)) // 10 messages per minute

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    try {
      // Rate limiting check
      if (!chatRateLimiter.current.isAllowed('user')) {
        alert('You are sending messages too quickly. Please wait a moment.')
        return
      }

      // Sanitize and validate input
      const sanitizedMessage = sanitizeSearchQuery(inputMessage.trim())
      
      // Check message length
      if (sanitizedMessage.length > 500) {
        alert('Message is too long. Please keep it under 500 characters.')
        return
      }

      // Check for empty message after sanitization
      if (!sanitizedMessage) {
        alert('Please enter a valid message.')
        return
      }

      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: sanitizedMessage,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, userMessage])
      setInputMessage('')
      setIsTyping(true)

      // Simulate AI processing time
      setTimeout(() => {
        const botResponse = generateBotResponse(sanitizedMessage)
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: botResponse.content,
          timestamp: new Date().toISOString(),
          suggestions: botResponse.suggestions
        }

        setMessages(prev => [...prev, botMessage])
        setIsTyping(false)
      }, 1500 + Math.random() * 1000)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('An error occurred while sending your message. Please try again.')
      setIsTyping(false)
    }
  }

  const handleQuickAction = (action) => {
    const actionMessages = {
      'security-status': 'What is the current security status of the system?',
      'active-threats': 'Show me all active threats and their severity levels',
      'device-health': 'Provide a health check report for all connected devices',
      'ai-insights': 'What insights can AI models provide about current security posture?'
    }

    setInputMessage(actionMessages[action] || action)
  }

  const handleSuggestionClick = (suggestion) => {
    // Sanitize suggestion before setting as input
    const sanitizedSuggestion = sanitizeInput(suggestion)
    setInputMessage(sanitizedSuggestion)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-96 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Security Assistant</h3>
                  <p className="text-slate-400 text-sm">Powered by Advanced ML</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-slate-700/50">
            <p className="text-slate-400 text-xs mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.action)}
                    className="flex items-center space-x-2 p-2 bg-slate-700/30 rounded-lg hover:bg-slate-600/50 transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-xs">{action.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-br from-purple-500 to-blue-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-100'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      <div className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-slate-400'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="mt-3 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left p-2 bg-slate-700/30 hover:bg-slate-600/50 rounded-lg text-slate-300 text-xs transition-colors"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center space-x-1">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      <span className="text-slate-400 text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about security, devices, threats, or AI insights..."
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="2"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>AI-Powered</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ChatBot

