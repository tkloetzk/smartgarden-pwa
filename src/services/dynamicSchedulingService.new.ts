// src/services/dynamicSchedulingService.new.ts - Instance-based version with dependency injection
import { db, TaskCompletionRecord } from "@/types/database";
import { CareActivityType, GrowthStage } from "@/types";
import { addDays, differenceInDays } from "date-fns";
import { generateUUID } from "@/utils/cn";
import { Logger } from "@/utils/logger";
import { APP_CONFIG } from "@/config/constants";
import { IDynamicSchedulingService } from "./interfaces";

export interface SchedulingAdjustment {
  plantId: string;
  taskType: CareActivityType;
  originalInterval: number;
  adjustedInterval: number;
  reason: string;
  confidence: number;
}

export interface CompletionPattern {
  averageVariance: number;
  consistency: number;
  recommendedAdjustment: number;
  totalCompletions: number;
  lastCompletion?: Date;
}

export class DynamicSchedulingService implements IDynamicSchedulingService {
  private readonly maxLookbackDays: number;
  private readonly minCompletionsForPattern: number;
  private readonly consistencyThreshold: number;

  constructor(
    maxLookbackDays = APP_CONFIG.CARE_SCHEDULING.MAX_TASK_LOOKBACK_DAYS,
    minCompletionsForPattern = 3,
    consistencyThreshold = 0.6
  ) {
    this.maxLookbackDays = maxLookbackDays;
    this.minCompletionsForPattern = minCompletionsForPattern;
    this.consistencyThreshold = consistencyThreshold;
  }

