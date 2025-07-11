import Dexie, { Table } from "dexie";
import { v4 as uuidv4 } from "uuid";
import {
  CareActivityType,
  PlantRecord,
  VarietyRecord,
  BedRecord,
  CareActivityRecord,
  TaskBypassRecord,
  TaskCompletionRecord,
  ScheduledTask,
} from "./consolidated";
import { generateUUID } from "@/utils/cn";
import { Logger } from "@/utils/logger";

// Database class
class SmartGardenDatabase extends Dexie {
  plants!: Table<PlantRecord>;
  varieties!: Table<VarietyRecord>;
  beds!: Table<BedRecord>;
  careActivities!: Table<CareActivityRecord>;
  taskBypasses!: Table<TaskBypassRecord>;
  taskCompletions!: Table<TaskCompletionRecord>;
  scheduledTasks!: Table<ScheduledTask>;

  constructor() {
    super("SmartGardenDatabase");

    this.version(8).stores({
      plants: "++id, varietyId, isActive, plantedDate, growthRateModifier",
      varieties: "++id, &normalizedName, name, category",
      beds: "++id, name, type, isActive",
      careActivities: "++id, plantId, type, date",
      taskBypasses: "++id, taskId, plantId, taskType, bypassDate",
      scheduledTasks:
        "++id, plantId, [plantId+status], [dueDate+status], taskType",
      taskCompletions:
        "++id, plantId, taskType, [scheduledDate+actualCompletionDate], scheduledDate, actualCompletionDate",
    });
    
    this.version(7).stores({
      plants: "++id, varietyId, isActive, plantedDate, growthRateModifier",
      varieties: "++id, &normalizedName, name, category",
      careActivities: "++id, plantId, type, date",
      taskBypasses: "++id, taskId, plantId, taskType, bypassDate",
      scheduledTasks:
        "++id, plantId, [plantId+status], [dueDate+status], taskType",
      taskCompletions:
        "++id, plantId, taskType, [scheduledDate+actualCompletionDate], scheduledDate, actualCompletionDate",
    });
    
    this.version(6).stores({
      plants: "++id, varietyId, isActive, plantedDate",
      varieties: "++id, &normalizedName, name, category",
      careActivities: "++id, plantId, type, date",
      taskBypasses: "++id, taskId, plantId, taskType, bypassDate",
      scheduledTasks:
        "++id, plantId, [plantId+status], [dueDate+status], taskType",
      taskCompletions:
        "++id, plantId, taskType, scheduledDate, actualCompletionDate",
    });

    this.version(5).stores({
      plants: "++id, varietyId, isActive, plantedDate",
      varieties: "++id, &normalizedName, name, category",
      careActivities: "++id, plantId, type, date",
      taskBypasses: "++id, taskId, plantId, taskType, bypassDate",
      taskCompletions: null,
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
    const id = generateUUID();
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
      Logger.error("Failed to add plant:", error);
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
      Logger.warn(
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
      Logger.error("Failed to add variety:", error);
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
    category: string
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
    const id = generateUUID();
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
      Logger.error("Failed to add care activity:", error);
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

export const bedService = {
  async addBed(
    bed: Omit<BedRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const id = generateUUID();
    const now = new Date();
    const fullBed: BedRecord = {
      ...bed,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.beds.add(fullBed);
      return id;
    } catch (error) {
      Logger.error("Failed to add bed:", error);
      throw error;
    }
  },

  async getActiveBeds(): Promise<BedRecord[]> {
    const allBeds = await db.beds.toArray();
    return allBeds.filter((bed) => bed.isActive === true);
  },

  async getBed(id: string): Promise<BedRecord | undefined> {
    return db.beds.get(id);
  },

  async updateBed(
    id: string,
    updates: Partial<Omit<BedRecord, "id" | "createdAt">>
  ): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    await db.beds.update(id, updateData);
  },

  async deleteBed(id: string): Promise<void> {
    const updateData = { isActive: false, updatedAt: new Date() };
    await db.beds.update(id, updateData);
  },
};

// Re-export types for backward compatibility
export type {
  GrowthStage,
  CareActivityType,
  VolumeUnit,
  BaseRecord,
  PlantRecord,
  VarietyRecord,
  BedRecord,
  CareActivityRecord,
  CareActivityDetails,
  TaskBypassRecord,
  TaskCompletionRecord,
  ScheduledTask,
  CareRecord,
} from "./consolidated";