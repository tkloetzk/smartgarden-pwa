// Create src/components/plant/NextTaskDisplay.tsx

import React from "react";
import { useNextPlantTask } from "@/hooks/useNextPlantTask";

interface NextTaskDisplayProps {
  plantId: string;
  className?: string;
}

const NextTaskDisplay: React.FC<NextTaskDisplayProps> = ({
  plantId,
  className = "",
}) => {
  const { nextTask, isLoading } = useNextPlantTask(plantId);

  if (isLoading) {
    return (
      <div className={`text-xs text-gray-400 ${className}`}>
        Loading next task...
      </div>
    );
  }

  if (!nextTask) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        📅 No tasks scheduled
      </div>
    );
  }

  // Choose icon based on task type
  const getTaskIcon = (task: string): string => {
    if (task.toLowerCase().includes("water")) return "💧";
    if (task.toLowerCase().includes("fertiliz")) return "🌱";
    if (
      task.toLowerCase().includes("observe") ||
      task.toLowerCase().includes("check")
    )
      return "👁️";
    if (task.toLowerCase().includes("harvest")) return "🌾";
    return "📋";
  };

  // Choose color based on priority
  const getPriorityColor = (priority: "low" | "medium" | "high"): string => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`text-xs ${getPriorityColor(nextTask.priority)} ${className}`}
    >
      <span className="mr-1">{getTaskIcon(nextTask.task)}</span>
      {nextTask.task} - {nextTask.dueIn}
    </div>
  );
};

export default NextTaskDisplay;
