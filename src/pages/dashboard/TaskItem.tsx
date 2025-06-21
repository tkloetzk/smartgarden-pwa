// src/components/dashboard/TaskItem.tsx (completely redesigned)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { UpcomingTask } from "@/types/scheduling";

interface TaskItemProps {
  task: UpcomingTask;
  onQuickAction?: (taskId: string, action: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onQuickAction }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const getTaskInfo = (taskDescription: string, dueIn: string) => {
    const taskLower = taskDescription.toLowerCase();

    if (taskLower.includes("water")) {
      return {
        icon: "💧",
        action: "Time to water",
        description: "Check if soil feels dry, then water until runoff",
        urgency: getUrgencyFromDueIn(dueIn),
        urgencyColor: getUrgencyColor(dueIn),
        quickActions: ["Water Now", "Not Needed", "Check Later"],
      };
    }

    if (taskLower.includes("health") || taskLower.includes("observe")) {
      return {
        icon: "👀",
        action: "Health check time",
        description: "Look for pests, diseased leaves, or growth issues",
        urgency: getUrgencyFromDueIn(dueIn),
        urgencyColor: getUrgencyColor(dueIn),
        quickActions: ["Looks Good", "Take Photo", "Found Issues"],
      };
    }

    if (taskLower.includes("fertiliz")) {
      return {
        icon: "🌱",
        action: "Feeding time",
        description: "Apply nutrients to support healthy growth",
        urgency: getUrgencyFromDueIn(dueIn),
        urgencyColor: getUrgencyColor(dueIn),
        quickActions: ["Fed Plant", "Skip This Week", "Check Growth"],
      };
    }

    // Default case
    return {
      icon: "📋",
      action: taskDescription,
      description: "Complete this care task for your plant",
      urgency: getUrgencyFromDueIn(dueIn),
      urgencyColor: getUrgencyColor(dueIn),
      quickActions: ["Done", "Skip", "View Plant"],
    };
  };

  const getUrgencyFromDueIn = (dueIn: string): string => {
    if (dueIn.includes("overdue")) {
      const days = dueIn.match(/\d+/)?.[0];
      return `${days} days overdue`;
    }
    if (dueIn.includes("today")) {
      return "Today";
    }
    if (dueIn.includes("tomorrow")) {
      return "Tomorrow";
    }
    return dueIn;
  };

  const getUrgencyColor = (dueIn: string): string => {
    if (dueIn.includes("overdue"))
      return "text-red-600 bg-red-50 border-red-200";
    if (dueIn.includes("today"))
      return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(task.id, action);
    }
  };

  const taskInfo = getTaskInfo(task.task, task.dueIn);

  return (
    <div className={`rounded-xl border-2 ${taskInfo.urgencyColor} bg-card`}>
      <div className="p-4">
        {/* Header with plant name and action */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{taskInfo.icon}</span>
              <h3 className="font-bold text-foreground">{task.name}</h3>
            </div>

            <div className="font-semibold text-foreground mb-1">
              {taskInfo.action}
            </div>

            <div className="text-sm text-muted-foreground">
              {taskInfo.description}
            </div>
          </div>

          {/* Urgency indicator */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${taskInfo.urgencyColor}`}
          >
            {taskInfo.urgency}
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2 mb-2">
          {taskInfo.quickActions.slice(0, 2).map((action) => (
            <Button
              key={action}
              variant={
                action.includes("Not") || action.includes("Skip")
                  ? "outline"
                  : "primary"
              }
              size="sm"
              className="text-sm h-8"
              onClick={() => handleQuickAction(action)}
            >
              {action}
            </Button>
          ))}

          {taskInfo.quickActions.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-sm h-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Less" : "More"}
              <svg
                className={`w-3 h-3 ml-1 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
          )}
        </div>

        {/* Expanded actions */}
        {isExpanded && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {taskInfo.quickActions.slice(2).map((action) => (
              <Button
                key={action}
                variant="primary"
                size="sm"
                className="text-sm h-8"
                onClick={() => handleQuickAction(action)}
              >
                {action}
              </Button>
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="text-sm h-8 text-blue-600"
              onClick={() => navigate(`/plants/${task.plantId}`)}
            >
              View Plant Details →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
