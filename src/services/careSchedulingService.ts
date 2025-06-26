// src/services/careSchedulingService.ts
import {
  plantService,
  careService,
  varietyService,
  PlantRecord,
} from "@/types/database";
import { CareActivityType, GrowthStage } from "@/types/core";
import {
  calculateCurrentStage,
  calculateCurrentStageWithVariety,
} from "@/utils/growthStage";
import { getPlantDisplayName } from "@/utils/plantDisplay"; // Add this import
import { UpcomingTask } from "@/types/scheduling";
import { addDays, differenceInDays } from "date-fns";
import { DynamicSchedulingService } from "./dynamicSchedulingService";

export class CareSchedulingService {
  static async getUpcomingTasks(): Promise<UpcomingTask[]> {
    try {
      const plants = await plantService.getActivePlants();
      const allTasks: UpcomingTask[] = [];

      for (const plant of plants) {
        const plantTasks = await this.getTasksForPlant(plant);

        // Filter tasks based on reminder preferences
        const filteredTasks = plantTasks.filter((task) => {
          if (!plant.reminderPreferences) return true; // Show all if no preferences set

          // Map task types to preference keys
          const taskTypeMap: Record<
            string,
            keyof typeof plant.reminderPreferences
          > = {
            "Check water level": "watering",
            Water: "watering",
            Fertilize: "fertilizing",
            Observe: "observation",
            "Check lighting": "lighting",
            Prune: "pruning",
            "Health check": "observation",
          };

          const preferenceKey = taskTypeMap[task.task];
          return preferenceKey
            ? plant.reminderPreferences[preferenceKey]
            : true;
        });

        allTasks.push(...filteredTasks);
      }

      return allTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
      console.error("Error getting upcoming tasks:", error);
      return [];
    }
  }

  private static async getTasksForPlant(
    plant: PlantRecord
  ): Promise<UpcomingTask[]> {
    try {
      const variety = await varietyService.getVariety(plant.varietyId);
      if (!variety) return [];

      // Update plant stage if needed
      const currentStage = calculateCurrentStageWithVariety(
        plant.plantedDate,
        variety
      );

      const tasks: UpcomingTask[] = [];

      // Check for watering task
      const wateringTask = await this.createWateringTask(plant, currentStage);
      if (wateringTask) tasks.push(wateringTask);

      // Check for observation task
      const observationTask = await this.createObservationTask(
        plant,
        currentStage
      );
      if (observationTask) tasks.push(observationTask);

      return tasks;
    } catch (error) {
      console.error(`Error processing tasks for plant ${plant.id}:`, error);
      return [];
    }
  }

  private static async createWateringTask(
    plant: PlantRecord,
    currentStage: GrowthStage
  ): Promise<UpcomingTask | null> {
    const lastWatering = await careService.getLastActivityByType(
      plant.id,
      "water"
    );

    // Define watering intervals by growth stage (in days)
    const wateringIntervals: Record<GrowthStage, number> = {
      germination: 1,
      seedling: 2,
      vegetative: 3,
      flowering: 2,
      fruiting: 2,
      maturation: 3,
      harvest: 4,
      "ongoing-production": 2,
    };

    const intervalDays = wateringIntervals[currentStage] || 3;

    let nextDueDate: Date;

    if (lastWatering) {
      nextDueDate = addDays(lastWatering.date, intervalDays);
    } else {
      // For new plants, base on planting date if more than 1 day old
      const daysSincePlanting = differenceInDays(new Date(), plant.plantedDate);
      nextDueDate =
        daysSincePlanting > 1 ? new Date() : addDays(plant.plantedDate, 1);
    }

    // Only create task if it's due within the next 2 days
    if (nextDueDate <= addDays(new Date(), 2)) {
      // Calculate how overdue this task is
      const daysOverdue = differenceInDays(new Date(), nextDueDate);

      return {
        id: `water-${plant.id}`,
        plantId: plant.id,
        plantName: getPlantDisplayName(plant),
        task: "Check water level",
        type: "water", // Fix: Added missing 'type' property
        dueIn: this.formatDueIn(nextDueDate),
        priority: this.calculatePriority(daysOverdue),
        plantStage: currentStage,
        dueDate: nextDueDate,
        canBypass: true,
      };
    }

    return null;
  }

