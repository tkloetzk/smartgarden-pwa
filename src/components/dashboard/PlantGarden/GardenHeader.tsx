import { Button } from "@/components/ui/Button";

export interface GardenHeaderProps {
  hiddenGroupsCount: number;
  onRestoreAllHidden: () => void;
  onNavigateToAddPlant: () => void;
}

export const GardenHeader = ({
  hiddenGroupsCount,
  onRestoreAllHidden,
  onNavigateToAddPlant,
}: GardenHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Your Garden</h2>
        {hiddenGroupsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRestoreAllHidden}
            className="text-muted-foreground hover:text-foreground"
          >
            Show {hiddenGroupsCount} hidden group
            {hiddenGroupsCount !== 1 ? "s" : ""}
          </Button>
        )}
      </div>
      <Button onClick={onNavigateToAddPlant}>Add Plant</Button>
    </div>
  );
};