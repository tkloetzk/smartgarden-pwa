import { PlantRecord, VarietyRecord } from "@/types";
import { ProtocolTranspilerService, TaskGenerationOptions } from "./ProtocolTranspilerService";
import { FirebaseScheduledTaskService } from "./firebase/scheduledTaskService";

/**
 * Centralized service for managing plant task generation and regeneration
 * Eliminates duplication across multiple services
 */
export class TaskManagementService {
  /**
   * Generate and save tasks for a new plant
   */
  static async generateTasksForPlant(
    plant: PlantRecord,
    variety: VarietyRecord,
    userId: string,
    callContext: string,
    options: TaskGenerationOptions = {}
  ): Promise<void> {
    if (!variety.protocols?.fertilization) {
      console.log(`No fertilization protocols for ${plant.name} (${variety.name})`);
      return;
    }

    console.log(`🌱 Generating tasks for ${plant.name} via ${callContext}`);

    const scheduledTasks = await ProtocolTranspilerService.transpilePlantProtocol(
      plant,
      variety,
      {
        futureHorizonDays: 21, // 3 weeks ahead
        pastHorizonDays: 14,   // 2 weeks behind for overdue tasks
        callContext,
        ...options
      }
    );

    if (scheduledTasks.length > 0) {
      await FirebaseScheduledTaskService.createMultipleTasks(scheduledTasks, userId);
      console.log(`✅ Created ${scheduledTasks.length} scheduled tasks for plant ${plant.id}`);
    } else {
      console.log(`ℹ️ No tasks generated for plant ${plant.id}`);
    }
  }

  /**
   * Regenerate tasks for an existing plant (deletes old pending tasks first)
   */
  static async regenerateTasksForPlant(
    plant: PlantRecord,
    variety: VarietyRecord,
    userId: string,
    callContext: string,
    options: TaskGenerationOptions = {}
  ): Promise<void> {
    console.log(`🔄 Regenerating tasks for ${plant.name} via ${callContext}`);

    // Delete existing pending tasks for this plant to avoid duplicates
    await FirebaseScheduledTaskService.deletePendingTasksForPlant(plant.id, userId);

    // Generate new tasks
    await this.generateTasksForPlant(plant, variety, userId, callContext, options);
    
    console.log(`✅ Regenerated tasks for plant ${plant.id}`);
  }

  /**
   * Bulk regenerate tasks for multiple plants (used by dashboard sync)
   */
  static async bulkRegenerateTasksForPlants(
    plants: PlantRecord[],
    getVariety: (plantId: string) => VarietyRecord | undefined,
    userId: string,
    callContext: string = "bulk-regenerate"
  ): Promise<void> {
    console.log(`🔄 Bulk regenerating tasks for ${plants.length} plants`);

    for (const plant of plants) {
      const variety = getVariety(plant.id);
      if (!variety || !variety.protocols?.fertilization) {
        continue;
      }

      await this.regenerateTasksForPlant(plant, variety, userId, `${callContext}/${plant.id}`);
    }

    console.log(`✅ Bulk regeneration completed for ${plants.length} plants`);
  }
}