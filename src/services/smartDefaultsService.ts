// src/services/smartDefaultsService.ts
import { varietyService, PlantRecord, VarietyRecord } from "@/types/database";
import { calculateCurrentStage } from "@/utils/growthStage";
import { GrowthStage, PlantCategory } from "@/types/core";

export interface WateringDefaults {
  suggestedAmount: number;
  unit: "oz" | "ml" | "cups" | "liters" | "gallons";
  confidence: "high" | "medium" | "low";
  source: "protocol" | "category" | "universal";
  reasoning: string;
}

export interface FertilizerDefaults {
  products: {
    name: string;
    dilution: string;
    amount: string;
    method?: "soil-drench" | "foliar-spray" | "top-dress" | "mix-in-soil";
    confidence: "high" | "medium" | "low";
  }[];
  source: "protocol" | "category" | "universal";
  reasoning: string;
}

export interface SmartDefaults {
  watering?: WateringDefaults;
  fertilizer?: FertilizerDefaults;
  plantName: string;
  currentStage: GrowthStage;
  daysSincePlanting: number;
}

export interface QuickCompletionValues {
  waterValue?: number;
  waterUnit?: string;
  product?: string;
  dilution?: string;
  amount?: string;
}

interface VolumeAmount {
  amount: number;
  unit: "oz" | "ml" | "cups" | "liters" | "gallons";
}

