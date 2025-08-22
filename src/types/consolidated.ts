/**
 * Consolidated Type Definitions for SmartGarden App
 * 
 * This file consolidates all type definitions from multiple files to eliminate
 * duplication and provide a single source of truth for all types.
 */

import { Timestamp } from "firebase/firestore";

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

// Plant Categories
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
type FlowerStage =
  | BaseGrowthStage
  | "budding"
  | "flowering"
  | "dormancy";

export type GrowthStage =
  | RootVegetableStage
  | FruitingPlantStage
  | LeafyGreenStage
  | HerbStage
  | BerryStage
  | FlowerStage;

// Care Activity Types
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

// Application Methods - Consolidated from core.ts and scheduling.ts
export type ApplicationMethod =
  | "soil-drench"
  | "foliar-spray"
  | "top-dress"
  | "side-dress"
  | "mix-in-soil";

// Other Methods
export type WateringMethod =
  | "top-watering"
  | "bottom-watering"
  | "drip"
  | "misting";

// Quality and Assessment Types
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
// SPACING AND POSITIONING TYPES
// ============================================================================

export interface Position {
  start: number;
  length: number;
  unit: PositionUnit;
  width?: number;
}

// Succession spacing types
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
  type: "raised-bed" | "container" | "ground-bed" | "greenhouse-bench" | "other";
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
// PROTOCOL TYPES
// ============================================================================

export interface GrowthTimeline {
  germination: number;
  seedling: number;
  vegetative: number;
  maturation: number;
  rootDevelopment?: number;
}

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

export interface VarietyProtocols {
  watering?: Partial<Record<
    GrowthStage,
    {
      trigger?: { moistureLevel?: string | number };
      target?: { moistureLevel?: string | number };
      volume?: { amount?: string | number; frequency?: string; perPlant?: boolean };
    }
  >>;
  fertilization?: Partial<Record<
    GrowthStage,
    {
      schedule?: FertilizationScheduleItem[];
      notes?: string[];
    }
  >>;
  lighting?: Partial<Record<
    GrowthStage,
    {
      ppfd?: { min: number; max: number; optimal?: number; unit: string };
      photoperiod?: { hours: number; maxHours?: number; minHours?: number; constraint?: string };
      dli?: { min: number; max: number; unit: string };
      notes?: string[];
    }
  >>;
  environment?: EnvironmentalProtocol;
  soilMixture?: SoilMixture;
  container?: ContainerRequirements;
  succession?: SuccessionProtocol;
  specialRequirements?: string[];
}

