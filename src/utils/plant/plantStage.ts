// src/utils/plantStage.ts
import { PlantRecord, varietyService } from "@/types/database";
import { calculateCurrentStageWithVariety } from "./growthStage";
import { GrowthStage } from "@/types";

export async function getPlantCurrentStage(
  plant: PlantRecord
): Promise<GrowthStage> {
  // If user has manually overridden the stage, use that
  //   if (plant.manualStageOverride) {
  //     return plant.manualStageOverride;
  //   }

  try {
    const variety = await varietyService.getVariety(plant.varietyId);

    if (!variety) {
      // Try to find by name as fallback
      const allVarieties = await varietyService.getAllVarieties();
      const varietyByName = allVarieties.find(
        (v) => v.name === plant.varietyName
      );

      if (varietyByName) {
        return calculateCurrentStageWithVariety(
          plant.plantedDate,
          varietyByName
        );
      }

      console.warn("Could not find variety, defaulting to germination");
      return "germination";
    }

    return calculateCurrentStageWithVariety(plant.plantedDate, variety);
  } catch (error) {
    console.error("Error calculating stage:", error);
    return "germination";
  }
}
