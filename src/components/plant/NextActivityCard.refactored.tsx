/**
 * Refactored NextActivityCard using generic UI components
 * Demonstrates elimination of repeated card layout patterns
 */

import React from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import { ActionCard, LoadingCard } from "@/components/ui/ActionCard";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { ActionButtonGroup } from "@/components/ui/ActionButtonGroup";
import { UpcomingTask } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/utils/cn";

interface NextActivityCardProps {
  nextTask?: UpcomingTask | null;
  isLoading?: boolean;
  className?: string;
  onMarkComplete?: (taskId: string) => void;
  onPostpone?: (taskId: string) => void;
  showActions?: boolean;
}

export function NextActivityCard({
  nextTask,
  isLoading = false,
  className,
  onMarkComplete,
  onPostpone,
  showActions = false,
}: NextActivityCardProps) {
  
  // Determine priority based on task urgency
  const getPriority = (task: UpcomingTask) => {
    if (task.isOverdue) return "high";
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff <= 24) return "medium";
    return "low";
  };

  const getStatus = (task: UpcomingTask) => {
    if (task.isOverdue) return "overdue";
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff <= 24) return "due-today";
    if (hoursDiff <= 48) return "due-soon";
    return "upcoming";
  };

  // Loading state
  if (isLoading) {
    return (
      <LoadingCard
        title="Next Activity"
        icon={<Calendar className="h-4 w-4" />}
        lines={3}
        className={className}
      />
    );
  }

  // No tasks state
  if (!nextTask) {
    return (
      <ActionCard
        title="Next Activity"
        icon={<Calendar className="h-4 w-4" />}
        className={className}
      >
        <div className="flex items-center gap-3 py-2">
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">
              All caught up!
            </div>
            <div className="text-xs text-muted-foreground">
              No tasks scheduled
            </div>
          </div>
        </div>
      </ActionCard>
    );
  }

  const priority = getPriority(nextTask);
  const status = getStatus(nextTask);
  const timeAgo = formatDistanceToNow(new Date(nextTask.dueDate), { addSuffix: true });

  // Task action buttons
  const taskActions = showActions && onMarkComplete && onPostpone ? (
    <ActionButtonGroup
      buttons={[
        {
          id: "complete",
          label: "Complete",
          variant: "default",
          onClick: () => onMarkComplete(nextTask.id),
          icon: <CheckCircle2 className="h-3 w-3" />,
        },
        {
          id: "postpone",
          label: "Postpone",
          variant: "outline",
          onClick: () => onPostpone(nextTask.id),
        },
      ]}
      layout="flex"
      size="sm"
      gap="sm"
    />
  ) : null;

  return (
    <ActionCard
      title="Next Activity"
      icon={<Calendar className="h-4 w-4" />}
      priority={priority}
      badge={{
        text: status === "overdue" ? "Overdue" : 
              status === "due-today" ? "Due Today" :
              status === "due-soon" ? "Due Soon" : "Upcoming",
        variant: status === "overdue" ? "destructive" : "default"
      }}
      className={className}
    >
      <div className="space-y-3">
        {/* Task info */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
            status === "overdue" && "bg-red-100 text-red-600",
            status === "due-today" && "bg-blue-100 text-blue-600",
            status === "due-soon" && "bg-orange-100 text-orange-600",
            status === "upcoming" && "bg-gray-100 text-gray-600"
          )}>
            {nextTask.type === "water" && "💧"}
            {nextTask.type === "fertilize" && "🌱"}
            {nextTask.type === "observe" && "👁️"}
            {nextTask.type === "prune" && "✂️"}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">
              {nextTask.task}
            </div>
            <div className="text-xs text-muted-foreground">
              {nextTask.plantName} • {timeAgo}
            </div>
          </div>
          <PriorityBadge status={status} size="sm">
            {status === "overdue" ? "Overdue" : 
             status === "due-today" ? "Today" :
             status === "due-soon" ? "Soon" : "Later"}
          </PriorityBadge>
        </div>

        {/* Task actions */}
        {taskActions && (
          <div className="pt-2 border-t">
            {taskActions}
          </div>
        )}
      </div>
    </ActionCard>
  );
}