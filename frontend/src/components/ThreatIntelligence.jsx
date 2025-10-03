import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  Target,
  Zap,
  TrendingUp,
  Globe,
  Database,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ThreatIntelligence = ({ systemStatus }) => {
  const [threats, setThreats] = useState([])
  const [filteredThreats, setFilteredThreats] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedThreat, setSelectedThreat] = useState(null)

  // Sample threat data
  useEffect(() => {
    const sampleThreats = [
      {
        id: 1,
        title: 'TRITON/TRISIS Malware Detected',
        type: 'Malware',
        severity: 'Critical',
        status: 'Active',
        description: 'Advanced persistent threat targeting safety instrumented systems',
        source: 'ICS-CERT',
        confidence: 'High',
        firstSeen: new Date(Date.now() - 86400000).toISOString(),
        lastUpdated: new Date().toISOString(),
        affectedSystems: ['Safety Systems', 'PLCs', 'HMIs'],
        indicators: ['192.168.1.100', 'malicious.exe', 'C2 domain: evil.com'],
        mitreTactics: ['Initial Access', 'Persistence', 'Impact'],
        mitreId: 'T1190',
        cveId: 'CVE-2023-1234',
        riskScore: 9.5
      },
      {
        id: 2,
        title: 'Unauthorized Modbus Access Attempt',
        type: 'Network Intrusion',
        severity: 'High',
        status: 'Investigating',
        description: 'Multiple failed authentication attempts on Modbus TCP port 502',
        source: 'Network Monitoring',
        confidence: 'Medium',
        firstSeen: new Date(Date.now() - 3600000).toISOString(),
        lastUpdated: new Date().toISOString(),
        affectedSystems: ['PLCs', 'RTUs'],
        indicators: ['10.0.0.50', 'Port 502', 'Failed auth'],
        mitreTactics: ['Initial Access', 'Discovery'],
        mitreId: 'T1021',
        cveId: null,
        riskScore: 7.2
      },
      {
        id: 3,
        title: 'Suspicious DNP3 Traffic Pattern',
        type: 'Anomaly',
        severity: 'Medium',
        status: 'Monitoring',
        description: 'Unusual DNP3 communication patterns detected on SCADA network',
        source: 'AI Anomaly Detection',
        confidence: 'Medium',
        firstSeen: new Date(Date.now() - 7200000).toISOString(),
        lastUpdated: new Date().toISOString(),
        affectedSystems: ['SCADA', 'RTUs'],
        indicators: ['DNP3 Protocol', 'Port 20000', 'Anomalous timing'],
        mitreTactics: ['Discovery', 'Collection'],
        mitreId: 'T1046',
        cveId: null,
        riskScore: 5.8
      },
      {
        id: 4,
        title: 'Firmware Vulnerability in Siemens PLCs',
        type: 'Vulnerability',
        severity: 'High',
        status: 'Patch Available',
        description: 'Buffer overflow vulnerability in S7-1200 firmware allows remote code execution',
        source: 'Vendor Advisory',
        confidence: 'High',
        firstSeen: new Date(Date.now() - 172800000).toISOString(),
        lastUpdated: new Date().toISOString(),
        affectedSystems: ['Siemens S7-1200', 'PLCs'],
        indicators: ['CVE-2023-5678', 'Firmware < v4.2.2'],
        mitreTactics: ['Initial Access', 'Execution'],
        mitreId: 'T1203',
        cveId: 'CVE-2023-5678',
        riskScore: 8.1
      },
      {
        id: 5,
        title: 'Phishing Campaign Targeting OT Personnel',
        type: 'Social Engineering',
        severity: 'Medium',
        status: 'Active',
        description: 'Targeted phishing emails with industrial-themed lures sent to OT staff',
        source: 'Email Security',
        confidence: 'High',
        firstSeen: new Date(Date.now() - 259200000).toISOString(),
        lastUpdated: new Date().toISOString(),
        affectedSystems: ['Email', 'Workstations'],
        indicators: ['phishing@fake-vendor.com', 'malicious.pdf'],
        mitreTactics: ['Initial Access', 'Credential Access'],
        mitreId: 'T1566',
        cveId: null,
        riskScore: 6.3
      }
    ]
    setThreats(sampleThreats)
    setFilteredThreats(sampleThreats)
  }, [])

  // Filter threats
  useEffect(() => {
    let filtered = threats

    if (searchTerm) {
      filtered = filtered.filter(threat =>
        threat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        threat.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(threat => {
        switch (selectedFilter) {
          case 'critical':
            return threat.severity === 'Critical'
          case 'high':
            return threat.severity === 'High'
          case 'active':
            return threat.status === 'Active'
          case 'malware':
            return threat.type === 'Malware'
          case 'vulnerability':
            return threat.type === 'Vulnerability'
          default:
            return true
        }
      })
    }

    setFilteredThreats(filtered)
  }, [threats, searchTerm, selectedFilter])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'High':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'Medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'Low':
        return 'text-green-400 bg-green-500/20 border-green-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  // Handler function for exporting threat intelligence report
  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      totalThreats: threats.length,
      criticalThreats: threats.filter(t => t.severity === 'Critical').length,
      highThreats: threats.filter(t => t.severity === 'High').length,
      activeThreats: threats.filter(t => t.status === 'Active').length,
      threats: threats
    }
    
    const reportContent = `THREAT INTELLIGENCE COMPREHENSIVE REPORT\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `EXECUTIVE SUMMARY\n` +
      `Total Threats: ${reportData.totalThreats}\n` +
      `Critical Threats: ${reportData.criticalThreats}\n` +
      `High Severity Threats: ${reportData.highThreats}\n` +
      `Active Threats: ${reportData.activeThreats}\n\n` +
      `DETAILED THREAT ANALYSIS\n` +
      `${'='.repeat(50)}\n\n` +
      threats.map((threat, index) => 
        `${index + 1}. ${threat.title}\n` +
        `   Severity: ${threat.severity} | Status: ${threat.status}\n` +
        `   Type: ${threat.type} | Source: ${threat.source}\n` +
        `   Risk Score: ${threat.riskScore}/10\n` +
        `   Description: ${threat.description}\n` +
        `   Affected Systems: ${threat.affectedSystems.join(', ')}\n` +
        `   MITRE Tactics: ${threat.mitreTactics.join(', ')}\n` +
        `   MITRE ID: ${threat.mitreId}\n` +
        `   CVE ID: ${threat.cveId || 'N/A'}\n` +
        `   Indicators: ${threat.indicators.join(', ')}\n` +
        `   First Seen: ${new Date(threat.firstSeen).toLocaleString()}\n` +
        `   Last Updated: ${new Date(threat.lastUpdated).toLocaleString()}\n` +
        `   ${'-'.repeat(40)}\n`
      ).join('\n') +
      `\n\nREPORT STATISTICS\n` +
      `${'='.repeat(50)}\n` +
      `Malware Threats: ${threats.filter(t => t.type === 'Malware').length}\n` +
      `Network Intrusions: ${threats.filter(t => t.type === 'Network Intrusion').length}\n` +
      `Vulnerabilities: ${threats.filter(t => t.type === 'Vulnerability').length}\n` +
      `Social Engineering: ${threats.filter(t => t.type === 'Social Engineering').length}\n` +
      `APT Campaigns: ${threats.filter(t => t.type === 'Advanced Persistent Threat').length}\n` +
      `Anomalies: ${threats.filter(t => t.type === 'Anomaly').length}\n\n` +
      `RECOMMENDATIONS\n` +
      `${'='.repeat(50)}\n` +
      `1. Prioritize Critical and High severity threats for immediate action\n` +
      `2. Review and update security controls for affected systems\n` +
      `3. Implement additional monitoring for active threats\n` +
      `4. Conduct threat hunting activities based on provided indicators\n` +
      `5. Update incident response procedures based on current threat landscape\n\n` +
      `End of Report`
    
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `threat-intelligence-report-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handler function for updating threat feed
  const handleUpdateFeed = () => {
    console.log('Update Feed button clicked - refreshing threat intelligence data...')
    
    // Show visual feedback that update is happening
    const button = document.querySelector('[data-update-feed]')
    if (button) {
      button.textContent = 'Updating...'
      button.disabled = true
    }
    
    // Simulate fetching new threat intelligence data
    const updatedThreats = [
      {
        id: Date.now() + 1,
        title: 'New APT Campaign Detected',
        type: 'Advanced Persistent Threat',
        severity: 'Critical',
        status: 'Active',
        description: 'Sophisticated multi-stage attack targeting industrial control systems',
        source: 'Threat Intelligence Feed',
        confidence: 'High',
        firstSeen: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        affectedSystems: ['PLCs', 'HMIs', 'Engineering Workstations'],
        indicators: ['apt.malicious.com', 'backdoor.exe', '203.0.113.42'],
        mitreTactics: ['Initial Access', 'Persistence', 'Lateral Movement'],
        mitreId: 'T1078',
        cveId: 'CVE-2024-0001',
        riskScore: 9.8
      },
      {
        id: Date.now() + 2,
        title: 'Zero-Day Exploit in OPC UA',
        type: 'Vulnerability',
        severity: 'High',
        status: 'Active',
        description: 'Newly discovered zero-day vulnerability in OPC UA implementations',
        source: 'Security Research',
        confidence: 'High',
        firstSeen: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        affectedSystems: ['OPC UA Servers', 'Industrial Applications'],
        indicators: ['CVE-2024-0002', 'OPC UA < v1.05'],
        mitreTactics: ['Initial Access', 'Execution'],
        mitreId: 'T1203',
        cveId: 'CVE-2024-0002',
        riskScore: 8.7
      }
    ]
    
    // Add new threats to existing ones and update timestamps
    const refreshedThreats = threats.map(threat => ({
      ...threat,
      lastUpdated: new Date().toISOString()
    }))
    
    const allThreats = [...updatedThreats, ...refreshedThreats]
    setThreats(allThreats)
    setFilteredThreats(allThreats)
    
    console.log(`Threat feed updated! Added ${updatedThreats.length} new threats. Total threats: ${allThreats.length}`)
    
    // Reset button state after update
    setTimeout(() => {
      const button = document.querySelector('[data-update-feed]')
      if (button) {
        button.textContent = 'Update Feed'
        button.disabled = false
      }
    }, 1000)
  }

  // Handler functions for threat detail actions
  const handleGenerateReport = () => {
    if (!selectedThreat) return
    
    const reportData = {
      threatId: selectedThreat.id,
      title: selectedThreat.title,
      severity: selectedThreat.severity,
      description: selectedThreat.description,
      affectedSystems: selectedThreat.affectedSystems,
      indicators: selectedThreat.indicators,
      mitreTactics: selectedThreat.mitreTactics,
      mitreId: selectedThreat.mitreId,
      cveId: selectedThreat.cveId,
      riskScore: selectedThreat.riskScore,
      generatedAt: new Date().toISOString()
    }
    
    const reportContent = `THREAT INTELLIGENCE REPORT\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `THREAT OVERVIEW\n` +
      `Title: ${selectedThreat.title}\n` +
      `Severity: ${selectedThreat.severity}\n` +
      `Risk Score: ${selectedThreat.riskScore}/10\n` +
      `Status: ${selectedThreat.status}\n\n` +
      `DESCRIPTION\n${selectedThreat.description}\n\n` +
      `AFFECTED SYSTEMS\n${selectedThreat.affectedSystems.join(', ')}\n\n` +
      `INDICATORS OF COMPROMISE\n${selectedThreat.indicators.join('\n')}\n\n` +
      `MITRE ATT&CK MAPPING\n` +
      `Tactics: ${selectedThreat.mitreTactics.join(', ')}\n` +
      `Technique ID: ${selectedThreat.mitreId}\n` +
      `CVE ID: ${selectedThreat.cveId || 'N/A'}\n\n` +
      `TIMELINE\n` +
      `First Seen: ${new Date(selectedThreat.firstSeen).toLocaleString()}\n` +
      `Last Updated: ${new Date(selectedThreat.lastUpdated).toLocaleString()}`
    
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `threat-report-${selectedThreat.id}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleViewMitreDetails = () => {
    if (!selectedThreat || !selectedThreat.mitreId) return
    
    const mitreUrl = `https://attack.mitre.org/techniques/${selectedThreat.mitreId}/`
    window.open(mitreUrl, '_blank', 'noopener,noreferrer')
  }

  const handleExportIOCs = () => {
    if (!selectedThreat) return
    
    const iocData = selectedThreat.indicators.map((indicator, index) => ({
      id: index + 1,
      indicator: indicator,
      type: indicator.includes('@') ? 'Email' : 
            indicator.includes('.') && !indicator.includes(' ') ? 'Domain/IP' : 
            indicator.includes('CVE-') ? 'CVE' : 'Hash/Other',
      threatId: selectedThreat.id,
      threatTitle: selectedThreat.title,
      severity: selectedThreat.severity,
      firstSeen: selectedThreat.firstSeen,
      confidence: selectedThreat.confidence
    }))
    
    const csvContent = 'ID,Indicator,Type,Threat ID,Threat Title,Severity,First Seen,Confidence\n' +
      iocData.map(ioc => 
        `${ioc.id},"${ioc.indicator}",${ioc.type},${ioc.threatId},"${ioc.threatTitle}",${ioc.severity},${new Date(ioc.firstSeen).toISOString()},${ioc.confidence}`
      ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iocs-${selectedThreat.id}-${Date.now()}.csv`
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
      case 'Monitoring':
        return 'text-blue-400 bg-blue-500/20'
      case 'Resolved':
        return 'text-green-400 bg-green-500/20'
      case 'Patch Available':
        return 'text-purple-400 bg-purple-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'High':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case 'Medium':
        return <Info className="w-4 h-4 text-yellow-400" />
      case 'Low':
        return <Shield className="w-4 h-4 text-green-400" />
      default:
        return <Info className="w-4 h-4 text-gray-400" />
    }
  }

  // Chart data
  const threatTrendData = [
    { month: 'Jan', critical: 2, high: 5, medium: 8, low: 3 },
    { month: 'Feb', critical: 1, high: 7, medium: 6, low: 4 },
    { month: 'Mar', critical: 3, high: 4, medium: 9, low: 2 },
    { month: 'Apr', critical: 1, high: 6, medium: 7, low: 5 },
    { month: 'May', critical: 2, high: 8, medium: 5, low: 3 },
    { month: 'Jun', critical: 1, high: 5, medium: 8, low: 4 }
  ]

  const threatTypeData = [
    { name: 'Malware', value: 25, color: '#EF4444' },
    { name: 'Vulnerability', value: 30, color: '#F59E0B' },
    { name: 'Network Intrusion', value: 20, color: '#8B5CF6' },
    { name: 'Social Engineering', value: 15, color: '#06B6D4' },
    { name: 'Anomaly', value: 10, color: '#10B981' }
  ]

  const ThreatCard = ({ threat }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          {getSeverityIcon(threat.severity)}
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">{threat.title}</h3>
            <p className="text-slate-400 text-sm mb-2">{threat.description}</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Risk Score:</span>
              <span className={`font-bold ${threat.riskScore >= 8 ? 'text-red-400' : threat.riskScore >= 6 ? 'text-orange-400' : 'text-yellow-400'}`}>
                {threat.riskScore}/10
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(threat.severity)}`}>
            {threat.severity}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(threat.status)}`}>
            {threat.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-slate-400">Type:</span>
          <span className="text-white ml-2">{threat.type}</span>
        </div>
        <div>
          <span className="text-slate-400">Source:</span>
          <span className="text-white ml-2">{threat.source}</span>
        </div>
        <div>
          <span className="text-slate-400">Confidence:</span>
          <span className="text-white ml-2">{threat.confidence}</span>
        </div>
        <div>
          <span className="text-slate-400">MITRE ID:</span>
          <span className="text-white ml-2">{threat.mitreId}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          <Clock className="w-3 h-3 inline mr-1" />
          {new Date(threat.lastUpdated).toLocaleString()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedThreat(threat)}
          className="text-blue-400 hover:text-blue-300"
        >
          <Eye className="w-4 h-4 mr-1" />
          Details
        </Button>
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
          <h1 className="text-3xl font-bold text-white mb-2">Threat Intelligence</h1>
          <p className="text-slate-400">Monitor and analyze cybersecurity threats targeting your infrastructure</p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" onClick={handleUpdateFeed} data-update-feed>
            <Database className="w-4 h-4 mr-2" />
            Update Feed
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
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {threats.filter(t => t.severity === 'Critical').length}
              </p>
              <p className="text-slate-400 text-sm">Critical Threats</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {threats.filter(t => t.severity === 'High').length}
              </p>
              <p className="text-slate-400 text-sm">High Severity</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {threats.filter(t => t.status === 'Active').length}
              </p>
              <p className="text-slate-400 text-sm">Active Threats</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {(threats.reduce((sum, t) => sum + t.riskScore, 0) / threats.length).toFixed(1)}
              </p>
              <p className="text-slate-400 text-sm">Avg Risk Score</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Threat Trends (6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={threatTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="critical" stackId="a" fill="#EF4444" />
              <Bar dataKey="high" stackId="a" fill="#F59E0B" />
              <Bar dataKey="medium" stackId="a" fill="#EAB308" />
              <Bar dataKey="low" stackId="a" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Threat Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Threat Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={threatTypeData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {threatTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search threats by title, type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Threats</option>
          <option value="critical">Critical</option>
          <option value="high">High Severity</option>
          <option value="active">Active</option>
          <option value="malware">Malware</option>
          <option value="vulnerability">Vulnerabilities</option>
        </select>
      </motion.div>

      {/* Threats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {filteredThreats.map((threat) => (
          <ThreatCard key={threat.id} threat={threat} />
        ))}
      </motion.div>

      {/* Threat Details Modal */}
      {selectedThreat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedThreat(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Threat Details</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedThreat(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">Threat Title</label>
                  <p className="text-white font-medium text-lg">{selectedThreat.title}</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Description</label>
                  <p className="text-slate-300">{selectedThreat.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-sm">Severity</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedThreat.severity)}`}>
                      {selectedThreat.severity}
                    </span>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedThreat.status)}`}>
                      {selectedThreat.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-sm">Type</label>
                    <p className="text-white font-medium">{selectedThreat.type}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Source</label>
                    <p className="text-white font-medium">{selectedThreat.source}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-sm">Confidence</label>
                    <p className="text-white font-medium">{selectedThreat.confidence}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Risk Score</label>
                    <p className={`font-bold text-lg ${selectedThreat.riskScore >= 8 ? 'text-red-400' : selectedThreat.riskScore >= 6 ? 'text-orange-400' : 'text-yellow-400'}`}>
                      {selectedThreat.riskScore}/10
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">Affected Systems</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedThreat.affectedSystems.map((system, index) => (
                      <span key={index} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                        {system}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Indicators of Compromise</label>
                  <div className="space-y-1 mt-1">
                    {selectedThreat.indicators.map((indicator, index) => (
                      <div key={index} className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs font-mono">
                        {indicator}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">MITRE ATT&CK Tactics</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedThreat.mitreTactics.map((tactic, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {tactic}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-sm">MITRE ID</label>
                    <p className="text-white font-medium">{selectedThreat.mitreId}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">CVE ID</label>
                    <p className="text-white font-medium">{selectedThreat.cveId || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-sm">First Seen</label>
                    <p className="text-white font-medium">{new Date(selectedThreat.firstSeen).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Last Updated</label>
                    <p className="text-white font-medium">{new Date(selectedThreat.lastUpdated).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700 flex space-x-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleGenerateReport}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button 
                variant="outline"
                onClick={handleViewMitreDetails}
              >
                <Globe className="w-4 h-4 mr-2" />
                View MITRE Details
              </Button>
              <Button 
                variant="outline"
                onClick={handleExportIOCs}
              >
                <Download className="w-4 h-4 mr-2" />
                Export IOCs
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default ThreatIntelligence

