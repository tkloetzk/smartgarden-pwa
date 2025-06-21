// src/components/ui/DarkModeToggle.tsx
import React from "react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { cn } from "@/utils/cn";

interface DarkModeToggleProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabels?: boolean;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  size = "md",
  className,
  showLabels = false,
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const sizeClasses = {
    sm: {
      button: "w-12 h-6",
      circle: "w-4 h-4",
      translate: "translate-x-6",
      icon: "text-xs",
    },
    md: {
      button: "w-14 h-7",
      circle: "w-5 h-5",
      translate: "translate-x-7",
      icon: "text-sm",
    },
    lg: {
      button: "w-16 h-8",
      circle: "w-6 h-6",
      translate: "translate-x-8",
      icon: "text-base",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabels && (
        <span
          className={cn(
            "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
            sizes.button,
            isDarkMode
              ? "bg-emerald-600 hover:bg-emerald-700" // These are already good
              : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-background0"
          )}
        >
          ☀️
        </span>
      )}

      <button
        type="button"
        onClick={toggleDarkMode}
        className={cn(
          "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
          sizes.button,
          isDarkMode
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-background0"
        )}
        aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      >
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-card shadow transform ring-0 transition duration-200 ease-in-out flex items-center justify-center",
            sizes.circle,
            isDarkMode ? sizes.translate : "translate-x-0"
          )}
        >
          <span className={cn(sizes.icon)}>{isDarkMode ? "🌙" : "☀️"}</span>
        </span>
      </button>

      {showLabels && (
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            isDarkMode
              ? "text-emerald-700 dark:text-emerald-500"
              : "text-muted-foreground dark:text-muted-foreground"
          )}
        >
          🌙
        </span>
      )}
    </div>
  );
};
