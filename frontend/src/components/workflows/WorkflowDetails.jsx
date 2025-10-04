import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

const WorkflowDetails = ({ workflow, type }) => {
  if (!workflow) return null;
  
  const isTemplate = type === 'template';
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{workflow.name}</span>
          {!isTemplate && (
            <Badge className={`ml-2 ${
              workflow.status === 'completed' ? 'bg-green-500' : 
              workflow.status === 'in_progress' ? 'bg-blue-500' : 
              workflow.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
            }`}>
              {workflow.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Description</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{workflow.description}</p>
          </div>
          
          {isTemplate ? (
            <>
              <div>
                <h3 className="text-sm font-medium">Threat Type</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{workflow.threat_type}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Actions</h3>
                <ul className="mt-2 space-y-2">
                  {workflow.actions?.map((action, index) => (
                    <li key={index} className="text-sm border rounded p-2">
                      <div className="font-medium">{action.type}</div>
                      <div className="text-gray-500 dark:text-gray-400">Target: {action.target}</div>
                      <div className="text-gray-500 dark:text-gray-400">{action.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium">Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(workflow.current_step / workflow.total_steps) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  Step {workflow.current_step} of {workflow.total_steps}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Target Device</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{workflow.target_device}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Timeline</h3>
                <div className="text-sm">
                  <div>Started: {new Date(workflow.started_at).toLocaleString()}</div>
                  {workflow.completed_at && (
                    <div>Completed: {new Date(workflow.completed_at).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowDetails;