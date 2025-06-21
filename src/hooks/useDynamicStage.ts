// src/hooks/useDynamicStage.ts - Fixed version
import { useEffect, useState } from "react";
import { PlantRecord, varietyService } from "@/types/database";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage"; // ← Changed import!
import { GrowthStage } from "@/types";

export function useDynamicStage(plant: PlantRecord): GrowthStage {
  const [calculatedStage, setCalculatedStage] = useState<GrowthStage>(
    plant.currentStage
  );

  useEffect(() => {
    const calculateStage = async () => {
      try {
        const variety = await varietyService.getVariety(plant.varietyId);
        const stage = calculateCurrentStageWithVariety(
          plant.plantedDate,
          variety
        );
        setCalculatedStage(stage);
      } catch (error) {
        console.error("useDynamicStage: Error calculating stage:", error);
        setCalculatedStage(plant.currentStage);
      }
    };

    calculateStage();
  }, [plant.varietyId, plant.plantedDate, plant.currentStage]);

  return calculatedStage;
}
