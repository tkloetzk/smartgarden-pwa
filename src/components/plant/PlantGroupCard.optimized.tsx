// Optimized version of PlantGroupCard with React performance improvements
import React, { useState, useCallback, useMemo } from "react";
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

// Memoized sub-components to prevent unnecessary re-renders
const PlantNavigation = React.memo(({ 
  currentIndex, 
  totalPlants, 
  onPrevious, 
  onNext 
}: {
  currentIndex: number;
  totalPlants: number;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  if (totalPlants <= 1) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={totalPlants <= 1}
      >
        ←
      </Button>
      <span>
        {currentIndex + 1} of {totalPlants}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={totalPlants <= 1}
      >
        →
      </Button>
    </div>
  );
});

const PlantInfo = React.memo(({ 
  plant, 
  calculatedStage, 
  onClick 
}: {
  plant: any;
  calculatedStage: any;
  onClick: () => void;
}) => {
  const plantAge = useMemo(() => {
    return differenceInDays(new Date(), new Date(plant.plantedDate));
  }, [plant.plantedDate]);

  const stageDisplay = useMemo(() => {
    return calculatedStage?.currentStage || 'Unknown';
  }, [calculatedStage?.currentStage]);

  return (
    <div 
      className="cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{plant.name}</h3>
        <StatusBadge status="healthy" size="sm" />
      </div>
      
      <div className="space-y-1 text-sm text-muted-foreground">
        <div>📍 {plant.location}</div>
        <div>🌱 {stageDisplay}</div>
        <div>📅 {plantAge} days old</div>
      </div>
    </div>
  );
});

const PlantGroupCard = React.memo(({ group, onBulkLogActivity }: PlantGroupCardProps) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showIndividualActions, setShowIndividualActions] = useState(false);

  // Memoize derived values
  const currentPlant = useMemo(() => group.plants[currentIndex], [group.plants, currentIndex]);
  const hasMultiplePlants = useMemo(() => group.plants.length > 1, [group.plants.length]);
  const plantIds = useMemo(() => group.plants.map(p => p.id), [group.plants]);
  
  const calculatedStage = useDynamicStage(currentPlant);

  // Memoized navigation handlers
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? group.plants.length - 1 : prev - 1
    );
  }, [group.plants.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === group.plants.length - 1 ? 0 : prev + 1
    );
  }, [group.plants.length]);

  const handlePlantClick = useCallback(() => {
    navigate(`/plants/${currentPlant.id}`);
  }, [navigate, currentPlant.id]);

  // Memoized bulk action handler
  const handleBulkAction = useCallback((
    activityType: "water" | "fertilize" | "observe"
  ) => {
    onBulkLogActivity(plantIds, activityType, group);
    setShowBulkActions(false);
  }, [onBulkLogActivity, plantIds, group]);

  // Memoized individual action handler
  const handleIndividualAction = useCallback((
    activityType: "water" | "fertilize" | "observe"
  ) => {
    onBulkLogActivity([currentPlant.id], activityType, group);
    setShowIndividualActions(false);
  }, [onBulkLogActivity, currentPlant.id, group]);

  // Memoized toggle handlers
  const toggleBulkActions = useCallback(() => {
    setShowBulkActions(prev => !prev);
    setShowIndividualActions(false);
  }, []);

  const toggleIndividualActions = useCallback(() => {
    setShowIndividualActions(prev => !prev);
    setShowBulkActions(false);
  }, []);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-2xl">{group.icon}</span>
            {group.title}
            <span className="text-sm font-normal text-muted-foreground">
              ({group.plants.length} plants)
            </span>
          </CardTitle>
          
          <PlantNavigation
            currentIndex={currentIndex}
            totalPlants={group.plants.length}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <PlantInfo
          plant={currentPlant}
          calculatedStage={calculatedStage}
          onClick={handlePlantClick}
        />

        {/* Action buttons */}
        <div className="mt-4 space-y-2">
          {hasMultiplePlants && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleBulkActions}
              className="w-full"
            >
              {showBulkActions ? "Hide" : "Show"} Bulk Actions
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={toggleIndividualActions}
            className="w-full"
          >
            {showIndividualActions ? "Hide" : "Show"} Individual Actions
          </Button>
        </div>

        {/* Bulk actions */}
        {showBulkActions && hasMultiplePlants && (
          <div className="mt-3 p-3 bg-accent/50 rounded">
            <p className="text-sm font-medium mb-2">
              Apply to all {group.plants.length} plants:
            </p>
            <QuickActionButtons
              onAction={handleBulkAction}
              plantStage={calculatedStage?.currentStage}
            />
          </div>
        )}

        {/* Individual actions */}
        {showIndividualActions && (
          <div className="mt-3 p-3 bg-accent/50 rounded">
            <p className="text-sm font-medium mb-2">
              Apply to {currentPlant.name}:
            </p>
            <QuickActionButtons
              onAction={handleIndividualAction}
              plantStage={calculatedStage?.currentStage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PlantGroupCard.displayName = 'PlantGroupCard';
PlantNavigation.displayName = 'PlantNavigation';
PlantInfo.displayName = 'PlantInfo';

export default PlantGroupCard;