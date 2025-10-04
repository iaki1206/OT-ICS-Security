import React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip } from "../ui/tooltip";
import { PlayCircle } from "lucide-react";

const WorkflowTemplateList = ({ templates, selectedId, onSelect, onExecute, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <Card className="p-4 text-center">
        <p>No workflow templates available</p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <ScrollArea className="h-[500px]">
        <div className="divide-y">
          {templates.map((template) => (
            <div 
              key={template.id}
              className={`p-4 hover:bg-accent/50 cursor-pointer flex justify-between items-start ${selectedId === template.id ? 'bg-accent/50' : ''}`}
              onClick={() => onSelect(template.id)}
            >
              <div>
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span>{template.actions?.length || 0} steps • </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
                    {template.threat_type || 'Generic'}
                  </span>
                </div>
                <p className="text-sm mt-2">
                  {template.description?.length > 60 
                    ? `${template.description.substring(0, 60)}...` 
                    : template.description}
                </p>
              </div>
              {onExecute && (
                <Tooltip>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onExecute(template.id);
                    }}
                    className="ml-2"
                  >
                    <PlayCircle className="h-5 w-5" />
                  </Button>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default WorkflowTemplateList;