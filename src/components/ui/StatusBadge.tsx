// src/components/ui/StatusBadge.tsx
import React from "react";
import { cn } from "@/utils/cn";

interface StatusBadgeProps {
  status: "healthy" | "attention" | "critical" | "new";
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const baseClasses = "inline-flex items-center font-medium rounded-full";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  const statusClasses = {
    healthy: "bg-green-100 text-green-800",
    attention: "bg-yellow-100 text-yellow-800",
    critical: "bg-red-100 text-red-800",
    new: "bg-blue-100 text-blue-800",
  };

  const statusIcons = {
    healthy: "✅",
    attention: "⚠️",
    critical: "🚨",
    new: "🌱",
  };

  return (
    <span className={cn(baseClasses, sizeClasses[size], statusClasses[status])}>
      <span className="mr-1">{statusIcons[status]}</span>
      {status}
    </span>
  );
};
