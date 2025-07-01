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
      // // If a stage has been manually confirmed, always use that.
      // if (plant?.confirmedStage) {
      //   setCalculatedStage(plant.confirmedStage);
      //   return;
      // }

      // If no confirmed stage, proceed with calculation based on plantedDate.
      if (!plant?.varietyId) {
        setCalculatedStage("germination");
        return;
      }

      try {
        const variety = await varietyService.getVariety(plant.varietyId);

        if (!variety) {
          console.warn(
            `Variety with id ${plant.varietyId} not found. Defaulting stage.`
          );
          setCalculatedStage("vegetative");
          return;
        }

        // If a stage has been manually confirmed, use the confirmed date and stage as starting point
        if (plant.confirmedStage && plant.stageConfirmedDate) {
          const stage = calculateCurrentStageWithVariety(
            plant.stageConfirmedDate, // Use confirmed date as reference
            variety,
            new Date(), // Current date for calculation
            plant.confirmedStage // Use confirmed stage as starting point
          );
          setCalculatedStage(stage);
        } else {
          // No confirmed stage, calculate from planting date
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
  }, [plant]);

  return calculatedStage;
}
