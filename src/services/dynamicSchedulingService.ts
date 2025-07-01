// src/services/dynamicSchedulingService.ts
import { db, TaskCompletionRecord } from "@/types/database";
import { CareActivityType, GrowthStage } from "@/types/core";
import { addDays, differenceInDays } from "date-fns";
import { generateUUID } from "@/utils/cn";

export interface SchedulingAdjustment {
  plantId: string;
  taskType: CareActivityType;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  confidence: number;
}

export class DynamicSchedulingService {
  static async recordTaskCompletion(
    plantId: string,
    taskType: CareActivityType,
    scheduledDate: Date,
    actualCompletionDate: Date,
    careActivityId: string,
    plantStage: GrowthStage
  ): Promise<void> {
    try {
      const varianceDays = differenceInDays(
        actualCompletionDate,
        scheduledDate
      );

      await db.taskCompletions.add({
        id: generateUUID(),
        plantId,
        taskType,
        scheduledDate,
        actualCompletionDate,
        varianceDays,
        careActivityId,
        plantStage,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to record task completion:", error);
      throw error;
    }
  }

  static async getNextDueDateForTask(
    plantId: string,
    taskType: CareActivityType,
    lastCompletionDate: Date
  ): Promise<Date> {
    try {
      const patterns = await this.getCompletionPatterns(plantId, taskType);

      // Base interval of 7 days, adjusted by patterns
      let intervalDays = 7;

      if (patterns.recommendedAdjustment !== 0 && patterns.consistency > 0.5) {
        intervalDays += patterns.recommendedAdjustment;
      }

      return addDays(lastCompletionDate, intervalDays);
    } catch (error) {
      console.error("Failed to get next due date for task:", error);
      // Fallback to default 7-day interval
      return addDays(lastCompletionDate, 7);
    }
  }
  static async getCompletionPatterns(
    plantId: string,
    taskType: CareActivityType,
    lookbackDays: number = 90
  ): Promise<{
    averageVariance: number;
    consistency: number;
    recommendedAdjustment: number;
  }> {
    try {
      const cutoffDate = addDays(new Date(), -lookbackDays);

      const completions = await db.taskCompletions
        .where("plantId")
        .equals(plantId)
        .and(
          (completion: TaskCompletionRecord) =>
            completion.taskType === taskType &&
            new Date(completion.scheduledDate) > cutoffDate
        )
        .toArray();

      if (completions.length < 3) {
        return {
          averageVariance: 0,
          consistency: 0,
          recommendedAdjustment: 0,
        };
      }

      const variances = completions.map(
        (completion: TaskCompletionRecord) => completion.varianceDays
      );
      const averageVariance =
        variances.reduce((sum, variance) => sum + variance, 0) /
        variances.length;

      // Calculate consistency (lower standard deviation = higher consistency)
      const mean = averageVariance;
      const squaredDiffs = variances.map((variance) =>
        Math.pow(variance - mean, 2)
      );
      const stdDev = Math.sqrt(
        squaredDiffs.reduce((sum, diff) => sum + diff, 0) / variances.length
      );
      const consistency = Math.max(0, 1 - stdDev / 7); // Normalize to 0-1 scale

      // Recommend adjustment if consistently early/late
      let recommendedAdjustment = 0;
      if (Math.abs(averageVariance) > 1 && consistency > 0.6) {
        recommendedAdjustment = Math.round(averageVariance * 0.7); // Conservative adjustment
      }

      return {
        averageVariance,
        consistency,
        recommendedAdjustment,
      };
    } catch (error) {
      console.error("Failed to get completion patterns:", error);
      return {
        averageVariance: 0,
        consistency: 0,
        recommendedAdjustment: 0,
      };
    }
  }

  static async getSchedulingAdjustments(
    plantId?: string
  ): Promise<SchedulingAdjustment[]> {
    try {
      const cutoffDate = addDays(new Date(), -60);

      let query = db.taskCompletions.where("scheduledDate").above(cutoffDate);

      if (plantId) {
        query = query.and(
          (completion: TaskCompletionRecord) => completion.plantId === plantId
        );
      }

      const completions = await query.toArray();

      // Group by plant and task type
      const grouped = completions.reduce(
        (
          acc: Record<string, TaskCompletionRecord[]>,
          completion: TaskCompletionRecord
        ) => {
          const key = `${completion.plantId}-${completion.taskType}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(completion);
          return acc;
        },
        {}
      );

      const adjustments: SchedulingAdjustment[] = [];

      for (const [key, taskCompletions] of Object.entries(grouped)) {
        if (taskCompletions.length < 3) continue;

        const [plantId, taskType] = key.split("-");
        const patterns = await this.getCompletionPatterns(
          plantId,
          taskType as CareActivityType
        );

        if (Math.abs(patterns.recommendedAdjustment) > 0) {
          adjustments.push({
            plantId,
            taskType: taskType as CareActivityType,
            originalInterval: 7, // Default weekly - could be looked up from protocols
            adjustedInterval: 7 + patterns.recommendedAdjustment,
            reason:
              patterns.averageVariance > 0
                ? `Tasks consistently completed ${Math.abs(
                    patterns.averageVariance
                  )} days late`
                : `Tasks consistently completed ${Math.abs(
                    patterns.averageVariance
                  )} days early`,
            confidence: patterns.consistency,
          });
        }
      }

      return adjustments.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Failed to get scheduling adjustments:", error);
      return [];
    }
  }
}
