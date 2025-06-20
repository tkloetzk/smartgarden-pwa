// src/services/careSchedulingService.ts
import {
  plantService,
  careService,
  varietyService,
  PlantRecord,
} from "@/types/database";
import { GrowthStage } from "@/types/core";
import { calculateCurrentStage } from "@/utils/growthStage";
import { getPlantDisplayName } from "@/utils/plantDisplay"; // Add this import
import { UpcomingTask } from "@/types/scheduling";
import { addDays, differenceInDays } from "date-fns";

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
      const currentStage = calculateCurrentStage(
        plant.plantedDate,
        variety.growthTimeline
      );

      if (currentStage !== plant.currentStage) {
        await plantService.updatePlant(plant.id, {
          currentStage,
          updatedAt: new Date(),
        });
      }

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
    const lastWatering = await careService.getLastCareActivityByType(
      plant.id,
      "water"
    );

    // Simple watering intervals based on stage
    const wateringIntervals: Record<GrowthStage, number> = {
      germination: 1,
      seedling: 2,
      vegetative: 3,
      flowering: 2,
      fruiting: 2,
      maturation: 3,
      harvest: 4,
      "ongoing-production": 2, // More frequent for active production
    };

    const intervalDays = wateringIntervals[currentStage] || 3;

    let nextDueDate: Date;

    if (lastWatering) {
      nextDueDate = addDays(lastWatering.date, intervalDays);
    } else {
      // No previous watering, should water soon if never watered
      const daysSincePlanting = differenceInDays(new Date(), plant.plantedDate);
      nextDueDate =
        daysSincePlanting > 1 ? new Date() : addDays(plant.plantedDate, 1);
    }

    // Only create task if due or overdue
    if (nextDueDate <= addDays(new Date(), 2)) {
      // Show tasks due within 2 days
      const daysOverdue = differenceInDays(new Date(), nextDueDate);

      return {
        id: `water-${plant.id}`,
        plantId: plant.id,
        name: getPlantDisplayName(plant), // Use the utility function here
        task: "Check water level",
        dueIn: this.formatDueIn(nextDueDate),
        priority: this.calculatePriority(daysOverdue),
        plantStage: currentStage,
        dueDate: nextDueDate,
      };
    }

    return null;
  }

  private static async createObservationTask(
    plant: PlantRecord,
    currentStage: GrowthStage
  ): Promise<UpcomingTask | null> {
    const lastObservation = await careService.getLastCareActivityByType(
      plant.id,
      "observe"
    );

    // Weekly observations
    const observationInterval = 7;

    let nextDueDate: Date;

    if (lastObservation) {
      nextDueDate = addDays(lastObservation.date, observationInterval);
    } else {
      // First observation after a few days
      nextDueDate = addDays(plant.plantedDate, 3);
    }

    // Only create task if due or overdue
    if (nextDueDate <= addDays(new Date(), 1)) {
      // Show tasks due within 1 day
      const daysOverdue = differenceInDays(new Date(), nextDueDate);

      return {
        id: `observe-${plant.id}`,
        plantId: plant.id,
        name: getPlantDisplayName(plant),
        task: "Health check",
        dueIn: this.formatDueIn(nextDueDate),
        priority: this.calculatePriority(daysOverdue),
        plantStage: currentStage,
        dueDate: nextDueDate,
      };
    }

    return null;
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
