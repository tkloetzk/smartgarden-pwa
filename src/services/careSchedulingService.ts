// src/services/careSchedulingService.ts
import {
  plantService,
  careService,
  varietyService,
  PlantRecord,
} from "@/types/database";
import { GrowthStage } from "@/types/core";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { UpcomingTask } from "@/types/scheduling";
import { addDays, differenceInDays } from "date-fns";
import { DynamicSchedulingService } from "./dynamicSchedulingService";

export class CareSchedulingService {
  public static async getUpcomingTasks(): Promise<UpcomingTask[]> {
    try {
      const plants = await plantService.getActivePlants();
      const allTasks: UpcomingTask[] = [];

      for (const plant of plants) {
        const plantTasks = await this.getTasksForPlant(plant);

        const filteredTasks = plantTasks.filter((task) => {
          if (!plant.reminderPreferences) return true;

          const taskTypeMap: Record<
            string,
            keyof NonNullable<typeof plant.reminderPreferences>
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

      const wateringTask = await this.createWateringTask(plant, currentStage);
      if (wateringTask) tasks.push(wateringTask);

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

  public static async createWateringTask(
    plant: PlantRecord,
    currentStage: GrowthStage
  ): Promise<UpcomingTask | null> {
    let nextDueDate: Date;

    // In CareSchedulingService.createWateringTask
    const lastWatering = await careService.getLastActivityByType(
      plant.id,
      "water"
    );

    if (lastWatering) {
      // Ensure date is a Date object
      const lastWateringDate =
        lastWatering.date instanceof Date
          ? lastWatering.date
          : new Date(lastWatering.date);

      nextDueDate = await DynamicSchedulingService.getNextDueDateForTask(
        plant.id,
        "water",
        lastWateringDate
      );
    } else {
      const daysSincePlanting = differenceInDays(new Date(), plant.plantedDate);
      nextDueDate =
        daysSincePlanting > 1 ? new Date() : addDays(plant.plantedDate, 1);
    }

    if (nextDueDate <= addDays(new Date(), 2)) {
      const daysOverdue = differenceInDays(new Date(), nextDueDate);

      return {
        id: `water-${plant.id}`,
        plantId: plant.id,
        plantName: getPlantDisplayName(plant),
        task: "Check water level",
        type: "water",
        dueIn: this.formatDueIn(nextDueDate),
        priority: this.calculatePriority(daysOverdue),
        plantStage: currentStage,
        dueDate: nextDueDate,
        category: "watering",
        canBypass: true,
      };
    }

    return null;
  }

  public static async createObservationTask(
    plant: PlantRecord,
    currentStage: GrowthStage
  ): Promise<UpcomingTask | null> {
    const lastObservation = await careService.getLastActivityByType(
      plant.id,
      "observe"
    );

    let nextDueDate: Date;

    if (lastObservation) {
      nextDueDate = await DynamicSchedulingService.getNextDueDateForTask(
        plant.id,
        "observe",
        lastObservation.date
      );
    } else {
      nextDueDate = addDays(plant.plantedDate, 3);
    }

    if (nextDueDate <= addDays(new Date(), 1)) {
      const daysOverdue = differenceInDays(new Date(), nextDueDate);

      return {
        id: `observe-${plant.id}`,
        plantId: plant.id,
        plantName: getPlantDisplayName(plant),
        task: "Health check",
        type: "observe",
        dueIn: this.formatDueIn(nextDueDate),
        priority: this.calculatePriority(daysOverdue),
        plantStage: currentStage,
        dueDate: nextDueDate,
        category: "observation",
        canBypass: true,
      };
    }

    return null;
  }

  public static async getNextTaskForPlant(
    plantId: string
  ): Promise<UpcomingTask | null> {
    const plants = await plantService.getActivePlants();
    const plant = plants.find((p) => p.id === plantId);

    if (!plant) return null;

    const tasks = await this.getTasksForPlant(plant);

    if (plant.reminderPreferences) {
      const filteredTasks = tasks.filter((task) => {
        const taskTypeMap: Record<
          string,
          keyof NonNullable<typeof plant.reminderPreferences>
        > = {
          "Check water level": "watering",
          Water: "watering",
          Fertilize: "fertilizing",
          Observe: "observation",
          "Health check": "observation",
          "Check lighting": "lighting",
          Prune: "pruning",
        };
        const preferenceKey = taskTypeMap[task.task];
        return preferenceKey ? plant.reminderPreferences![preferenceKey] : true;
      });

      return filteredTasks.length > 0 ? filteredTasks[0] : null;
    }

    return tasks.length > 0 ? tasks[0] : null;
  }

  private static formatDueIn(dueDate: Date): string {
    const now = new Date();
    const diffDays = differenceInDays(dueDate, now);

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${
        Math.abs(diffDays) !== 1 ? "s" : ""
      } overdue`;
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
  ): "low" | "medium" | "high" | "overdue" {
    if (daysOverdue > 0) return "overdue";
    if (daysOverdue === 0) return "high";
    if (daysOverdue >= -1) return "medium";
    return "low";
  }
}
