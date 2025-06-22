// src/services/bypassAnalyticsService.ts
import { db } from "@/types/database";
import { CareActivityType, GrowthStage } from "@/types/core";
import { subDays, format } from "date-fns";

export interface BypassEntry {
  id: string;
  taskId: string;
  plantId: string;
  taskType: CareActivityType;
  reason: string;
  bypassedAt: Date;
  plantStage: GrowthStage;
  dueDate: Date;
  moistureLevel?: number;
  weatherConditions?: string;
}

export interface BypassAnalytics {
  totalBypasses: number;
  bypassRate: number;
  commonReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  byTaskType: Array<{
    taskType: CareActivityType;
    count: number;
    percentage: number;
  }>;
  trendsOverTime: Array<{
    date: string;
    bypasses: number;
  }>;
}

export class BypassAnalyticsService {
  static async recordBypass(
    taskId: string,
    plantId: string,
    taskType: CareActivityType,
    reason: string,
    dueDate: Date,
    plantStage: GrowthStage,
    moistureLevel?: number,
    weatherConditions?: string
  ): Promise<void> {
    try {
      const bypassEntry: Omit<BypassEntry, "id"> = {
        taskId,
        plantId,
        taskType,
        reason,
        bypassedAt: new Date(),
        plantStage,
        dueDate,
        moistureLevel,
        weatherConditions,
      };

      await db.bypassLog.add({
        id: crypto.randomUUID(),
        ...bypassEntry,
      });

      // Also add to new task bypasses table for better tracking
      await db.taskBypasses.add({
        id: crypto.randomUUID(),
        taskId,
        plantId,
        taskType,
        reason,
        scheduledDate: dueDate,
        bypassDate: new Date(),
        plantStage,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Log an observation record for analytics
      await db.careActivities.add({
        id: crypto.randomUUID(),
        plantId,
        type: "observe",
        date: new Date(),
        details: {
          type: "observe",
          healthAssessment: "good",
          observations: `Task bypassed: ${reason}`,
          notes: `Bypassed ${taskType} task - ${reason}`,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to record bypass:", error);
      throw error;
    }
  }

  static async getBypassAnalytics(
    plantId?: string,
    daysBack: number = 30
  ): Promise<BypassAnalytics> {
    try {
      const cutoffDate = subDays(new Date(), daysBack);

      let bypassQuery = db.bypassLog.where("bypassedAt").above(cutoffDate);

      if (plantId) {
        bypassQuery = bypassQuery.and((log) => log.plantId === plantId);
      }

      const bypasses = await bypassQuery.toArray();

      // Get total scheduled tasks for rate calculation
      let taskQuery = db.careActivities.where("date").above(cutoffDate);
      if (plantId) {
        taskQuery = taskQuery.and((activity) => activity.plantId === plantId);
      }

      const scheduledTasks = await taskQuery.count();
      const totalBypasses = bypasses.length;
      const bypassRate =
        scheduledTasks > 0 ? (totalBypasses / scheduledTasks) * 100 : 0;

      // Common reasons analysis
      const reasonCounts: Record<string, number> = {};
      bypasses.forEach((bypass) => {
        const reason = bypass.reason.toLowerCase().trim();
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });

      const commonReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: totalBypasses > 0 ? (count / totalBypasses) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // By task type analysis
      const taskTypeCounts: Record<CareActivityType, number> = {} as Record<
        CareActivityType,
        number
      >;
      bypasses.forEach((bypass) => {
        taskTypeCounts[bypass.taskType] =
          (taskTypeCounts[bypass.taskType] || 0) + 1;
      });

      const byTaskType = Object.entries(taskTypeCounts)
        .map(([taskType, count]) => ({
          taskType: taskType as CareActivityType,
          count,
          percentage: totalBypasses > 0 ? (count / totalBypasses) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Trends over time (daily)
      const dailyCounts: Record<string, number> = {};
      bypasses.forEach((bypass) => {
        const dateKey = format(new Date(bypass.bypassedAt), "yyyy-MM-dd");
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      });

      const trendsOverTime = Object.entries(dailyCounts)
        .map(([date, bypasses]) => ({ date, bypasses }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalBypasses,
        bypassRate,
        commonReasons,
        byTaskType,
        trendsOverTime,
      };
    } catch (error) {
      console.error("Failed to get bypass analytics:", error);
      return {
        totalBypasses: 0,
        bypassRate: 0,
        commonReasons: [],
        byTaskType: [],
        trendsOverTime: [],
      };
    }
  }
}
