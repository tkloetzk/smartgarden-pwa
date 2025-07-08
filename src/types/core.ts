// Core domain types - fundamental enums and basic types

// Base growth stages common to all plants
type BaseGrowthStage = "germination" | "seedling" | "vegetative" | "maturation";

// Category-specific additional stages
type RootVegetableStage = BaseGrowthStage | "rootDevelopment";
type FruitingPlantStage =
  | BaseGrowthStage
  | "flowering"
  | "fruiting"
  | "harvest";
type LeafyGreenStage = BaseGrowthStage | "harvest" | "ongoing-production";

// Union type for flexibility
export type GrowthStage =
  | RootVegetableStage
  | FruitingPlantStage
  | LeafyGreenStage;

export type PlantCategory =
  | "root-vegetables"
  | "leafy-greens"
  | "herbs"
  | "berries"
  | "fruiting-plants";

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
  | "thin"; // For reducing plant count

// NEW: Define the thinning reason type
export type ThinningReason =
  | "overcrowding"
  | "weak-seedlings"
  | "succession-planning"
  | "other";

// Note: These interface extensions should go in database.ts since that's where CareActivityDetails is defined
// I'll show those updates below

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

// Unit types
export type VolumeUnit = "oz" | "ml" | "gal" | "L" | "cups";
export type WeightUnit = "oz" | "lbs" | "g" | "kg";
export type LengthUnit = "inches" | "cm" | "ft" | "m";
export type TemperatureUnit = "F" | "C";

// Application methods
export type ApplicationMethod =
  | "soil-drench"
  | "foliar-spray"
  | "top-dress"
  | "mix-in-soil";

export type WateringMethod =
  | "top-watering"
  | "bottom-watering"
  | "drip"
  | "misting";

// Base measurement interfaces
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
  after: number;
  scale: "1-10" | "visual";
}
