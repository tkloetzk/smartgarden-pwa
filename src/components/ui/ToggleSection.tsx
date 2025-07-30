/**
 * Generic ToggleSection component for title/description + toggle button pattern
 * Eliminates repeated toggle section layouts across components
 */

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export interface ToggleSectionProps {
  // Content
  title: string;
  description?: string;
  children?: ReactNode;
  
  // Toggle button
  buttonText: string;
  activeButtonText?: string;
  isActive?: boolean;
  onToggle: () => void;
  
  // Styling
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  buttonClassName?: string;
  
  // Button customization
  buttonVariant?: "primary" | "destructive" | "outline" | "secondary" | "ghost";
  buttonSize?: "sm" | "md" | "lg";
  
  // Layout
  layout?: "horizontal" | "vertical";
  alignment?: "start" | "center" | "end" | "between";
  
  // Icons
  icon?: ReactNode;
  buttonIcon?: ReactNode;
  activeButtonIcon?: ReactNode;
  
  // State
  disabled?: boolean;
  loading?: boolean;
}

export function ToggleSection({
  title,
  description,
  children,
  buttonText,
  activeButtonText,
  isActive = false,
  onToggle,
  className,
  titleClassName,
  descriptionClassName,
  buttonClassName,
  buttonVariant = "outline",
  buttonSize = "sm",
  layout = "horizontal",
  alignment = "between",
  icon,
  buttonIcon,
  activeButtonIcon,
  disabled = false,
  loading = false,
}: ToggleSectionProps) {
  
  const getAlignmentClass = () => {
    switch (alignment) {
      case "start": return "justify-start items-start";
      case "center": return "justify-center items-center";
      case "end": return "justify-end items-end";
      case "between": return "justify-between items-center";
      default: return "justify-between items-center";
    }
  };

  const getLayoutClass = () => {
    switch (layout) {
      case "vertical": return "flex-col gap-3";
      case "horizontal": return `flex ${getAlignmentClass()}`;
      default: return `flex ${getAlignmentClass()}`;
    }
  };

  const currentButtonText = isActive && activeButtonText ? activeButtonText : buttonText;
  const currentButtonIcon = isActive && activeButtonIcon ? activeButtonIcon : buttonIcon;

  return (
    <div className={cn("space-y-3", className)}>
      <div className={getLayoutClass()}>
        {/* Content section */}
        <div className={cn(
          "flex-1",
          layout === "vertical" && "text-center"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            layout === "vertical" && "justify-center"
          )}>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <div className={cn(
              "text-sm font-medium text-primary",
              titleClassName
            )}>
              {title}
            </div>
          </div>
          {description && (
            <div className={cn(
              "text-xs text-muted-foreground mt-1",
              layout === "vertical" && "text-center",
              descriptionClassName
            )}>
              {description}
            </div>
          )}
        </div>

        {/* Toggle button */}
        <Button
          variant={isActive ? "primary" : buttonVariant}
          size={buttonSize}
          onClick={onToggle}
          disabled={disabled || loading}
          className={cn(
            "flex-shrink-0 transition-all duration-200",
            isActive && "border-primary/50 bg-primary text-primary-foreground",
            !isActive && "text-primary border-primary/50 hover:bg-primary/10",
            buttonClassName
          )}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              {currentButtonIcon && (
                <span className="mr-1">{currentButtonIcon}</span>
              )}
              {currentButtonText}
            </>
          )}
        </Button>
      </div>
      
      {/* Additional content */}
      {children && (
        <div className="pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

// Specialized variant for show/hide content pattern
export function ShowHideSection({
  title,
  description,
  showText = "Show",
  hideText = "Hide",
  isShown = false,
  onToggle,
  children,
  hiddenContent,
  ...props
}: Omit<ToggleSectionProps, 'buttonText' | 'activeButtonText' | 'isActive'> & {
  showText?: string;
  hideText?: string;
  isShown?: boolean;
  hiddenContent?: ReactNode;
}) {
  return (
    <div>
      <ToggleSection
        {...props}
        title={title}
        description={description}
        buttonText={showText}
        activeButtonText={hideText}
        isActive={isShown}
        onToggle={onToggle}
      >
        {children}
      </ToggleSection>
      
      {/* Collapsible content */}
      {isShown && hiddenContent && (
        <div className="mt-3 pt-3 border-t animate-in slide-in-from-top-2 duration-200">
          {hiddenContent}
        </div>
      )}
    </div>
  );
}

// Specialized variant for enable/disable pattern
export function EnableDisableSection({
  feature,
  description,
  isEnabled = false,
  onToggle,
  enableText = "Enable",
  disableText = "Disable",
  ...props
}: Omit<ToggleSectionProps, 'title' | 'buttonText' | 'activeButtonText' | 'isActive'> & {
  feature: string;
  isEnabled?: boolean;
  enableText?: string;
  disableText?: string;
}) {
  return (
    <ToggleSection
      {...props}
      title={feature}
      description={description}
      buttonText={enableText}
      activeButtonText={disableText}
      isActive={isEnabled}
      onToggle={onToggle}
      buttonVariant={isEnabled ? "destructive" : "primary"}
    />
  );
}