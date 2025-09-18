// src/components/plant/PlantStageDisplay.tsx
import { PlantRecord } from "@/types/database";
import { useDynamicStage } from "@/hooks/plants/useDynamicStage";

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
  const isHarvestStage = calculatedStage === "harvest" || calculatedStage === "ongoing-production";

  const stageClassName = isHarvestStage
    ? `${className} text-amber-700 dark:text-amber-300 font-semibold`
    : className;

  return (
    <div className={stageClassName}>
      {showEmoji && <span className="mr-1">{isHarvestStage ? "🌾" : "🌱"}</span>}
      Stage: {calculatedStage}
    </div>
  );
};

export default PlantStageDisplay;
