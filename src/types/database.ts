import Dexie, { Table } from "dexie";
import { v4 as uuidv4 } from "uuid";
import {
  GrowthStage,
  PlantCategory,
  CareActivityType,
  QualityRating,
  HealthAssessment,
  VolumeUnit,
  ApplicationMethod,
  WateringMethod,
} from "./core";
import { VarietyProtocols, GrowthTimeline } from "./protocols";

// Base record interface - single source of truth
export interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Remove TimestampedRecord - use BaseRecord instead
// Remove duplicate BaseRecord definitions

// Plant-related records
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
  reminderPreferences?: {
    watering?: boolean;
    fertilizing?: boolean;
    observation?: boolean;
    lighting?: boolean;
    pruning?: boolean;
  };
}

export interface VarietyRecord extends BaseRecord {
  name: string;
  category: PlantCategory;
  description?: string;
  growthTimeline: GrowthTimeline;
  protocols?: VarietyProtocols;
  isEverbearing?: boolean;
  productiveLifespan?: number;
  isCustom?: boolean;
}

// Unified care activity details (removing multiple versions)
export interface CareActivityDetails {
  type: CareActivityType;
  // Water details
  waterAmount?: number;
  waterUnit?: VolumeUnit;
  moistureLevel?: {
    before: number;
    after: number;
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

  // Environmental details
  temperature?: number;
  humidity?: number;
  lightLevel?: number;
  weatherConditions?: string;

  // General
  notes?: string;
}

// Single care activity record type (removing CareRecord vs CareActivityRecord duplication)
export interface CareActivityRecord extends BaseRecord {
  plantId: string;
  type: CareActivityType;
  date: Date;
  details: CareActivityDetails;
}

// Task and scheduling records
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

// Legacy type aliases for backward compatibility - remove these gradually
export type CareRecord = CareActivityRecord;
export type BypassLogRecord = TaskBypassRecord;

// Database class
class SmartGardenDatabase extends Dexie {
  plants!: Table<PlantRecord>;
  varieties!: Table<VarietyRecord>;
  careActivities!: Table<CareActivityRecord>;
  taskBypasses!: Table<TaskBypassRecord>;
  taskCompletions!: Table<TaskCompletionRecord>;
  scheduledTasks!: Table<ScheduledTask>;

  constructor() {
    super("SmartGardenDatabase");

    this.version(5).stores({
      plants: "++id, varietyId, isActive, plantedDate",
      varieties: "++id, name, category",
      careActivities: "++id, plantId, type, date",
      taskBypasses: "++id, taskId, plantId, taskType, bypassDate",
      taskCompletions:
        "++id, plantId, taskType, scheduledDate, actualCompletionDate",
      scheduledTasks:
        "++id, plantId, [plantId+status], [dueDate+status], taskType",
    });
  }
}

export const db = new SmartGardenDatabase();

// Services - ensure these are properly exported
export const plantService = {
  async addPlant(
    plant: Omit<PlantRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    const fullPlant: PlantRecord = {
      ...plant,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.plants.add(fullPlant);
      return id;
    } catch (error) {
      console.error("Failed to add plant:", error);
      throw error;
    }
  },

  async getActivePlants(): Promise<PlantRecord[]> {
    const allPlants = await db.plants.toArray();
    return allPlants.filter((plant) => plant.isActive === true);
  },

  async getPlant(id: string): Promise<PlantRecord | undefined> {
    return db.plants.get(id);
  },

  async updatePlant(
    id: string,
    updates: Partial<Omit<PlantRecord, "id" | "createdAt">>
  ): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    await db.plants.update(id, updateData);
  },

  async deletePlant(id: string): Promise<void> {
    const updateData = { isActive: false, updatedAt: new Date() };
    await db.plants.update(id, updateData);
  },
};

export const varietyService = {
  async addVariety(
    variety: Omit<VarietyRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const existingVariety = await db.varieties
      .where("name")
      .equals(variety.name)
      .first();

    if (existingVariety) {
      console.warn(
        `Variety "${variety.name}" already exists. Returning existing ID.`
      );
      return existingVariety.id;
    }

    const id = uuidv4();
    const now = new Date();
    const fullVariety: VarietyRecord = {
      ...variety,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.varieties.add(fullVariety);
      return id;
    } catch (error) {
      console.error("Failed to add variety:", error);
      throw error;
    }
  },

  async getVariety(id: string): Promise<VarietyRecord | undefined> {
    return db.varieties.get(id);
  },

  async getAllVarieties(): Promise<VarietyRecord[]> {
    return db.varieties.toArray();
  },

  async getVarietiesByCategory(
    category: PlantCategory
  ): Promise<VarietyRecord[]> {
    return db.varieties.where("category").equals(category).toArray();
  },

  async getVarietyByName(name: string): Promise<VarietyRecord | undefined> {
    return db.varieties.where("name").equals(name).first();
  },
};

export const careService = {
  async addCareActivity(
    activity: Omit<CareActivityRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    const fullActivity: CareActivityRecord = {
      ...activity,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.careActivities.add(fullActivity);
      return id;
    } catch (error) {
      console.error("Failed to add care activity:", error);
      throw error;
    }
  },

  async getLastActivityByType(
    plantId: string,
    type: CareActivityType
  ): Promise<CareActivityRecord | null> {
    const activities = await db.careActivities
      .where("plantId")
      .equals(plantId)
      .and((activity) => activity.type === type)
      .reverse()
      .sortBy("date");

    return activities.length > 0 ? activities[0] : null;
  },

  async getPlantCareHistory(plantId: string): Promise<CareActivityRecord[]> {
    return db.careActivities
      .where("plantId")
      .equals(plantId)
      .reverse()
      .sortBy("date");
  },

  async getRecentActivities(limit: number = 10): Promise<CareActivityRecord[]> {
    return db.careActivities.orderBy("date").reverse().limit(limit).toArray();
  },
};
