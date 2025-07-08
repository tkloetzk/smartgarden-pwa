// src/services/careSchedulingService.ts
import {
  plantService,
  careService,
  varietyService,
  PlantRecord,
} from "@/types/database";
import { GrowthStage, CareActivityType } from "@/types/core";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { UpcomingTask } from "@/types/scheduling";
import { addDays, differenceInDays } from "date-fns";
import { DynamicSchedulingService } from "./dynamicSchedulingService";
import {
  formatDueIn,
  calculatePriority,
  ensureDateObject,
} from "@/utils/dateUtils";

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

export class CareSchedulingService {
  public static async getUpcomingTasks(): Promise<UpcomingTask[]> {
    try {
      const plants = await plantService.getActivePlants();
      const allTasks: UpcomingTask[] = [];

      for (const plant of plants) {
        const plantTasks = await this.getTasksForPlant(plant);
        const filteredTasks = this.filterTasksByPreferences(plant, plantTasks);
        allTasks.push(...filteredTasks);
      }

      return allTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
      console.error("Error getting upcoming tasks:", error);
      return [];
    }
  }

  public static async getTasksForPlant(
    plant: PlantRecord
  ): Promise<UpcomingTask[]> {
    try {
      const variety = await varietyService.getVariety(plant.varietyId);
      if (!variety) return [];

      const currentStage = calculateCurrentStageWithVariety(
        plant.plantedDate,
        variety
      );

      const tasks: UpcomingTask[] = [];

      const wateringTask = await this.createTaskForType(
        plant,
        currentStage,
        "water"
      );
      if (wateringTask) tasks.push(wateringTask);

      const observationTask = await this.createTaskForType(
        plant,
        currentStage,
        "observe"
      );
      if (observationTask) tasks.push(observationTask);

      return tasks;
    } catch (error) {
      console.error(`Error processing tasks for plant ${plant.id}:`, error);
      return [];
    }
  }

  public static async getNextTaskForPlant(
    plantId: string
  ): Promise<UpcomingTask | null> {
    const plants = await plantService.getActivePlants();
    const plant = plants.find((p) => p.id === plantId);

    if (!plant) return null;

    const tasks = await this.getTasksForPlant(plant);
    const filteredTasks = this.filterTasksByPreferences(plant, tasks);

    return filteredTasks.length > 0 ? filteredTasks[0] : null;
  }

  private static async createTaskForType(
    plant: PlantRecord,
    currentStage: GrowthStage,
    taskType: keyof typeof TASK_CONFIGS
  ): Promise<UpcomingTask | null> {
    const config = TASK_CONFIGS[taskType];
    if (!config) return null;

    const nextDueDate = await this.calculateNextDueDate(
      plant,
      config.type,
      config.fallbackInterval
    );

    if (nextDueDate <= addDays(new Date(), config.dueSoonThreshold)) {
      const daysOverdue = differenceInDays(new Date(), nextDueDate);

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
    fallbackInterval: number
  ): Promise<Date> {
    const lastActivity = await careService.getLastActivityByType(
      plant.id,
      activityType
    );

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

  // Legacy methods for backwards compatibility
  public static async createWateringTask(
    plant: PlantRecord,
    currentStage: GrowthStage
  ): Promise<UpcomingTask | null> {
    return this.createTaskForType(plant, currentStage, "water");
  }

  public static async createObservationTask(
    plant: PlantRecord,
    currentStage: GrowthStage
  ): Promise<UpcomingTask | null> {
    return this.createTaskForType(plant, currentStage, "observe");
  }
}
