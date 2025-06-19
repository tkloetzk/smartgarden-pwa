// src/types/database.ts
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
  Volume,
  GrowthTimeline,
} from "./core";

// Comprehensive protocol interfaces to match seedVarieties.ts
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

export interface SuccessionProtocol {
  interval: number;
  method: "continuous" | "zoned" | "single";
  harvestMethod: "cut-and-come-again" | "single-harvest" | "selective";
  productiveWeeks?: number;
  notes?: string[];
}

// Comprehensive plant protocols interface
export interface PlantProtocols {
  lighting?: StageSpecificLightingProtocol;
  watering?: StageSpecificWateringProtocol;
  fertilization?: StageSpecificFertilizationProtocol;
  environment?: EnvironmentalProtocol;
  soilMixture?: SoilMixture;
  container?: ContainerRequirements;
  succession?: SuccessionProtocol;
  specialRequirements?: string[];
}

// Legacy protocol interfaces for backward compatibility
export interface WateringProtocol {
  frequency: string;
  moistureTrigger: {
    triggerLevel: number;
    targetLevel: number;
    scale: "1-10" | "visual";
  };
  amount: Volume;
  method?: WateringMethod;
  notes: string[];
}

export interface LightingProtocol {
  ppfd: {
    min: number;
    max: number;
    optimal?: number;
  };
  photoperiod: {
    hours: number;
    maxHours?: number;
    minHours?: number;
  };
  dli: {
    min: number;
    max: number;
  };
}

export interface FertilizationProtocol {
  timing: {
    description: string;
    daysFromStart?: number;
    frequency?: string;
  };
  fertilizer: {
    product: string;
    type?: string;
    npkRatio?: string;
  };
  application: {
    dilution: string;
    amount: string;
    method: ApplicationMethod;
  };
}

// Care activity detail types - using discriminated unions
export interface WateringDetails {
  type: "water";
  amount: string;
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

// Main database record interfaces
export interface PlantRecord extends BaseRecord {
  varietyId: string;
  varietyName: string;
  name?: string;
  plantedDate: Date;
  currentStage: GrowthStage;
  location: string;
  container: string;
  soilMix?: string;
  isActive: boolean;
  notes?: string[];
}

// src/types/database.ts - Add the missing fields
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
  isEverbearing?: boolean; // ← ADD THIS
  productiveLifespan?: number; // ← ADD THIS
}

export interface CareRecord extends TimestampedRecord {
  plantId: string;
  type: CareActivityType;
  date: Date;
  details: CareActivityDetails;
}

export interface SyncQueueRecord {
  id: string;
  table: "plants" | "varieties" | "careActivities";
  operation: "create" | "update" | "delete";
  recordId: string;
  data?: string;
  timestamp: Date;
  synced: boolean;
  retryCount?: number;
}

class SmartGardenDatabase extends Dexie {
  plants!: Table<PlantRecord>;
  varieties!: Table<VarietyRecord>;
  careActivities!: Table<CareRecord>;
  syncQueue!: Table<SyncQueueRecord>;

  constructor() {
    super("SmartGardenDB");

    this.version(1).stores({
      plants: "id, varietyId, plantedDate, currentStage, isActive, location",
      varieties: "id, name, category",
      careActivities: "id, plantId, type, date",
      syncQueue: "id, table, timestamp, synced",
    });
  }

  async addToSyncQueue(
    table: SyncQueueRecord["table"],
    operation: SyncQueueRecord["operation"],
    recordId: string,
    data?: unknown
  ): Promise<void> {
    try {
      await this.syncQueue.add({
        id: uuidv4(),
        table,
        operation,
        recordId,
        data: data ? JSON.stringify(data) : undefined,
        timestamp: new Date(),
        synced: false,
      });
    } catch (error) {
      console.warn("Failed to add to sync queue:", error);
    }
  }
}

export const db = new SmartGardenDatabase();

// Services remain largely the same but with updated types
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

    await db.plants.add(fullPlant);
    await db.addToSyncQueue("plants", "create", id, fullPlant);
    return id;
  },

  async getActivePlants(): Promise<PlantRecord[]> {
    // Use memory filtering to avoid Dexie boolean indexing issues
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
    await db.addToSyncQueue("plants", "update", id, updateData);
  },

  async deletePlant(id: string): Promise<void> {
    const updateData = { isActive: false, updatedAt: new Date() };
    await db.plants.update(id, updateData);
    await db.addToSyncQueue("plants", "delete", id, updateData);
  },
};

export const varietyService = {
  async addVariety(
    variety: Omit<VarietyRecord, "id" | "createdAt"> // Remove createdAt from required input
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
    const fullVariety: VarietyRecord = {
      ...variety,
      id,
      createdAt: new Date(), // Add createdAt here automatically
    };

    await db.varieties.add(fullVariety);
    await db.addToSyncQueue("varieties", "create", id, fullVariety);
    return id;
  },

  async getAllVarieties(): Promise<VarietyRecord[]> {
    return db.varieties.toArray();
  },

  async getVariety(id: string): Promise<VarietyRecord | undefined> {
    return db.varieties.get(id);
  },

  async getVarietyByName(name: string): Promise<VarietyRecord | undefined> {
    return db.varieties.where("name").equals(name).first();
  },
};

export const careService = {
  async addCareActivity(
    activity: Omit<CareRecord, "id" | "createdAt">
  ): Promise<string> {
    const id = uuidv4();
    const fullActivity: CareRecord = {
      ...activity,
      id,
      createdAt: new Date(),
    };

    await db.careActivities.add(fullActivity);
    await db.addToSyncQueue("careActivities", "create", id, fullActivity);
    return id;
  },

  async getLastCareActivityByType(
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
