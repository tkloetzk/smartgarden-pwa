/**
 * Generic ActionCard component to eliminate repeated card layout patterns
 * Handles the common card structure with icon, title, optional badge, and content
 */

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

export interface ActionCardProps {
  // Content props
  title: string;
  icon?: ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  children: ReactNode;
  
  // Layout props
  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  
  // Card props
  className?: string;
  
  // Interaction props
  onClick?: () => void;
  onHeaderClick?: () => void;
  
  // Visual props
  priority?: "high" | "medium" | "low";
  isLoading?: boolean;
  
  // Header options
  headerActions?: ReactNode;
  hideHeader?: boolean;
}

const getPriorityColors = (priority?: string) => {
  switch (priority) {
    case "high":
      return "border-l-red-500 bg-red-50/50 dark:bg-red-950/20";
    case "medium":
      return "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20";
    case "low":
      return "border-l-green-500 bg-green-50/50 dark:bg-green-950/20";
    default:
      return "";
  }
};

export function ActionCard({
  title,
  icon,
  badge,
  children,
  headerClassName,
  contentClassName,
  titleClassName,
  className,
  onClick,
  onHeaderClick,
  priority,
  isLoading,
  headerActions,
  hideHeader = false,
}: ActionCardProps) {
  const priorityColors = priority ? getPriorityColors(priority) : "";
  
  if (isLoading) {
    return (
      <Card className={cn("border-border shadow-sm", priorityColors, className)}>
        <CardHeader className={cn("pb-3", headerClassName)}>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className={cn("pt-0", contentClassName)}>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "border-border shadow-sm",
        priorityColors,
        priority && "border-l-4",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      {!hideHeader && (
        <CardHeader 
          className={cn(
            "pb-3",
            onHeaderClick && "cursor-pointer hover:bg-muted/50 transition-colors",
            headerClassName
          )}
          onClick={onHeaderClick}
        >
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "flex items-center gap-2 text-base",
              titleClassName
            )}>
              {icon && <span className="flex-shrink-0">{icon}</span>}
              <span className="flex-1">{title}</span>
              {badge && (
                <Badge variant={badge.variant || "default"}>
                  {badge.text}
                </Badge>
              )}
            </CardTitle>
            {headerActions && (
              <div className="flex items-center gap-1">
                {headerActions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

// Specialized variants for common use cases
export function StatusCard({ 
  status,
  statusVariant = "default",
  ...props 
}: ActionCardProps & { 
  status: string;
  statusVariant?: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <ActionCard
      {...props}
      badge={{ text: status, variant: statusVariant }}
    />
  );
}

export function LoadingCard({ 
  title = "Loading...",
  lines = 2,
  ...props 
}: Partial<ActionCardProps> & { lines?: number }) {
  return (
    <ActionCard
      {...props}
      title={title}
      isLoading={true}
    >
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              "h-4 bg-muted rounded animate-pulse",
              i === lines - 1 && "w-3/4"
            )}
          />
        ))}
      </div>
    </ActionCard>
  );
}