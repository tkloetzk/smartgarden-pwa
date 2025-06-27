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
  normalizedName: string; // Add this field for case-insensitive unique index
  category: PlantCategory;
  description?: string;
  growthTimeline: GrowthTimeline;
  protocols?: VarietyProtocols;
  isEverbearing?: boolean;
  productiveLifespan?: number;
  isCustom?: boolean;
}

export interface CareActivityDetails {
  type: CareActivityType;
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
      varieties: "++id, &normalizedName, name, category", // The '&' makes normalizedName a unique index
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
  // [addVariety method remains the same]...
  async addVariety(
    variety: Omit<
      VarietyRecord,
      "id" | "createdAt" | "updatedAt" | "normalizedName"
    >
  ): Promise<string> {
    const normalizedName = variety.name.toLowerCase();
    const existingVariety = await db.varieties
      .where("normalizedName")
      .equals(normalizedName)
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
      normalizedName,
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
    const allVarieties = await db.varieties.toArray();
    const uniqueVarieties = new Map<string, VarietyRecord>();

    for (const variety of allVarieties) {
      // Use the normalizedName field for case-insensitive checking
      const normalizedName =
        variety.normalizedName || variety.name.toLowerCase();
      if (!uniqueVarieties.has(normalizedName)) {
        uniqueVarieties.set(normalizedName, variety);
      }
    }

    const sortedVarieties = Array.from(uniqueVarieties.values());
    sortedVarieties.sort((a, b) => a.name.localeCompare(b.name));

    return sortedVarieties;
  },

  async getVarietiesByCategory(
    category: PlantCategory
  ): Promise<VarietyRecord[]> {
    return db.varieties.where("category").equals(category).toArray();
  },

  async getVarietyByName(name: string): Promise<VarietyRecord | undefined> {
    const normalizedName = name.toLowerCase();
    return db.varieties.where("normalizedName").equals(normalizedName).first();
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
