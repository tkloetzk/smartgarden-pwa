// Core domain types - fundamental enums and basic types
export type GrowthStage =
  | "germination"
  | "seedling"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "maturation"
  | "harvest"
  | "ongoing-production";

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
  | "note";

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
