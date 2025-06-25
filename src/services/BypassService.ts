import { db, TaskBypassRecord } from "@/types/database";
import { CareActivityType, GrowthStage } from "@/types/core";
import { subMonths } from "date-fns";

export interface BypassPattern {
  plantId: string;
  taskType: CareActivityType;
  commonReasons: string[];
  frequency: number;
  seasonalPattern?: {
    season: string;
    frequency: number;
  }[];
  confidenceScore: number;
}

export interface BypassInsight {
  plantId: string;
  pattern: BypassPattern;
  recommendation: string;
  shouldAdjustSchedule: boolean;
  adjustmentDays?: number;
}

export class BypassService {
  /**
   * Logs a bypassed task and its associated analytics.
   * This combines the logic from the original logBypass and recordBypass methods.
   */
  static async logBypass(
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
      const now = new Date();
      const bypassId = crypto.randomUUID();

      // Log to taskBypasses table for pattern analysis [cite: 466]
      await db.taskBypasses.add({
        id: bypassId,
        taskId,
        plantId,
        taskType,
        reason,
        scheduledDate: dueDate,
        bypassDate: now,
        plantStage,
        createdAt: now,
        updatedAt: now,
      });

      // Log to bypassLog for detailed analytics [cite: 467]
      await db.bypassLog.add({
        id: crypto.randomUUID(),
        taskId,
        plantId,
        taskType,
        reason,
        bypassedAt: now,
        plantStage,
        dueDate,
        moistureLevel,
        weatherConditions,
      });

      // Also log an observation activity to the main care log [cite: 481-482]
      await db.careActivities.add({
        id: crypto.randomUUID(),
        plantId,
        type: "observe",
        date: now,
        details: {
          type: "observe",
          healthAssessment: "good",
          observations: `Task bypassed: ${reason}`,
          notes: `Bypassed ${taskType} task - ${reason}`,
        },
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error("Failed to log bypass:", error);
      throw error;
    }
  }

  /**
   * Analyzes bypass records to find recurring patterns. [cite: 459]
   */
  static async getBypassPatterns(
    plantId?: string,
    monthsBack: number = 6
  ): Promise<BypassPattern[]> {
    try {
      const cutoffDate = subMonths(new Date(), monthsBack);
      let query = db.taskBypasses.where("bypassDate").above(cutoffDate);

      if (plantId) {
        query = query.and(
          (bypass: TaskBypassRecord) => bypass.plantId === plantId
        );
      }

      const bypasses = await query.toArray();
      return this.analyzeBypassPatterns(bypasses);
    } catch (error) {
      console.error("Failed to get bypass patterns:", error);
      return [];
    }
  }

  /**
   * Generates actionable insights from identified bypass patterns. [cite: 471]
   */
  static async generateBypassInsights(
    plantId?: string
  ): Promise<BypassInsight[]> {
    try {
      const patterns = await this.getBypassPatterns(plantId);
      const insights: BypassInsight[] = [];

      for (const pattern of patterns) {
        let shouldAdjustSchedule = false;
        let adjustmentDays: number | undefined;
        let recommendation = "";

        if (pattern.frequency > 2) {
          shouldAdjustSchedule = true;
          adjustmentDays = Math.round(pattern.frequency * 2);

          if (pattern.commonReasons.includes("looks healthy")) {
            recommendation = `Consider extending ${pattern.taskType} interval by ${adjustmentDays} days. Your plant consistently appears healthy when bypassing.`;
          } else if (pattern.commonReasons.includes("weather")) {
            recommendation = `Consider weather-based scheduling adjustments.`;
          }
        }

        if (!recommendation) {
          recommendation = `You've bypassed ${pattern.taskType} ${Math.round(
            pattern.frequency
          )} times per month. Consider if schedule adjustments would be helpful.`;
        }

        insights.push({
          plantId: pattern.plantId,
          pattern,
          recommendation,
          shouldAdjustSchedule,
          adjustmentDays,
        });
      }

      return insights;
    } catch (error) {
      console.error("Failed to generate bypass insights:", error);
      return [];
    }
  }

  private static analyzeBypassPatterns(
    bypasses: TaskBypassRecord[]
  ): BypassPattern[] {
    const groupedBypasses = bypasses.reduce(
      (acc: Record<string, TaskBypassRecord[]>, bypass: TaskBypassRecord) => {
        const key = `${bypass.plantId}-${bypass.taskType}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(bypass);
        return acc;
      },
      {}
    );

    const patterns: BypassPattern[] = [];

    for (const [key, plantBypasses] of Object.entries(groupedBypasses)) {
      if (plantBypasses.length < 2) continue;

      const [plantId, taskType] = key.split("-");
      const commonReasons = this.extractCommonReasons(plantBypasses);
      const frequency = plantBypasses.length / 6;
      const seasonalPattern = this.calculateSeasonalPattern(plantBypasses);

      patterns.push({
        plantId,
        taskType: taskType as CareActivityType,
        commonReasons,
        frequency,
        seasonalPattern,
        confidenceScore: Math.min(plantBypasses.length / 10, 1),
      });
    }

    return patterns.sort(
      (a: BypassPattern, b: BypassPattern) =>
        b.confidenceScore - a.confidenceScore
    );
  }

  private static extractCommonReasons(bypasses: TaskBypassRecord[]): string[] {
    const reasonCounts: Record<string, number> = {};
    bypasses.forEach((bypass: TaskBypassRecord) => {
      const reason = bypass.reason.toLowerCase().trim();
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    return Object.entries(reasonCounts)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([reason]) => reason);
  }

  private static calculateSeasonalPattern(bypasses: TaskBypassRecord[]) {
    const seasonCounts: Record<string, number> = {
      winter: 0,
      spring: 0,
      summer: 0,
      fall: 0,
    };

    bypasses.forEach((bypass: TaskBypassRecord) => {
      const month = new Date(bypass.bypassDate).getMonth();
      const season =
        month < 3
          ? "winter"
          : month < 6
          ? "spring"
          : month < 9
          ? "summer"
          : "fall";
      seasonCounts[season]++;
    });

    return Object.entries(seasonCounts)
      .filter(([, count]) => count > 0)
      .map(([season, frequency]) => ({ season, frequency }));
  }
}
