// src/services/serviceMigration.ts - Helper utilities for migrating from static to instance-based services
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CareSchedulingService as LegacyCareSchedulingService } from "./careSchedulingService";
import { DynamicSchedulingService as LegacyDynamicSchedulingService } from "./dynamicSchedulingService";
import { 
  getSchedulingService, 
  getDynamicSchedulingService
} from "./serviceRegistry";
import { Logger } from "@/utils/logger";
import { ICareSchedulingService, IDynamicSchedulingService } from "./interfaces";

/**
 * Service Migration Helper - Provides backwards compatibility during transition
 * 
 * This utility provides:
 * 1. Backwards-compatible static method wrappers
 * 2. Migration detection and warnings
 * 3. Gradual migration support
 */
export class ServiceMigrationHelper {
  private static migrationWarningsEnabled = process.env.NODE_ENV === 'development';

  /**
   * Enable/disable migration warnings
   */
  static setMigrationWarnings(enabled: boolean): void {
    ServiceMigrationHelper.migrationWarningsEnabled = enabled;
  }

  private static logMigrationWarning(serviceName: string, methodName: string): void {
    if (ServiceMigrationHelper.migrationWarningsEnabled) {
      Logger.warn(`Legacy service usage detected: ${serviceName}.${methodName}. Consider migrating to dependency injection pattern.`, {
        service: serviceName,
        method: methodName,
        stack: new Error().stack?.split('\n').slice(1, 4),
      });
    }
  }

  /**
   * Get the new instance-based care scheduling service
   * with fallback to legacy static methods
   */
  static getCareSchedulingService(): ICareSchedulingService {
    try {
      return getSchedulingService();
    } catch (error) {
      Logger.warn("Failed to get new care scheduling service, falling back to legacy", error);
      return ServiceMigrationHelper.createLegacyCareSchedulingWrapper();
    }
  }

  /**
   * Get the new instance-based dynamic scheduling service
   * with fallback to legacy static methods
   */
  static getDynamicSchedulingService(): IDynamicSchedulingService {
    try {
      return getDynamicSchedulingService();
    } catch (error) {
      Logger.warn("Failed to get new dynamic scheduling service, falling back to legacy", error);
      return ServiceMigrationHelper.createLegacyDynamicSchedulingWrapper();
    }
  }

  /**
   * Create a wrapper that implements the new interface but delegates to legacy static methods
   */
  private static createLegacyCareSchedulingWrapper(): ICareSchedulingService {
    return {
      async getUpcomingTasks(plantId?: string) {
        ServiceMigrationHelper.logMigrationWarning('CareSchedulingService', 'getUpcomingTasks');
        if (plantId) {
          const task = await LegacyCareSchedulingService.getNextTaskForPlant(plantId);
          return task ? [task] : [];
        }
        return LegacyCareSchedulingService.getUpcomingTasks();
      },

      async getTasksForPlant(plantId: string) {
        ServiceMigrationHelper.logMigrationWarning('CareSchedulingService', 'getTasksForPlant');
        const plants = await import("@/types/database").then(m => m.plantService.getActivePlants());
        const plant = plants.find(p => p.id === plantId);
        if (!plant) return [];
        return LegacyCareSchedulingService.getTasksForPlant(plant);
      },

      calculateNextDueDate(_activityType, lastDate) {
        ServiceMigrationHelper.logMigrationWarning('CareSchedulingService', 'calculateNextDueDate');
        // Legacy service doesn't have this exact method, so we provide a simple fallback
        const addDays = (date: Date, days: number) => {
          const result = new Date(date);
          result.setDate(result.getDate() + days);
          return result;
        };
        return addDays(lastDate, 7); // Default 7-day interval
      },

      filterTasksByPreferences(tasks, preferences) {
        ServiceMigrationHelper.logMigrationWarning('CareSchedulingService', 'filterTasksByPreferences');
        // Simplified version of the legacy filtering logic
        if (!preferences || Object.keys(preferences).length === 0) {
          return tasks;
        }

        const TASK_TYPE_MAP: Record<string, keyof typeof preferences> = {
          "Check water level": "watering",
          Water: "watering",
          Fertilize: "fertilizing",
          Observe: "observation",
          "Check lighting": "lighting",
          Prune: "pruning",
          "Health check": "observation",
        };

        return tasks.filter((task) => {
          const preferenceKey = TASK_TYPE_MAP[task.task];
          return preferenceKey ? preferences[preferenceKey] : true;
        });
      },
    };
  }

