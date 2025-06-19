// src/services/growthStageService.ts - Use the new function
import { plantService, varietyService } from "@/types/database";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage"; // Updated import

export class GrowthStageService {
  static async updatePlantStages(): Promise<void> {
    const plants = await plantService.getActivePlants();

    for (const plant of plants) {
      const variety = await varietyService.getVariety(plant.varietyId);
      // Use the enhanced function that considers everbearing characteristics
      const currentStage = calculateCurrentStageWithVariety(
        plant.plantedDate,
        variety
      );

      if (currentStage !== plant.currentStage) {
        await plantService.updatePlant(plant.id, {
          currentStage,
          updatedAt: new Date(),
        });
      }
    }
  }
}
