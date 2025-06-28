// Create new file: src/services/StageManagementService.ts

import { plantService, varietyService } from "@/types/database";
import { GrowthStage } from "@/types/core";
import { ProtocolTranspilerService } from "./ProtocolTranspilerService";
import { FirebaseScheduledTaskService } from "./firebase/scheduledTaskService";
import { toast } from "react-hot-toast";

export class StageManagementService {
  /**
   * Confirms a new growth stage for a plant, updates its record,
   * and recalculates all future scheduled tasks based on this new anchor point.
   * @param plantId - The ID of the plant being updated.
   * @param newStage - The new GrowthStage confirmed by the user.
   * @param userId - The ID of the current user.
   */
  static async confirmNewStage(
    plantId: string,
    newStage: GrowthStage,
    userId: string
  ): Promise<void> {
    const plant = await plantService.getPlant(plantId);
    if (!plant) throw new Error("Plant not found during stage update.");

    const variety = await varietyService.getVariety(plant.varietyId);
    if (!variety)
      throw new Error("Variety information could not be loaded for the plant.");

    // 1. Update the plant record with the new confirmed stage and date.
    await plantService.updatePlant(plantId, {
      confirmedStage: newStage,
      stageConfirmedDate: new Date(),
      updatedAt: new Date(),
    });

    // 2. Delete all future pending tasks for this plant.
    // NOTE: We will implement 'deletePendingTasksForPlant' in a later step.
    await FirebaseScheduledTaskService.deletePendingTasksForPlant(plantId);

    // 3. Recalculate and create new tasks from this new anchor date.
    // NOTE: We will implement 'transpileProtocolFromStage' in a later step.
    const updatedPlant = {
      ...plant,
      confirmedStage: newStage,
      stageConfirmedDate: new Date(),
    };
    const newTasks = await ProtocolTranspilerService.transpileProtocolFromStage(
      updatedPlant,
      variety,
      newStage
    );

    if (newTasks.length > 0) {
      await FirebaseScheduledTaskService.createMultipleTasks(newTasks, userId);
      toast.success(`${newTasks.length} new care tasks have been scheduled.`);
    }
  }
}