  async recordTaskCompletion(
    plantId: string,
    taskType: CareActivityType,
    scheduledDate: Date,
    actualCompletionDate: Date,
    careActivityId: string,
    plantStage: GrowthStage
  ): Promise<void> {
    try {
      const varianceDays = differenceInDays(actualCompletionDate, scheduledDate);

      const completionRecord: Omit<TaskCompletionRecord, "id"> = {
        plantId,
        taskType,
        scheduledDate,
        actualCompletionDate,
        varianceDays,
        careActivityId,
        plantStage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.taskCompletions.add({
        id: generateUUID(),
        ...completionRecord,
      });

      Logger.debug("Task completion recorded", {
        plantId,
        taskType,
        varianceDays,
        plantStage,
      });
    } catch (error) {
      Logger.error("Failed to record task completion", error, {
        plantId,
        taskType,
        careActivityId,
      });
      throw error;
    }
  }

  async getNextDueDateForTask(
    plantId: string,
    taskType: CareActivityType
  ): Promise<Date> {
    try {
      // Get the last completion to base the calculation on
      const lastCompletion = await this.getLastCompletionForTask(plantId, taskType);
      const baseDate = lastCompletion ? lastCompletion.actualCompletionDate : new Date();

      const patterns = await this.getCompletionPatterns(plantId, taskType);

      // Start with a reasonable default interval based on task type
      let intervalDays = this.getDefaultIntervalForTaskType(taskType);

      // Apply dynamic adjustment if we have sufficient data
      if (
        patterns.totalCompletions >= this.minCompletionsForPattern &&
        patterns.consistency > this.consistencyThreshold &&
        Math.abs(patterns.recommendedAdjustment) > 0
      ) {
        intervalDays += patterns.recommendedAdjustment;
        
        Logger.debug("Applied dynamic scheduling adjustment", {
          plantId,
          taskType,
          originalInterval: this.getDefaultIntervalForTaskType(taskType),
          adjustedInterval: intervalDays,
          patterns,
        });
      }

      // Ensure interval is within reasonable bounds
      intervalDays = Math.max(1, Math.min(intervalDays, 30));

      return addDays(baseDate, intervalDays);
    } catch (error) {
      Logger.error("Failed to get next due date for task", error, {
        plantId,
        taskType,
      });
      
      // Fallback to default interval
      const defaultInterval = this.getDefaultIntervalForTaskType(taskType);
      return addDays(new Date(), defaultInterval);
    }
  }

  async getCompletionPatterns(
    plantId: string,
    taskType: CareActivityType,
    lookbackDays: number = this.maxLookbackDays
  ): Promise<CompletionPattern> {
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
        .reverse()
        .sortBy("actualCompletionDate");

      if (completions.length < this.minCompletionsForPattern) {
        return {
          averageVariance: 0,
          consistency: 0,
          recommendedAdjustment: 0,
          totalCompletions: completions.length,
          lastCompletion: completions[0]?.actualCompletionDate,
        };
      }

      // Calculate statistics
      const variances = completions.map((c) => c.varianceDays);
      const averageVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;

      // Calculate consistency (lower standard deviation = higher consistency)
      const variance = variances.reduce((sum, v) => sum + Math.pow(v - averageVariance, 2), 0) / variances.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 1 - stdDev / 7); // Normalize to 0-1 scale

      // Calculate recommended adjustment
      let recommendedAdjustment = 0;
      if (Math.abs(averageVariance) > 1 && consistency > this.consistencyThreshold) {
        // Conservative adjustment - only apply 70% of the observed variance
        recommendedAdjustment = Math.round(averageVariance * 0.7);
        
        // Cap adjustments to reasonable bounds
        recommendedAdjustment = Math.max(-7, Math.min(recommendedAdjustment, 7));
      }

      return {
        averageVariance,
        consistency,
        recommendedAdjustment,
        totalCompletions: completions.length,
        lastCompletion: completions[0]?.actualCompletionDate,
      };
    } catch (error) {
      Logger.error("Failed to get completion patterns", error, {
        plantId,
        taskType,
        lookbackDays,
      });
      
      return {
        averageVariance: 0,
        consistency: 0,
        recommendedAdjustment: 0,
        totalCompletions: 0,
      };
    }
  }

  async getAdjustmentRecommendations(plantId?: string): Promise<SchedulingAdjustment[]> {
    try {
      const cutoffDate = addDays(new Date(), -this.maxLookbackDays);

      let query = db.taskCompletions.where("scheduledDate").above(cutoffDate);

      if (plantId) {
        query = query.and((completion: TaskCompletionRecord) => completion.plantId === plantId);
      }

      const completions = await query.toArray();

      // Group by plant and task type
      const grouped = this.groupCompletionsByPlantAndTask(completions);
      const adjustments: SchedulingAdjustment[] = [];

      for (const [key, taskCompletions] of Object.entries(grouped)) {
        if (taskCompletions.length < this.minCompletionsForPattern) continue;

        const [plantIdKey, taskType] = key.split("-");
        const patterns = await this.getCompletionPatterns(
          plantIdKey,
          taskType as CareActivityType
        );

        if (Math.abs(patterns.recommendedAdjustment) > 0) {
          const originalInterval = this.getDefaultIntervalForTaskType(taskType as CareActivityType);
          
          adjustments.push({
            plantId: plantIdKey,
            taskType: taskType as CareActivityType,
            originalInterval,
            adjustedInterval: originalInterval + patterns.recommendedAdjustment,
            reason: this.generateAdjustmentReason(patterns.averageVariance),
            confidence: patterns.consistency,
          });
        }
      }

      return adjustments.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      Logger.error("Failed to get adjustment recommendations", error, { plantId });
      return [];
    }
  }

  private async getLastCompletionForTask(
    plantId: string,
    taskType: CareActivityType
  ): Promise<TaskCompletionRecord | null> {
    try {
      const completions = await db.taskCompletions
        .where("plantId")
        .equals(plantId)
        .and((completion: TaskCompletionRecord) => completion.taskType === taskType)
        .reverse()
        .sortBy("actualCompletionDate");

      return completions.length > 0 ? completions[0] : null;
    } catch (error) {
      Logger.error("Failed to get last completion", error, { plantId, taskType });
      return null;
    }
  }

  private getDefaultIntervalForTaskType(taskType: CareActivityType): number {
    switch (taskType) {
      case "water":
        return APP_CONFIG.CARE_SCHEDULING.DEFAULT_WATERING_INTERVAL_DAYS;
      case "fertilize":
        return APP_CONFIG.CARE_SCHEDULING.DEFAULT_FERTILIZING_INTERVAL_DAYS;
      case "observe":
        return 7; // Weekly observations
      case "prune":
        return 21; // Every 3 weeks
      case "transplant":
        return 90; // Quarterly
      default:
        return APP_CONFIG.CARE_SCHEDULING.FALLBACK_INTERVAL_DAYS;
    }
  }

  private groupCompletionsByPlantAndTask(
    completions: TaskCompletionRecord[]
  ): Record<string, TaskCompletionRecord[]> {
    return completions.reduce((acc, completion) => {
      const key = `${completion.plantId}-${completion.taskType}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(completion);
      return acc;
    }, {} as Record<string, TaskCompletionRecord[]>);
  }

  private generateAdjustmentReason(averageVariance: number): string {
    if (averageVariance > 0) {
      return `Tasks consistently completed ${Math.abs(averageVariance).toFixed(1)} days late`;
    } else {
      return `Tasks consistently completed ${Math.abs(averageVariance).toFixed(1)} days early`;
    }
  }
}