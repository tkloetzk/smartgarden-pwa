// src/components/plant/GroupedCareActivityItem.tsx
import React, { useState } from "react";
import { GroupedCareActivity } from "@/utils/careActivityGrouping";
import { formatDateTime } from "@/utils/dateUtils";
import CareActivityItem from "./CareActivityItem";

interface GroupedCareActivityItemProps {
  groupedActivity: GroupedCareActivity;
}

const GroupedCareActivityItem: React.FC<GroupedCareActivityItemProps> = ({ 
  groupedActivity 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIndividual, setShowIndividual] = useState(false);

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case "water":
        return "💧";
      case "fertilize":
        return "🌱";
      case "observe":
        return "👁️";
      case "harvest":
        return "🌾";
      case "transplant":
        return "🏺";
      case "pruning":
        return "✂️";
      case "thin":
        return "🌿";
      case "lighting":
        return "💡";
      case "photo":
        return "📸";
      case "note":
        return "📝";
      default:
        return "📋";
    }
  };

  const getGroupedTitle = (groupedActivity: GroupedCareActivity): string => {
    const { type, details, plantCount } = groupedActivity;
    
    switch (type) {
      case "water": {
        let amountDisplay = "unknown amount";
        if (details.waterAmount && details.waterUnit) {
          amountDisplay = `${details.waterAmount} ${details.waterUnit} each`;
        }
        return `Watered ${plantCount} plants (${amountDisplay})`;
      }
      case "fertilize": {
        const product = details.product || "fertilizer";
        return `Fertilized ${plantCount} plants with ${product}`;
      }
      case "observe": {
        return `Health check for ${plantCount} plants`;
      }
      case "harvest": {
        return `Harvested from ${plantCount} plants`;
      }
      case "transplant": {
        const toContainer = details.toContainer || "new containers";
        return `Transplanted ${plantCount} plants to ${toContainer}`;
      }
      case "pruning": {
        return `Pruned ${plantCount} plants`;
      }
      case "thin": {
        return `Thinned ${plantCount} plants`;
      }
      case "lighting": {
        return `Adjusted lighting for ${plantCount} plants`;
      }
      case "photo": {
        return `Photographed ${plantCount} plants`;
      }
      case "note": {
        return `Added notes for ${plantCount} plants`;
      }
      default:
        return `Bulk activity for ${plantCount} plants`;
    }
  };

  const renderGroupedDetails = (groupedActivity: GroupedCareActivity) => {
    const { type, details, activities, plantCount } = groupedActivity;

    // Get plant names/IDs for display
    const plantDisplay = activities
      .map(activity => activity.plantId)
      .slice(0, 3)
      .join(", ");
    
    const hasMore = activities.length > 3;
    const moreCount = activities.length - 3;

    const plantsList = (
      <div className="mb-3">
        <span className="font-medium text-muted-foreground">Plants:</span>
        <div className="text-sm mt-1">
          {plantDisplay}
          {hasMore && <span className="text-muted-foreground"> (+{moreCount} more)</span>}
        </div>
      </div>
    );

    switch (type) {
      case "water": {
        return (
          <div className="space-y-2">
            {plantsList}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Amount per plant:</span>
                <div>
                  {details.waterAmount && details.waterUnit
                    ? `${details.waterAmount} ${details.waterUnit}`
                    : "Not specified"}
                </div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Total applied:</span>
                <div>
                  {details.waterAmount && details.waterUnit
                    ? `${details.waterAmount * plantCount} ${details.waterUnit}`
                    : "Not calculated"}
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      case "fertilize": {
        return (
          <div className="space-y-2">
            {plantsList}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Product:</span>
                <div>{details.product || "Not specified"}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Dilution:</span>
                <div>{details.dilution || "Not specified"}</div>
              </div>
              {details.applicationMethod && (
                <>
                  <div>
                    <span className="font-medium text-muted-foreground">Method:</span>
                    <div>{details.applicationMethod.replace("-", " ")}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }
      
      default: {
        return (
          <div className="space-y-2">
            {plantsList}
            {details.notes && (
              <div>
                <span className="font-medium text-muted-foreground">Notes:</span>
                <div className="text-sm">{details.notes}</div>
              </div>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className="border border-border rounded-lg bg-gradient-to-r from-blue-50/30 to-green-50/30 dark:from-blue-950/20 dark:to-green-950/20">
      {/* Main grouped activity header */}
      <div
        className="p-4 cursor-pointer hover:bg-background/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl relative">
            {getActivityIcon(groupedActivity.type)}
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {groupedActivity.plantCount}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-foreground text-sm">
                  {getGroupedTitle(groupedActivity)}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(groupedActivity.date)}
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  📦 Bulk Activity
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-background/30">
          <div className="pt-3 space-y-3">
            {renderGroupedDetails(groupedActivity)}

            {/* Toggle between grouped and individual view */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIndividual(!showIndividual);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showIndividual ? "Hide Individual Records" : "View Individual Records"}
              </button>
            </div>

            {/* Individual activities list */}
            {showIndividual && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Individual Records ({groupedActivity.activities.length})
                </h5>
                <div className="space-y-2">
                  {groupedActivity.activities.map((activity) => (
                    <div key={activity.id} className="ml-4">
                      <CareActivityItem activity={activity} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes section for the group */}
            {groupedActivity.details.notes && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="font-medium text-muted-foreground">Group Notes:</span>
                <div className="text-sm text-foreground mt-1">
                  {groupedActivity.details.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupedCareActivityItem;