import { PlantGroup } from "@/utils/plantGrouping";
import { QuickActionType } from "@/components/shared/QuickActionButtons";
import PlantGroupCard from "@/components/plant/PlantGroupCard";

export interface PlantGroupGridProps {
  plantGroups: PlantGroup[];
  onBulkLogActivity: (
    plantIds: string[],
    activityType: QuickActionType,
    group: PlantGroup
  ) => void;
  onRemoveFromView: (group: PlantGroup) => void;
  refreshTrigger: number;
}

export const PlantGroupGrid = ({
  plantGroups,
  onBulkLogActivity,
  onRemoveFromView,
  refreshTrigger,
}: PlantGroupGridProps) => {
  if (plantGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No plant groups found. Start by adding your first plant!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ml-6">
      {plantGroups.map((group) => (
        <PlantGroupCard
          key={group.id}
          group={group}
          onBulkLogActivity={onBulkLogActivity}
          onRemoveFromView={onRemoveFromView}
          refreshTrigger={refreshTrigger}
        />
      ))}
    </div>
  );
};