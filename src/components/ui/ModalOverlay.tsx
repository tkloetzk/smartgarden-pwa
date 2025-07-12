/**
 * Generic ModalOverlay component for consistent modal patterns
 * Eliminates repeated modal backdrop and container patterns
 */

import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export interface ModalOverlayProps {
  // Core props
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  
  // Customization
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  
  // Styling
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  
  // Behavior
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
  
  // Animation
  animationDuration?: number;
  
  // Custom header
  customHeader?: ReactNode;
  headerActions?: ReactNode;
  
  // Footer
  footer?: ReactNode;
}

const getSizeClasses = (size: string) => {
  switch (size) {
    case "sm": return "max-w-sm";
    case "md": return "max-w-md";
    case "lg": return "max-w-lg";
    case "xl": return "max-w-xl";
    case "full": return "max-w-full mx-4";
    default: return "max-w-md";
  }
};

export function ModalOverlay({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = "md",
  overlayClassName,
  contentClassName,
  headerClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventBodyScroll = true,
  animationDuration = 200,
  customHeader,
  headerActions,
  footer,
}: ModalOverlayProps) {
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);
  
  // Handle body scroll
  useEffect(() => {
    if (!preventBodyScroll) return;
    
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, preventBodyScroll]);
  
  if (!isOpen) return null;
  
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };
  
  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50",
        "animate-in fade-in duration-200",
        overlayClassName
      )}
      onClick={handleOverlayClick}
      style={{ animationDuration: `${animationDuration}ms` }}
    >
      <div
        className={cn(
          "bg-background rounded-lg shadow-lg w-full",
          getSizeClasses(size),
          "animate-in zoom-in-95 duration-200",
          contentClassName
        )}
        style={{ animationDuration: `${animationDuration}ms` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description || customHeader || showCloseButton) && (
          <div className={cn(
            "flex items-start justify-between p-6 pb-4",
            headerClassName
          )}>
            <div className="flex-1">
              {customHeader || (
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {headerActions}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 pb-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-0 border-t bg-muted/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized variants for common patterns
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default" as const,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
}) {
  const footer = (
    <div className="flex gap-2 justify-end pt-4">
      <Button 
        variant="outline" 
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelText}
      </Button>
      <Button 
        variant={confirmVariant}
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
        ) : null}
        {confirmText}
      </Button>
    </div>
  );

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </ModalOverlay>
  );
}

export function FormModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isLoading = false,
  isValid = true,
  size = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isValid?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const footer = (
    <div className="flex gap-2 justify-end pt-4">
      <Button 
        variant="outline" 
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelText}
      </Button>
      <Button 
        onClick={onSubmit}
        disabled={isLoading || !isValid}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
        ) : null}
        {submitText}
      </Button>
    </div>
  );

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={footer}
    >
      {children}
    </ModalOverlay>
  );
}