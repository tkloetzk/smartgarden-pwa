// src/hooks/useDynamicStage.ts - Even simpler version
import { useEffect, useState } from "react";
import { PlantRecord } from "@/types/database";
import { GrowthStage } from "@/types";
import { calculateStageFromSeedVarieties } from "@/utils/growthStage";

export function useDynamicStage(plant: PlantRecord): GrowthStage {
  const [calculatedStage, setCalculatedStage] =
    useState<GrowthStage>("germination");

  useEffect(() => {
    if (!plant?.varietyName) {
      setCalculatedStage("germination");
      return;
    }

    const stage = calculateStageFromSeedVarieties(
      plant.plantedDate,
      plant.varietyName
    );
    setCalculatedStage(stage);
  }, [plant]);

  return calculatedStage;
}
