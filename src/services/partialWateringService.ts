// src/services/partialWateringService.ts
import { WateringResolver } from "@/utils/wateringResolver";
import { varietyService, PlantRecord } from "@/types/database";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { CareActivityDetails, VolumeUnit } from "@/types/consolidated";
import { addDays } from "date-fns";

export interface PartialWateringAnalysis {
  isPartial: boolean;
  completeness: number; // 0-1 scale
  recommendedAmount: { value: number; unit: VolumeUnit };
  actualAmount: { value: number; unit: VolumeUnit };
  deficit: { value: number; unit: VolumeUnit };
  shouldScheduleFollowUp: boolean;
  followUpDays: number;
  message: string;
  canAddSupplement: boolean; // True if user can add remaining amount
  supplementAmount: { value: number; unit: VolumeUnit }; // Remaining amount needed
}

export class PartialWateringService {
  /**
   * Analyze if a watering activity was partial and needs follow-up
   */
  static async analyzeWateringAmount(
    plant: PlantRecord,
    actualAmount: number,
    actualUnit: VolumeUnit
  ): Promise<PartialWateringAnalysis> {
    try {
      // Get the variety and calculate current stage
      const variety = await varietyService.getVariety(plant.varietyId);
      if (!variety) {
        return this.createDefaultAnalysis(actualAmount, actualUnit);
      }

      const currentStage = calculateCurrentStageWithVariety(
        plant.plantedDate,
        variety
      );

      // Get recommended watering amount
      const wateringRecommendation = WateringResolver.resolveWateringAmount(
        variety,
        currentStage
      );

      // Convert to same units for comparison (normalize to oz)
      const recommendedInOz = this.convertToOz(
        wateringRecommendation.amount,
        wateringRecommendation.unit as VolumeUnit
      );
      const actualInOz = this.convertToOz(actualAmount, actualUnit);

      const completeness = actualInOz / recommendedInOz;
      const isPartial = completeness < 0.8; // Less than 80% is considered partial
      const deficit = Math.max(0, recommendedInOz - actualInOz);

      // Determine follow-up schedule based on deficit
      let followUpDays = 0;
      let shouldScheduleFollowUp = false;
      let message = "";

      if (isPartial) {
        if (completeness < 0.5) {
          // Very low watering - follow up in 1-2 days
          followUpDays = 1;
          shouldScheduleFollowUp = true;
          message = `Only ${Math.round(completeness * 100)}% of recommended water given. Check again tomorrow.`;
        } else if (completeness < 0.8) {
          // Moderate deficit - follow up in 2-3 days
          followUpDays = 2;
          shouldScheduleFollowUp = true;
          message = `${Math.round(completeness * 100)}% of recommended water given. Check again in 2 days.`;
        }
      } else {
        message = `Adequate watering (${Math.round(completeness * 100)}% of recommended).`;
      }

      return {
        isPartial,
        completeness,
        recommendedAmount: {
          value: wateringRecommendation.amount,
          unit: wateringRecommendation.unit as VolumeUnit,
        },
        actualAmount: { value: actualAmount, unit: actualUnit },
        deficit: { value: this.convertFromOz(deficit, actualUnit), unit: actualUnit },
        shouldScheduleFollowUp,
        followUpDays,
        message,
        canAddSupplement: isPartial && deficit > 0,
        supplementAmount: { 
          value: this.convertFromOz(deficit, actualUnit), 
          unit: actualUnit 
        },
      };
    } catch (error) {
      console.error("Error analyzing watering amount:", error);
      return this.createDefaultAnalysis(actualAmount, actualUnit);
    }
  }

  /**
   * Enhance care activity details with partial watering information
   */
  static enhanceCareDetails(
    details: CareActivityDetails,
    analysis: PartialWateringAnalysis
  ): CareActivityDetails {
    return {
      ...details,
      recommendedAmount: analysis.recommendedAmount,
      isPartialWatering: analysis.isPartial,
      wateringCompleteness: analysis.completeness,
    };
  }

  /**
   * Calculate next watering date considering partial watering
   */
  static calculateNextWateringDate(
    analysis: PartialWateringAnalysis,
    lastWateringDate: Date,
    normalInterval: number = 7
  ): Date {
    if (analysis.shouldScheduleFollowUp) {
      return addDays(lastWateringDate, analysis.followUpDays);
    }

    // If watering was adequate, use normal interval
    return addDays(lastWateringDate, normalInterval);
  }

  private static createDefaultAnalysis(
    actualAmount: number,
    actualUnit: VolumeUnit
  ): PartialWateringAnalysis {
    return {
      isPartial: false,
      completeness: 1,
      recommendedAmount: { value: actualAmount, unit: actualUnit },
      actualAmount: { value: actualAmount, unit: actualUnit },
      deficit: { value: 0, unit: actualUnit },
      shouldScheduleFollowUp: false,
      followUpDays: 0,
      message: "Unable to determine recommended amount. Assuming adequate.",
      canAddSupplement: false,
      supplementAmount: { value: 0, unit: actualUnit },
    };
  }

  private static convertToOz(amount: number, unit: VolumeUnit): number {
    switch (unit) {
      case "ml":
        return amount * 0.033814; // ml to fl oz
      case "cups":
        return amount * 8; // cups to fl oz
      case "L":
        return amount * 33.814; // liters to fl oz
      case "oz":
      default:
        return amount;
    }
  }

  private static convertFromOz(ozAmount: number, targetUnit: VolumeUnit): number {
    switch (targetUnit) {
      case "ml":
        return ozAmount / 0.033814;
      case "cups":
        return ozAmount / 8;
      case "L":
        return ozAmount / 33.814;
      case "oz":
      default:
        return ozAmount;
    }
  }
}