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
      if (!plant?.varietyId) {
        setCalculatedStage("germination");
        return;
      }
      try {
        const variety = await varietyService.getVariety(plant.varietyId);

        if (!variety) {
          // Fallback logic if variety is not found
          console.warn(
            `Variety with id ${plant.varietyId} not found. Defaulting stage.`
          );
          setCalculatedStage("vegetative"); // A safe default
          return;
        }

        // --- NEW LOGIC ---
        // Prioritize user-confirmed stage if it exists
        if (plant.confirmedStage && plant.stageConfirmedDate) {
          const stage = calculateCurrentStageWithVariety(
            plant.stageConfirmedDate, // Use confirmed date as the new anchor
            variety,
            new Date(),
            plant.confirmedStage // Tell the function which stage we're starting from
          );
          setCalculatedStage(stage);
        } else {
          // Fallback to original calculation from planted date
          const stage = calculateCurrentStageWithVariety(
            plant.plantedDate,
            variety
          );
          setCalculatedStage(stage);
        }
      } catch (error) {
        console.error("❌ Error calculating stage:", error);
        setCalculatedStage("germination");
      }
    };

    calculateStage();
  }, [plant]); // Depend on the entire plant object to react to updates

  return calculatedStage;
}
