import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Cpu,
  Activity,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Download,
  Upload,
  Eye,
  BarChart3,
  Zap,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const AIModels = ({ systemStatus }) => {
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [isTraining, setIsTraining] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedConfigOption, setSelectedConfigOption] = useState('')
  const [selectedExportFormat, setSelectedExportFormat] = useState('')

  // Sample AI model data
  useEffect(() => {
    const sampleModels = [
      {
        id: 1,
        name: 'Anomaly Detection Engine',
        type: 'Anomaly Detection',
        algorithm: 'Isolation Forest + Autoencoder',
        status: 'Active',
        accuracy: 95.2,
        precision: 94.8,
        recall: 96.1,
        f1Score: 95.4,
        lastTrained: new Date(Date.now() - 86400000).toISOString(),
        predictions: 1247,
        falsePositives: 23,
        version: 'v2.1.3',
        trainingData: '50,000 samples',
        inferenceTime: '12ms',
        modelSize: '45MB'
      },
      {
        id: 2,
        name: 'Threat Classification Model',
        type: 'Classification',
        algorithm: 'Random Forest + CNN',
        status: 'Active',
        accuracy: 97.8,
        precision: 98.2,
        recall: 97.4,
        f1Score: 97.8,
        lastTrained: new Date(Date.now() - 172800000).toISOString(),
        predictions: 892,
        falsePositives: 8,
        version: 'v1.8.2',
        trainingData: '75,000 samples',
        inferenceTime: '8ms',
        modelSize: '67MB'
      },
      {
        id: 3,
        name: 'Behavioral Analysis Engine',
        type: 'Behavioral Analysis',
        algorithm: 'LSTM + Attention',
        status: 'Training',
        accuracy: 93.4,
        precision: 92.8,
        recall: 94.1,
        f1Score: 93.4,
        lastTrained: new Date(Date.now() - 3600000).toISOString(),
        predictions: 2156,
        falsePositives: 67,
        version: 'v3.0.1',
        trainingData: '100,000 samples',
        inferenceTime: '15ms',
        modelSize: '89MB'
      },
      {
        id: 4,
        name: 'Network Traffic Analyzer',
        type: 'Network Analysis',
        algorithm: 'Deep Neural Network',
        status: 'Active',
        accuracy: 96.1,
        precision: 95.7,
        recall: 96.5,
        f1Score: 96.1,
        lastTrained: new Date(Date.now() - 259200000).toISOString(),
        predictions: 1834,
        falsePositives: 34,
        version: 'v2.3.1',
        trainingData: '80,000 samples',
        inferenceTime: '10ms',
        modelSize: '52MB'
      },
      {
        id: 5,
        name: 'Zero-Day Detection System',
        type: 'Zero-Day Detection',
        algorithm: 'Ensemble Learning',
        status: 'Inactive',
        accuracy: 89.7,
        precision: 88.9,
        recall: 90.5,
        f1Score: 89.7,
        lastTrained: new Date(Date.now() - 604800000).toISOString(),
        predictions: 456,
        falsePositives: 12,
        version: 'v1.2.0',
        trainingData: '30,000 samples',
        inferenceTime: '25ms',
        modelSize: '123MB'
      }
    ]
    setModels(sampleModels)
    setSelectedModel(sampleModels[0])
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'text-green-400 bg-green-500/20'
      case 'Training':
        return 'text-blue-400 bg-blue-500/20'
      case 'Inactive':
        return 'text-gray-400 bg-gray-500/20'
      case 'Error':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'Training':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
      case 'Inactive':
        return <Pause className="w-4 h-4 text-gray-400" />
      case 'Error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <Pause className="w-4 h-4 text-gray-400" />
    }
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 95) return 'text-green-400'
    if (accuracy >= 90) return 'text-yellow-400'
    return 'text-red-400'
  }

  // Performance data for charts
  const performanceData = [
    { time: '00:00', accuracy: 94.2, predictions: 45, latency: 12 },
    { time: '04:00', accuracy: 95.1, predictions: 38, latency: 11 },
    { time: '08:00', accuracy: 96.3, predictions: 67, latency: 13 },
    { time: '12:00', accuracy: 95.8, predictions: 52, latency: 12 },
    { time: '16:00', accuracy: 97.1, predictions: 73, latency: 14 },
    { time: '20:00', accuracy: 96.5, predictions: 61, latency: 13 },
    { time: '24:00', accuracy: 95.9, predictions: 48, latency: 12 }
  ]

  const modelTypeData = [
    { name: 'Anomaly Detection', value: 35, color: '#3B82F6' },
    { name: 'Classification', value: 25, color: '#8B5CF6' },
    { name: 'Behavioral Analysis', value: 20, color: '#10B981' },
    { name: 'Network Analysis', value: 15, color: '#F59E0B' },
    { name: 'Zero-Day Detection', value: 5, color: '#EF4444' }
  ]

  const ModelCard = ({ model }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300 cursor-pointer ${
        selectedModel?.id === model.id ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700/50'
      }`}
      onClick={() => setSelectedModel(model)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{model.name}</h3>
            <p className="text-slate-400 text-sm">{model.algorithm}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(model.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
            {model.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <div className={`text-lg font-bold ${getAccuracyColor(model.accuracy)}`}>
            {model.accuracy}%
          </div>
          <div className="text-slate-400 text-xs">Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{model.predictions}</div>
          <div className="text-slate-400 text-xs">Predictions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">{model.inferenceTime}</div>
          <div className="text-slate-400 text-xs">Inference</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{model.falsePositives}</div>
          <div className="text-slate-400 text-xs">False Positives</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Version {model.version}</span>
        <span>Last trained: {new Date(model.lastTrained).toLocaleDateString()}</span>
      </div>
    </motion.div>
  )

  const handleTrainModel = () => {
    setIsTraining(true)
    // Simulate training process
    setTimeout(() => {
      setIsTraining(false)
      // Update model status
      if (selectedModel) {
        const updatedModels = models.map(model =>
          model.id === selectedModel.id
            ? { ...model, status: 'Active', lastTrained: new Date().toISOString() }
            : model
        )
        setModels(updatedModels)
        setSelectedModel(updatedModels.find(m => m.id === selectedModel.id))
      }
    }, 5000)
  }

  const handleConfigureModel = () => {
    if (!selectedModel) {
      alert('No model selected for configuration.')
      return
    }
    
    console.log('Configuring model:', selectedModel.name)
    setShowConfigModal(true)
  }

  const applyConfiguration = () => {
    if (selectedConfigOption) {
      alert(`Configuration updated: ${selectedConfigOption}\n\nModel "${selectedModel.name}" has been reconfigured successfully. Changes will take effect after the next training cycle.`)
      console.log(`Applied configuration: ${selectedConfigOption} to model ${selectedModel.name}`)
      setShowConfigModal(false)
      setSelectedConfigOption('')
    } else {
      alert('Please select a configuration option.')
    }
  }
  
  const handleExportModel = () => {
    if (!selectedModel) {
      alert('No model selected for export.')
      return
    }
    
    console.log('Exporting model:', selectedModel.name)
    setShowExportModal(true)
  }

  const exportModel = () => {
    if (selectedExportFormat) {
      // Create and download a sample file
      const modelData = {
        name: selectedModel.name,
        type: selectedModel.type,
        algorithm: selectedModel.algorithm,
        version: selectedModel.version,
        accuracy: selectedModel.accuracy,
        precision: selectedModel.precision,
        recall: selectedModel.recall,
        f1Score: selectedModel.f1Score,
        trainingData: selectedModel.trainingData,
        inferenceTime: selectedModel.inferenceTime,
        modelSize: selectedModel.modelSize,
        exportDate: new Date().toISOString(),
        exportFormat: selectedExportFormat
      }
      
      const dataStr = JSON.stringify(modelData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedModel.name.replace(/\s+/g, '_')}_${selectedModel.version}_${selectedExportFormat.split(' ')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert(`Model "${selectedModel.name}" exported successfully as ${selectedExportFormat}!\n\nThe model file has been downloaded to your default downloads folder.`)
      setShowExportModal(false)
      setSelectedExportFormat('')
    } else {
      alert('Please select an export format.')
    }
  }

  const handleImportModel = () => {
    // Create a file input element
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.pkl,.h5,.onnx,.pt,.pth,.joblib,.json'
    fileInput.multiple = false
    
    fileInput.onchange = (event) => {
      const file = event.target.files[0]
      if (file) {
        console.log('Importing model file:', file.name)
        
        // Simulate model import process
        const newModel = {
          id: models.length + 1,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          type: 'Imported Model',
          algorithm: 'Custom Algorithm',
          status: 'Inactive',
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          lastTrained: new Date().toISOString(),
          predictions: 0,
          falsePositives: 0,
          version: 'v1.0.0',
          trainingData: 'Imported',
          inferenceTime: 'TBD',
          modelSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`
        }
        
        // Add the new model to the list
        const updatedModels = [...models, newModel]
        setModels(updatedModels)
        setSelectedModel(newModel)
        
        alert(`Model "${file.name}" imported successfully!\n\nThe model has been added to your AI Models list and needs to be configured and trained before use.`)
      }
    }
    
    // Trigger file selection dialog
    fileInput.click()
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
          <h1 className="text-3xl font-bold text-white mb-2">AI Models Management</h1>
          <p className="text-slate-400">Monitor and manage machine learning models for cybersecurity</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleTrainModel}
            disabled={isTraining}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isTraining ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isTraining ? 'Training...' : 'Train Models'}
          </Button>
          <Button variant="outline" onClick={handleImportModel}>
            <Upload className="w-4 h-4 mr-2" />
            Import Model
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
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{models.length}</p>
              <p className="text-slate-400 text-sm">Total Models</p>
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
                {models.filter(m => m.status === 'Active').length}
              </p>
              <p className="text-slate-400 text-sm">Active Models</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {(models.reduce((sum, m) => sum + m.accuracy, 0) / models.length).toFixed(1)}%
              </p>
              <p className="text-slate-400 text-sm">Avg Accuracy</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {models.reduce((sum, m) => sum + m.predictions, 0).toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm">Total Predictions</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Models List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-4"
        >
          <h3 className="text-xl font-semibold text-white mb-4">AI Models</h3>
          {models.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </motion.div>

        {/* Model Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          {selectedModel && (
            <>
              {/* Model Info */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">{selectedModel.name}</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleConfigureModel}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportModel}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getAccuracyColor(selectedModel.accuracy)}`}>
                      {selectedModel.accuracy}%
                    </div>
                    <div className="text-slate-400 text-sm">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{selectedModel.precision}%</div>
                    <div className="text-slate-400 text-sm">Precision</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{selectedModel.recall}%</div>
                    <div className="text-slate-400 text-sm">Recall</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{selectedModel.f1Score}%</div>
                    <div className="text-slate-400 text-sm">F1 Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-400 text-sm">Algorithm</label>
                    <p className="text-white font-medium">{selectedModel.algorithm}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Training Data</label>
                    <p className="text-white font-medium">{selectedModel.trainingData}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Model Size</label>
                    <p className="text-white font-medium">{selectedModel.modelSize}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Inference Time</label>
                    <p className="text-white font-medium">{selectedModel.inferenceTime}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Version</label>
                    <p className="text-white font-medium">{selectedModel.version}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Last Trained</label>
                    <p className="text-white font-medium">
                      {new Date(selectedModel.lastTrained).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Accuracy Trend */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Accuracy Trend (24h)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={performanceData}>
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
                      <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Predictions Volume */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Predictions Volume</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={performanceData}>
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
                      <Area type="monotone" dataKey="predictions" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Model Types Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Model Types Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={modelTypeData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {modelTypeData.map((entry, index) => (
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

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Model Performance Summary</h4>
            {models.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(model.status)}
                  <div>
                    <p className="text-white font-medium">{model.name}</p>
                    <p className="text-slate-400 text-sm">{model.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getAccuracyColor(model.accuracy)}`}>
                    {model.accuracy}%
                  </p>
                  <p className="text-slate-400 text-sm">{model.predictions} predictions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Configure Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Configure {selectedModel?.name}</h3>
            <p className="text-slate-400 mb-4">Select a configuration option:</p>
            <div className="space-y-2 mb-6">
              {[
                'Adjust detection threshold',
                'Update training parameters',
                'Modify feature selection',
                'Set alert sensitivity',
                'Configure data preprocessing'
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
              <Button onClick={applyConfiguration} className="flex-1">
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Export {selectedModel?.name}</h3>
            <p className="text-slate-400 mb-4">Select an export format:</p>
            <div className="space-y-2 mb-6">
              {[
                'ONNX (.onnx)',
                'TensorFlow (.pb)',
                'PyTorch (.pt)',
                'Scikit-learn (.pkl)',
                'JSON Config (.json)'
              ].map((format) => (
                <label key={format} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format}
                    checked={selectedExportFormat === format}
                    onChange={(e) => setSelectedExportFormat(e.target.value)}
                    className="text-blue-500"
                  />
                  <span className="text-white">{format}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-3">
              <Button onClick={exportModel} className="flex-1">
                Export Model
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowExportModal(false)
                  setSelectedExportFormat('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIModels

