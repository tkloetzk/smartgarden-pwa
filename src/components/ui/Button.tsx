// src/components/ui/Button.tsx (Now Tailwind should work!)
import React from "react";
import { cn } from "@/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className,
  children,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseClasses = [
    "inline-flex items-center justify-center",
    "font-bold tracking-wide",
    "rounded-2xl",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-4 focus:ring-offset-0",
    "active:scale-95",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
    "select-none",
    "relative overflow-hidden",
  ].join(" ");

  const variantClasses = {
    primary: [
      "bg-gradient-to-r from-emerald-500 to-green-600",
      "text-white",
      "hover:from-emerald-600 hover:to-green-700",
      "active:from-emerald-700 active:to-green-800",
      "focus:ring-emerald-400/50",
      "shadow-lg shadow-emerald-500/25",
      "hover:shadow-xl hover:shadow-emerald-500/30",
      "border-0",
    ].join(" "),

    secondary: [
      "bg-gradient-to-r from-amber-400 to-orange-500",
      "text-white",
      "hover:from-amber-500 hover:to-orange-600",
      "focus:ring-amber-400/50",
      "shadow-lg shadow-amber-400/25",
      "border-0",
    ].join(" "),

    outline: [
      "bg-card text-primary",
      "hover:bg-muted hover:text-primary",
      "active:bg-muted",
      "focus:ring-ring/50",
      "border-2 border-border",
      "hover:border-ring",
      "shadow-sm hover:shadow-md",
    ].join(" "),

    ghost: [
      "bg-transparent text-muted-foreground",
      "hover:bg-muted hover:text-foreground",
      "active:bg-muted",
      "focus:ring-ring/50",
      "border-0",
      "shadow-none",
    ].join(" "),

    destructive: [
      "bg-gradient-to-r from-red-500 to-red-600",
      "text-white",
      "hover:from-red-600 hover:to-red-700",
      "active:from-red-700 active:to-red-800",
      "focus:ring-red-400/50",
      "shadow-lg shadow-red-500/25",
      "hover:shadow-xl hover:shadow-red-500/30",
      "border-0",
    ].join(" "),
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2.5",
    xl: "px-8 py-4 text-xl gap-3",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </div>
    </button>
  );
};
