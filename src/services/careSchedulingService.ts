// src/services/careSchedulingService.ts
import {
  plantService,
  careService,
  varietyService,
  PlantRecord,
} from "@/types/database";
import { GrowthStage } from "@/types/core";
import { calculateCurrentStage } from "@/utils/growthStage";
import { UpcomingTask } from "@/types/scheduling";
import { addDays, differenceInDays } from "date-fns";

export class CareSchedulingService {
  static async getUpcomingTasks(): Promise<UpcomingTask[]> {
    const plants = await plantService.getActivePlants();
    const tasks: UpcomingTask[] = [];

    for (const plant of plants) {
      try {
        const variety = await varietyService.getVariety(plant.varietyId);
        if (!variety) continue;

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

        // Check for watering task
        const wateringTask = await this.createWateringTask(plant, currentStage);
        if (wateringTask) tasks.push(wateringTask);

        // Check for observation task
        const observationTask = await this.createObservationTask(
          plant,
          currentStage
        );
        if (observationTask) tasks.push(observationTask);
      } catch (error) {
        console.error(`Error processing tasks for plant ${plant.id}:`, error);
      }
    }

    return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
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
        name: plant.name || plant.varietyId,
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

    if (nextDueDate <= addDays(new Date(), 3)) {
      // Show observation tasks due within 3 days
      const daysOverdue = differenceInDays(new Date(), nextDueDate);

      return {
        id: `observe-${plant.id}`,
        plantId: plant.id,
        name: plant.name || plant.varietyId,
        task: "Health check & photo",
        dueIn: this.formatDueIn(nextDueDate),
        priority: this.calculatePriority(daysOverdue),
        plantStage: currentStage,
        dueDate: nextDueDate,
      };
    }

    return null;
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
    if (daysOverdue > 1) return "high";
    if (daysOverdue >= 0) return "medium";
    return "low";
  }
}
