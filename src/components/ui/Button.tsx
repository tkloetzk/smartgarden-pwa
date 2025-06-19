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
      "bg-white/90 backdrop-blur-sm text-emerald-700",
      "hover:bg-emerald-50 hover:text-emerald-800",
      "active:bg-emerald-100",
      "focus:ring-emerald-400/50",
      "border-2 border-emerald-500",
      "shadow-md hover:shadow-lg",
    ].join(" "),

    ghost: [
      "bg-white/20 backdrop-blur-sm text-gray-700",
      "hover:bg-white/40 hover:text-gray-900",
      "active:bg-white/60",
      "focus:ring-gray-400/50",
      "border border-white/30",
      "shadow-sm",
    ].join(" "),

    destructive: [
      "bg-gradient-to-r from-red-500 to-pink-600",
      "text-white",
      "hover:from-red-600 hover:to-pink-700",
      "focus:ring-red-400/50",
      "shadow-lg shadow-red-500/25",
      "border-0",
    ].join(" "),
  };

  const sizeClasses = {
    sm: "px-5 py-2.5 text-sm min-h-10 gap-2",
    md: "px-7 py-3.5 text-base min-h-12 gap-2.5",
    lg: "px-9 py-4.5 text-lg min-h-14 gap-3",
    xl: "px-11 py-6 text-xl min-h-16 gap-3",
  };

  const LoadingSpinner = () => (
    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
  );

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
