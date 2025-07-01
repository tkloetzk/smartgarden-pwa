import { plantService, varietyService } from "@/types/database";
import { differenceInDays } from "date-fns";
import { estimateStageTransition } from "@/utils/growthStage";

export class GrowthRateService {
  /**
   * Analyzes a plant's confirmed stage history to calculate and store a growth rate modifier.
   * This modifier represents how much faster or slower the plant grows compared to the standard.
   * @param plantId - The ID of the plant to analyze.
   */
  static async updateGrowthRateModifier(plantId: string): Promise<void> {
    try {
      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found for growth rate analysis.");

      const variety = await varietyService.getVariety(plant.varietyId);
      if (!variety)
        throw new Error("Variety not found for growth rate analysis.");

      // We need at least one user-confirmed stage to calculate a modifier.
      // More data points would be better for a more complex calculation in the future.
      if (!plant.confirmedStage || !plant.stageConfirmedDate) {
        console.log(
          `Skipping growth rate update for ${plantId}: No confirmed stages.`
        );
        return;
      }

      // 1. Get the originally expected date for the confirmed stage.
      const expectedTransitionDate = estimateStageTransition(
        plant.plantedDate,
        variety.growthTimeline,
        plant.confirmedStage
      );

      // 2. Calculate the variance in days.
      // A negative variance means the user confirmed the stage *earlier* than expected (faster growth).
      // A positive variance means the user confirmed it *later* (slower growth).
      const varianceDays = differenceInDays(
        plant.stageConfirmedDate,
        expectedTransitionDate
      );

      // 3. Get the expected duration for the period up to the confirmed stage.
      const expectedDuration = differenceInDays(
        expectedTransitionDate,
        plant.plantedDate
      );
      if (expectedDuration <= 0) {
        console.warn(
          `Cannot calculate growth rate for plant ${plantId}: Invalid expected duration.`
        );
        return;
      }

      // 4. Calculate the growth rate modifier.
      // Example: If expected duration was 20 days, but it only took 18 (variance of -2),
      // the actual duration is 18. The modifier is 18 / 20 = 0.9 (10% faster).
      const actualDuration = expectedDuration + varianceDays;
      const growthRateModifier = actualDuration / expectedDuration;

      // 5. Update the plant record with the new modifier.
      await plantService.updatePlant(plant.id, {
        growthRateModifier,
      });

      console.log(
        `Updated growth rate modifier for ${plantId} to ${growthRateModifier.toFixed(
          2
        )}`
      );
    } catch (error) {
      console.error("Failed to update growth rate modifier:", error);
      // We don't re-throw here, as this is a background enhancement, not a critical failure.
    }
  }
}
