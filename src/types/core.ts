// src/types/core.ts
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
  | "transplant";

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

export type VolumeUnit = "oz" | "ml" | "gal" | "L";
export type WeightUnit = "oz" | "lbs" | "g" | "kg";
export type LengthUnit = "inches" | "cm" | "ft" | "m";
export type TemperatureUnit = "F" | "C";

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

// Common interfaces used across multiple domains
export interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimestampedRecord {
  id: string;
  createdAt: Date;
}

export interface MoistureReading {
  before: number;
  after: number;
  scale: "1-10" | "visual";
}

export interface Volume {
  amount: number;
  unit: VolumeUnit;
}

export interface Weight {
  amount: number;
  unit: WeightUnit;
}

export interface GrowthTimeline {
  germination: number;
  seedling: number;
  vegetative: number;
  maturation: number;
}
export interface CategoryMoistureDefaults {
  trigger: [number, number];
  target: [number, number];
}

export interface MoistureProtocolInfo {
  trigger: [number, number];
  target: [number, number];
  varietyName: string;
  currentStage: GrowthStage;
  isDefault: boolean;
  source: "custom" | "category" | "universal";
}
