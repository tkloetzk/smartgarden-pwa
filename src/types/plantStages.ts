import { GrowthStage, PlantCategory } from "./core";

// Base stages that all plants go through
type BaseGrowthStage = "germination" | "seedling" | "vegetative" | "maturation";

// Category-specific stage combinations
export type RootVegetableStage = BaseGrowthStage | "rootDevelopment";
export type FruitingPlantStage =
  | BaseGrowthStage
  | "flowering"
  | "fruiting"
  | "harvest";
export type LeafyGreenStage =
  | BaseGrowthStage
  | "harvest"
  | "ongoing-production";
export type HerbStage = BaseGrowthStage | "harvest" | "ongoing-production";
export type BerryStage =
  | BaseGrowthStage
  | "flowering"
  | "fruiting"
  | "harvest"
  | "ongoing-production";

// Map each category to its relevant stages
export type CategoryStageMap = {
  "root-vegetables": RootVegetableStage;
  "fruiting-plants": FruitingPlantStage;
  "leafy-greens": LeafyGreenStage;
  herbs: HerbStage;
  berries: BerryStage;
};

// Utility type to get stages for a specific category
export type StagesForCategory<T extends PlantCategory> = CategoryStageMap[T];

// Helper to check if a stage is valid for a category
export const CATEGORY_STAGES: Record<PlantCategory, readonly GrowthStage[]> = {
  "root-vegetables": [
    "germination",
    "seedling",
    "vegetative",
    "rootDevelopment",
    "maturation",
  ],
  "fruiting-plants": [
    "germination",
    "seedling",
    "vegetative",
    "flowering",
    "fruiting",
    "harvest",
    "maturation",
  ],
  "leafy-greens": [
    "germination",
    "seedling",
    "vegetative",
    "harvest",
    "ongoing-production",
    "maturation",
  ],
  herbs: [
    "germination",
    "seedling",
    "vegetative",
    "harvest",
    "ongoing-production",
    "maturation",
  ],
  berries: [
    "germination",
    "seedling",
    "vegetative",
    "flowering",
    "fruiting",
    "harvest",
    "ongoing-production",
    "maturation",
  ],
} as const;

// Utility function to check if a stage is valid for a category
export function isValidStageForCategory(
  stage: GrowthStage,
  category: PlantCategory
): boolean {
  return CATEGORY_STAGES[category].includes(stage);
}

// Type for category-specific watering configurations
export type CategoryWateringConfig<T extends PlantCategory> = {
  [K in StagesForCategory<T>]: { amount: number; unit: "oz" };
};