export class SmartDefaultsService {
  /**
   * Get intelligent defaults for a specific plant
   */
  static async getDefaultsForPlant(
    plant: PlantRecord
  ): Promise<SmartDefaults | null> {
    try {
      const variety = await varietyService.getVariety(plant.varietyId);
      if (!variety) return null;

      const currentStage = calculateCurrentStage(
        plant.plantedDate,
        variety.growthTimeline
      );
      const daysSincePlanting = Math.floor(
        (Date.now() - plant.plantedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const wateringDefaults = this.getWateringDefaults(variety, currentStage);
      const fertilizerDefaults = this.getFertilizerDefaults(
        variety,
        currentStage
      );

      return {
        watering: wateringDefaults,
        fertilizer: fertilizerDefaults,
        plantName: plant.name || plant.varietyName,
        currentStage,
        daysSincePlanting,
      };
    } catch (error) {
      console.error("Error getting smart defaults:", error);
      return null;
    }
  }

  /**
   * Extract watering defaults from variety protocol
   */
  private static getWateringDefaults(
    variety: VarietyRecord,
    currentStage: GrowthStage
  ): WateringDefaults | undefined {
    // 1. Try to get stage-specific protocol
    const stageProtocol = variety.protocols?.watering?.[currentStage] as {
      volume?: { amount?: number | string; unit?: string };
    };

    if (stageProtocol?.volume?.amount) {
      const parsed = this.parseWaterAmount(stageProtocol.volume.amount);
      if (parsed && stageProtocol.volume.unit) {
        return {
          suggestedAmount: parsed.amount,
          unit: stageProtocol.volume.unit as
            | "oz"
            | "ml"
            | "cups"
            | "liters"
            | "gallons",
          confidence: "high",
          source: "protocol",
          reasoning: `Based on ${variety.name} protocol for ${currentStage} stage`,
        };
      }
    }

    // 2. Try category-based defaults
    const categoryDefaults = this.getCategoryWateringDefaults(
      variety.category,
      currentStage
    );
    if (categoryDefaults) {
      return {
        suggestedAmount: categoryDefaults.amount,
        unit: categoryDefaults.unit,
        confidence: "medium",
        source: "category",
        reasoning: `Based on ${variety.category} category guidelines for ${currentStage} stage`,
      };
    }

    // 3. Universal fallback
    return {
      suggestedAmount: 16,
      unit: "oz",
      confidence: "low",
      source: "universal",
      reasoning: "Using universal default amount",
    };
  }

  /**
   * Extract fertilizer defaults from variety protocol
   */
  private static getFertilizerDefaults(
    variety: VarietyRecord,
    currentStage: GrowthStage
  ): FertilizerDefaults | undefined {
    const stageProtocol = variety.protocols?.fertilization?.[currentStage] as {
      fertilizer?: { product?: string };
      application?: { dilution?: string; amount?: string; method?: string };
    };

    if (stageProtocol?.fertilizer?.product && stageProtocol?.application) {
      return {
        products: [
          {
            name: stageProtocol.fertilizer.product,
            dilution: stageProtocol.application.dilution || "As directed",
            amount: stageProtocol.application.amount || "Apply to runoff",
            method: (stageProtocol.application.method as any) || "soil-drench",
            confidence: "high",
          },
        ],
        source: "protocol",
        reasoning: `Based on ${variety.name} fertilization protocol for ${currentStage} stage`,
      };
    }

    // Category-based fertilizer defaults
    const categoryDefaults = this.getCategoryFertilizerDefaults(
      variety.category,
      currentStage
    );
    if (categoryDefaults) {
      return categoryDefaults;
    }

    return undefined;
  }

  /**
   * Get category-based watering defaults
   */
  private static getCategoryWateringDefaults(
    category: PlantCategory,
    stage: GrowthStage
  ): VolumeAmount | undefined {
    const categoryWateringGuides: Record<
      PlantCategory,
      Record<GrowthStage, VolumeAmount>
    > = {
      "leafy-greens": {
        germination: { amount: 8, unit: "oz" },
        seedling: { amount: 12, unit: "oz" },
        vegetative: { amount: 16, unit: "oz" },
        flowering: { amount: 16, unit: "oz" },
        fruiting: { amount: 16, unit: "oz" },
        maturation: { amount: 16, unit: "oz" },
        harvest: { amount: 16, unit: "oz" },
        "ongoing-production": { amount: 16, unit: "oz" },
      },
      "fruiting-plants": {
        germination: { amount: 12, unit: "oz" },
        seedling: { amount: 16, unit: "oz" },
        vegetative: { amount: 24, unit: "oz" },
        flowering: { amount: 28, unit: "oz" },
        fruiting: { amount: 32, unit: "oz" },
        maturation: { amount: 32, unit: "oz" },
        harvest: { amount: 32, unit: "oz" },
        "ongoing-production": { amount: 32, unit: "oz" },
      },
      "root-vegetables": {
        germination: { amount: 8, unit: "oz" },
        seedling: { amount: 12, unit: "oz" },
        vegetative: { amount: 20, unit: "oz" },
        flowering: { amount: 20, unit: "oz" },
        fruiting: { amount: 24, unit: "oz" },
        maturation: { amount: 24, unit: "oz" },
        harvest: { amount: 24, unit: "oz" },
        "ongoing-production": { amount: 24, unit: "oz" },
      },
      herbs: {
        germination: { amount: 6, unit: "oz" },
        seedling: { amount: 10, unit: "oz" },
        vegetative: { amount: 14, unit: "oz" },
        flowering: { amount: 14, unit: "oz" },
        fruiting: { amount: 14, unit: "oz" },
        maturation: { amount: 14, unit: "oz" },
        harvest: { amount: 14, unit: "oz" },
        "ongoing-production": { amount: 14, unit: "oz" },
      },
      berries: {
        germination: { amount: 10, unit: "oz" },
        seedling: { amount: 14, unit: "oz" },
        vegetative: { amount: 20, unit: "oz" },
        flowering: { amount: 24, unit: "oz" },
        fruiting: { amount: 28, unit: "oz" },
        maturation: { amount: 28, unit: "oz" },
        harvest: { amount: 28, unit: "oz" },
        "ongoing-production": { amount: 28, unit: "oz" },
      },
    };

    return categoryWateringGuides[category]?.[stage];
  }

  /**
   * Get category-based fertilizer defaults
   */
  private static getCategoryFertilizerDefaults(
    category: PlantCategory,
    stage: GrowthStage
  ): FertilizerDefaults | undefined {
    const categoryFertilizerGuides: Record<
      PlantCategory,
      Record<string, { product: string; dilution: string; amount: string }>
    > = {
      "leafy-greens": {
        general: {
          product: "Balanced liquid fertilizer",
          dilution: "Half strength",
          amount: "Apply every 2 weeks",
        },
      },
      "fruiting-plants": {
        vegetative: {
          product: "High nitrogen fertilizer",
          dilution: "Full strength",
          amount: "Apply weekly",
        },
        flowering: {
          product: "Bloom booster",
          dilution: "Full strength",
          amount: "Apply bi-weekly",
        },
        fruiting: {
          product: "Potassium-rich fertilizer",
          dilution: "Full strength",
          amount: "Apply weekly",
        },
      },
      "root-vegetables": {
        general: {
          product: "Root vegetable fertilizer",
          dilution: "Half strength",
          amount: "Apply monthly",
        },
      },
      herbs: {
        general: {
          product: "Light liquid fertilizer",
          dilution: "Quarter strength",
          amount: "Apply monthly",
        },
      },
      berries: {
        general: {
          product: "Berry fertilizer",
          dilution: "Full strength",
          amount: "Apply bi-weekly",
        },
      },
    };

    const stageKey = ["flowering", "fruiting"].includes(stage)
      ? stage
      : "general";
    const defaults = categoryFertilizerGuides[category]?.[stageKey];

    if (defaults) {
      return {
        products: [
          {
            name: defaults.product,
            dilution: defaults.dilution,
            amount: defaults.amount,
            confidence: "medium",
          },
        ],
        source: "category",
        reasoning: `General ${category} fertilization guidelines`,
      };
    }

    return undefined;
  }

  /**
   * Parse water amount from various formats
   */
  private static parseWaterAmount(
    amount: string | number
  ): { amount: number } | null {
    if (typeof amount === "number") {
      return { amount };
    }

    if (typeof amount === "string") {
      // Handle ranges like "20-24" or "30-35"
      const rangeMatch = amount.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        return { amount: Math.round((min + max) / 2) };
      }

      // Handle single values like "20" or "30.5"
      const singleMatch = amount.match(/(\d+(?:\.\d+)?)/);
      if (singleMatch) {
        return { amount: parseFloat(singleMatch[1]) };
      }
    }

    return null;
  }

  /**
   * Get quick completion suggestions for a specific plant and activity type
   */
  static async getQuickCompletionOptions(
    plant: PlantRecord,
    activityType: "water" | "fertilize"
  ): Promise<Array<{ label: string; values: QuickCompletionValues }> | null> {
    const defaults = await this.getDefaultsForPlant(plant);
    if (!defaults) return null;

    if (activityType === "water" && defaults.watering) {
      const { suggestedAmount, unit } = defaults.watering;

      // Provide a few quick options around the suggested amount
      const baseAmount = suggestedAmount;
      const options = [
        {
          label: `Quick: ${baseAmount}${unit}`,
          values: {
            waterValue: baseAmount,
            waterUnit: unit,
          },
        },
      ];

      // Add lighter/heavier options if confidence is high
      if (defaults.watering.confidence === "high") {
        const lightAmount = Math.round(baseAmount * 0.75);
        const heavyAmount = Math.round(baseAmount * 1.25);

        options.unshift({
          label: `Light: ${lightAmount}${unit}`,
          values: {
            waterValue: lightAmount,
            waterUnit: unit,
          },
        });

        options.push({
          label: `Heavy: ${heavyAmount}${unit}`,
          values: {
            waterValue: heavyAmount,
            waterUnit: unit,
          },
        });
      }

      return options;
    }

    if (
      activityType === "fertilize" &&
      defaults.fertilizer?.products &&
      defaults.fertilizer.products.length > 0
    ) {
      return defaults.fertilizer.products.slice(0, 3).map((product) => ({
        label: `Quick: ${product.name}`,
        values: {
          product: product.name,
          dilution: product.dilution,
          amount: product.amount,
        },
      }));
    }

    return null;
  }
}
