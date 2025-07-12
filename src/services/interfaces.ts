// Service interfaces for dependency injection
import { PlantRecord, VarietyRecord, CareActivityRecord } from "@/types/database";
import { UpcomingTask, CareActivityType, GrowthStage, ReminderPreferences } from "@/types";

// Import types from the service implementations
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

// Care Scheduling Service Interface
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

// Dynamic Scheduling Service Interface
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

// Database Service Interfaces (for the existing services)
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

// Service Keys (constants for service registration)
export const SERVICE_KEYS = {
  CARE_SCHEDULING: 'CareSchedulingService',
  DYNAMIC_SCHEDULING: 'DynamicSchedulingService',
  PLANT_SERVICE: 'PlantService',
  CARE_SERVICE: 'CareService',
  VARIETY_SERVICE: 'VarietyService',
} as const;

// Dependency Injection Container
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, unknown> = new Map();
  private singletons: Map<string, unknown> = new Map();

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  // Register a service factory (for dependency injection)
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  // Register a singleton instance
  registerSingleton<T>(key: string, instance: T): void {
    this.singletons.set(key, instance);
  }

  // Get service instance (creates new instance each time unless singleton)
  get<T>(key: string): T {
    // Check for singleton first
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }

    // Check for factory
    const factory = this.services.get(key) as (() => T) | undefined;
    if (!factory) {
      throw new Error(`Service ${key} not registered`);
    }

    return factory();
  }

  // Get singleton (creates and caches if not exists)
  getSingleton<T>(key: string): T {
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }

    const factory = this.services.get(key) as (() => T) | undefined;
    if (!factory) {
      throw new Error(`Service ${key} not registered`);
    }

    const instance = factory();
    this.singletons.set(key, instance);
    return instance;
  }

  // Clear all services (useful for testing)
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  // Check if service is registered
  has(key: string): boolean {
    return this.services.has(key) || this.singletons.has(key);
  }
}

// Convenience function to get container instance
export const container = ServiceContainer.getInstance();

// Service injection decorators/helpers
export function inject<T>(serviceKey: string): T {
  return container.get<T>(serviceKey);
}

export function injectSingleton<T>(serviceKey: string): T {
  return container.getSingleton<T>(serviceKey);
}