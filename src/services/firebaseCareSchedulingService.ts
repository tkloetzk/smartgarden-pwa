// src/services/firebaseCareSchedulingService.ts
import { PlantRecord } from "@/types/database";
import { GrowthStage, CareActivityType, UpcomingTask } from "@/types";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { addDays, differenceInDays } from "date-fns";
import { DynamicSchedulingService } from "./dynamicSchedulingService";
import {
  formatDueIn,
  calculatePriority,
  ensureDateObject,
} from "@/utils/dateUtils";
import { Logger } from "@/utils/logger";
import { seedVarieties, SeedVariety } from "@/data/seedVarieties";
import { CareRecord } from "@/types";

interface TaskConfig {
  type: CareActivityType;
  taskName: string;
  category: "watering" | "fertilizing" | "observation" | "maintenance";
  dueSoonThreshold: number; // days
  fallbackInterval: number; // days for new plants
}

const TASK_CONFIGS: Record<string, TaskConfig> = {
  water: {
    type: "water",
    taskName: "Check water level",
    category: "watering",
    dueSoonThreshold: 2,
    fallbackInterval: 1,
  },
  observe: {
    type: "observe",
    taskName: "Health check",
    category: "observation",
    dueSoonThreshold: 1,
    fallbackInterval: 3,
  },
};

const TASK_TYPE_MAP: Record<
  string,
  keyof NonNullable<PlantRecord["reminderPreferences"]>
> = {
  "Check water level": "watering",
  Water: "watering",
  Fertilize: "fertilizing",
  Observe: "observation",
  "Check lighting": "lighting",
  Prune: "pruning",
  "Health check": "observation",
};

