// src/services/PlantRegistrationService.ts
import { PlantRecord } from "@/types";
import {
  ProtocolTranspilerService,
  ScheduledTask,
} from "./ProtocolTranspilerService";
import { plantService, varietyService } from ".";
import { generateUUID } from "@/utils/cn";
import { FirebaseScheduledTaskService } from "./firebase/scheduledTaskService";

// We'll need to add this to the database later
const scheduledTasksStore: ScheduledTask[] = []; // Temporary storage until database is updated

export class PlantRegistrationService {
  /**
   * Complete plant registration workflow with fertilization scheduling
   */
  static async registerPlant(plantData: PlantRecord, userId: string): Promise<void> {
    try {
      // Remove the generated fields before passing to addPlant
      const { ...plantDataForDb } = plantData;
      await plantService.addPlant(plantDataForDb);

      const variety = await varietyService.getVariety(plantData.varietyId);
      if (!variety) {
        throw new Error(`Variety not found: ${plantData.varietyId}`);
      }

      if (variety.protocols?.fertilization) {
        const scheduledTasks =
          await ProtocolTranspilerService.transpilePlantProtocol(
            plantData,
            variety
          );
        
        // Save tasks to Firebase instead of temporary store
        if (scheduledTasks.length > 0) {
          await FirebaseScheduledTaskService.createMultipleTasks(scheduledTasks, userId);
          console.log(`✅ Created ${scheduledTasks.length} scheduled tasks for plant ${plantData.id}`);
        }
        
        // Keep temporary store for backward compatibility during migration
        scheduledTasksStore.push(...scheduledTasks);
      }
    } catch (error) {
      // In the rollback, use the original plantData.id
      try {
        await plantService.deletePlant(plantData.id);
      } catch (rollbackError) {
        console.error("Failed to rollback plant creation:", rollbackError);
      }
      throw new Error(`Failed to register plant: ${(error as Error).message}`);
    }
  }

  /**
   * Register plant from form data
   */
  static async createPlantFromForm(formData: {
    varietyId: string;
    name?: string;
    plantedDate: Date;
    location: string;
    container: string;
    soilMix?: string;
    notes?: string[];
    quantity?: number;
    reminderPreferences?: {
      watering: boolean;
      fertilizing: boolean;
      observation: boolean;
      lighting: boolean;
      pruning: boolean;
    };
  }, userId: string): Promise<PlantRecord> {
    // Get variety info for name
    const variety = await varietyService.getVariety(formData.varietyId);
    if (!variety) {
      throw new Error(`Variety not found: ${formData.varietyId}`);
    }

    // Generate unique ID
    const plantId = generateUUID(); // ✅ Use your custom function

    const plant: PlantRecord = {
      id: plantId,
      varietyId: formData.varietyId,
      varietyName: variety.name,
      name: formData.name,
      plantedDate: formData.plantedDate,
      location: formData.location,
      container: formData.container,
      soilMix: formData.soilMix,
      isActive: true,
      notes: formData.notes,
      quantity: formData.quantity || 1,
      reminderPreferences: formData.reminderPreferences || {
        watering: true,
        fertilizing: true,
        observation: true,
        lighting: true,
        pruning: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.registerPlant(plant, userId);
    return plant;
  }

  /**
   * Get scheduled tasks for a plant (temporary method until database is updated)
   */
  static getScheduledTasksForPlant(plantId: string): ScheduledTask[] {
    return scheduledTasksStore.filter((task) => task.plantId === plantId);
  }

  /**
   * Get all pending fertilization tasks (temporary method)
   */
  static getPendingFertilizationTasks(): ScheduledTask[] {
    return scheduledTasksStore.filter(
      (task) => task.status === "pending" && task.taskType === "fertilize"
    );
  }

  /**
   * Regenerate scheduled tasks for an existing plant
   * This is useful when protocols are updated or plant details change
   */
  static async regenerateTasksForPlant(plantData: PlantRecord, userId: string): Promise<void> {
    try {
      console.log(`🔄 Regenerating tasks for plant ${plantData.id}...`);
      
      // Delete existing pending tasks for this plant
      await FirebaseScheduledTaskService.deletePendingTasksForPlant(plantData.id, userId);
      
      const variety = await varietyService.getVariety(plantData.varietyId);
      if (!variety) {
        throw new Error(`Variety not found: ${plantData.varietyId}`);
      }

      if (variety.protocols?.fertilization) {
        const scheduledTasks =
          await ProtocolTranspilerService.transpilePlantProtocol(
            plantData,
            variety
          );
        
        // Save new tasks to Firebase
        if (scheduledTasks.length > 0) {
          await FirebaseScheduledTaskService.createMultipleTasks(scheduledTasks, userId);
          console.log(`✅ Regenerated ${scheduledTasks.length} scheduled tasks for plant ${plantData.id}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to regenerate tasks for plant ${plantData.id}:`, error);
      throw new Error(`Failed to regenerate tasks: ${(error as Error).message}`);
    }
  }
}
