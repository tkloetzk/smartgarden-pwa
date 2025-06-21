// src/components/plant/NextTaskDisplay.tsx
import React from "react";
import { useNextPlantTask } from "@/hooks/useNextPlantTask";

interface NextTaskDisplayProps {
  plantId: string;
  className?: string;
  onClick?: (taskType: string) => void;
}

const NextTaskDisplay: React.FC<NextTaskDisplayProps> = ({
  plantId,
  className = "",
  onClick,
}) => {
  const { nextTask, isLoading } = useNextPlantTask(plantId);

  if (isLoading) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Loading next task...
      </div>
    );
  }

  if (!nextTask) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        📅 No tasks scheduled
      </div>
    );
  }

  // Map task descriptions to activity types for the form
  const getActivityType = (taskDescription: string): string => {
    const task = taskDescription.toLowerCase();
    if (task.includes("water") || task.includes("watering")) return "water";
    if (task.includes("fertiliz")) return "fertilize";
    if (task.includes("health check") || task.includes("observe"))
      return "observe";
    if (task.includes("harvest")) return "harvest";
    if (task.includes("transplant")) return "transplant";
    return "water"; // Default fallback
  };

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
        return "text-muted-foreground";
    }
  };

  const handleClick = () => {
    if (onClick) {
      const activityType = getActivityType(nextTask.task);
      onClick(activityType);
    }
  };

  return (
    <div
      className={`text-xs ${getPriorityColor(nextTask.priority)} ${className} ${
        onClick ? "cursor-pointer hover:underline hover:text-blue-600" : ""
      }`}
      onClick={handleClick}
    >
      <span className="mr-1">{getTaskIcon(nextTask.task)}</span>
      {nextTask.task} - {nextTask.dueIn}
      {onClick && (
        <span className="text-xs text-muted-foreground ml-2">
          → Click to log
        </span>
      )}
    </div>
  );
};

export default NextTaskDisplay;
