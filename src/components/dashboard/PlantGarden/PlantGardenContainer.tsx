import { ReactNode } from "react";
import { ContainerGroup as ContainerGroupType } from "@/utils/containerGrouping";
import { PlantGroup } from "@/utils/plantGrouping";
import { QuickActionType } from "@/components/shared/QuickActionButtons";

export interface PlantGardenContainerProps {
  plants: any[] | null;
  containerGroups: ContainerGroupType[];
  hiddenGroupsCount: number;
  children: ReactNode;
  onNavigateToAddPlant: () => void;
  onRestoreAllHidden: () => void;
  onBulkLogActivity: (
    plantIds: string[],
    activityType: QuickActionType,
    group: PlantGroup
  ) => void;
  onRemoveFromView: (group: PlantGroup) => void;
  refreshTrigger: number;
}

export const PlantGardenContainer = ({
  plants,
  children,
}: PlantGardenContainerProps) => {
  // Determine if we should show empty state or garden
  const showEmptyState = plants && plants.length === 0;

  return (
    <div>
      {showEmptyState ? children : <div>{children}</div>}
    </div>
  );
};