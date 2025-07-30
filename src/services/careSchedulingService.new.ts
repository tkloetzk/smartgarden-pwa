// src/services/careSchedulingService.new.ts - Instance-based version with dependency injection
import { PlantRecord, VarietyRecord } from "@/types/database";
import { GrowthStage, CareActivityType, UpcomingTask, ReminderPreferences } from "@/types";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { addDays, differenceInDays } from "date-fns";
import {
  formatDueIn,
  calculatePriority,
  ensureDateObject,
} from "@/utils/dateUtils";
import { Logger } from "@/utils/logger";
import { APP_CONFIG } from "@/config/constants";
import { 
  ICareSchedulingService, 
  IDynamicSchedulingService,
  IPlantService,
  ICareService,
  IVarietyService
} from "./interfaces";

interface TaskConfig {
  type: CareActivityType;
  taskName: string;
  category: "watering" | "fertilizing" | "observation" | "maintenance";
  dueSoonThreshold: number;
  fallbackInterval: number;
}

const TASK_CONFIGS: Record<string, TaskConfig> = {
  water: {
    type: "water",
    taskName: "Check water level",
    category: "watering",
    dueSoonThreshold: APP_CONFIG.CARE_SCHEDULING.DUE_SOON_THRESHOLD_DAYS,
    fallbackInterval: APP_CONFIG.CARE_SCHEDULING.DEFAULT_WATERING_INTERVAL_DAYS,
  },
  observe: {
    type: "observe",
    taskName: "Health check",
    category: "observation",
    dueSoonThreshold: APP_CONFIG.CARE_SCHEDULING.DUE_SOON_THRESHOLD_DAYS,
    fallbackInterval: 3,
  },
  fertilize: {
    type: "fertilize",
    taskName: "Fertilize",
    category: "fertilizing",
    dueSoonThreshold: APP_CONFIG.CARE_SCHEDULING.DUE_SOON_THRESHOLD_DAYS,
    fallbackInterval: APP_CONFIG.CARE_SCHEDULING.DEFAULT_FERTILIZING_INTERVAL_DAYS,
  },
};

const TASK_TYPE_MAP: Record<string, keyof ReminderPreferences> = {
  "Check water level": "watering",
  Water: "watering",
  Fertilize: "fertilizing",
  Observe: "observation",
  "Check lighting": "lighting",
  Prune: "pruning",
  "Health check": "observation",
};

export class CareSchedulingService implements ICareSchedulingService {
  constructor(
    private plantService: IPlantService,
    private careService: ICareService,
    private varietyService: IVarietyService,
    private dynamicSchedulingService: IDynamicSchedulingService
  ) {}

  async getUpcomingTasks(plantId?: string): Promise<UpcomingTask[]> {
    try {
      let plants: PlantRecord[];
      
      if (plantId) {
        const plant = await this.plantService.getPlant(plantId);
        plants = plant ? [plant] : [];
      } else {
        plants = await this.plantService.getActivePlants();
      }

      const allTasks: UpcomingTask[] = [];

      for (const plant of plants) {
        const plantTasks = await this.getTasksForPlant(plant.id);
        const filteredTasks = this.filterTasksByPreferences(plantTasks, plant.reminderPreferences || {});
        allTasks.push(...filteredTasks);
      }

      return allTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
      Logger.error("Error getting upcoming tasks:", error, { plantId });
      return [];
    }
  }

  async getTasksForPlant(plantId: string): Promise<UpcomingTask[]> {
    try {
      const plant = await this.plantService.getPlant(plantId);
      if (!plant) {
        Logger.warn("Plant not found", { plantId });
        return [];
      }

      const variety = await this.varietyService.getVariety(plant.varietyId);
      if (!variety) {
        Logger.warn("Variety not found for plant", { plantId, varietyId: plant.varietyId });
        return [];
      }

      const currentStage = calculateCurrentStageWithVariety(plant.plantedDate, variety);
      const tasks: UpcomingTask[] = [];

      // Generate tasks for each configured type
      for (const [taskType, _config] of Object.entries(TASK_CONFIGS)) {
        const task = await this.createTaskForType(plant, variety, currentStage, taskType as keyof typeof TASK_CONFIGS);
        if (task) {
          tasks.push(task);
        }
      }

      return tasks;
    } catch (error) {
      Logger.error(`Error processing tasks for plant`, error, { plantId });
      return [];
    }
  }

