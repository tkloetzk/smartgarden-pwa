import { ContainerGroup as ContainerGroupType } from "@/utils/containerGrouping";
import { PlantGroup } from "@/utils/plantGrouping";
import { QuickActionType } from "@/components/shared/QuickActionButtons";
import { PlantGroupGrid } from "./PlantGroupGrid";

export interface ContainerGroupProps {
  container: ContainerGroupType;
  onBulkLogActivity: (
    plantIds: string[],
    activityType: QuickActionType,
    group: PlantGroup
  ) => void;
  onRemoveFromView: (group: PlantGroup) => void;
  refreshTrigger: number;
}

export const ContainerGroup = ({
  container,
  onBulkLogActivity,
  onRemoveFromView,
  refreshTrigger,
}: ContainerGroupProps) => {
  return (
    <div className="mb-8">
      {/* Container Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📦</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {container.containerName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {container.plantGroups.length} section
              {container.plantGroups.length !== 1 ? "s" : ""} •{" "}
              {container.totalPlants} plant
              {container.totalPlants !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {container.needsCareCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {container.needsCareCount} need
              {container.needsCareCount !== 1 ? "" : "s"} care
            </span>
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Plant Groups Grid */}
      <PlantGroupGrid
        plantGroups={container.plantGroups}
        onBulkLogActivity={onBulkLogActivity}
        onRemoveFromView={onRemoveFromView}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};