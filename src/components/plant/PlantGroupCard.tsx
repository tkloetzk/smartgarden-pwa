// src/components/plant/PlantGroupCard.tsx

import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlantGroup } from "@/utils/plant/plantGrouping";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDynamicStage } from "@/hooks/plants/useDynamicStage";
import { useLastCareActivitiesLocal } from "@/hooks/care/useLastCareActivitiesLocal";
import { useLocalOverdueCalculation } from "@/hooks/plants/useLocalOverdueCalculation";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import {
  QuickActionButtons,
  QuickActionType,
} from "@/components/shared/QuickActionButtons";
import { AlertTriangle } from "lucide-react";

interface PlantGroupCardProps {
  group: PlantGroup;
  onBulkLogActivity: (
    plantIds: string[],
    activityType: QuickActionType,
    group: PlantGroup
  ) => void;
  onRemoveFromView?: (group: PlantGroup) => void;
  refreshTrigger?: number;
}

const PlantGroupCard = memo(
  ({
    group,
    onBulkLogActivity,
    onRemoveFromView,
    refreshTrigger,
  }: PlantGroupCardProps) => {
    const navigate = useNavigate();
    const [showQuickActions, setShowQuickActions] = useState(false);

    // Use the first plant as representative (since they're all the same variety/container)
    const representativePlant = useMemo(() => group.plants[0], [group.plants]);
    const hasMultiplePlants = useMemo(
      () => group.plants.length > 1,
      [group.plants.length]
    );
    const plantIds = useMemo(
      () => group.plants.map((p) => p.id),
      [group.plants]
    );
    const plantAge = useMemo(
      () => differenceInDays(new Date(), representativePlant.plantedDate),
      [representativePlant.plantedDate]
    );

    const calculatedStage = useDynamicStage(representativePlant);
    const {
      activities: lastCareActivities,
      loading: careActivitiesLoading,
      refetch: refetchCareActivities,
    } = useLastCareActivitiesLocal(representativePlant.id);

    const { nextTask, isLoading: nextTaskLoading } = useLocalOverdueCalculation(
      representativePlant,
      lastCareActivities,
      calculatedStage,
      careActivitiesLoading
    );



    const handlePlantClick = useCallback(() => {
      navigate(`/plants/${representativePlant.id}`);
    }, [navigate, representativePlant.id]);

    const handleAction = useCallback(
      (activityType: QuickActionType | "more") => {
        if (activityType === "more") {
          navigate(`/log-care/${representativePlant.id}`);
        } else {
          onBulkLogActivity(plantIds, activityType, group);
        }
        setShowQuickActions(false);
      },
      [navigate, representativePlant.id, onBulkLogActivity, plantIds, group]
    );

    const toggleQuickActions = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowQuickActions(!showQuickActions);
      },
      [showQuickActions]
    );

    const handleRemoveFromView = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemoveFromView) {
          onRemoveFromView(group);
        }
      },
      [onRemoveFromView, group]
    );

    // Trigger refresh when refreshTrigger changes (indicates new activity was logged)
    useEffect(() => {
      if (refreshTrigger && refreshTrigger > 0) {
        // Small delay to ensure Firebase propagation before refetching
        setTimeout(() => {
          refetchCareActivities();
        }, 100);
      }
    }, [refreshTrigger, refetchCareActivities, representativePlant.id]);

    // Harvest stage styling
    const isHarvestStage = calculatedStage === "harvest" || calculatedStage === "ongoing-production";
    const cardClassName = isHarvestStage
      ? "hover:shadow-lg transition-shadow border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-500"
      : "hover:shadow-lg transition-shadow";

    return (
      <Card className={cardClassName}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">
                <span className="truncate block">{group.varietyName}</span>
              </CardTitle>
              {hasMultiplePlants && (
                <div className="text-sm text-muted-foreground mt-1">
                  {group.plants.length} plants
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status="healthy" size="sm" />
              {!nextTaskLoading && nextTask?.priority === "overdue" && (
                <div
                  className="flex items-center gap-1 px-2 py-1 bg-red-200 text-red-900 border border-red-300 rounded-full text-xs font-medium dark:bg-red-900/30 dark:text-red-300 dark:border-red-600"
                  title={`Overdue: ${nextTask.task}`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>OVERDUE</span>
                </div>
              )}
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
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Plant Info */}
            <div onClick={handlePlantClick} className="cursor-pointer">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {hasMultiplePlants
                      ? `${group.plants.length} plants`
                      : representativePlant.name}
                  </span>
                  <span className={`text-xs capitalize flex items-center gap-1 ${
                    isHarvestStage
                      ? "text-amber-700 dark:text-amber-300 font-medium"
                      : "text-muted-foreground"
                  }`}>
                    {isHarvestStage && <span className="text-sm">🌾</span>}
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
                    {representativePlant.container &&
                      representativePlant.container !==
                        representativePlant.location && (
                        <span> • {representativePlant.container}</span>
                      )}
                  </div>
                  {representativePlant.section && (
                    <div className="flex items-center gap-1">
                      <span>🏷️</span>
                      <span className="font-medium">
                        {representativePlant.section}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Last Care Activities */}
            <div className="border-t border-border pt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Recent Care
              </div>
              {careActivitiesLoading ? (
                <div className="text-xs text-muted-foreground">Loading...</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-500">💧</span>
                    <div className="flex flex-col">
                      <span className="font-medium">Watering</span>
                      <span
                        className="text-muted-foreground"
                        data-testid="last-watering-time"
                      >
                        {lastCareActivities.watering
                          ? formatDistanceToNow(
                              lastCareActivities.watering.date,
                              { addSuffix: true }
                            )
                          : "Never"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-500">🌱</span>
                    <div className="flex flex-col">
                      <span className="font-medium">Fertilizing</span>
                      <span className="text-muted-foreground">
                        {lastCareActivities.fertilizing
                          ? formatDistanceToNow(
                              lastCareActivities.fertilizing.date,
                              { addSuffix: true }
                            )
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                      : "Log care activity"}
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
                  actions={isHarvestStage
                    ? ["harvest", "water", "fertilize", "observe", "more"]
                    : ["water", "fertilize", "observe", "more"]
                  }
                  layout="grid"
                  preventPropagation={true}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

export default PlantGroupCard;
