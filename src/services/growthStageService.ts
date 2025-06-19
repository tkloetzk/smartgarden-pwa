import { plantService, varietyService } from "@/types/database";
import { calculateCurrentStage } from "@/utils/growthStage";
// src/services/growthStageService.ts
export class GrowthStageService {
  static async updatePlantStages(): Promise<void> {
    const plants = await plantService.getActivePlants();

    for (const plant of plants) {
      const variety = await varietyService.getVariety(plant.varietyId);

      // Check if variety is everbearing
      const isEverbearing = variety?.isEverbearing || false;

      const currentStage = calculateCurrentStage(
        plant.plantedDate,
        variety.growthTimeline,
        new Date(),
        isEverbearing
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
