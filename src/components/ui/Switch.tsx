// src/components/ui/Switch.tsx
import React from "react";
import { cn } from "@/utils/cn";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  leftLabel,
  rightLabel,
  leftIcon,
  rightIcon,
  size = "md",
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}) => {
  const sizeClasses = {
    sm: {
      track: "w-10 h-5",
      thumb: "w-4 h-4",
      translate: "translate-x-5",
      text: "text-sm",
      gap: "gap-2",
    },
    md: {
      track: "w-12 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-6",
      text: "text-base",
      gap: "gap-3",
    },
    lg: {
      track: "w-14 h-7",
      thumb: "w-6 h-6",
      translate: "translate-x-7",
      text: "text-lg",
      gap: "gap-4",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex items-center", sizes.gap, className)}>
      {/* Left side (Indoor) */}
      {(leftLabel || leftIcon) && (
        <div
          className={cn(
            "flex items-center gap-2 transition-colors duration-200",
            sizes.text,
            !checked ? "text-emerald-700 font-semibold" : "text-gray-500",
            disabled && "opacity-50"
          )}
        >
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {leftLabel && <span>{leftLabel}</span>}
        </div>
      )}

      {/* Switch Track */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        id={id}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
          sizes.track,
          checked
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-gray-300 hover:bg-gray-400",
          disabled && "cursor-not-allowed opacity-50 hover:bg-gray-300"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out",
            sizes.thumb,
            checked ? sizes.translate : "translate-x-0"
          )}
        />
      </button>

      {/* Right side (Outdoor) */}
      {(rightLabel || rightIcon) && (
        <div
          className={cn(
            "flex items-center gap-2 transition-colors duration-200",
            sizes.text,
            checked ? "text-emerald-700 font-semibold" : "text-gray-500",
            disabled && "opacity-50"
          )}
        >
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          {rightLabel && <span>{rightLabel}</span>}
        </div>
      )}
    </div>
  );
};
