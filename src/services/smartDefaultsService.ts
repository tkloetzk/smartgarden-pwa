// src/services/smartDefaultsService.ts

import {
  varietyService,
  careService,
  PlantRecord,
  VarietyRecord,
} from "@/types/database";
import { GrowthStage, PlantCategory, CareActivityType } from "@/types/core";
import { calculateCurrentStage } from "@/utils/growthStage";

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

interface VolumeAmount {
  amount: number;
  unit: "oz" | "ml" | "cups" | "liters" | "gallons";
}

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
      console.error("Failed to get defaults for plant:", error);
      return null;
    }
  }

  private static getWateringDefaults(
    variety: VarietyRecord,
    currentStage: GrowthStage
  ): WateringDefaults {
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

    return {
      suggestedAmount: 16,
      unit: "oz",
      confidence: "low",
      source: "universal",
      reasoning: "Using universal default amount",
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
        fruiting: { amount: 20, unit: "oz" },
        maturation: { amount: 20, unit: "oz" },
        harvest: { amount: 20, unit: "oz" },
        "ongoing-production": { amount: 20, unit: "oz" },
      },
      herbs: {
        germination: { amount: 6, unit: "oz" },
        seedling: { amount: 8, unit: "oz" },
        vegetative: { amount: 12, unit: "oz" },
        flowering: { amount: 12, unit: "oz" },
        fruiting: { amount: 12, unit: "oz" },
        maturation: { amount: 12, unit: "oz" },
        harvest: { amount: 12, unit: "oz" },
        "ongoing-production": { amount: 12, unit: "oz" },
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

  private static parseWaterAmount(
    amount: string | number
  ): { amount: number } | null {
    if (typeof amount === "number") {
      return { amount };
    }

    if (typeof amount === "string") {
      const rangeMatch = amount.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
      if (rangeMatch) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        return { amount: Math.round((min + max) / 2) };
      }

      const singleMatch = amount.match(/(\d+(?:\.\d+)?)/);
      if (singleMatch) {
        return { amount: parseFloat(singleMatch[1]) };
      }
    }

    return null;
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
      console.error("Failed to get quick completion options:", error);
      return null;
    }
  }

  private static async getWateringQuickOptions(
    plant: PlantRecord,
    variety: VarietyRecord,
    currentStage: GrowthStage,
    isForDashboard = false
  ): Promise<QuickCompleteOption[]> {
    const options: QuickCompleteOption[] = [];

    const wateringDefaults = this.getWateringDefaults(variety, currentStage);

    if (wateringDefaults) {
      options.push({
        label: `Quick: ${wateringDefaults.suggestedAmount}${wateringDefaults.unit}`,
        values: {
          waterValue: wateringDefaults.suggestedAmount,
          waterUnit: wateringDefaults.unit,
          notes: `${
            wateringDefaults.source === "protocol" ? "Protocol" : "Category"
          } suggestion for ${currentStage} stage`,
        },
      });

      if (!isForDashboard) {
        const lightAmount = Math.round(wateringDefaults.suggestedAmount * 0.75);
        const heavyAmount = Math.round(wateringDefaults.suggestedAmount * 1.25);

        if (
          lightAmount !== wateringDefaults.suggestedAmount &&
          lightAmount > 0
        ) {
          options.push({
            label: `Light: ${lightAmount}${wateringDefaults.unit}`,
            values: {
              waterValue: lightAmount,
              waterUnit: wateringDefaults.unit,
              notes: `Light watering for ${currentStage} stage`,
            },
          });
        }

        if (heavyAmount !== wateringDefaults.suggestedAmount) {
          options.push({
            label: `Heavy: ${heavyAmount}${wateringDefaults.unit}`,
            values: {
              waterValue: heavyAmount,
              waterUnit: wateringDefaults.unit,
              notes: `Deep watering for ${currentStage} stage`,
            },
          });
        }
      }
    }

    if (!isForDashboard) {
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
        console.error("Error getting watering history:", error);
      }
    }

    return options.slice(0, isForDashboard ? 1 : 3); // Only 1 option for dashboard, up to 3 for forms
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
