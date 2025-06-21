// src/components/plant/PlantStageDisplay.tsx
import { PlantRecord } from "@/types/database";
import { useDynamicStage } from "@/hooks/useDynamicStage";

interface PlantStageDisplayProps {
  plant: PlantRecord;
  showEmoji?: boolean;
  className?: string;
}

const PlantStageDisplay = ({
  plant,
  showEmoji = false,
  className = "text-sm font-medium text-muted-foreground capitalize",
}: PlantStageDisplayProps) => {
  const calculatedStage = useDynamicStage(plant);

  return (
    <div className={className}>
      {showEmoji && <span className="mr-1">🌱</span>}
      Stage: {calculatedStage}
    </div>
  );
};

export default PlantStageDisplay;
