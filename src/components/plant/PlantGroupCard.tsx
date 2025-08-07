// src/components/plant/PlantGroupCard.tsx

import React, { useState, useCallback, useMemo, memo } from "react";
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
  onRemoveFromView?: (group: PlantGroup) => void;
}

const PlantGroupCard = memo(({ group, onBulkLogActivity, onRemoveFromView }: PlantGroupCardProps) => {
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Use the first plant as representative (since they're all the same variety/container)
  const representativePlant = useMemo(() => group.plants[0], [group.plants]);
  const hasMultiplePlants = useMemo(() => group.plants.length > 1, [group.plants.length]);
  const plantIds = useMemo(() => group.plants.map((p) => p.id), [group.plants]);
  const plantAge = useMemo(() => differenceInDays(new Date(), representativePlant.plantedDate), [representativePlant.plantedDate]);
  
  const calculatedStage = useDynamicStage(representativePlant);

  const handlePlantClick = useCallback(() => {
    navigate(`/plants/${representativePlant.id}`);
  }, [navigate, representativePlant.id]);

  const handleAction = useCallback((
    activityType: QuickActionType | "more"
  ) => {
    if (activityType === "more") {
      navigate(`/log-care/${representativePlant.id}`);
    } else {
      onBulkLogActivity(plantIds, activityType, group);
    }
    setShowQuickActions(false);
  }, [navigate, representativePlant.id, onBulkLogActivity, plantIds, group]);

  const toggleQuickActions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQuickActions(!showQuickActions);
  }, [showQuickActions]);

  const handleRemoveFromView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromView) {
      onRemoveFromView(group);
    }
  }, [onRemoveFromView, group]);


  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="truncate">{group.varietyName}</span>
              <div className="flex items-center gap-2">
                <StatusBadge status="healthy" size="sm" />
                {onRemoveFromView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFromView}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    title="Remove from view"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </CardTitle>
            {hasMultiplePlants && (
              <div className="text-sm text-muted-foreground mt-1">
                {group.plants.length} plants
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
                <span className="text-sm font-medium">
                  {hasMultiplePlants ? `${group.plants.length} plants` : representativePlant.name}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {calculatedStage}
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                {plantAge} days old
              </div>

              {/* Location and Section Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{representativePlant.location}</span>
                  {representativePlant.container && representativePlant.container !== representativePlant.location && (
                    <span> • {representativePlant.container}</span>
                  )}
                </div>
                {representativePlant.section && (
                  <div className="flex items-center gap-1">
                    <span>🏷️</span>
                    <span className="font-medium">{representativePlant.section}</span>
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
                  Quick Actions
                </div>
                <div className="text-xs text-muted-foreground">
                  {hasMultiplePlants 
                    ? `Log care for ${group.plants.length} plants`
                    : "Log care activity"
                  }
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleQuickActions}
                className="text-primary border-primary/50 hover:bg-primary/10"
              >
                {showQuickActions ? "Cancel" : "Log Care"}
              </Button>
            </div>

            {showQuickActions && (
              <QuickActionButtons
                onAction={handleAction}
                actions={["water", "fertilize", "observe", "more"]}
                layout="grid"
                preventPropagation={true}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default PlantGroupCard;
