// src/hooks/useDynamicStage.ts
import { useEffect, useState } from "react";
import { PlantRecord, varietyService } from "@/types/database";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { GrowthStage } from "@/types";

export function useDynamicStage(plant: PlantRecord): GrowthStage {
  const [calculatedStage, setCalculatedStage] =
    useState<GrowthStage>("germination");

  useEffect(() => {
    const calculateStage = async () => {
      try {
        // If user has manually overridden the stage, use that
        // if (plant.manualStageOverride) {
        //   console.log(
        //     "✅ Using manual stage override:",
        //     plant.manualStageOverride
        //   );
        //   setCalculatedStage(plant.manualStageOverride);
        //   return;
        // }

        const variety = await varietyService.getVariety(plant.varietyId);

        if (!variety) {
          // Try to find by name as fallback
          const allVarieties = await varietyService.getAllVarieties();

          const varietyByName = allVarieties.find(
            (v) => v.name === plant.varietyName
          );

          if (varietyByName) {
            const stage = calculateCurrentStageWithVariety(
              plant.plantedDate,
              varietyByName
            );
            setCalculatedStage(stage);
            return;
          }
          setCalculatedStage("germination");
          return;
        }

        const stage = calculateCurrentStageWithVariety(
          plant.plantedDate,
          variety
        );
        setCalculatedStage(stage);
      } catch (error) {
        console.error("❌ Error calculating stage:", error);
        setCalculatedStage("germination");
      }
    };

    calculateStage();
  }, [
    plant.varietyId,
    plant.plantedDate,
    plant.varietyName,
    // plant.manualStageOverride,
  ]);

  return calculatedStage;
}
