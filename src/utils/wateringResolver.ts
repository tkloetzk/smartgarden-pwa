import { VarietyRecord } from "@/types/database";
import { GrowthStage } from "@/types/core";
import {
  CategoryWateringConfig,
  isValidStageForCategory,
} from "@/types/plantStages";

interface WateringAmount {
  amount: number;
  unit: "oz" | "ml" | "cups" | "liters" | "gallons";
  confidence: "high" | "medium" | "low";
  source: "protocol" | "category" | "universal";
  reasoning: string;
}

export class WateringResolver {
  // Each category only defines the stages it actually uses
  private static readonly CATEGORY_WATERING_GUIDES = {
    "root-vegetables": {
      germination: { amount: 8, unit: "oz" },
      seedling: { amount: 12, unit: "oz" },
      vegetative: { amount: 20, unit: "oz" },
      rootDevelopment: { amount: 24, unit: "oz" },
      maturation: { amount: 20, unit: "oz" },
    } as CategoryWateringConfig<"root-vegetables">,

    "leafy-greens": {
      germination: { amount: 8, unit: "oz" },
      seedling: { amount: 12, unit: "oz" },
      vegetative: { amount: 16, unit: "oz" },
      harvest: { amount: 16, unit: "oz" },
      "ongoing-production": { amount: 16, unit: "oz" },
      maturation: { amount: 16, unit: "oz" },
    } as CategoryWateringConfig<"leafy-greens">,

    herbs: {
      germination: { amount: 6, unit: "oz" },
      seedling: { amount: 8, unit: "oz" },
      vegetative: { amount: 12, unit: "oz" },
      harvest: { amount: 12, unit: "oz" },
      "ongoing-production": { amount: 12, unit: "oz" },
      maturation: { amount: 12, unit: "oz" },
    } as CategoryWateringConfig<"herbs">,

    "fruiting-plants": {
      germination: { amount: 12, unit: "oz" },
      seedling: { amount: 16, unit: "oz" },
      vegetative: { amount: 24, unit: "oz" },
      flowering: { amount: 28, unit: "oz" },
      fruiting: { amount: 32, unit: "oz" },
      harvest: { amount: 28, unit: "oz" },
      maturation: { amount: 28, unit: "oz" },
    } as CategoryWateringConfig<"fruiting-plants">,

    berries: {
      germination: { amount: 10, unit: "oz" },
      seedling: { amount: 14, unit: "oz" },
      vegetative: { amount: 18, unit: "oz" },
      flowering: { amount: 20, unit: "oz" },
      fruiting: { amount: 24, unit: "oz" },
      harvest: { amount: 20, unit: "oz" },
      "ongoing-production": { amount: 24, unit: "oz" },
      maturation: { amount: 20, unit: "oz" },
    } as CategoryWateringConfig<"berries">,
  } as const;

  static resolveWateringAmount(
    variety: VarietyRecord,
    currentStage: GrowthStage
  ): WateringAmount {
    // Check if the stage is valid for this category
    if (!isValidStageForCategory(currentStage, variety.category)) {
      return {
        amount: 16,
        unit: "oz",
        confidence: "low",
        source: "universal",
        reasoning: `Stage '${currentStage}' not applicable to ${variety.category}. Using default.`,
      };
    }

    // Try protocol first - this would check variety.protocols.watering[currentStage]
    const protocolAmount = this.getProtocolWateringAmount(
      variety,
      currentStage
    );
    if (protocolAmount) {
      return protocolAmount;
    }

    // Use category-specific amount
    const categoryGuide = this.CATEGORY_WATERING_GUIDES[variety.category];
    if (categoryGuide && currentStage in categoryGuide) {
      const config = categoryGuide[currentStage as keyof typeof categoryGuide];
      return {
        amount: config.amount,
        unit: config.unit,
        confidence: "medium",
        source: "category",
        reasoning: `Based on ${variety.category} guidelines for ${currentStage} stage`,
      };
    }

    // Fallback to universal default
    return {
      amount: 16,
      unit: "oz",
      confidence: "low",
      source: "universal",
      reasoning: "Using universal default amount",
    };
  }

  private static getProtocolWateringAmount(
    variety: VarietyRecord,
    currentStage: GrowthStage
  ): WateringAmount | null {
    const stageProtocol = variety.protocols?.watering?.[currentStage];
    if (!stageProtocol?.volume?.amount) {
      return null;
    }

    // Parse the amount from protocol (e.g., "16-24 oz" -> 20)
    const amountStr = String(stageProtocol.volume.amount);
    const parsedAmount = this.parseWateringAmount(amountStr);

    if (parsedAmount) {
      return {
        amount: parsedAmount.amount,
        unit: parsedAmount.unit,
        confidence: "high",
        source: "protocol",
        reasoning: `From ${variety.name} protocol for ${currentStage} stage`,
      };
    }

    return null;
  }

  private static parseWateringAmount(amountStr: string): {
    amount: number;
    unit: "oz" | "ml" | "cups" | "liters" | "gallons";
  } | null {
    // Handle ranges like "16-24 oz" by taking the midpoint
    const rangeMatch = amountStr.match(
      /(\d+)-(\d+)\s*(oz|ml|cups|liters|gallons)/i
    );
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      const unit = rangeMatch[3].toLowerCase() as
        | "oz"
        | "ml"
        | "cups"
        | "liters"
        | "gallons";
      return {
        amount: Math.round((min + max) / 2),
        unit,
      };
    }

    // Handle single values like "20 oz"
    const singleMatch = amountStr.match(/(\d+)\s*(oz|ml|cups|liters|gallons)/i);
    if (singleMatch) {
      return {
        amount: parseInt(singleMatch[1]),
        unit: singleMatch[2].toLowerCase() as
          | "oz"
          | "ml"
          | "cups"
          | "liters"
          | "gallons",
      };
    }

    return null;
  }
}
