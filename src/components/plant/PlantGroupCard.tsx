// src/components/plant/PlantGroupCard.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlantGroup } from "@/utils/plantGrouping";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDynamicStage } from "@/hooks/useDynamicStage";
import { differenceInDays } from "date-fns";
import { QuickActionButtons, QuickActionType } from "@/components/shared/QuickActionButtons";

interface PlantGroupCardProps {
  group: PlantGroup;
  onBulkLogActivity: (
    plantIds: string[],
    activityType: QuickActionType,
    group: PlantGroup
  ) => void;
}

const PlantGroupCard = ({ group, onBulkLogActivity }: PlantGroupCardProps) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showIndividualActions, setShowIndividualActions] = useState(false);

  const currentPlant = group.plants[currentIndex];
  const hasMultiplePlants = group.plants.length > 1;
  const calculatedStage = useDynamicStage(currentPlant);

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? group.plants.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === group.plants.length - 1 ? 0 : prev + 1
    );
  };

  const handlePlantClick = () => {
    navigate(`/plants/${currentPlant.id}`);
  };

  const handleBulkAction = (
    activityType: "water" | "fertilize" | "observe"
  ) => {
    // ✅ Updated parameter type
    const plantIds = group.plants.map((p) => p.id);
    onBulkLogActivity(plantIds, activityType, group);
    setShowBulkActions(false);
  };

  const handleIndividualAction = (
    activityType: QuickActionType | "more"
  ) => {
    if (activityType === "more") {
      navigate(`/log-care/${currentPlant.id}`);
    } else {
      onBulkLogActivity([currentPlant.id], activityType, group);
    }
    setShowIndividualActions(false);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="truncate">{currentPlant.name}</span>
              <StatusBadge status="healthy" size="sm" />
            </CardTitle>

            {hasMultiplePlants && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="h-8 w-8 p-0"
                >
                  ←
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {group.plants.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="h-8 w-8 p-0"
                >
                  →
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Plant Info */}
          <div onClick={handlePlantClick} className="cursor-pointer">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{group.varietyName}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {calculatedStage}
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                {differenceInDays(new Date(), currentPlant.plantedDate)} days
                old
                {hasMultiplePlants && (
                  <span className="ml-2">• {group.plants.length} plants</span>
                )}
              </div>

              {/* Location and Section Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{currentPlant.location}</span>
                  {currentPlant.container && currentPlant.container !== currentPlant.location && (
                    <span> • {currentPlant.container}</span>
                  )}
                </div>
                {currentPlant.section && (
                  <div className="flex items-center gap-1">
                    <span>🏷️</span>
                    <span className="font-medium">{currentPlant.section}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-primary">
                  {hasMultiplePlants
                    ? "Current Plant Actions"
                    : "Quick Actions"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Log activity for {currentPlant.name}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIndividualActions(!showIndividualActions);
                }}
                className="text-primary border-primary/50 hover:bg-primary/10"
              >
                {showIndividualActions
                  ? "Cancel"
                  : hasMultiplePlants
                  ? "Log One"
                  : "Log Care"}
              </Button>
            </div>

            {showIndividualActions && (
              <QuickActionButtons
                onAction={handleIndividualAction}
                actions={["water", "fertilize", "observe", "more"]}
                layout="grid"
                preventPropagation={true}
              />
            )}
          </div>

          {hasMultiplePlants && (
            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-primary">
                    Group Actions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Log activity for all {group.plants.length} plants
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBulkActions(!showBulkActions);
                  }}
                  className="text-primary border-primary/50 hover:bg-primary/10"
                >
                  {showBulkActions ? "Cancel" : "Log All"}
                </Button>
              </div>

              {showBulkActions && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBulkAction("water");
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    💧 Water All
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBulkAction("fertilize");
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    🌱 Fertilize All
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBulkAction("observe");
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    👁️ Inspect All
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/plants`); // Navigate to more options
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    📝 More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantGroupCard;
