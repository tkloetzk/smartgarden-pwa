// src/pages/dashboard/TaskItem.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  UpcomingTask,
  QuickCompleteOption,
  QuickCompletionValues,
} from "@/types/scheduling";
import { CheckCircle2, Clock } from "lucide-react";

interface TaskItemProps {
  task: UpcomingTask;
  onQuickComplete?: (
    taskId: string,
    values: QuickCompletionValues
  ) => Promise<void>;
  onBypass?: (taskId: string, reason: string) => Promise<void>;
  className?: string;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onQuickComplete,
  onBypass,
  className = "",
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showBypassDialog, setShowBypassDialog] = useState(false);
  const [bypassReason, setBypassReason] = useState("");
  const [bypassSubmitted, setBypassSubmitted] = useState(false);

  const handleTaskClick = () => {
    navigate(`/plants/${task.plantId}`);
  };

  const handleQuickComplete = async (option: QuickCompleteOption) => {
    if (!onQuickComplete) return;

    setIsLoading(true);
    try {
      await onQuickComplete(task.id, option.values);
    } catch (error) {
      console.error("Failed to quick complete task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypass = async () => {
    if (!onBypass || !bypassReason.trim()) return;

    setIsLoading(true);
    try {
      await onBypass(task.id, bypassReason);
      setBypassSubmitted(true);

      setTimeout(() => {
        setShowBypassDialog(false);
        setBypassReason("");
        setBypassSubmitted(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to bypass task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskIcon = (taskName: string) => {
    const name = taskName.toLowerCase();
    if (name.includes("water")) return "💧";
    if (name.includes("fertiliz")) return "🌱";
    if (name.includes("observe") || name.includes("health")) return "👁";
    return "🌿";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusFromPriority = (priority: string) => {
    switch (priority) {
      case "high":
        return "critical" as const;
      case "medium":
        return "attention" as const;
      case "low":
        return "healthy" as const;
      default:
        return "new" as const;
    }
  };

  return (
    <div className={`bg-card rounded-lg border p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-2xl">{getTaskIcon(task.task)}</div>
          <div className="flex-1 min-w-0" onClick={handleTaskClick}>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground">{task.name}</h4>
              <StatusBadge
                status={getStatusFromPriority(task.priority)}
                size="sm"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{task.task}</p>
            <p className="text-xs text-muted-foreground mb-1">
              Stage: {task.plantStage}
            </p>
            <p className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.dueIn}
            </p>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {task.quickCompleteOptions &&
              task.quickCompleteOptions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.quickCompleteOptions.map((option, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickComplete(option)}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBypassDialog(true)}
                disabled={isLoading}
                className="text-xs"
              >
                Bypass
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/log-care?plant=${task.plantId}&type=${
                      task.task.toLowerCase().includes("water")
                        ? "water"
                        : "fertilize"
                    }`
                  )
                }
                disabled={isLoading}
              >
                Log Manually
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showBypassDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            {bypassSubmitted ? (
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-green-700">
                  Task Bypassed
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your preferences are being learned for better recommendations.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">
                  Bypass "{task.task}" for {task.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Why are you skipping this task? This helps us improve future
                  recommendations.
                </p>
                <textarea
                  value={bypassReason}
                  onChange={(e) => setBypassReason(e.target.value)}
                  placeholder="e.g., plant looks healthy, watered recently, weather too cold..."
                  className="w-full h-24 p-3 border rounded-md resize-none text-sm"
                  disabled={isLoading}
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {
                      setShowBypassDialog(false);
                      setBypassReason("");
                    }}
                    variant="outline"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBypass}
                    disabled={!bypassReason.trim() || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      "Submit Bypass"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
