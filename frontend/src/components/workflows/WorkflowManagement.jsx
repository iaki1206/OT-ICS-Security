import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Plus, PlayCircle, Square } from "lucide-react";
import { workflowService } from '../../lib/api/workflowService';
import WorkflowTemplateList from './WorkflowTemplateList';
import WorkflowInstanceList from './WorkflowInstanceList';
import WorkflowTemplateForm from './WorkflowTemplateForm';
import WorkflowDetails from './WorkflowDetails';

const WorkflowManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load templates and instances
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const templatesData = await workflowService.getTemplates();
        setTemplates(templatesData);
        
        const instancesData = await workflowService.getInstances();
        setInstances(instancesData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching workflow data:', err);
        setError('Failed to load workflow data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset selections when changing tabs
    setSelectedTemplate(null);
    setSelectedInstance(null);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setSelectedInstance(null);
  };

  const handleInstanceSelect = (instance) => {
    setSelectedInstance(instance);
    setSelectedTemplate(null);
  };

  const handleCreateTemplate = async (templateData) => {
    setIsLoading(true);
    try {
      const newTemplate = await workflowService.createTemplate(templateData);
      setTemplates([...templates, newTemplate]);
      setIsCreateDialogOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error creating template:', err);
      setError('Failed to create template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTemplate = async (id, templateData) => {
    setIsLoading(true);
    try {
      const updatedTemplate = await workflowService.updateTemplate(id, templateData);
      setTemplates(templates.map(t => t.id === id ? updatedTemplate : t));
      setSelectedTemplate(updatedTemplate);
      setError(null);
    } catch (err) {
      console.error('Error updating template:', err);
      setError('Failed to update template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    setIsLoading(true);
    try {
      await workflowService.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      setSelectedTemplate(null);
      setError(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInstance = async (id) => {
    setIsLoading(true);
    try {
      const updatedInstance = await workflowService.cancelInstance(id);
      setInstances(instances.map(i => i.id === id ? updatedInstance : i));
      if (selectedInstance && selectedInstance.id === id) {
        setSelectedInstance(updatedInstance);
      }
      setError(null);
    } catch (err) {
      console.error('Error cancelling instance:', err);
      setError('Failed to cancel workflow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Automated Response Workflows</h1>
        <p className="text-muted-foreground">
          Create and manage automated response workflows for security incidents
        </p>
      </div>

      <Tabs defaultValue={tabValue === 0 ? "templates" : "history"} onValueChange={(value) => setTabValue(value === "templates" ? 0 : 1)}>
        <TabsList className="mb-6">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Workflow History</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Workflow Templates</h2>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
              <WorkflowTemplateList 
                templates={templates}
                selectedId={selectedTemplate?.id}
                onSelect={handleTemplateSelect}
                onExecute={handleExecuteTemplate}
                isLoading={isLoading}
              />
            </div>
            <div className="md:col-span-2">
              {selectedTemplate ? (
                <WorkflowDetails 
                  item={selectedTemplate}
                  type="template"
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  onExecute={handleExecuteTemplate}
                />
              ) : (
                <Card>
                  <CardContent className="text-center p-6">
                    <p className="text-muted-foreground">
                      Select a template to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="history">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Workflow Instances</h2>
              </div>
              <WorkflowInstanceList 
                instances={instances}
                selectedId={selectedInstance?.id}
                onSelect={handleInstanceSelect}
                onCancel={handleCancelInstance}
                isLoading={isLoading}
              />
            </div>
            <div className="md:col-span-2">
              {selectedInstance ? (
                <WorkflowDetails 
                  item={selectedInstance}
                  type="instance"
                  onCancel={handleCancelInstance}
                />
              ) : (
                <Card>
                  <CardContent className="text-center p-6">
                    <p className="text-muted-foreground">
                      Select a workflow instance to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Template Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => setIsCreateDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Workflow Template' : 'Create Workflow Template'}
            </DialogTitle>
          </DialogHeader>
          <WorkflowTemplateForm 
            initialData={editingTemplate}
            onSubmit={handleTemplateFormSubmit}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default WorkflowManagement;