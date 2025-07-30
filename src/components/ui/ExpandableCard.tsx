/**
 * Generic ExpandableCard component for collapsible content
 * Eliminates repeated expandable card patterns across components
 */

import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ActionCard, ActionCardProps } from "./ActionCard";
import { cn } from "@/utils/cn";

export interface ExpandableCardProps extends Omit<ActionCardProps, 'onHeaderClick' | 'children'> {
  // Expandable content
  children: ReactNode;
  expandedContent?: ReactNode;
  
  // State control
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  
  // Customization
  expandIcon?: ReactNode;
  collapseIcon?: ReactNode;
  expandText?: string;
  collapseText?: string;
  showExpandText?: boolean;
  
  // Animation
  animationDuration?: string;
}

export function ExpandableCard({
  children,
  expandedContent,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  expandIcon,
  collapseIcon,
  expandText = "Show more",
  collapseText = "Show less",
  showExpandText = false,
  animationDuration = "200ms",
  headerActions,
  ...actionCardProps
}: ExpandableCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  
  // Use controlled or internal state
  const isExpanded = controlledExpanded ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

  const handleToggle = () => {
    setExpanded(!isExpanded);
  };

  const toggleIcon = isExpanded 
    ? (collapseIcon || <ChevronUp className="h-4 w-4" />)
    : (expandIcon || <ChevronDown className="h-4 w-4" />);

  const toggleText = isExpanded ? collapseText : expandText;

  const expandActions = (
    <div className="flex items-center gap-2">
      {headerActions}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
        aria-label={isExpanded ? "Collapse" : "Expand"}
      >
        {showExpandText && <span>{toggleText}</span>}
        <span className={cn(
          "transition-transform duration-200",
          isExpanded && "rotate-180"
        )}>
          {toggleIcon}
        </span>
      </button>
    </div>
  );

  return (
    <ActionCard
      {...actionCardProps}
      headerActions={expandActions}
      onHeaderClick={handleToggle}
      headerClassName={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        actionCardProps.headerClassName
      )}
    >
      {/* Always visible content */}
      {children}
      
      {/* Expandable content with animation */}
      <div
        className={cn(
          "overflow-hidden transition-all ease-in-out",
          isExpanded ? "opacity-100" : "opacity-0 max-h-0"
        )}
        style={{
          transitionDuration: animationDuration,
          maxHeight: isExpanded ? "1000px" : "0px",
        }}
      >
        {expandedContent && (
          <div className="pt-3 border-t mt-3">
            {expandedContent}
          </div>
        )}
      </div>
    </ActionCard>
  );
}

// Specialized variant for simple text expansion
export function ExpandableTextCard({
  text,
  expandedText,
  maxLines = 3,
  ...props
}: Omit<ExpandableCardProps, 'children' | 'expandedContent'> & {
  text: string;
  expandedText?: string;
  maxLines?: number;
}) {
  const shouldShowExpansion = expandedText || text.length > 150;

  return (
    <ExpandableCard
      {...props}
      expandedContent={expandedText || text}
    >
      <p 
        className={cn(
          "text-sm text-muted-foreground",
          !shouldShowExpansion && "line-clamp-none",
          shouldShowExpansion && `line-clamp-${maxLines}`
        )}
      >
        {shouldShowExpansion ? text.substring(0, 150) + "..." : text}
      </p>
    </ExpandableCard>
  );
}