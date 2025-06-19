// src/components/ui/LocationToggle.tsx
import React from "react";
import { cn } from "@/utils/cn";

interface LocationToggleProps {
  isOutdoor: boolean;
  onChange: (isOutdoor: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const LocationToggle: React.FC<LocationToggleProps> = ({
  isOutdoor,
  onChange,
  disabled = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative inline-flex rounded-lg p-1 bg-gray-100",
        className
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
          !isOutdoor
            ? "bg-white text-emerald-700 shadow-sm"
            : "text-gray-600 hover:text-gray-900",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="text-lg">🏠</span>
        <span>Indoor</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
          isOutdoor
            ? "bg-white text-emerald-700 shadow-sm"
            : "text-gray-600 hover:text-gray-900",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="text-lg">🌞</span>
        <span>Outdoor</span>
      </button>
    </div>
  );
};
