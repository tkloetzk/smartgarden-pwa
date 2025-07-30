/**
 * Generic ActionButtonGroup component for common button patterns
 * Eliminates repeated button layout and styling patterns
 */

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export interface ActionButtonConfig {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  color?: string; // For custom background colors
}

export interface ActionButtonGroupProps {
  buttons: ActionButtonConfig[];
  layout?: "grid" | "flex" | "vertical";
  gridCols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullWidth?: boolean;
}

const getGapClass = (gap: string) => {
  switch (gap) {
    case "sm": return "gap-1";
    case "md": return "gap-2";
    case "lg": return "gap-4";
    default: return "gap-2";
  }
};

const getGridColsClass = (cols: number) => {
  switch (cols) {
    case 1: return "grid-cols-1";
    case 2: return "grid-cols-2";
    case 3: return "grid-cols-3";
    case 4: return "grid-cols-4";
    default: return "grid-cols-2";
  }
};

export function ActionButtonGroup({
  buttons,
  layout = "grid",
  gridCols = 2,
  gap = "md",
  size = "sm",
  className,
  fullWidth = false,
}: ActionButtonGroupProps) {
  const gapClass = getGapClass(gap);
  
  const layoutClass = {
    grid: cn("grid", getGridColsClass(gridCols), gapClass),
    flex: cn("flex flex-wrap", gapClass),
    vertical: cn("flex flex-col", gapClass),
  }[layout];

  return (
    <div className={cn(layoutClass, className)}>
      {buttons.map((button) => (
        <Button
          key={button.id}
          variant={button.variant || "primary"}
          size={button.size || size}
          onClick={button.onClick}
          disabled={button.disabled || button.loading}
          className={cn(
            fullWidth && "flex-1",
            button.color && `bg-${button.color} hover:bg-${button.color}/90 text-white`,
            button.className
          )}
          style={button.color ? {
            backgroundColor: button.color,
          } : undefined}
        >
          {button.loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              {button.icon && <span className="mr-1">{button.icon}</span>}
              {button.label}
            </>
          )}
        </Button>
      ))}
    </div>
  );
}

// Specialized variants for common patterns
export function PrimaryCancelButtons({
  primaryLabel = "Confirm",
  cancelLabel = "Cancel",
  onPrimary,
  onCancel,
  primaryLoading = false,
  primaryDisabled = false,
  primaryVariant = "default",
  gap = "md",
  className,
}: {
  primaryLabel?: string;
  cancelLabel?: string;
  onPrimary: () => void;
  onCancel: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  primaryVariant?: "default" | "destructive";
  gap?: "sm" | "md" | "lg";
  className?: string;
}) {
  const buttons: ActionButtonConfig[] = [
    {
      id: "cancel",
      label: cancelLabel,
      variant: "outline",
      onClick: onCancel,
    },
    {
      id: "primary",
      label: primaryLabel,
      variant: primaryVariant === "default" ? "primary" : primaryVariant,
      onClick: onPrimary,
      loading: primaryLoading,
      disabled: primaryDisabled,
    },
  ];

  return (
    <ActionButtonGroup
      buttons={buttons}
      layout="flex"
      gap={gap}
      fullWidth={true}
      className={className}
    />
  );
}

export function QuickActionButtons({
  onWater,
  onFertilize,
  onObserve,
  onPrune,
  disabled = false,
  size = "sm",
  className,
}: {
  onWater?: () => void;
  onFertilize?: () => void;
  onObserve?: () => void;
  onPrune?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const buttons: ActionButtonConfig[] = [
    onWater && {
      id: "water",
      label: "💧 Water",
      onClick: onWater,
      disabled,
      color: "#3b82f6", // blue-500
    },
    onFertilize && {
      id: "fertilize", 
      label: "🌱 Fertilize",
      onClick: onFertilize,
      disabled,
      color: "#22c55e", // green-500
    },
    onObserve && {
      id: "observe",
      label: "👁️ Observe",
      onClick: onObserve,
      disabled,
      color: "#8b5cf6", // violet-500
    },
    onPrune && {
      id: "prune",
      label: "✂️ Prune", 
      onClick: onPrune,
      disabled,
      color: "#f59e0b", // amber-500
    },
  ].filter(Boolean) as ActionButtonConfig[];

  return (
    <ActionButtonGroup
      buttons={buttons}
      layout="grid"
      gridCols={2}
      size={size}
      className={className}
    />
  );
}

export function ToggleActionButton({
  label,
  activeLabel,
  icon,
  activeIcon,
  isActive,
  onClick,
  variant = "outline",
  activeVariant = "primary", 
  size = "sm",
  className,
}: {
  label: string;
  activeLabel?: string;
  icon?: ReactNode;
  activeIcon?: ReactNode;
  isActive: boolean;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  activeVariant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <Button
      variant={isActive ? activeVariant : variant}
      size={size}
      onClick={onClick}
      className={cn(
        "transition-all duration-200",
        isActive && "border-primary/50 bg-primary/10 text-primary",
        className
      )}
    >
      {isActive ? (activeIcon || icon) : icon}
      {isActive ? (activeLabel || label) : label}
    </Button>
  );
}