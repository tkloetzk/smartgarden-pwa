// src/components/plant/CareActivityItem.tsx
import React, { useState } from "react";
import {
  CareRecord,
  WateringDetails,
  FertilizingDetails,
  ObservationDetails,
  HarvestDetails,
  TransplantDetails,
} from "@/types/database";
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
      default:
        return "📋";
    }
  };

  const getActivityTitle = (activity: CareRecord): string => {
    switch (activity.type) {
      case "water":
        const waterDetails = activity.details as WateringDetails;
        return `Watering (${waterDetails.amount.value} ${waterDetails.amount.unit})`;
      case "fertilize":
        const fertilizeDetails = activity.details as FertilizingDetails;
        return `Fertilized with ${fertilizeDetails.product}`;
      case "observe":
        const observeDetails = activity.details as ObservationDetails;
        return `Health Check (${observeDetails.healthAssessment})`;
      case "harvest":
        const harvestDetails = activity.details as HarvestDetails;
        return `Harvested ${harvestDetails.amount}`;
      case "transplant":
        const transplantDetails = activity.details as TransplantDetails;
        return `Transplanted to ${transplantDetails.toContainer}`;
      default:
        return "Care Activity";
    }
  };

  const renderActivityDetails = (activity: CareRecord) => {
    switch (activity.type) {
      case "water":
        const waterDetails = activity.details as WateringDetails;
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Amount:</span>
                <div>
                  {waterDetails.amount.value} {waterDetails.amount.unit}
                </div>
              </div>
              {waterDetails.method && (
                <div>
                  <span className="font-medium text-gray-600">Method:</span>
                  <div>{waterDetails.method.replace("-", " ")}</div>
                </div>
              )}
            </div>
            {waterDetails.moistureReading && (
              <div>
                <span className="font-medium text-gray-600">
                  Moisture Reading:
                </span>
                <div className="text-sm">
                  Before: {waterDetails.moistureReading.before}/10 → After:{" "}
                  {waterDetails.moistureReading.after}/10
                </div>
              </div>
            )}
            {waterDetails.runoffObserved !== undefined && (
              <div>
                <span className="font-medium text-gray-600">Runoff:</span>
                <div className="text-sm">
                  {waterDetails.runoffObserved ? "Yes" : "No"}
                </div>
              </div>
            )}
          </div>
        );

      case "fertilize":
        const fertilizeDetails = activity.details as FertilizingDetails;
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Product:</span>
                <div>{fertilizeDetails.product}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Dilution:</span>
                <div>{fertilizeDetails.dilution}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Amount:</span>
                <div>{fertilizeDetails.amount}</div>
              </div>
            </div>
          </div>
        );

      case "observe":
        const observeDetails = activity.details as ObservationDetails;
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-600">
                Health Assessment:
              </span>
              <div className="text-sm capitalize">
                {observeDetails.healthAssessment}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Observations:</span>
              <div className="text-sm">{observeDetails.observations}</div>
            </div>
            {observeDetails.photos && observeDetails.photos.length > 0 && (
              <div>
                <span className="font-medium text-gray-600">Photos:</span>
                <div className="text-sm">
                  {observeDetails.photos.length} photo(s) attached
                </div>
              </div>
            )}
          </div>
        );

      case "harvest":
        const harvestDetails = activity.details as HarvestDetails;
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Amount:</span>
                <div>{harvestDetails.amount}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Quality:</span>
                <div className="capitalize">{harvestDetails.quality}</div>
              </div>
            </div>
            {harvestDetails.method && (
              <div>
                <span className="font-medium text-gray-600">Method:</span>
                <div className="text-sm">{harvestDetails.method}</div>
              </div>
            )}
          </div>
        );

      case "transplant":
        const transplantDetails = activity.details as TransplantDetails;
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">From:</span>
                <div>{transplantDetails.fromContainer}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">To:</span>
                <div>{transplantDetails.toContainer}</div>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-600">Reason:</span>
              <div className="text-sm">{transplantDetails.reason}</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl">{getActivityIcon(activity.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  {getActivityTitle(activity)}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(activity.date)}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
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
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
          <div className="pt-3">
            {renderActivityDetails(activity)}

            {activity.details.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-600">Notes:</span>
                <div className="text-sm text-gray-700 mt-1">
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