  calculateNextDueDate(
    activityType: CareActivityType,
    lastDate: Date,
    plant: PlantRecord,
    _variety: VarietyRecord
  ): Date {
    try {
      // Use configuration-based fallback interval
      const config = TASK_CONFIGS[activityType];
      const fallbackInterval = config?.fallbackInterval || APP_CONFIG.CARE_SCHEDULING.FALLBACK_INTERVAL_DAYS;
      
      // Simple calculation - in a real implementation, this would be more sophisticated
      // and would integrate with the dynamic scheduling service
      return addDays(lastDate, fallbackInterval);
    } catch (error) {
      Logger.error("Error calculating next due date", error, { activityType, plantId: plant.id });
      return addDays(new Date(), APP_CONFIG.CARE_SCHEDULING.FALLBACK_INTERVAL_DAYS);
    }
  }

  filterTasksByPreferences(tasks: UpcomingTask[], preferences: ReminderPreferences): UpcomingTask[] {
    if (!preferences || Object.keys(preferences).length === 0) {
      return tasks;
    }

    return tasks.filter((task) => {
      const preferenceKey = TASK_TYPE_MAP[task.task];
      return preferenceKey ? preferences[preferenceKey] : true;
    });
  }

  private async createTaskForType(
    plant: PlantRecord,
    _variety: VarietyRecord,
    currentStage: GrowthStage,
    taskType: keyof typeof TASK_CONFIGS
  ): Promise<UpcomingTask | null> {
    const config = TASK_CONFIGS[taskType];
    if (!config) {
      Logger.warn("Unknown task type", { taskType, plantId: plant.id });
      return null;
    }

    try {
      const nextDueDate = await this.calculateNextDueDateForTask(
        plant,
        config.type,
        config.fallbackInterval
      );

      // Only return tasks that are due soon or overdue
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
    } catch (error) {
      Logger.error("Error creating task", error, { taskType, plantId: plant.id });
      return null;
    }
  }

  private async calculateNextDueDateForTask(
    plant: PlantRecord,
    activityType: CareActivityType,
    fallbackInterval: number
  ): Promise<Date> {
    try {
      const lastActivity = await this.careService.getLastActivityByType(plant.id, activityType);

      if (lastActivity) {
        const lastActivityDate = ensureDateObject(lastActivity.date);
        // Use dynamic scheduling service for better predictions
        try {
          return await this.dynamicSchedulingService.getNextDueDateForTask(plant.id, activityType);
        } catch (dynamicError) {
          Logger.warn("Dynamic scheduling failed, using fallback", dynamicError, { 
            plantId: plant.id, 
            activityType 
          });
          return addDays(lastActivityDate, fallbackInterval);
        }
      } else {
        // No previous activity, use fallback based on planting date
        const daysSincePlanting = differenceInDays(new Date(), plant.plantedDate);
        return daysSincePlanting > fallbackInterval
          ? new Date()
          : addDays(plant.plantedDate, fallbackInterval);
      }
    } catch (error) {
      Logger.error("Error calculating next due date for task", error, { 
        plantId: plant.id, 
        activityType 
      });
      return addDays(new Date(), fallbackInterval);
    }
  }

  // Legacy support methods for backwards compatibility
  async createWateringTask(plant: PlantRecord, currentStage: GrowthStage): Promise<UpcomingTask | null> {
    const variety = await this.varietyService.getVariety(plant.varietyId);
    if (!variety) return null;
    return this.createTaskForType(plant, variety, currentStage, "water");
  }

  async createObservationTask(plant: PlantRecord, currentStage: GrowthStage): Promise<UpcomingTask | null> {
    const variety = await this.varietyService.getVariety(plant.varietyId);
    if (!variety) return null;
    return this.createTaskForType(plant, variety, currentStage, "observe");
  }
}