// src/services/ProtocolTranspilerService.ts
import {
  PlantRecord,
  VarietyRecord,
  GrowthStage,
  CareActivityType,
  FertilizationScheduleItem,
} from "@/types";

export interface ScheduledTask {
  id: string;
  plantId: string;
  taskName: string;
  taskType: CareActivityType;
  details: {
    type: "fertilize";
    product: string;
    dilution: string;
    amount: string;
    method: "soil-drench" | "foliar-spray" | "top-dress" | "mix-in-soil";
  };
  dueDate: Date;
  status: "pending" | "completed" | "skipped" | "bypassed";
  sourceProtocol: {
    stage: GrowthStage;
    originalStartDays: number;
    isDynamic: boolean;
  };
  coordinatedWith?: string[];
  priority?: "low" | "normal" | "high" | "critical";
  createdAt: Date;
  updatedAt: Date;
}

export class ProtocolTranspilerService {
  /**
   * Convert a plant's variety protocols into concrete scheduled tasks
   */
  static async transpilePlantProtocol(
    plant: PlantRecord,
    variety: VarietyRecord
  ): Promise<ScheduledTask[]> {
    const tasks: ScheduledTask[] = [];
    const plantedDate = new Date(plant.plantedDate);

    if (!variety.protocols?.fertilization) {
      return tasks;
    }

    // For each growth stage with fertilization
    for (const [stageName, stageProtocol] of Object.entries(
      variety.protocols.fertilization
    )) {
      const stageStartDays = this.calculateStageStartDays(
        variety.growthTimeline,
        stageName as GrowthStage
      );

      // For each scheduled task in that stage
      for (const scheduleItem of stageProtocol.schedule || []) {
        const taskInstances = this.createTaskInstances(
          plant,
          stageName as GrowthStage,
          scheduleItem,
          plantedDate,
          stageStartDays
        );
        tasks.push(...taskInstances);
      }
    }

    return tasks;
  }

  /**
   * Calculate when a growth stage starts (in days from planting)
   */
  private static calculateStageStartDays(
    growthTimeline: any,
    stageName: string
  ): number {
    // No mapping needed - direct lookup!
    if (growthTimeline[stageName] !== undefined) {
      return growthTimeline[stageName];
    }

    console.warn(`Stage '${stageName}' not found in growth timeline`);
    return 0;
  }

  /**
   * Create individual task instances for a schedule item
   */
  private static createTaskInstances(
    plant: PlantRecord,
    stage: GrowthStage,
    scheduleItem: FertilizationScheduleItem,
    plantedDate: Date,
    stageStartDays: number
  ): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    const absoluteStartDays = stageStartDays + scheduleItem.startDays;

    for (let i = 0; i < scheduleItem.repeatCount; i++) {
      const dueDate = new Date(plantedDate);
      dueDate.setDate(
        dueDate.getDate() + absoluteStartDays + i * scheduleItem.frequencyDays
      );

      const taskId = `${plant.id}-${stage}-${scheduleItem.taskName
        .replace(/\s+/g, "-")
        .toLowerCase()}-${i}`;

      tasks.push({
        id: taskId,
        plantId: plant.id,
        taskName: scheduleItem.taskName,
        taskType: "fertilize",
        details: {
          type: "fertilize",
          product: scheduleItem.details.product,
          dilution: scheduleItem.details.dilution || "As directed",
          amount: scheduleItem.details.amount || "Apply as needed",
          method: scheduleItem.details.method || "soil-drench",
        },
        dueDate,
        status: "pending",
        sourceProtocol: {
          stage,
          originalStartDays: scheduleItem.startDays,
          isDynamic: false,
        },
        priority: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return tasks;
  }
}
