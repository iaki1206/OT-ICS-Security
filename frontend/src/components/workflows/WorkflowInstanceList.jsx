import React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip } from "../ui/tooltip";
import { Square } from "lucide-react";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800"
};

const WorkflowInstanceList = ({ instances, onSelect, selectedId, onCancel, isLoading }) => {
  if (isLoading && instances.length === 0) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <Card className="p-4 text-center">
        <p>No workflow instances available</p>
      </Card>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card className="p-0 overflow-hidden">
      <ScrollArea className="h-[500px]">
        <div className="divide-y">
          {instances.map((instance) => (
            <div 
              key={instance.id}
              className={`p-4 hover:bg-accent/50 cursor-pointer ${selectedId === instance.id ? 'bg-accent/50' : ''}`}
              onClick={() => onSelect(instance)}
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-medium flex items-center">
                    {instance.template_name || "Unnamed Workflow"}
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${statusColors[instance.status] || "bg-gray-100"}`}>
                      {instance.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Started: {formatDate(instance.created_at)}
                  </div>
                  {instance.completed_at && (
                    <div className="text-sm text-muted-foreground">
                      Completed: {formatDate(instance.completed_at)}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {instance.alert_id ? `Alert ID: ${instance.alert_id}` : 'Manual execution'}
                  </div>
                </div>
                {onCancel && ['pending', 'in_progress'].includes(instance.status) && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(instance.id);
                    }}
                    className="ml-2"
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default WorkflowInstanceList;