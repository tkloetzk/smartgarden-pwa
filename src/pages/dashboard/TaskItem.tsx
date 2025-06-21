// src/pages/dashboard/TaskItem.tsx - Enhanced version

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  UpcomingTask,
  QuickCompleteOption,
  QuickCompletionValues,
} from "@/types/scheduling";

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
      setShowBypassDialog(false);
      setBypassReason("");
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
    if (name.includes("prune") || name.includes("trim")) return "✂️";
    return "📋";
  };

  const getStatusFromPriority = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "critical";
      case "medium":
        return "attention";
      case "low":
        return "healthy";
      default:
        return "healthy";
    }
  };

  return (
    <>
      <div
        className={`bg-card border border-border rounded-lg p-4 ${className}`}
      >
        {/* Task Header */}
        <div className="cursor-pointer" onClick={handleTaskClick}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getTaskIcon(task.task)}</span>
                <span className="font-semibold text-foreground">
                  {task.name}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {task.task} • {task.dueIn}
              </div>
              <StatusBadge
                status={getStatusFromPriority(task.priority)}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Quick Complete Options */}
          {task.quickCompleteOptions?.map((option, ind) => (
            <Button
              key={ind}
              variant="outline"
              size="sm"
              onClick={() => handleQuickComplete(option)}
              disabled={isLoading}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              {option.label}
            </Button>
          ))}

          {/* Bypass Button */}
          {task.canBypass && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBypassDialog(true)}
              disabled={isLoading}
              className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              Bypass
            </Button>
          )}

          {/* Log Manually Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/care/log?plantId=${task.plantId}&activityType=${
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

      {/* Bypass Dialog */}
      {showBypassDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Bypass Task: {task.task}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Why are you skipping this task? This helps improve future
              recommendations.
            </p>

            <div className="space-y-3 mb-4">
              {[
                "Plant looks healthy, doesn't need it yet",
                "Soil still moist from recent rain/watering",
                "Weather conditions not suitable",
                "Plant dormant/not growing actively",
                "Other reason",
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="bypassReason"
                    value={reason}
                    checked={bypassReason === reason}
                    onChange={(e) => setBypassReason(e.target.value)}
                    className="text-primary"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>

            {bypassReason === "Other reason" && (
              <textarea
                placeholder="Please specify..."
                value={bypassReason === "Other reason" ? "" : bypassReason}
                onChange={(e) => setBypassReason(e.target.value)}
                className="w-full p-3 border border-border rounded-md text-sm mb-4"
                rows={3}
              />
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBypassDialog(false);
                  setBypassReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBypass}
                disabled={!bypassReason.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? "Bypassing..." : "Bypass Task"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskItem;
