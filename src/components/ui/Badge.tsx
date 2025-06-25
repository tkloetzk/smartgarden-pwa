import React from "react";
import { cn } from "@/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export const Badge = ({
  variant = "default",
  size = "md",
  children,
  className,
  ...props
}: BadgeProps) => {
  const baseClasses =
    "inline-flex items-center font-medium rounded-full border";

  const variantClasses = {
    default: "bg-primary text-primary-foreground border-primary",
    secondary: "bg-secondary text-secondary-foreground border-secondary",
    destructive:
      "bg-destructive text-destructive-foreground border-destructive",
    outline: "text-foreground border-border bg-transparent",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Badge;
