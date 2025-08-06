// src/services/firebaseCareSchedulingService.ts
import { PlantRecord } from "@/types/database";
import { GrowthStage, CareActivityType, UpcomingTask } from "@/types";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { addDays, differenceInDays } from "date-fns";
import { DynamicSchedulingService } from "./dynamicSchedulingService";
import {
  formatDueIn,
  calculatePriority,
  ensureDateObject,
} from "@/utils/dateUtils";
import { Logger } from "@/utils/logger";
import { seedVarieties, SeedVariety } from "@/data/seedVarieties";
import { CareRecord } from "@/types";

interface TaskConfig {
  type: CareActivityType;
  taskName: string;
  category: "watering" | "fertilizing" | "observation" | "maintenance";
  dueSoonThreshold: number; // days
  fallbackInterval: number; // days for new plants
}

const TASK_CONFIGS: Record<string, TaskConfig> = {
  water: {
    type: "water",
    taskName: "Check water level",
    category: "watering",
    dueSoonThreshold: 2,
    fallbackInterval: 1,
  },
  observe: {
    type: "observe",
    taskName: "Health check",
    category: "observation",
    dueSoonThreshold: 1,
    fallbackInterval: 3,
  },
};

const TASK_TYPE_MAP: Record<
  string,
  keyof NonNullable<PlantRecord["reminderPreferences"]>
> = {
  "Check water level": "watering",
  Water: "watering",
  Fertilize: "fertilizing",
  Observe: "observation",
  "Check lighting": "lighting",
  Prune: "pruning",
  "Health check": "observation",
};

export class FirebaseCareSchedulingService {
  /**
   * Get upcoming tasks using Firebase plant and activity data
   */
  public static async getUpcomingTasks(
    plants: PlantRecord[],
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask[]> {
    try {
      const allTasks: UpcomingTask[] = [];

      for (const plant of plants) {
        const plantTasks = await this.getTasksForPlant(plant, getLastActivityByType);
        const filteredTasks = this.filterTasksByPreferences(plant, plantTasks);
        allTasks.push(...filteredTasks);
      }
      return allTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
      Logger.error("Error getting upcoming tasks:", error);
      console.error("❌ Firebase care scheduling error:", error);
      return [];
    }
  }

  /**
   * Get next task for a specific plant
   */
  public static async getNextTaskForPlant(
    plant: PlantRecord,
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask | null> {
    const tasks = await this.getTasksForPlant(plant, getLastActivityByType);
    const filteredTasks = this.filterTasksByPreferences(plant, tasks);

    return filteredTasks.length > 0 ? filteredTasks[0] : null;
  }

  private static async getTasksForPlant(
    plant: PlantRecord,
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask[]> {
    try {
      // Find variety by name in seed data instead of IndexedDB lookup
      const seedVariety = seedVarieties.find((v: SeedVariety) => v.name === plant.varietyName);
      
      if (!seedVariety) {
        console.warn(`No variety found for ${plant.varietyName}`);
        return [];
      }

      // Convert SeedVariety to VarietyRecord format for compatibility
      const variety = {
        id: plant.varietyId || 'seed-variety',
        name: seedVariety.name,
        normalizedName: seedVariety.name.toLowerCase(),
        category: seedVariety.category,
        description: undefined,
        growthTimeline: {
          germination: seedVariety.growthTimeline.germination || 14,
          seedling: seedVariety.growthTimeline.seedling || 14,
          vegetative: seedVariety.growthTimeline.vegetative || 28,
          maturation: seedVariety.growthTimeline.maturation || 56,
          rootDevelopment: seedVariety.growthTimeline.rootDevelopment
        },
        protocols: seedVariety.protocols,
        isEverbearing: seedVariety.isEverbearing,
        productiveLifespan: seedVariety.productiveLifespan,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const currentStage = calculateCurrentStageWithVariety(
        plant.plantedDate,
        variety
      );

      const tasks: UpcomingTask[] = [];

      const wateringTask = await this.createTaskForType(
        plant,
        currentStage,
        "water",
        getLastActivityByType
      );
      if (wateringTask) tasks.push(wateringTask);

      const observationTask = await this.createTaskForType(
        plant,
        currentStage,
        "observe",
        getLastActivityByType
      );
      if (observationTask) tasks.push(observationTask);
      return tasks;
    } catch (error) {
      console.error(`❌ Error processing tasks for plant ${plant.id}:`, error);
      Logger.error(`Error processing tasks for plant ${plant.id}:`, error);
      return [];
    }
  }

  private static async createTaskForType(
    plant: PlantRecord,
    currentStage: GrowthStage,
    taskType: keyof typeof TASK_CONFIGS,
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask | null> {
    const config = TASK_CONFIGS[taskType];
    if (!config) return null;

    const nextDueDate = await this.calculateNextDueDate(
      plant,
      config.type,
      config.fallbackInterval,
      getLastActivityByType
    );

    const today = new Date();
    let thresholdDays = config.dueSoonThreshold;
    
    // For watering tasks, check if last watering was partial and extend threshold
    if (taskType === "water") {
      const lastActivity = await getLastActivityByType(plant.id, "water");
      if (lastActivity?.details.isPartialWatering) {
        thresholdDays = 7; // Show partial watering follow-up tasks for up to a week
      }
    }
    
    const thresholdDate = addDays(today, thresholdDays);
    
    // Create task if it's due today/overdue OR within the threshold
    if (nextDueDate <= thresholdDate) {
      const daysOverdue = differenceInDays(today, nextDueDate);
      
      return {
        id: `${taskType}-${plant.id}`,
        plantId: plant.id,
        plantName: getPlantDisplayName(plant),
        task: config.taskName,
        type: taskType,
        dueIn: formatDueIn(nextDueDate),
        priority: calculatePriority(daysOverdue),
        plantStage: currentStage,
        dueDate: nextDueDate,
        category: config.category,
        canBypass: true,
      };
    }
    return null;
  }

  private static async calculateNextDueDate(
    plant: PlantRecord,
    activityType: CareActivityType,
    fallbackInterval: number,
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<Date> {
    const lastActivity = await getLastActivityByType(plant.id, activityType);

    if (lastActivity) {
      const lastActivityDate = ensureDateObject(lastActivity.date);
      return await DynamicSchedulingService.getNextDueDateForTask(
        plant.id,
        activityType,
        lastActivityDate
      );
    } else {
      const daysSincePlanting = differenceInDays(new Date(), plant.plantedDate);
      return daysSincePlanting > fallbackInterval
        ? new Date()
        : addDays(plant.plantedDate, fallbackInterval);
    }
  }

  private static filterTasksByPreferences(
    plant: PlantRecord,
    tasks: UpcomingTask[]
  ): UpcomingTask[] {
    if (!plant.reminderPreferences) return tasks;

    return tasks.filter((task) => {
      const preferenceKey = TASK_TYPE_MAP[task.task];
      return preferenceKey ? plant.reminderPreferences![preferenceKey] : true;
    });
  }
}