export interface EnvironmentalProtocol {
  temperature?: {
    min?: number;
    max?: number;
    optimal?: number;
    unit: "F" | "C";
    criticalMax?: number;
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

// Stage-specific protocol types
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
// SETTINGS AND PREFERENCES TYPES
// ============================================================================

export interface ReminderPreferences {
  watering?: boolean;
  fertilizing?: boolean;
  observation?: boolean;
  lighting?: boolean;
  pruning?: boolean;
}

// ============================================================================
// DATABASE RECORD TYPES
// ============================================================================

export interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PlantRecord extends BaseRecord {
  varietyId: string;
  varietyName: string;
  name?: string;
  plantedDate: Date;
  location: string;
  container: string;
  soilMix?: string;
  isActive: boolean;
  notes?: string[];
  quantity?: number;
  setupType?: "multiple-containers" | "same-container";
  confirmedStage?: GrowthStage;
  stageConfirmedDate?: Date;
  growthRateModifier?: number;
  reminderPreferences?: ReminderPreferences;
  currentPlantCount?: number;
  originalPlantCount?: number;
  lastThinningDate?: Date;
  section?: string;
  structuredSection?: PlantSection;
}

export interface VarietyRecord extends BaseRecord {
  name: string;
  normalizedName: string;
  category: PlantCategory;
  description?: string;
  growthTimeline: GrowthTimeline;
  protocols?: VarietyProtocols;
  isEverbearing?: boolean;
  productiveLifespan?: number;
  isCustom?: boolean;
}

export interface BedRecord extends BaseRecord, BedReference {
  isActive: boolean;
}

export interface CareActivityDetails {
  type: CareActivityType;
  
  // Section-based activity tracking
  sectionBased?: boolean;
  sectionId?: string; // Unique identifier for this section application
  totalSectionAmount?: { value: number; unit: VolumeUnit }; // Total amount applied to entire section
  plantsInSection?: number; // Number of plants this was applied to
  
  // Watering adequacy tracking
  recommendedAmount?: { value: number; unit: VolumeUnit }; // What was recommended
  isPartialWatering?: boolean; // True if less than 80% of recommended amount
  wateringCompleteness?: number; // Percentage of recommended amount (0-1)
  
  // Watering details
  waterAmount?: number;
  waterUnit?: VolumeUnit;
  moistureLevel?: {
    before: number;
    after?: number;
    scale: "1-10" | "visual";
  };
  method?: WateringMethod;
  runoffObserved?: boolean;

  // Fertilizer details
  product?: string;
  dilution?: string;
  amount?: string | { value: number; unit: VolumeUnit };
  applicationMethod?: ApplicationMethod;

  // Observation details
  healthAssessment?: HealthAssessment;
  observations?: string;
  photos?: string[];

  // Harvest details
  quality?: QualityRating;
  harvestMethod?: string;

  // Transplant details
  fromContainer?: string;
  toContainer?: string;
  reason?: string;

  // Thinning details
  originalCount?: number;
  finalCount?: number;
  removedPlants?: {
    condition: "healthy" | "weak" | "diseased";
    action: "compost" | "transplant" | "discard";
  }[];

  // Pruning details
  partsRemoved?: "leaves" | "stems" | "flowers" | "runners" | "multiple";
  amountRemoved?: string;
  purpose?: "maintenance" | "disease-control" | "shape" | "harvest" | "other";

  // Environmental details
  temperature?: number;
  humidity?: number;
  lightLevel?: number;
  weatherConditions?: string;

  // General
  notes?: string;
}

export interface CareActivityRecord extends BaseRecord {
  plantId: string;
  type: CareActivityType;
  date: Date;
  details: CareActivityDetails;
  
  // Legacy property aliases for backward compatibility
  activityType?: CareActivityType; // alias for type
  activityDate?: Date; // alias for date
  
  // Additional metadata
  notes?: string;
  stage?: GrowthStage;
  plantAge?: number;
}

export interface TaskBypassRecord extends BaseRecord {
  taskId: string;
  plantId: string;
  taskType: CareActivityType;
  reason: string;
  scheduledDate: Date;
  bypassDate: Date;
  plantStage: GrowthStage;
  userId?: string;
}

export interface TaskCompletionRecord extends BaseRecord {
  plantId: string;
  taskType: CareActivityType;
  scheduledDate: Date;
  actualCompletionDate: Date;
  varianceDays: number;
  careActivityId: string;
  plantStage: GrowthStage;
}

export interface ScheduledTask extends BaseRecord {
  plantId: string;
  taskType: CareActivityType;
  dueDate: Date;
  status: "pending" | "completed" | "bypassed";
  priority?: "low" | "medium" | "high";
  description?: string;
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
  category: "watering" | "fertilizing" | "observation" | "maintenance";
  plantStage: GrowthStage;
  canBypass?: boolean;
  quickCompleteOptions?: QuickCompleteOption[];
}

export interface TaskGroup {
  type: string;
  title: string;
  emoji: string;
  tasks: UpcomingTask[];
  isExpanded: boolean;
}

// ============================================================================
// FIREBASE TYPES
// ============================================================================

export interface FirebasePlantRecord {
  id?: string;
  userId: string;
  varietyId: string;
  varietyName: string;
  name?: string;
  plantedDate: Timestamp;
  location: string;
  container: string;
  soilMix?: string;
  isActive: boolean;
  notes?: string[];
  quantity?: number;
  setupType?: "multiple-containers" | "same-container";
  reminderPreferences?: ReminderPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseCareRecord {
  id?: string;
  userId: string;
  plantId: string;
  type: CareActivityType;
  date: Timestamp;
  details: CareActivityDetails;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseVarietyRecord {
  id?: string;
  userId?: string;
  name: string;
  category: PlantCategory;
  growthTimeline: {
    germination: number;
    seedling: number;
    vegetative: number;
    maturation: number;
  };
  protocols?: Record<string, unknown>;
  moistureProtocols?: Record<string, unknown>;
  isCustom?: boolean;
  isEverbearing?: boolean;
  productiveLifespan?: number;
  createdAt: Timestamp;
}

export interface FirebaseScheduledTask {
  id?: string;
  userId: string;
  plantId: string;
  taskName: string;
  taskType: string;
  details: {
    type: string;
    product: string;
    dilution: string;
    amount: string;
    method: string;
  };
  dueDate: Timestamp;
  status: string;
  sourceProtocol: {
    stage: string;
    originalStartDays: number;
    isDynamic: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserSettings {
  id: string;
  units: {
    temperature: "fahrenheit" | "celsius";
    volume: "ounces" | "liters";
  };
  notifications: {
    careReminders: boolean;
    harvestAlerts: boolean;
  };
  location: {
    timezone: string;
    zipCode?: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  settings: UserSettings;
  createdAt: Date;
  lastLoginAt: Date;
}

// ============================================================================
// UTILITY TYPES AND MAPPINGS
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
// LEGACY TYPE ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

// Remove these gradually as you update the codebase
export type CareRecord = CareActivityRecord;
export type BypassLogRecord = TaskBypassRecord;
export type FertilizationMethod = ApplicationMethod; // For backward compatibility

// Convenience aliases
export type Plant = PlantRecord;
export type Variety = VarietyRecord;
export type CareActivity = CareActivityRecord;

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

// Firebase utility functions
export const toFirebaseTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

export const fromFirebaseTimestamp = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const convertPlantToFirebase = (
  plant: PlantRecord,
  userId: string
): Omit<FirebasePlantRecord, "id"> => ({
  userId,
  varietyId: plant.varietyId,
  varietyName: plant.varietyName,
  name: plant.name || plant.varietyName,
  plantedDate: toFirebaseTimestamp(plant.plantedDate),
  location: plant.location,
  container: plant.container,
  soilMix: plant.soilMix,
  isActive: plant.isActive,
  notes: plant.notes,
  quantity: plant.quantity,
  setupType: plant.setupType,
  reminderPreferences: plant.reminderPreferences,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

export const convertPlantFromFirebase = (
  firebasePlant: FirebasePlantRecord
): PlantRecord => ({
  id: firebasePlant.id!,
  varietyId: firebasePlant.varietyId,
  varietyName: firebasePlant.varietyName,
  name: firebasePlant.name,
  plantedDate: fromFirebaseTimestamp(firebasePlant.plantedDate),
  location: firebasePlant.location,
  container: firebasePlant.container,
  soilMix: firebasePlant.soilMix,
  isActive: firebasePlant.isActive,
  notes: firebasePlant.notes,
  quantity: firebasePlant.quantity,
  setupType: firebasePlant.setupType,
  reminderPreferences: firebasePlant.reminderPreferences,
  createdAt: fromFirebaseTimestamp(firebasePlant.createdAt),
  updatedAt: fromFirebaseTimestamp(firebasePlant.updatedAt),
});

export const convertCareActivityToFirebase = (
  activity: CareActivityRecord,
  userId: string
): Omit<FirebaseCareRecord, "id"> => ({
  userId,
  plantId: activity.plantId,
  type: activity.type,
  date: toFirebaseTimestamp(activity.date),
  details: activity.details,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

export const convertCareActivityFromFirebase = (
  firebaseActivity: FirebaseCareRecord
): CareActivityRecord => ({
  id: firebaseActivity.id!,
  plantId: firebaseActivity.plantId,
  type: firebaseActivity.type,
  date: fromFirebaseTimestamp(firebaseActivity.date),
  details: firebaseActivity.details as CareActivityDetails,
  createdAt: fromFirebaseTimestamp(firebaseActivity.createdAt),
  updatedAt: fromFirebaseTimestamp(firebaseActivity.updatedAt),
});