// src/components/shared/QuickActionButtons.tsx
import React from "react";
import { Button } from "@/components/ui/Button";
import { CareActivityType } from "@/types";

// Define the subset of care activities that are commonly used as quick actions
export type QuickActionType = Extract<CareActivityType, "water" | "fertilize" | "observe" | "photo" | "pruning" | "harvest" | "transplant" | "note" | "lighting" | "thin">;

export interface QuickActionButtonsProps {
  onAction: (type: QuickActionType | "more") => void;
  actions?: (QuickActionType | "more")[];
  layout?: "grid" | "horizontal";
  preventPropagation?: boolean;
  className?: string;
  buttonSize?: "sm" | "md" | "lg";
}

interface ActionConfig {
  icon: string;
  label: string;
  className: string;
  variant?: "primary" | "outline";
}

const ACTION_CONFIG: Record<QuickActionType | "more", ActionConfig> = {
  water: {
    icon: "💧",
    label: "Water",
    className: "bg-blue-500 hover:bg-blue-600 text-white",
    variant: "primary"
  },
  fertilize: {
    icon: "🌱",
    label: "Fertilize", 
    className: "bg-green-500 hover:bg-green-600 text-white",
    variant: "primary"
  },
  observe: {
    icon: "👁️",
    label: "Inspect",
    className: "bg-orange-500 hover:bg-orange-600 text-white", 
    variant: "primary"
  },
  photo: {
    icon: "📸",
    label: "Photo",
    className: "bg-purple-500 hover:bg-purple-600 text-white",
    variant: "primary"
  },
  pruning: {
    icon: "✂️",
    label: "Prune",
    className: "bg-indigo-500 hover:bg-indigo-600 text-white",
    variant: "primary"
  },
  harvest: {
    icon: "🌾",
    label: "Harvest",
    className: "bg-yellow-500 hover:bg-yellow-600 text-white",
    variant: "primary"
  },
  transplant: {
    icon: "🪴",
    label: "Transplant", 
    className: "bg-emerald-500 hover:bg-emerald-600 text-white",
    variant: "primary"
  },
  note: {
    icon: "📝",
    label: "Note",
    className: "bg-gray-500 hover:bg-gray-600 text-white",
    variant: "primary"
  },
  lighting: {
    icon: "💡",
    label: "Lighting",
    className: "bg-amber-500 hover:bg-amber-600 text-white",
    variant: "primary"
  },
  thin: {
    icon: "🌱",
    label: "Thin",
    className: "bg-lime-500 hover:bg-lime-600 text-white",
    variant: "primary"
  },
  more: {
    icon: "📝",
    label: "More",
    className: "",
    variant: "outline"
  }
};

const DEFAULT_ACTIONS: (QuickActionType | "more")[] = ["water", "fertilize", "observe", "more"];

export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  onAction,
  actions = DEFAULT_ACTIONS,
  layout = "grid",
  preventPropagation = true,
  className = "",
  buttonSize = "sm"
}) => {
  const handleClick = (actionType: QuickActionType | "more") => {
    return (e: React.MouseEvent) => {
      if (preventPropagation) {
        e.stopPropagation();
      }
      onAction(actionType);
    };
  };

  const containerClasses = 
    layout === "grid" 
      ? "grid grid-cols-2 gap-2" 
      : "flex gap-2 flex-wrap";

  return (
    <div className={`${containerClasses} ${className}`}>
      {actions.map((actionType) => {
        const config = ACTION_CONFIG[actionType];
        return (
          <Button
            key={actionType}
            size={buttonSize}
            onClick={handleClick(actionType)}
            className={config.className}
            variant={config.variant}
          >
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </Button>
        );
      })}
    </div>
  );
};

// Helper function to get icon for any care activity type (for backward compatibility)
export const getActivityIcon = (activityType: CareActivityType | string): string => {
  const activityLower = activityType.toLowerCase();
  
  if (activityLower.includes("water")) return "💧";
  if (activityLower.includes("fertiliz")) return "🌱";
  if (activityLower.includes("observ") || activityLower.includes("check") || activityLower.includes("inspect")) return "👁️";
  if (activityLower.includes("photo")) return "📸";
  if (activityLower.includes("harvest")) return "🌾";
  if (activityLower.includes("transplant")) return "🪴";
  if (activityLower.includes("pruni")) return "✂️";
  if (activityLower.includes("light")) return "💡";
  if (activityLower.includes("thin")) return "🌱";
  
  return "📝"; // Default for note or other activities
};

export default QuickActionButtons;