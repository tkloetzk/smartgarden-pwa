import Dexie, { Table } from "dexie";
import { v4 as uuidv4 } from "uuid";
import {
  GrowthStage,
  PlantCategory,
  CareActivityType,
  QualityRating,
  HealthAssessment,
  ApplicationMethod,
  WateringMethod,
  BaseRecord,
  TimestampedRecord,
  MoistureReading,
  GrowthTimeline,
} from "./core";

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
    products?: {
      name: string;
      dilution: string;
      amount: string;
      frequency: string;
      method?: "soil-drench" | "foliar-spray" | "top-dress" | "mix-in-soil";
    }[];
    timing?: string;
    specialInstructions?: string[];
    notes?: string[];
  };
}

export interface EnvironmentalProtocol {
  temperature?: {
    min: number;
    max: number;
    optimal?: number;
    unit: "F" | "C";
    criticalMax?: number;
    criticalMin?: number;
    stage?: string;
  };
  humidity?: {
    min: number;
    max: number;
    optimal?: number;
    unit: "%";
    criticalForStage?: string;
  };
  pH?: {
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
    [component: string]: number;
  };
  amendments?: {
    [amendment: string]: string;
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

export interface PlantProtocols {
  watering?: StageSpecificWateringProtocol;
  lighting?: StageSpecificLightingProtocol;
  fertilization?: StageSpecificFertilizationProtocol;
  environment?: EnvironmentalProtocol;
  soilMixture?: SoilMixture;
  container?: ContainerRequirements;
  specialRequirements?: string[];
}
export interface WaterAmount {
  value: number;
  unit: "oz" | "ml" | "cups" | "gallons" | "liters";
}

export interface WateringDetails {
  type: "water";
  amount: WaterAmount;
  moistureReading?: MoistureReading;
  method?: WateringMethod;
  runoffObserved?: boolean;
  notes?: string;
}

export interface FertilizingDetails {
  type: "fertilize";
  product: string;
  dilution: string;
  amount: string;
  method?: ApplicationMethod;
  notes?: string;
}

export interface ObservationDetails {
  type: "observe";
  healthAssessment: HealthAssessment;
  observations: string;
  photos?: string[];
  notes?: string;
}

export interface HarvestDetails {
  type: "harvest";
  amount: string;
  quality: QualityRating;
  method?: string;
  notes?: string;
}

export interface TransplantDetails {
  type: "transplant";
  fromContainer: string;
  toContainer: string;
  reason: string;
  notes?: string;
}

export type CareActivityDetails =
  | WateringDetails
  | FertilizingDetails
  | ObservationDetails
  | HarvestDetails
  | TransplantDetails;

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
    watering: boolean;
    fertilizing: boolean;
    observation: boolean;
    lighting: boolean;
    pruning: boolean;
  };
}

export interface VarietyRecord extends TimestampedRecord {
  name: string;
  category: PlantCategory;
  growthTimeline: GrowthTimeline;
  protocols?: PlantProtocols;
  moistureProtocols?: {
    [key in GrowthStage]?: {
      trigger: {
        min: number;
        max: number;
      };
      target: {
        min: number;
        max: number;
      };
    };
  };
  isCustom?: boolean;
  isEverbearing?: boolean;
  productiveLifespan?: number;
}

export interface CareRecord extends BaseRecord {
  plantId: string;
  type: CareActivityType;
  date: Date;
  details: CareActivityDetails;
  updatedAt: Date;
}

export interface BypassLogRecord {
  id?: string;
  taskId: string;
  plantId: string;
  taskType: CareActivityType;
  reason: string;
  bypassedAt: Date;
  plantStage: GrowthStage;
  dueDate: Date;
  moistureLevel?: number;
  weatherConditions?: string;
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

export interface BypassEntry {
  id: string;
  taskId: string;
  plantId: string;
  taskType: CareActivityType;
  reason: string;
  bypassedAt: Date;
  plantStage: GrowthStage;
  dueDate: Date;
  moistureLevel?: number;
  weatherConditions?: string;
}

export interface CareActivityRecord extends BaseRecord {
  plantId: string;
  type: CareActivityType;
  date: Date;
  details: CareActivityDetails;
}

// Dexie Database class
class SmartGardenDatabase extends Dexie {
  plants!: Table<PlantRecord>;
  varieties!: Table<VarietyRecord>;
  careActivities!: Table<CareActivityRecord>;
  bypassLog!: Table<BypassLogRecord>;
  taskBypasses!: Table<TaskBypassRecord>;
  taskCompletions!: Table<TaskCompletionRecord>;

  constructor() {
    super("SmartGardenDatabase");

    this.version(3).stores({
      plants: "++id, varietyId, isActive, plantedDate",
      varieties: "++id, name, category",
      careActivities: "++id, plantId, type, date",
      bypassLog: "++id, plantId, taskType, bypassedAt",
      taskBypasses: "++id, taskId, plantId, taskType, bypassDate",
      taskCompletions:
        "++id, plantId, taskType, scheduledDate, actualCompletionDate",
    });

    // Version 4: Remove sync queue
    this.version(4).stores({
      plants: "++id, varietyId, isActive, plantedDate",
      varieties: "++id, name, category",
      careActivities: "++id, plantId, type, date",
      bypassLog: "++id, plantId, taskType, bypassedAt",
      taskBypasses: "++id, taskId, plantId, taskType, bypassDate",
      taskCompletions:
        "++id, plantId, taskType, scheduledDate, actualCompletionDate",
    });
  }
}

export const db = new SmartGardenDatabase();

// Plant service
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

// Variety service
export const varietyService = {
  async addVariety(
    variety: Omit<VarietyRecord, "id" | "createdAt">
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
    };

    try {
      await db.varieties.add(fullVariety);
      return id;
    } catch (error) {
      console.error("Failed to add variety:", error);
      throw error;
    }
  },
  async getVarietyByName(name: string): Promise<VarietyRecord | undefined> {
    return db.varieties.where("name").equals(name).first();
  },
  async getUniqueVarieties(): Promise<VarietyRecord[]> {
    const allVarieties = await db.varieties.toArray();

    // Remove duplicates by name, keeping the first occurrence
    const uniqueVarieties = allVarieties.filter(
      (variety, index, self) =>
        index === self.findIndex((v) => v.name === variety.name)
    );

    return uniqueVarieties;
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
};

// Care service
export const careService = {
  async addCareActivity(
    activity: Omit<CareRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();
    const fullActivity: CareRecord = {
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
  ): Promise<CareRecord | null> {
    const activities = await db.careActivities
      .where("plantId")
      .equals(plantId)
      .and((activity) => activity.type === type)
      .reverse()
      .sortBy("date");

    return activities.length > 0 ? activities[0] : null;
  },

  async getPlantCareHistory(plantId: string): Promise<CareRecord[]> {
    return db.careActivities
      .where("plantId")
      .equals(plantId)
      .reverse()
      .sortBy("date");
  },

  async getRecentActivities(limit: number = 10): Promise<CareRecord[]> {
    return db.careActivities.orderBy("date").reverse().limit(limit).toArray();
  },
};