  private static async createObservationTask(
    plant: PlantRecord,
    currentStage: GrowthStage
  ): Promise<UpcomingTask | null> {
    const lastObservation = await careService.getLastActivityByType(
      plant.id,
      "observe"
    );

    // Observation every 7 days
    const observationInterval = 7;

    let nextDueDate: Date;

    if (lastObservation) {
      nextDueDate = addDays(lastObservation.date, observationInterval);
    } else {
      // First observation should be 3 days after planting
      nextDueDate = addDays(plant.plantedDate, 3);
    }

    // Only create task if it's due within the next day
    if (nextDueDate <= addDays(new Date(), 1)) {
      // Calculate how overdue this task is
      const daysOverdue = differenceInDays(new Date(), nextDueDate);

      return {
        id: `observe-${plant.id}`,
        plantId: plant.id,
        plantName: getPlantDisplayName(plant),
        task: "Health check",
        type: "observe", // Fix: Added missing 'type' property
        dueIn: this.formatDueIn(nextDueDate),
        priority: this.calculatePriority(daysOverdue),
        plantStage: currentStage,
        dueDate: nextDueDate,
        canBypass: true,
      };
    }

    return null;
  }

  static async getTasksForPlantWithDynamicScheduling(
    plant: PlantRecord
  ): Promise<UpcomingTask[]> {
    try {
      const variety = await varietyService.getVariety(plant.varietyId);
      if (!variety) return [];

      const tasks: UpcomingTask[] = [];
      const currentStage = calculateCurrentStage(
        plant.plantedDate,
        variety.growthTimeline
      );

      const protocolIntervals = {
        water: 3,
        fertilize: 14,
        observe: 7,
      };

      for (const [taskType, protocolInterval] of Object.entries(
        protocolIntervals
      )) {
        const nextDueDate =
          await DynamicSchedulingService.getNextDueDateForTask(
            plant.id,
            taskType as CareActivityType,
            new Date(protocolInterval)
          );

        const daysUntilDue = differenceInDays(nextDueDate, new Date());
        const priority =
          daysUntilDue < 0 ? "high" : daysUntilDue === 0 ? "medium" : "low";

        tasks.push({
          id: `${plant.id}-${taskType}`,
          plantId: plant.id,
          plantName: getPlantDisplayName(plant),
          task: this.getTaskName(taskType as CareActivityType),
          type: taskType as CareActivityType, // Fix: Added missing 'type' property
          dueIn: this.formatDueIn(nextDueDate),
          plantStage: currentStage,
          dueDate: nextDueDate,
          priority,
          canBypass: true,
        });
      }

      return tasks;
    } catch (error) {
      console.error("Failed to get tasks for plant:", error);
      return [];
    }
  }

  private static getTaskName(taskType: CareActivityType): string {
    switch (taskType) {
      case "water":
        return "Check water level";
      case "fertilize":
        return "Fertilize";
      case "observe":
        return "Health check";
      default:
        return "Care task";
    }
  }

  static async getNextTaskForPlant(
    plantId: string
  ): Promise<UpcomingTask | null> {
    const plants = await plantService.getActivePlants();
    const plant = plants.find((p) => p.id === plantId);

    if (!plant) return null;

    const tasks = await this.getTasksForPlant(plant);

    // Filter by reminder preferences
    const filteredTasks = tasks.filter((task) => {
      if (!plant.reminderPreferences) return true;

      const taskTypeMap: Record<
        string,
        keyof typeof plant.reminderPreferences
      > = {
        "Check water level": "watering",
        Water: "watering",
        Fertilize: "fertilizing",
        Observe: "observation",
        "Check lighting": "lighting",
        Prune: "pruning",
        "Health check": "observation",
      };

      const preferenceKey = taskTypeMap[task.task];
      return preferenceKey ? plant.reminderPreferences[preferenceKey] : true;
    });

    // Return the most urgent task (sorted by due date)
    if (filteredTasks.length === 0) return null;

    return filteredTasks.sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    )[0];
  }

  private static formatDueIn(dueDate: Date): string {
    const now = new Date();
    const diffDays = differenceInDays(dueDate, now);

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffDays} days`;
    }
  }

  private static calculatePriority(
    daysOverdue: number
  ): "low" | "medium" | "high" {
    if (daysOverdue >= 2) return "high"; // 2+ days overdue
    if (daysOverdue >= 0) return "medium"; // Due today or overdue
    return "low"; // Due in future
  }
}
