// src/services/smartDefaultsService.ts

import {
  varietyService,
  careService,
  PlantRecord,
  VarietyRecord,
} from "@/types/database";
import { GrowthStage, PlantCategory, CareActivityType } from "@/types/core";
import { calculateCurrentStage } from "@/utils/growthStage";
import { WateringResolver } from "@/utils/wateringResolver";
import { Logger } from "@/utils/logger";

export interface QuickCompleteOption {
  label: string;
  values: QuickCompletionValues;
}

export interface QuickCompletionValues {
  waterValue?: number;
  waterUnit?: "oz" | "ml" | "cups" | "liters" | "gallons";
  product?: string;
  dilution?: string;
  amount?: string;
  notes?: string;
}

export interface SmartDefaults {
  watering?: WateringDefaults;
  fertilizer?: FertilizerDefaults;
}

interface WateringDefaults {
  suggestedAmount: number;
  unit: "oz" | "ml" | "cups" | "liters" | "gallons";
  confidence: "high" | "medium" | "low";
  source: "protocol" | "category" | "universal";
  reasoning: string;
}

interface FertilizerDefaults {
  products: Array<{
    name: string;
    dilution: string;
    amount: string;
    method?: ApplicationMethod;
    confidence: "high" | "medium" | "low";
  }>;
  source: "protocol" | "category" | "universal";
  reasoning: string;
}

type ApplicationMethod = "soil-drench" | "foliar-spray" | "side-dress";

export class SmartDefaultsService {
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

      const watering = this.getWateringDefaults(variety, currentStage);
      const fertilizer = this.getFertilizerDefaults(variety, currentStage);

      return {
        watering,
        fertilizer,
      };
    } catch (error) {
      Logger.error("Failed to get defaults for plant:", error);
      return null;
    }
  }

  private static getWateringDefaults(
    variety: VarietyRecord,
    currentStage: GrowthStage
  ): WateringDefaults {
    const resolved = WateringResolver.resolveWateringAmount(
      variety,
      currentStage
    );
    return {
      suggestedAmount: resolved.amount,
      unit: resolved.unit,
      confidence: resolved.confidence,
      source: resolved.source,
      reasoning: resolved.reasoning,
    };
  }

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
            method:
              (stageProtocol.application.method as ApplicationMethod) ||
              "soil-drench",
            confidence: "high",
          },
        ],
        source: "protocol",
        reasoning: `Based on ${variety.name} fertilization protocol for ${currentStage} stage`,
      };
    }

    const categoryDefaults = this.getCategoryFertilizerDefaults(
      variety.category,
      currentStage
    );
    if (categoryDefaults) {
      return categoryDefaults;
    }

    return undefined;
  }

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

  static async getQuickCompletionOptions(
    plant: PlantRecord,
    taskType: CareActivityType,
    isForDashboard = false // Add parameter to distinguish dashboard vs full form
  ): Promise<QuickCompleteOption[] | null> {
    try {
      const variety = await varietyService.getVariety(plant.varietyId);
      if (!variety) return null;

      const currentStage = calculateCurrentStage(
        plant.plantedDate,
        variety.growthTimeline
      );

      switch (taskType) {
        case "water":
          return this.getWateringQuickOptions(
            plant,
            variety,
            currentStage,
            isForDashboard
          );
        case "fertilize":
          return this.getFertilizingQuickOptions(variety, currentStage);
        case "observe":
          return [
            {
              label: "Quick: Health Check",
              values: { notes: "Quick health observation" },
            },
          ];
        default:
          return null;
      }
    } catch (error) {
      Logger.error("Failed to get quick completion options:", error);
      return null;
    }
  }

  private static async addRecentWateringOption(
    plant: PlantRecord,
    options: QuickCompleteOption[]
  ): Promise<void> {
    try {
      const recentWatering = await careService.getLastActivityByType(
        plant.id,
        "water"
      );
      if (recentWatering && recentWatering.details.type === "water") {
        const lastAmount = recentWatering.details.amount as unknown as {
          value: number;
          unit: "oz" | "ml" | "cups" | "liters" | "gallons";
        };

        if (lastAmount && lastAmount.value > 0) {
          const isDifferent = !options.some(
            (opt) =>
              opt.values.waterValue === lastAmount.value &&
              opt.values.waterUnit === lastAmount.unit
          );

          if (isDifferent) {
            options.push({
              label: `Repeat: ${lastAmount.value}${lastAmount.unit}`,
              values: {
                waterValue: lastAmount.value,
                waterUnit: lastAmount.unit,
                notes: `Based on your last watering`,
              },
            });
          }
        }
      }
    } catch (error) {
      Logger.error("Error getting watering history:", error);
    }
  }

  private static async getWateringQuickOptions(
    plant: PlantRecord,
    variety: VarietyRecord,
    currentStage: GrowthStage,
    isForDashboard = false
  ): Promise<QuickCompleteOption[]> {
    const options: QuickCompleteOption[] = [];
    const wateringAmount = WateringResolver.resolveWateringAmount(
      variety,
      currentStage
    );

    // Add primary suggestion
    options.push({
      label: `Quick: ${wateringAmount.amount}${wateringAmount.unit}`,
      values: {
        waterValue: wateringAmount.amount,
        waterUnit: wateringAmount.unit,
        notes: `${
          wateringAmount.source === "protocol" ? "Protocol" : "Category"
        } suggestion for ${currentStage} stage`,
      },
    });

    // Add light/heavy variants for full forms only
    if (!isForDashboard) {
      const lightAmount = Math.round(wateringAmount.amount * 0.75);
      const heavyAmount = Math.round(wateringAmount.amount * 1.25);

      if (lightAmount !== wateringAmount.amount && lightAmount > 0) {
        options.push({
          label: `Light: ${lightAmount}${wateringAmount.unit}`,
          values: {
            waterValue: lightAmount,
            waterUnit: wateringAmount.unit,
            notes: `Light watering for ${currentStage} stage`,
          },
        });
      }

      if (heavyAmount !== wateringAmount.amount) {
        options.push({
          label: `Heavy: ${heavyAmount}${wateringAmount.unit}`,
          values: {
            waterValue: heavyAmount,
            waterUnit: wateringAmount.unit,
            notes: `Deep watering for ${currentStage} stage`,
          },
        });
      }

      // Add recent watering option
      await this.addRecentWateringOption(plant, options);
    }

    return options.slice(0, isForDashboard ? 1 : 3);
  }

  private static async getFertilizingQuickOptions(
    variety: VarietyRecord,
    currentStage: GrowthStage
  ): Promise<QuickCompleteOption[]> {
    const options: QuickCompleteOption[] = [];

    const fertilizerDefaults = this.getFertilizerDefaults(
      variety,
      currentStage
    );

    if (fertilizerDefaults && fertilizerDefaults.products.length > 0) {
      fertilizerDefaults.products.slice(0, 2).forEach((product, index) => {
        const label = index === 0 ? `Quick: ${product.name}` : product.name;
        options.push({
          label,
          values: {
            product: product.name,
            dilution: product.dilution,
            amount: product.amount,
            notes: `${
              fertilizerDefaults.source === "protocol" ? "Protocol" : "Category"
            } suggestion for ${currentStage} stage`,
          },
        });
      });
    }

    return options;
  }
}