  /**
   * Create a wrapper that implements the new interface but delegates to legacy static methods
   */
  private static createLegacyDynamicSchedulingWrapper(): IDynamicSchedulingService {
    return {
      async recordTaskCompletion(plantId, taskType, scheduledDate, actualCompletionDate, careActivityId, plantStage) {
        ServiceMigrationHelper.logMigrationWarning('DynamicSchedulingService', 'recordTaskCompletion');
        return LegacyDynamicSchedulingService.recordTaskCompletion(
          plantId,
          taskType,
          scheduledDate,
          actualCompletionDate,
          careActivityId,
          plantStage
        );
      },

      async getCompletionPatterns(plantId, taskType) {
        ServiceMigrationHelper.logMigrationWarning('DynamicSchedulingService', 'getCompletionPatterns');
        const legacyResult = await LegacyDynamicSchedulingService.getCompletionPatterns(plantId, taskType);
        return {
          ...legacyResult,
          totalCompletions: 0, // Legacy service doesn't provide this, default to 0
          lastCompletion: undefined, // Legacy service doesn't provide this
        };
      },

      async getNextDueDateForTask(plantId, taskType) {
        ServiceMigrationHelper.logMigrationWarning('DynamicSchedulingService', 'getNextDueDateForTask');
        return LegacyDynamicSchedulingService.getNextDueDateForTask(plantId, taskType, new Date());
      },

      async getAdjustmentRecommendations(plantId) {
        ServiceMigrationHelper.logMigrationWarning('DynamicSchedulingService', 'getAdjustmentRecommendations');
        return LegacyDynamicSchedulingService.getSchedulingAdjustments(plantId);
      },
    };
  }
}

/**
 * Legacy Static Service Adapters
 * These provide static method compatibility while using the new instance-based services
 */
export class CareSchedulingServiceAdapter {
  static async getUpcomingTasks() {
    const service = ServiceMigrationHelper.getCareSchedulingService();
    return service.getUpcomingTasks();
  }

  static async getTasksForPlant(plant: any) {
    const service = ServiceMigrationHelper.getCareSchedulingService();
    return service.getTasksForPlant(plant.id);
  }

  static async getNextTaskForPlant(plantId: string) {
    const service = ServiceMigrationHelper.getCareSchedulingService();
    const tasks = await service.getTasksForPlant(plantId);
    return tasks.length > 0 ? tasks[0] : null;
  }

  static calculateNextDueDate(activityType: string, lastDate: Date, plant: unknown, variety: unknown) {
    const service = ServiceMigrationHelper.getCareSchedulingService();
    return service.calculateNextDueDate(activityType as any, lastDate, plant as any, variety as any);
  }

  static filterTasksByPreferences(tasks: unknown[], preferences: unknown) {
    const service = ServiceMigrationHelper.getCareSchedulingService();
    return service.filterTasksByPreferences(tasks as any, preferences as any);
  }
}

export class DynamicSchedulingServiceAdapter {
  static async recordTaskCompletion(...args: Parameters<IDynamicSchedulingService['recordTaskCompletion']>) {
    const service = ServiceMigrationHelper.getDynamicSchedulingService();
    return service.recordTaskCompletion(...args);
  }

  static async getCompletionPatterns(plantId: string, taskType: string) {
    const service = ServiceMigrationHelper.getDynamicSchedulingService();
    return service.getCompletionPatterns(plantId, taskType as any);
  }

  static async getNextDueDateForTask(plantId: string, taskType: string) {
    const service = ServiceMigrationHelper.getDynamicSchedulingService();
    return service.getNextDueDateForTask(plantId, taskType as any);
  }

  static async getSchedulingAdjustments(plantId?: string) {
    const service = ServiceMigrationHelper.getDynamicSchedulingService();
    if (!plantId) {
      return [];
    }
    return service.getAdjustmentRecommendations(plantId);
  }
}