export class FirebaseCareSchedulingService {
  /**
   * Get upcoming tasks using Firebase plant and activity data
   */
  public static async getUpcomingTasks(
    plants: PlantRecord[],
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask[]> {
    try {
      const allTasks: UpcomingTask[] = [];

      // Group plants by variety, container, planting date, and conditions
      const plantGroups = this.groupPlantsForTasks(plants);
      
      for (const group of plantGroups) {
        if (group.isGroup && group.plants.length > 1) {
          // For plant groups (multiple plants with same conditions), create grouped tasks
          const groupTasks = await this.getTasksForGroup(group, getLastActivityByType);
          allTasks.push(...groupTasks);
        } else {
          // For individual plants, create tasks per plant as before
          for (const plant of group.plants) {
            const plantTasks = await this.getTasksForPlant(plant, getLastActivityByType);
            const filteredTasks = this.filterTasksByPreferences(plant, plantTasks);
            allTasks.push(...filteredTasks);
          }
        }
      }

      return allTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    } catch (error) {
      Logger.error("Error getting upcoming tasks:", error);
      console.error("❌ Firebase care scheduling error:", error);
      return [];
    }
  }

  /**
   * Get next task for a specific plant
   */
  public static async getNextTaskForPlant(
    plant: PlantRecord,
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask | null> {
    const tasks = await this.getTasksForPlant(plant, getLastActivityByType);
    const filteredTasks = this.filterTasksByPreferences(plant, tasks);

    return filteredTasks.length > 0 ? filteredTasks[0] : null;
  }

  private static async getTasksForPlant(
    plant: PlantRecord,
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask[]> {
    try {
      // Find variety by name in seed data instead of IndexedDB lookup
      const seedVariety = seedVarieties.find((v: SeedVariety) => v.name === plant.varietyName);
      
      if (!seedVariety) {
        console.warn(`No variety found for ${plant.varietyName}`);
        return [];
      }

      // Convert SeedVariety to VarietyRecord format for compatibility
      const variety = {
        id: plant.varietyId || 'seed-variety',
        name: seedVariety.name,
        normalizedName: seedVariety.name.toLowerCase(),
        category: seedVariety.category,
        description: undefined,
        growthTimeline: {
          germination: seedVariety.growthTimeline.germination || 14,
          seedling: seedVariety.growthTimeline.seedling || 14,
          vegetative: seedVariety.growthTimeline.vegetative || 28,
          maturation: seedVariety.growthTimeline.maturation || 56,
          rootDevelopment: seedVariety.growthTimeline.rootDevelopment
        },
        protocols: seedVariety.protocols,
        isEverbearing: seedVariety.isEverbearing,
        productiveLifespan: seedVariety.productiveLifespan,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const currentStage = calculateCurrentStageWithVariety(
        plant.plantedDate,
        variety
      );

      const tasks: UpcomingTask[] = [];

      const wateringTask = await this.createTaskForType(
        plant,
        currentStage,
        "water",
        getLastActivityByType
      );
      if (wateringTask) tasks.push(wateringTask);

      const observationTask = await this.createTaskForType(
        plant,
        currentStage,
        "observe",
        getLastActivityByType
      );
      if (observationTask) tasks.push(observationTask);
      return tasks;
    } catch (error) {
      console.error(`❌ Error processing tasks for plant ${plant.id}:`, error);
      Logger.error(`Error processing tasks for plant ${plant.id}:`, error);
      return [];
    }
  }

  private static async createTaskForType(
    plant: PlantRecord,
    currentStage: GrowthStage,
    taskType: keyof typeof TASK_CONFIGS,
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask | null> {
    const config = TASK_CONFIGS[taskType];
    if (!config) return null;

    const nextDueDate = await this.calculateNextDueDate(
      plant,
      config.type,
      config.fallbackInterval,
      getLastActivityByType
    );

    const today = new Date();
    let thresholdDays = config.dueSoonThreshold;
    
    // For watering tasks, check if last watering was partial and extend threshold
    if (taskType === "water") {
      const lastActivity = await getLastActivityByType(plant.id, "water");
      if (lastActivity?.details.isPartialWatering) {
        thresholdDays = 7; // Show partial watering follow-up tasks for up to a week
      }
    }
    
    const thresholdDate = addDays(today, thresholdDays);
    
    // Create task if it's due today/overdue OR within the threshold
    if (nextDueDate <= thresholdDate) {
      const daysOverdue = differenceInDays(today, nextDueDate);
      
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
  }

  private static async calculateNextDueDate(
    plant: PlantRecord,
    activityType: CareActivityType,
    fallbackInterval: number,
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<Date> {
    const lastActivity = await getLastActivityByType(plant.id, activityType);

    // For watering tasks, also check if recent fertilizer applications should count as watering
    if (activityType === "water") {
      const lastFertilizerActivity = await getLastActivityByType(plant.id, "fertilize");
      
      if (lastFertilizerActivity) {
        console.log(`🔍 Checking fertilizer for plant ${plant.id}:`, {
          fertilizerDate: lastFertilizerActivity.date,
          amount: lastFertilizerActivity.details?.amount,
          shouldCount: this.shouldFertilizerCountAsWatering(lastFertilizerActivity)
        });
      }
      
      // If we have a recent fertilizer activity that involved significant water
      if (lastFertilizerActivity && this.shouldFertilizerCountAsWatering(lastFertilizerActivity)) {
        const fertilizerDate = ensureDateObject(lastFertilizerActivity.date);
        
        // Use the more recent of water or fertilizer activity
        if (!lastActivity || fertilizerDate > ensureDateObject(lastActivity.date)) {
          console.log(`✅ Using fertilizer date for watering schedule: ${fertilizerDate}`);
          return await DynamicSchedulingService.getNextDueDateForTask(
            plant.id,
            activityType,
            fertilizerDate
          );
        }
      }
    }

    if (lastActivity) {
      const lastActivityDate = ensureDateObject(lastActivity.date);
      return await DynamicSchedulingService.getNextDueDateForTask(
        plant.id,
        activityType,
        lastActivityDate
      );
    } else {
      const daysSincePlanting = differenceInDays(new Date(), plant.plantedDate);
      return daysSincePlanting > fallbackInterval
        ? new Date()
        : addDays(plant.plantedDate, fallbackInterval);
    }
  }

  /**
   * Determines if a fertilizer application should count as watering based on water volume
   */
  private static shouldFertilizerCountAsWatering(fertilizerActivity: CareRecord): boolean {
    const details = fertilizerActivity.details;
    
    // Check if there's an application amount that indicates significant water volume
    if (details?.amount) {
      // Handle both string format "20 fl oz" and object format { value: 20, unit: "fl oz" }
      let amount: number;
      let unit: string;
      
      if (typeof details.amount === 'string') {
        // Parse string format like "20 fl oz"
        const match = details.amount.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
        if (match) {
          amount = parseFloat(match[1]);
          unit = match[2].toLowerCase();
        } else {
          console.log(`❌ Could not parse fertilizer amount: "${details.amount}"`);
          return false;
        }
      } else if (typeof details.amount === 'object' && details.amount.value && details.amount.unit) {
        // Handle object format
        amount = details.amount.value;
        unit = details.amount.unit.toLowerCase();
      } else {
        console.log(`❌ Fertilizer amount format not recognized:`, details.amount);
        return false;
      }
      
      // Convert to fluid ounces for consistent comparison
      let fluidOunces = 0;
      if (unit === 'fl oz' || unit === 'oz') {
        fluidOunces = amount;
      } else if (unit === 'cup' || unit === 'cups') {
        fluidOunces = amount * 8; // 8 fl oz per cup
      } else if (unit === 'gallon' || unit === 'gal') {
        fluidOunces = amount * 128; // 128 fl oz per gallon
      } else if (unit === 'liter' || unit === 'l') {
        fluidOunces = amount * 33.814; // ~33.8 fl oz per liter
      }
      
      console.log(`🧪 Fertilizer analysis: ${amount} ${unit} = ${fluidOunces} fl oz (threshold: 4 fl oz)`);
      
      // Consider it watering if application is >= 4 fl oz (significant liquid fertilizer application)
      const shouldCount = fluidOunces >= 4;
      console.log(`${shouldCount ? '✅' : '❌'} Fertilizer ${shouldCount ? 'counts' : 'does not count'} as watering`);
      return shouldCount;
    }
    
    // Check for legacy text-based notes that might indicate watering
    const notes = details?.notes?.toLowerCase() || '';
    const waterKeywords = ['watered', 'liquid', 'solution', 'drench', 'oz', 'cup', 'gallon', 'ml', 'liter'];
    const hasWaterKeywords = waterKeywords.some(keyword => notes.includes(keyword));
    
    if (hasWaterKeywords) {
      console.log(`✅ Fertilizer counts as watering based on notes: "${notes}"`);
    } else {
      console.log(`❌ No sufficient liquid volume or water keywords found`);
    }
    
    return hasWaterKeywords;
  }

  private static filterTasksByPreferences(
    plant: PlantRecord,
    tasks: UpcomingTask[]
  ): UpcomingTask[] {
    if (!plant.reminderPreferences) return tasks;

    return tasks.filter((task) => {
      const preferenceKey = TASK_TYPE_MAP[task.task];
      return preferenceKey ? plant.reminderPreferences![preferenceKey] : true;
    });
  }

  /**
   * Group plants for task generation - group by variety, container, planting date, and conditions
   */
  private static groupPlantsForTasks(plants: PlantRecord[]) {
    interface PlantGroup {
      key: string;
      plants: PlantRecord[];
      isGroup: boolean;
      container?: string;
      section?: string;
      varietyName?: string;
      plantCount: number;
    }

    const groups = new Map<string, PlantGroup>();

    for (const plant of plants) {
      // Create grouping key based on variety, container, planting date, and location
      const plantedDateStr = plant.plantedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const location = plant.location || 'unknown';
      const soilMix = plant.soilMix || 'default';
      
      // Check if this plant has section information (raised bed style)
      const hasSection = plant.section || plant.structuredSection;
      
      if (hasSection) {
        // Group by container + variety + section for plants with sections
        const sectionKey = `section_${plant.container}_${plant.varietyName}_${plant.section || 'section'}_${plantedDateStr}`;
        
        if (!groups.has(sectionKey)) {
          groups.set(sectionKey, {
            key: sectionKey,
            plants: [],
            isGroup: true,
            container: plant.container,
            section: plant.section,
            varietyName: plant.varietyName,
            plantCount: 0,
          });
        }
        
        const group = groups.get(sectionKey)!;
        group.plants.push(plant);
        group.plantCount = group.plants.length;
      } else {
        // Group plants by variety, container, planting date, location, and soil mix
        const groupKey = `group_${plant.varietyName}_${plant.container}_${plantedDateStr}_${location}_${soilMix}`;
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            key: groupKey,
            plants: [],
            isGroup: true,
            container: plant.container,
            varietyName: plant.varietyName,
            plantCount: 0,
          });
        }
        
        const group = groups.get(groupKey)!;
        group.plants.push(plant);
        group.plantCount = group.plants.length;
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Generate tasks for a plant group (multiple plants with same conditions)
   */
  private static async getTasksForGroup(
    group: { key: string; plants: PlantRecord[]; container?: string; section?: string; varietyName?: string; plantCount: number },
    getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>
  ): Promise<UpcomingTask[]> {
    if (group.plants.length === 0) return [];

    // Use the first plant as representative for the group
    const representativePlant = group.plants[0];
    
    // Generate tasks for the representative plant
    const plantTasks = await this.getTasksForPlant(representativePlant, getLastActivityByType);
    const filteredTasks = this.filterTasksByPreferences(representativePlant, plantTasks);

    // Modify task details to reflect group instead of individual plant
    return filteredTasks.map(task => ({
      ...task,
      id: `${task.type}-group-${group.key}`,
      plantId: group.key, // Use group key instead of individual plant ID
      plantName: `${group.container} (${group.plantCount}x ${group.varietyName})${group.section ? ` - ${group.section}` : ''}`,
    }));
  }

}