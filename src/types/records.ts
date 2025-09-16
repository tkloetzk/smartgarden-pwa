/**
 * Database Record Types
 * 
 * Types for database entities and records, including base interfaces
 * and all database-stored types.
 */

import { 
  PlantCategory, 
  GrowthStage, 
  CareActivityType, 
  VolumeUnit,
  ApplicationMethod,
  HealthAssessment,
  QualityRating,
  ThinningReason,
  PlantSection,
  MoistureReading,
  Volume,
  Weight
} from "./core";
import { ReminderPreferences, GrowthTimeline, VarietyProtocols } from "./protocols";

// ============================================================================
// BASE RECORD INTERFACE
// ============================================================================

export interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PLANT RECORDS
// ============================================================================

export interface PlantRecord extends BaseRecord {
  varietyId: string;
  varietyName: string;
  name?: string;
  plantedDate: Date;
  location?: string;
  container?: string;
  soilMix?: string;
  isActive: boolean;
  notes?: string;
  quantity?: number;
  setupType?: "seed" | "transplant" | "cutting" | "bare-root";
  reminderPreferences?: ReminderPreferences;
  growthRateModifier?: number;
  section?: PlantSection | string; // Support both structured and string sections
  structuredSection?: PlantSection; // Legacy support
}

export interface VarietyRecord extends BaseRecord {
  name: string;
  normalizedName: string;
  category: PlantCategory;
  description?: string;
  timeline?: GrowthTimeline;
  protocols?: VarietyProtocols;
  isCustom?: boolean;
  source?: string;
  tags?: string[];
}

export interface BedReference {
  id: string;
  name: string;
  type: "raised-bed" | "container" | "ground-bed" | "greenhouse-bench" | "other";
  isActive: boolean;
}

export interface BedRecord extends BaseRecord, BedReference {
  description?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  location?: string;
  material?: string;
  soilType?: string;
  notes?: string;
}

// ============================================================================
// CARE ACTIVITY RECORDS
// ============================================================================

export interface CareActivityDetails {
  // Watering details
  amount?: string;
  unit?: VolumeUnit;
  method?: string;
  volumeData?: Volume;
  moistureReading?: MoistureReading;

  // Fertilization details  
  product?: string;
  dilution?: string;
  applicationMethod?: ApplicationMethod;

  // Harvest details
  quantity?: number;
  qualityRating?: QualityRating;
  harvestWeight?: Weight;
  notes?: string;

  // Observation details
  healthAssessment?: HealthAssessment;
  photos?: string[];
  visualCues?: string[];

  // Transplant details
  fromLocation?: string;
  toLocation?: string;
  containerSize?: string;
  soilMix?: string;

  // Pruning details
  partsRemoved?: string[];
  technique?: string;

  // Thinning details
  numberRemoved?: number;
  reason?: ThinningReason;
  selectedCriteria?: string;

  // General fields
  temperature?: number;
  humidity?: number;
  ppfd?: number;
  dli?: number;
  duration?: number;
  
  // Partial watering fields
  recommendedAmount?: {
    value: string | number;
    unit: VolumeUnit;
  };
  isPartialWatering?: boolean;
  wateringCompleteness?: number;
  
  // Legacy aliases for backward compatibility
  activityType?: CareActivityType; // alias for type
  activityDate?: Date; // alias for date
  // Additional metadata
  stage?: GrowthStage;
  plantAge?: number;
}

export interface CareActivityRecord extends BaseRecord {
  plantId: string;
  type: CareActivityType;
  date: Date;
  details?: CareActivityDetails;
}

// ============================================================================
// TASK MANAGEMENT RECORDS
// ============================================================================

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
// USER SETTINGS AND PROFILE
// ============================================================================

export interface UserSettings {
  theme: "light" | "dark" | "system";
  units: {
    volume: VolumeUnit;
    weight: "oz" | "lbs" | "g" | "kg";
    temperature: "F" | "C";
    length: "inches" | "cm" | "ft" | "m";
  };
  defaultReminders: ReminderPreferences;
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
}

export interface UserProfile extends BaseRecord {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  settings: UserSettings;
  isFirstTimeUser: boolean;
  onboardingCompleted: boolean;
  lastActiveDate: Date;
}

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
