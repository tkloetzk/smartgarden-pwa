/**
 * Generic PriorityBadge component for standardized priority/status display
 * Eliminates repeated priority color mapping logic across components
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

export type Priority = "high" | "medium" | "low";
export type Status = "overdue" | "due-soon" | "due-today" | "upcoming" | "completed" | "cancelled";

export interface PriorityConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  textColor?: string;
}

const priorityConfigs: Record<Priority, PriorityConfig> = {
  high: {
    variant: "destructive",
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    textColor: "text-red-600",
  },
  medium: {
    variant: "default",
    className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    textColor: "text-orange-600",
  },
  low: {
    variant: "secondary",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    textColor: "text-green-600",
  },
};

const statusConfigs: Record<Status, PriorityConfig> = {
  overdue: {
    variant: "destructive",
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    textColor: "text-red-600",
  },
  "due-soon": {
    variant: "default",
    className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    textColor: "text-orange-600",
  },
  "due-today": {
    variant: "default",
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    textColor: "text-blue-600",
  },
  upcoming: {
    variant: "secondary",
    className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
    textColor: "text-gray-600",
  },
  completed: {
    variant: "secondary",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    textColor: "text-green-600",
  },
  cancelled: {
    variant: "outline",
    className: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900/20 dark:text-gray-500 dark:border-gray-700",
    textColor: "text-gray-500",
  },
};

export interface PriorityBadgeProps {
  priority?: Priority;
  status?: Status;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
  showDot?: boolean;
  customConfig?: PriorityConfig;
}

export function PriorityBadge({
  priority,
  status,
  children,
  className,
  variant,
  size = "default",
  showDot = false,
  customConfig,
}: PriorityBadgeProps) {
  // Determine configuration based on priority or status
  const config = customConfig || 
    (priority ? priorityConfigs[priority] : null) ||
    (status ? statusConfigs[status] : null) ||
    priorityConfigs.medium;

  const finalVariant = variant || config.variant;

  return (
    <Badge
      variant={finalVariant}
      className={cn(
        config.className,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "lg" && "text-sm px-3 py-1",
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "w-2 h-2 rounded-full mr-1.5",
            config.textColor?.replace("text-", "bg-") || "bg-current"
          )}
        />
      )}
      {children}
    </Badge>
  );
}

// Utility function to get priority colors for other components
export function getPriorityColors(priority: Priority): string {
  const config = priorityConfigs[priority];
  return config.className;
}

export function getStatusColors(status: Status): string {
  const config = statusConfigs[status];
  return config.className;
}

// Utility function to get border colors for cards
export function getPriorityBorderColor(priority: Priority): string {
  switch (priority) {
    case "high": return "border-l-red-500";
    case "medium": return "border-l-orange-500";
    case "low": return "border-l-green-500";
    default: return "";
  }
}

export function getStatusBorderColor(status: Status): string {
  switch (status) {
    case "overdue": return "border-l-red-500";
    case "due-soon": return "border-l-orange-500";
    case "due-today": return "border-l-blue-500";
    case "upcoming": return "border-l-gray-500";
    case "completed": return "border-l-green-500";
    case "cancelled": return "border-l-gray-400";
    default: return "";
  }
}

// Pre-configured priority badges for common use cases
export function HighPriorityBadge({ children, ...props }: Omit<PriorityBadgeProps, 'priority'>) {
  return <PriorityBadge priority="high" {...props}>{children}</PriorityBadge>;
}

export function MediumPriorityBadge({ children, ...props }: Omit<PriorityBadgeProps, 'priority'>) {
  return <PriorityBadge priority="medium" {...props}>{children}</PriorityBadge>;
}

export function LowPriorityBadge({ children, ...props }: Omit<PriorityBadgeProps, 'priority'>) {
  return <PriorityBadge priority="low" {...props}>{children}</PriorityBadge>;
}

// Pre-configured status badges
export function OverdueBadge({ children, ...props }: Omit<PriorityBadgeProps, 'status'>) {
  return <PriorityBadge status="overdue" {...props}>{children}</PriorityBadge>;
}

export function DueTodayBadge({ children, ...props }: Omit<PriorityBadgeProps, 'status'>) {
  return <PriorityBadge status="due-today" {...props}>{children}</PriorityBadge>;
}

export function CompletedBadge({ children, ...props }: Omit<PriorityBadgeProps, 'status'>) {
  return <PriorityBadge status="completed" {...props}>{children}</PriorityBadge>;
}