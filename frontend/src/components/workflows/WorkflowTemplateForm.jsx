import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Plus, Trash2 } from 'lucide-react';

const ACTION_TYPES = [
  { value: 'notification', label: 'Send Notification' },
  { value: 'device_command', label: 'Execute Device Command' },
  { value: 'isolation', label: 'Network Isolation' },
  { value: 'log_collection', label: 'Collect Logs' },
  { value: 'threat_scan', label: 'Run Threat Scan' },
  { value: 'custom_script', label: 'Execute Custom Script' }
];

const THREAT_TYPES = [
  { value: 'malware', label: 'Malware' },
  { value: 'unauthorized_access', label: 'Unauthorized Access' },
  { value: 'anomalous_traffic', label: 'Anomalous Traffic' },
  { value: 'firmware_tampering', label: 'Firmware Tampering' },
  { value: 'dos_attack', label: 'DoS Attack' },
  { value: 'other', label: 'Other' }
];

const WorkflowTemplateForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    threat_type: '',
    actions: [{ type: 'notification', name: '', parameters: {} }]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleActionChange = (index, field, value) => {
    const updatedActions = [...formData.actions];
    
    if (field === 'type') {
      // Reset parameters when action type changes
      updatedActions[index] = { 
        type: value, 
        name: updatedActions[index].name,
        parameters: {} 
      };
    } else if (field === 'parameter') {
      const [paramName, paramValue] = value;
      updatedActions[index] = {
        ...updatedActions[index],
        parameters: {
          ...updatedActions[index].parameters,
          [paramName]: paramValue
        }
      };
    } else {
      updatedActions[index] = { 
        ...updatedActions[index], 
        [field]: value 
      };
    }
    
    setFormData({ ...formData, actions: updatedActions });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        { type: 'notification', name: '', parameters: {} }
      ]
    });
  };

  const removeAction = (index) => {
    const updatedActions = [...formData.actions];
    updatedActions.splice(index, 1);
    setFormData({ ...formData, actions: updatedActions });
  };

  const renderActionParameters = (action, index) => {
    switch (action.type) {
      case 'notification':
        return (
          <>
            <TextField
              fullWidth
              margin="dense"
              label="Recipients"
              value={action.parameters.recipients || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['recipients', e.target.value])}
              placeholder="Comma-separated email addresses"
            />
            <TextField
              fullWidth
              margin="dense"
              label="Message"
              value={action.parameters.message || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['message', e.target.value])}
              multiline
              rows={2}
            />
          </>
        );
      
      case 'device_command':
        return (
          <>
            <TextField
              fullWidth
              margin="dense"
              label="Device ID"
              value={action.parameters.device_id || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['device_id', e.target.value])}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Command"
              value={action.parameters.command || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['command', e.target.value])}
            />
          </>
        );
      
      case 'isolation':
        return (
          <>
            <TextField
              fullWidth
              margin="dense"
              label="Device ID"
              value={action.parameters.device_id || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['device_id', e.target.value])}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Isolation Type</InputLabel>
              <Select
                value={action.parameters.isolation_type || 'full'}
                onChange={(e) => handleActionChange(index, 'parameter', ['isolation_type', e.target.value])}
                label="Isolation Type"
              >
                <MenuItem value="full">Full Isolation</MenuItem>
                <MenuItem value="partial">Partial Isolation</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      
      case 'log_collection':
        return (
          <>
            <TextField
              fullWidth
              margin="dense"
              label="Device ID"
              value={action.parameters.device_id || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['device_id', e.target.value])}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Log Types"
              value={action.parameters.log_types || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['log_types', e.target.value])}
              placeholder="system,application,security"
            />
          </>
        );
      
      case 'threat_scan':
        return (
          <>
            <TextField
              fullWidth
              margin="dense"
              label="Device ID"
              value={action.parameters.device_id || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['device_id', e.target.value])}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Scan Type</InputLabel>
              <Select
                value={action.parameters.scan_type || 'quick'}
                onChange={(e) => handleActionChange(index, 'parameter', ['scan_type', e.target.value])}
                label="Scan Type"
              >
                <MenuItem value="quick">Quick Scan</MenuItem>
                <MenuItem value="full">Full Scan</MenuItem>
                <MenuItem value="custom">Custom Scan</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      
      case 'custom_script':
        return (
          <>
            <TextField
              fullWidth
              margin="dense"
              label="Script Path"
              value={action.parameters.script_path || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['script_path', e.target.value])}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Arguments"
              value={action.parameters.arguments || ''}
              onChange={(e) => handleActionChange(index, 'parameter', ['arguments', e.target.value])}
              placeholder="--arg1 value1 --arg2 value2"
            />
          </>
        );
      
      default:
        return null;
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Workflow Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Threat Type</InputLabel>
            <Select
              name="threat_type"
              value={formData.threat_type}
              onChange={handleChange}
              label="Threat Type"
            >
              {THREAT_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Workflow Actions</Typography>
            <Button 
              startIcon={<AddIcon />} 
              onClick={addAction}
              variant="outlined"
              size="small"
            >
              Add Action
            </Button>
          </Box>
          
          {formData.actions.map((action, index) => (
            <Box 
              key={index} 
              sx={{ 
                p: 2, 
                mb: 2, 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                position: 'relative'
              }}
            >
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => removeAction(index)}
                sx={{ position: 'absolute', top: 8, right: 8 }}
                disabled={formData.actions.length <= 1}
              >
                <DeleteIcon />
              </IconButton>
              
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Step {index + 1}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Action Name"
                    value={action.name}
                    onChange={(e) => handleActionChange(index, 'name', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Action Type</InputLabel>
                    <Select
                      value={action.type}
                      onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                      label="Action Type"
                    >
                      {ACTION_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Parameters
                  </Typography>
                  {renderActionParameters(action, index)}
                </Grid>
              </Grid>
            </Box>
          ))}
        </Grid>
        
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.description || formData.actions.some(a => !a.name)}
          >
            Save Workflow
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkflowTemplateForm;