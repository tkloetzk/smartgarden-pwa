/**
 * Core Domain Types
 * 
 * Base types that define the fundamental domain concepts of the SmartGarden app.
 * These are the essential building blocks used throughout the application.
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// PLANT CATEGORIES AND GROWTH STAGES
// ============================================================================

export type PlantCategory =
  | "root-vegetables"
  | "leafy-greens"
  | "herbs"
  | "berries"
  | "fruiting-plants"
  | "flowers";

// Growth Stages - Consolidated from core.ts and plantStages.ts
type BaseGrowthStage = "germination" | "seedling" | "vegetative" | "maturation";

type RootVegetableStage = BaseGrowthStage | "rootDevelopment";
type FruitingPlantStage =
  | BaseGrowthStage
  | "flowering"
  | "fruiting"
  | "harvest";
type LeafyGreenStage = BaseGrowthStage | "harvest" | "ongoing-production";
type HerbStage = BaseGrowthStage | "harvest" | "ongoing-production";
type BerryStage =
  | BaseGrowthStage
  | "flowering"
  | "fruiting"
  | "harvest"
  | "ongoing-production";
type FlowerStage = BaseGrowthStage | "budding" | "flowering" | "dormancy";

export type GrowthStage =
  | RootVegetableStage
  | FruitingPlantStage
  | LeafyGreenStage
  | HerbStage
  | BerryStage
  | FlowerStage;

// ============================================================================
// CARE ACTIVITY TYPES
// ============================================================================

export type CareActivityType =
  | "water"
  | "fertilize"
  | "observe"
  | "harvest"
  | "transplant"
  | "photo"
  | "note"
  | "lighting"
  | "pruning"
  | "thin"
  | "moisture";

// ============================================================================
// APPLICATION AND CARE METHODS
// ============================================================================

export type ApplicationMethod =
  | "soil-drench"
  | "foliar-spray"
  | "top-dress"
  | "side-dress"
  | "mix-in-soil";

export type WateringMethod =
  | "top-watering"
  | "bottom-watering"
  | "drip"
  | "misting";

// ============================================================================
// QUALITY AND ASSESSMENT TYPES
// ============================================================================

export type QualityRating =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "unsaleable";

export type HealthAssessment =
  | "excellent"
  | "good"
  | "fair"
  | "concerning"
  | "critical";

export type ThinningReason =
  | "overcrowding"
  | "weak-seedlings"
  | "succession-planning"
  | "other";

// ============================================================================
// UNIT TYPES
// ============================================================================

export type VolumeUnit = "oz" | "ml" | "gal" | "L" | "cups";
export type WeightUnit = "oz" | "lbs" | "g" | "kg";
export type LengthUnit = "inches" | "cm" | "ft" | "m";
export type TemperatureUnit = "F" | "C";
export type PositionUnit = "inches" | "cm" | "feet" | "mm";
export type OrientationDirection = "north-south" | "east-west" | "diagonal";

// ============================================================================
// MEASUREMENT INTERFACES
// ============================================================================

export interface Volume {
  amount: number;
  unit: VolumeUnit;
}

export interface Weight {
  amount: number;
  unit: WeightUnit;
}

export interface MoistureReading {
  before: number;
  after?: number;
  scale: "1-10" | "visual";
}

// ============================================================================
// POSITIONING AND SPACING TYPES
// ============================================================================

export interface Position {
  start: number;
  length: number;
  unit: PositionUnit;
  width?: number;
}

export interface SuccessionSpacing {
  totalSpace: number;
  occupiedSpace: number;
  availableSpace: number;
  optimalSpacing?: number;
  maxAdditionalPlants?: number;
  suggestedPositions?: Position[];
}

export interface SuccessionPlanting {
  plantingDate: Date;
  varietyId: string;
  position: Position;
  status: "planned" | "planted" | "skipped" | "completed";
  notes?: string;
}

export interface BedReference {
  id: string;
  name: string;
  dimensions: {
    length: number;
    width: number;
    unit: PositionUnit;
  };
  type:
    | "raised-bed"
    | "container"
    | "ground-bed"
    | "greenhouse-bench"
    | "other";
  orientation?: OrientationDirection;
  referencePoint?: string;
}

export interface PlantSection {
  bedId: string;
  position: Position;
  row?: string | number;
  column?: string | number;
  description?: string;
  isSuccessionSlot?: boolean;
  successionInterval?: number;
}

// ============================================================================
// CATEGORY-SPECIFIC STAGE MAPPINGS
// ============================================================================

// Map each category to its relevant stages
export type CategoryStageMap = {
  "root-vegetables": RootVegetableStage;
  "fruiting-plants": FruitingPlantStage;
  "leafy-greens": LeafyGreenStage;
  herbs: HerbStage;
  berries: BerryStage;
  flowers: FlowerStage;
};

export type StagesForCategory<T extends PlantCategory> = CategoryStageMap[T];

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
  flowers: [
    "germination",
    "seedling",
    "vegetative",
    "budding",
    "flowering",
    "dormancy",
    "maturation",
  ],
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

// ============================================================================
// FIREBASE UTILITY FUNCTIONS
// ============================================================================

export const toFirebaseTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

export const fromFirebaseTimestamp = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};
