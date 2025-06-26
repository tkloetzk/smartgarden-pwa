import { GrowthStage, ApplicationMethod } from "./core";

export interface GrowthTimeline {
  germination: number;
  seedling: number;
  vegetative: number;
  maturation: number;
  rootDevelopment?: number;
}

export interface FertilizerProtocol {
  product?: string;
  dilution?: string;
  amount?: string;
  method?: ApplicationMethod;
}

export interface ApplicationDetails {
  dilution?: string;
  amount?: string;
  method?: ApplicationMethod;
}

// In src/types/protocols.ts

export interface VarietyProtocols {
  watering?: Record<
    GrowthStage,
    {
      trigger?: { moistureLevel?: string | number };
      target?: { moistureLevel?: string | number };
      volume?: { amount?: string | number; frequency?: string };
    }
  >;
  fertilization?: Record<
    GrowthStage,
    {
      schedule?: FertilizationScheduleItem[];
      notes?: string[];
    }
  >;
  lighting?: Record<
    GrowthStage,
    {
      ppfd?: { min: number; max: number; unit: string };
      photoperiod?: { hours: number };
      dli?: { min: number; max: number; unit: string };
    }
  >;
  environment?: EnvironmentalProtocol;
  soilMixture?: SoilMixture;
  container?: ContainerRequirements;
  succession?: SuccessionProtocol;
  specialRequirements?: string[];
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

export interface FertilizationScheduleItem {
  taskName: string;
  details: {
    product: string;
    dilution?: string;
    amount?: string;
    method?: ApplicationMethod;
  };
  startDays: number;
  frequencyDays: number;
  repeatCount: number;
}

export interface StageSpecificWateringProtocol {
  [stageName: string]: {
    trigger: {
      moistureLevel: string | number; // e.g., "3-4", 4, "surface dry"
      description?: string;
    };
    target: {
      moistureLevel: string | number; // e.g., "6-7", 7, "8-10"
      description?: string;
    };
    volume: {
      amount: string; // e.g., "16-24 oz", "32-40 oz per plant"
      frequency: string; // e.g., "every 2-3 days", "3-4x/week"
      perPlant?: boolean;
    };
    notes?: string[];
  };
}

export interface StageSpecificLightingProtocol {
  [stageName: string]: {
    ppfd: {
      min: number;
      max: number;
      optimal?: number;
      unit: "µmol/m²/s";
    };
    photoperiod: {
      hours: number;
      maxHours?: number; // Critical for preventing bolting
      minHours?: number;
      constraint?: string; // e.g., "strict maximum to prevent bolting"
    };
    dli: {
      min: number;
      max: number;
      unit: "mol/m²/day";
    };
    notes?: string[];
  };
}

export interface FertilizationScheduleItem {
  taskName: string;
  details: {
    product: string;
    dilution?: string;
    amount?: string;
    method?: "soil-drench" | "foliar-spray" | "top-dress" | "mix-in-soil";
  };
  startDays: number;
  frequencyDays: number;
  repeatCount: number;
}

export interface StageSpecificFertilizationProtocol {
  [stageName: string]: {
    schedule?: FertilizationScheduleItem[];
    notes?: string[];
  };
}

// Enhanced environmental protocol
export interface EnvironmentalProtocol {
  temperature?: {
    min?: number;
    max?: number;
    optimal?: number;
    unit: "F" | "C";
    criticalMax?: number; // e.g., ">75°F can cause bolting"
    criticalMin?: number;
    stage?: string;
  };
  humidity?: {
    min?: number;
    max?: number;
    optimal?: number;
    criticalForStage?: string;
  };
  pH: {
    min: number;
    max: number;
    optimal: number;
  };
  specialConditions?: string[];
  constraints?: {
    description: string;
    parameter: "temperature" | "humidity" | "light" | "other";
    threshold: number;
    consequence: string;
  }[];
}

export interface SoilMixture {
  components: {
    [component: string]: number; // percentage
  };
  amendments?: {
    [amendment: string]: string; // amount per gallon/container
  };
}

export interface ContainerRequirements {
  minSize?: string;
  depth: string;
  drainage?: string;
  staging?: {
    seedling?: string;
    intermediate?: string;
    final: string;
  };
}

export interface SuccessionProtocol {
  interval: number; // days between plantings
  method: "continuous" | "zoned" | "single";
  harvestMethod: "cut-and-come-again" | "single-harvest" | "selective";
  productiveWeeks?: number;
  notes?: string[];
}
