// src/components/plant/CareActivityItem.tsx
import React, { useState } from "react";
import { CareRecord } from "@/types";
import { formatDateTime } from "@/utils/dateUtils";

interface CareActivityItemProps {
  activity: CareRecord;
}

const CareActivityItem: React.FC<CareActivityItemProps> = ({ activity }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
      case "moisture":
        return "🌡️";
      default:
        return "📋";
    }
  };

  const getActivityTitle = (activity: CareRecord): string => {
    const details = activity.details;

    switch (activity.type) {
      case "water": {
        // Handle both string and object amount formats
        let amountDisplay = "unknown amount";
        if (typeof details.amount === "object" && details.amount?.value) {
          amountDisplay = `${details.amount.value} ${details.amount.unit}`;
        } else if (details.waterAmount && details.waterUnit) {
          amountDisplay = `${details.waterAmount} ${details.waterUnit}`;
        }
        
        // Show section-based context
        let title = `Watering (${amountDisplay})`;
        if (details.sectionBased && details.totalSectionAmount) {
          title = `Section Watering (${details.totalSectionAmount.value} ${details.totalSectionAmount.unit} total)`;
        }

        // Show partial watering indicator
        if (details.isPartialWatering && details.wateringCompleteness) {
          const percentage = Math.round(details.wateringCompleteness * 100);
          title = `⚠️ ${title} - ${percentage}% of recommended`;
        }
        
        return title;
      }
      case "fertilize": {
        let title = `Fertilized with ${details.product || "fertilizer"}`;
        if (details.sectionBased) {
          title = `Section Fertilizing with ${details.product || "fertilizer"}`;
        }
        return title;
      }
      case "observe": {
        return `Health Check (${details.healthAssessment || "unknown"})`;
      }
      case "harvest": {
        const amount =
          typeof details.amount === "string"
            ? details.amount
            : "unknown amount";
        return `Harvested ${amount}`;
      }
      case "transplant": {
        return `Transplanted to ${details.toContainer || "new container"}`;
      }
      case "moisture": {
        const moistureLevel = details.moistureLevel?.before || "unknown";
        return `Moisture Check (${moistureLevel}/10)`;
      }
      default:
        return "Care Activity";
    }
  };

  const renderActivityDetails = (activity: CareRecord) => {
    const details = activity.details;

    switch (activity.type) {
      case "water": {
        return (
          <div className="space-y-2">
            {details.sectionBased && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400">🌱</span>
                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    Section-Based Application
                  </span>
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  Applied to {details.plantsInSection} plants in section
                  {details.totalSectionAmount && (
                    <span className="block mt-1">
                      Total amount: {details.totalSectionAmount.value} {details.totalSectionAmount.unit}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Amount:
                </span>
                <div>
                  {typeof details.amount === "object" && details.amount?.value
                    ? `${details.amount.value} ${details.amount.unit}`
                    : details.waterAmount && details.waterUnit
                    ? `${details.waterAmount} ${details.waterUnit}`
                    : "Not specified"}
                  {details.sectionBased && details.totalSectionAmount && (
                    <span className="text-xs text-muted-foreground block">
                      ({details.totalSectionAmount.value} {details.totalSectionAmount.unit} total for section)
                    </span>
                  )}
                  {details.isPartialWatering && details.recommendedAmount && (
                    <span className="text-xs text-amber-600 block">
                      Recommended: {details.recommendedAmount.value} {details.recommendedAmount.unit}
                      ({Math.round((details.wateringCompleteness || 0) * 100)}% given)
                    </span>
                  )}
                </div>
              </div>
              {details.method && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    Method:
                  </span>
                  <div>{details.method.replace("-", " ")}</div>
                </div>
              )}
            </div>
            {details.moistureLevel && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Moisture Reading:
                </span>
                <div className="text-sm">
                  Before: {details.moistureLevel.before}/10
                  {details.moistureLevel.after && (
                    <> → After: {details.moistureLevel.after}/10</>
                  )}
                </div>
              </div>
            )}
            {details.runoffObserved !== undefined && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Runoff:
                </span>
                <div className="text-sm">
                  {details.runoffObserved ? "Yes" : "No"}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "fertilize": {
        return (
          <div className="space-y-2">
            {details.sectionBased && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400">🌱</span>
                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    Section-Based Application
                  </span>
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  Applied to {details.plantsInSection} plants in section
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Product:
                </span>
                <div>{details.product || "Not specified"}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Dilution:
                </span>
                <div>{details.dilution || "Not specified"}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Amount:
                </span>
                <div>
                  {typeof details.amount === "string"
                    ? details.amount
                    : "Not specified"}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "observe": {
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium text-muted-foreground">
                Health Assessment:
              </span>
              <div className="text-sm capitalize">
                {details.healthAssessment || "Not specified"}
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Observations:
              </span>
              <div className="text-sm">{details.observations || "None"}</div>
            </div>
            {details.photos && details.photos.length > 0 && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Photos:
                </span>
                <div className="text-sm">
                  {details.photos.length} photo(s) attached
                </div>
              </div>
            )}
          </div>
        );
      }

      case "harvest": {
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Amount:
                </span>
                <div>
                  {typeof details.amount === "string"
                    ? details.amount
                    : "Not specified"}
                </div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Quality:
                </span>
                <div className="capitalize">
                  {details.quality || "Not specified"}
                </div>
              </div>
            </div>
            {details.harvestMethod && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Method:
                </span>
                <div className="text-sm">{details.harvestMethod}</div>
              </div>
            )}
          </div>
        );
      }

      case "transplant": {
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">From:</span>
                <div>{details.fromContainer || "Not specified"}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">To:</span>
                <div>{details.toContainer || "Not specified"}</div>
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Reason:</span>
              <div className="text-sm">{details.reason || "Not specified"}</div>
            </div>
          </div>
        );
      }

      case "moisture": {
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium text-muted-foreground">
                Moisture Level:
              </span>
              <div className="text-sm">
                {details.moistureLevel?.before || "Not specified"}/10
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Scale: 1 = Completely dry, 5 = Optimal, 10 = Waterlogged
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="border border-border rounded-lg">
      <div
        className="p-4 cursor-pointer hover:bg-background transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl">{getActivityIcon(activity.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-foreground text-sm">
                  {getActivityTitle(activity)}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(activity.date)}
                </p>
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

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-background">
          <div className="pt-3">
            {renderActivityDetails(activity)}

            {activity.details.notes && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="font-medium text-muted-foreground">
                  Notes:
                </span>
                <div className="text-sm text-foreground mt-1">
                  {activity.details.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareActivityItem;
