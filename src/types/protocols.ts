/**
 * Protocol and Growth Management Types
 * 
 * Types related to plant growth protocols, schedules, fertilization,
 * environmental requirements, and care scheduling.
 */

import { GrowthStage, ApplicationMethod } from "./core";

// ============================================================================
// GROWTH TIMELINE TYPES
// ============================================================================

export interface GrowthTimeline {
  // Starting stages (plants can begin from different propagation methods)
  germination?: number; // From seed
  establishment?: number; // From bare root, transplant, or runner
  caneEstablishment?: number; // From bare root canes (berries)
  slipProduction?: number; // From tuber sprouting (sweet potatoes)
  seedling?: number; // From established seedling/transplant

  // Growth stages (all represent DURATION in days)
  vegetative?: number;
  vegetativeGrowth?: number; // Alternative name for vegetative
  flowering?: number;
  fruiting?: number;
  maturation?: number;
  rootDevelopment?: number; // For root vegetables
  tuberDevelopment?: number; // For tuber crops
  budding?: number; // For flowers
  dormancy?: number; // For perennials

  // Production stages
  ongoingProduction?: number; // Continuous harvest period
  floweringFruiting?: number; // Combined flowering/fruiting
  ongoing?: number; // Alternative to ongoingProduction

  // Allow custom stages for specialized varieties
  [customStage: string]: number | undefined;
}

// ============================================================================
// FERTILIZATION PROTOCOL TYPES
// ============================================================================

export interface FertilizerDetails {
  product: string;
  dilution?: string;
  amount: string;
  method: ApplicationMethod;
  notes?: string;
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

// ============================================================================
// ENVIRONMENTAL PROTOCOL TYPES
// ============================================================================

export interface EnvironmentalProtocol {
  temperature: {
    min: number;
    max: number;
    optimal?: { min: number; max: number };
    unit: "F" | "C";
  };
  humidity: {
    min: number;
    max: number;
    optimal?: { min: number; max: number };
    unit: "%";
  };
  airCirculation?: {
    required: boolean;
    notes?: string[];
  };
  co2?: {
    min?: number;
    max?: number;
    optimal?: number;
    unit: "ppm";
  };
}

export interface SoilMixture {
  baseComponents: {
    component: string;
    percentage: number;
    notes?: string;
  }[];
  amendments?: {
    component: string;
    amount: string;
    frequency?: string;
    notes?: string;
  }[];
  ph: {
    min: number;
    max: number;
    optimal?: number;
  };
  drainage: "excellent" | "good" | "moderate" | "poor";
  moistureRetention: "high" | "medium" | "low";
  notes?: string[];
}

export interface ContainerRequirements {
  minVolume: {
    amount: number;
    unit: "oz" | "ml" | "gal" | "L";
  };
  depth: {
    min: number;
    optimal?: number;
    unit: "inches" | "cm";
  };
  width?: {
    min: number;
    optimal?: number;
    unit: "inches" | "cm";
  };
  drainageHoles: boolean;
  material?: string[];
  notes?: string[];
}

export interface SuccessionProtocol {
  recommended: boolean;
  intervalDays?: number;
  maxSuccessions?: number;
  seasonConstraints?: {
    lastPlantingDate?: string; // MM-DD format
    firstPlantingDate?: string; // MM-DD format
  };
  spacingRequirements?: {
    betweenPlants: number;
    betweenRows?: number;
    unit: "inches" | "cm";
  };
  notes?: string[];
}

// ============================================================================
// STAGE-SPECIFIC PROTOCOL TYPES
// ============================================================================

export interface StageSpecificWateringProtocol {
  [stageName: string]: {
    trigger: {
      moistureLevel: string | number;
      description?: string;
    };
    target: {
      moistureLevel: string | number;
      description?: string;
    };
    volume: {
      amount: string;
      frequency: string;
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
      maxHours?: number;
      minHours?: number;
      constraint?: string;
    };
    dli: {
      min: number;
      max: number;
      unit: "mol/m²/day";
    };
    notes?: string[];
  };
}

export interface StageSpecificFertilizationProtocol {
  [stageName: string]: {
    schedule?: FertilizationScheduleItem[];
    notes?: string[];
  };
}

// ============================================================================
// VARIETY PROTOCOLS INTERFACE
// ============================================================================

export interface VarietyProtocols {
  watering?: Partial<
    Record<
      GrowthStage,
      {
        trigger?: { moistureLevel?: string | number };
        target?: { moistureLevel?: string | number };
        volume?: {
          amount?: string | number;
          frequency?: string;
          perPlant?: boolean;
        };
      }
    >
  >;
  fertilization?: Partial<
    Record<
      GrowthStage,
      {
        schedule?: FertilizationScheduleItem[];
        notes?: string[];
      }
    >
  >;
  lighting?: Partial<
    Record<
      GrowthStage,
      {
        ppfd?: { min: number; max: number; optimal?: number; unit: string };
        photoperiod?: {
          hours: number;
          maxHours?: number;
          minHours?: number;
          constraint?: string;
        };
        dli?: { min: number; max: number; unit: string };
        notes?: string[];
      }
    >
  >;
  environment?: EnvironmentalProtocol;
  soilMixture?: SoilMixture;
  container?: ContainerRequirements;
}

// ============================================================================
// SCHEDULING TYPES
// ============================================================================

export interface QuickCompleteOption {
  id: string;
  label: string;
  values: {
    amount?: string;
    product?: string;
    dilution?: string;
    notes?: string;
  };
}

export interface UpcomingTask {
  id: string;
  plantId: string;
  plantName: string;
  task: string;
  type: string;
  dueDate: Date;
  dueIn: string;
  priority: "low" | "medium" | "high" | "overdue";
  isOverdue: boolean;
  metadata?: {
    scheduleSource?: string;
    automated?: boolean;
    estimatedDuration?: number;
    requiresAttention?: boolean;
  };
  quickCompleteOptions?: QuickCompleteOption[];
}

export interface TaskGroup {
  title: string;
  tasks: UpcomingTask[];
  priority: "low" | "medium" | "high" | "overdue";
  totalCount: number;
  expanded?: boolean;
}

// ============================================================================
// REMINDER AND SETTINGS TYPES
// ============================================================================

export interface ReminderPreferences {
  enabled: boolean;
  wateringReminders: boolean;
  fertilizationReminders: boolean;
  harvestReminders: boolean;
  observationReminders: boolean;
  advanceDays: number;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  frequency: "daily" | "twice-daily" | "weekly";
  customSchedule?: {
    watering?: number; // days before due
    fertilization?: number;
    harvest?: number;
    observation?: number;
  };
}
