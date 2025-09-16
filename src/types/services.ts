/**
 * Service Interface Types
 * 
 * Interface definitions for all services, including scheduling, care management,
 * and data services. These define the contracts that service implementations must follow.
 */

import { 
  CareActivityType, 
  GrowthStage,
  PlantCategory 
} from "./core";
import { 
  PlantRecord, 
  VarietyRecord, 
  CareActivityRecord,
  ScheduledTask
} from "./records";
import { 
  ReminderPreferences, 
  UpcomingTask
} from "./protocols";

// ============================================================================
// ANALYSIS AND PATTERN TYPES
// ============================================================================

export interface CompletionPattern {
  averageVariance: number;
  consistency: number;
  recommendedAdjustment: number;
  totalCompletions: number;
  lastCompletion?: Date;
}

export interface SchedulingAdjustment {
  plantId: string;
  taskType: CareActivityType;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  confidence: number;
}

export interface MissedOpportunity {
  plantId: string;
  plantName: string;
  activityType: CareActivityType;
  lastPerformed?: Date;
  daysSinceLastActivity: number;
  stageDuringMiss: GrowthStage;
  impactAssessment: "low" | "medium" | "high" | "critical";
  recoveryRecommendation: string;
  automationSuggestion?: string;
}

export interface PartialWateringAnalysis {
  plantId: string;
  totalVolume: number;
  scheduledVolume: number;
  percentageGiven: number;
  remainingAmount: number;
  isComplete: boolean;
  notes?: string;
}

export interface BulkActivityData {
  plantIds: string[];
  activityType: CareActivityType;
  date: Date;
  details: Record<string, any>;
  groupIdentifier?: string;
}

export interface SectionPlants {
  sectionKey: string;
  location?: string;
  container?: string;
  section?: string;
  plants: PlantRecord[];
  varietyCount: number;
  varieties: string[];
}

export interface SectionApplyOption {
  sectionKey: string;
  plantCount: number;
  varieties: string[];
  location?: string;
  container?: string;
  section?: string;
  hasVarietyMix: boolean;
  displayText?: string;
}

export interface BulkCareResult {
  successful: string[];
  failed: Array<{
    plantId: string;
    error: string;
  }>;
  totalProcessed: number;
  activityIds: string[];
}

// ============================================================================
// GROUPING AND ORGANIZATION TYPES
// ============================================================================

export interface GroupedCareActivity {
  type: CareActivityType;
  date: Date;
  count: number;
  details: string;
  plantIds: string[];
  activities: CareActivityRecord[];
}

export type CareActivityDisplayItem = CareActivityRecord | GroupedCareActivity;

export interface ContainerGroup {
  container: string;
  plants: PlantRecord[];
  count: number;
  needsWatering: number;
  needsFertilizing: number;
  recentlyHarvested: number;
}

export interface PlantGroup {
  variety: string;
  category: PlantCategory;
  plants: PlantRecord[];
  avgAge: number;
  nextCareDate?: Date;
  careStatus: "on-track" | "needs-attention" | "overdue";
}

// ============================================================================
// UI AND UTILITY SERVICE TYPES
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

export interface QuickCompletionValues {
  amount?: string;
  product?: string;
  dilution?: string;
  method?: string;
  notes?: string;
}

export interface SmartDefaults {
  watering: Record<string, QuickCompleteOption[]>;
  fertilization: Record<string, QuickCompleteOption[]>;
  observation: Record<string, QuickCompleteOption[]>;
}

export interface GrowthStageInfo {
  stage: GrowthStage;
  displayName: string;
  description: string;
  expectedDuration: number;
  keyActivities: CareActivityType[];
  nextStage?: GrowthStage;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export interface ParsedDilution {
  numerator: number;
  denominator: number;
  ratio: number;
}

export interface ParsedAmount {
  value: number;
  unit: string;
  rawText: string;
}

// ============================================================================
// CARE SCHEDULING SERVICE INTERFACE
// ============================================================================

export interface ICareSchedulingService {
  calculateNextDueDate(
    activityType: CareActivityType,
    lastDate: Date,
    plant: PlantRecord,
    variety: VarietyRecord
  ): Date;
  getUpcomingTasks(plantId?: string): Promise<UpcomingTask[]>;
  filterTasksByPreferences(tasks: UpcomingTask[], preferences: ReminderPreferences): UpcomingTask[];
  getTasksForPlant(plantId: string): Promise<UpcomingTask[]>;
}

// ============================================================================
// DYNAMIC SCHEDULING SERVICE INTERFACE
// ============================================================================

export interface IDynamicSchedulingService {
  recordTaskCompletion(
    plantId: string,
    taskType: CareActivityType,
    scheduledDate: Date,
    actualCompletionDate: Date,
    careActivityId: string,
    plantStage: GrowthStage
  ): Promise<void>;
  getCompletionPatterns(plantId: string, taskType: CareActivityType): Promise<CompletionPattern>;
  getNextDueDateForTask(plantId: string, taskType: CareActivityType): Promise<Date>;
  getAdjustmentRecommendations(plantId: string): Promise<SchedulingAdjustment[]>;
}

// ============================================================================
// DATABASE SERVICE INTERFACES
// ============================================================================

export interface IPlantService {
  addPlant(plant: Omit<PlantRecord, "id" | "createdAt" | "updatedAt">): Promise<string>;
  getActivePlants(): Promise<PlantRecord[]>;
  getPlant(id: string): Promise<PlantRecord | undefined>;
  updatePlant(id: string, updates: Partial<Omit<PlantRecord, "id" | "createdAt">>): Promise<void>;
  deletePlant(id: string): Promise<void>;
}

export interface ICareService {
  addCareActivity(activity: Omit<CareActivityRecord, "id" | "createdAt" | "updatedAt">): Promise<string>;
  getLastActivityByType(plantId: string, type: CareActivityType): Promise<CareActivityRecord | null>;
  getPlantCareHistory(plantId: string): Promise<CareActivityRecord[]>;
  getRecentActivities(limit?: number): Promise<CareActivityRecord[]>;
}

export interface IVarietyService {
  addVariety(variety: Omit<VarietyRecord, "id" | "createdAt" | "updatedAt" | "normalizedName">): Promise<string>;
  getVariety(id: string): Promise<VarietyRecord | undefined>;
  getAllVarieties(): Promise<VarietyRecord[]>;
  getVarietiesByCategory(category: string): Promise<VarietyRecord[]>;
  getVarietyByName(name: string): Promise<VarietyRecord | undefined>;
}

// ============================================================================
// TASK MANAGEMENT SERVICE INTERFACES
// ============================================================================

export interface TaskGenerationOptions {
  includeWatering?: boolean;
  includeFertilization?: boolean;
  includePruning?: boolean;
  includeHarvest?: boolean;
  includeObservation?: boolean;
  startDate?: Date;
  endDate?: Date;
  plantIds?: string[];
}

export interface ITaskManagementService {
  generateTasksForPlant(plantId: string, options?: TaskGenerationOptions): Promise<ScheduledTask[]>;
  getUpcomingTasks(daysAhead?: number): Promise<ScheduledTask[]>;
  completeTask(taskId: string, careActivityId: string): Promise<void>;
  bypassTask(taskId: string, reason: string): Promise<void>;
  rescheduleTask(taskId: string, newDate: Date): Promise<void>;
}
