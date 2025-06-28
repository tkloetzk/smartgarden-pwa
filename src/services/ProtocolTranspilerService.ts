// src/services/ProtocolTranspilerService.ts
import {
  PlantRecord,
  VarietyRecord,
  GrowthStage,
  CareActivityType,
  FertilizationScheduleItem,
  GrowthTimeline,
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

// Define the canonical order of growth stages
const STAGE_ORDER: GrowthStage[] = [
  "germination",
  "seedling",
  "vegetative",
  "flowering",
  "fruiting",
  "maturation",
  "ongoing-production",
  "harvest",
];

export class ProtocolTranspilerService {
  static async transpileProtocolFromStage(
    plant: PlantRecord,
    variety: VarietyRecord,
    startStage: GrowthStage,
    anchorDate: Date = new Date()
  ): Promise<ScheduledTask[]> {
    const tasks: ScheduledTask[] = [];
    if (!variety.protocols?.fertilization) {
      return tasks;
    }

    const startStageIndex = STAGE_ORDER.indexOf(startStage);
    if (startStageIndex === -1) {
      console.error(`Invalid start stage provided: ${startStage}`);
      return [];
    }

    const anchorStageStartDays = this.calculateStageStartDays(
      variety.growthTimeline,
      startStage
    );

    // --- REVISED LOGIC: Iterate over the canonical STAGE_ORDER ---
    for (let i = startStageIndex; i < STAGE_ORDER.length; i++) {
      const currentStage = STAGE_ORDER[i];
      const stageProtocol = variety.protocols.fertilization[currentStage];

      if (!stageProtocol || !stageProtocol.schedule) {
        continue;
      }

      const stageStartDays = this.calculateStageStartDays(
        variety.growthTimeline,
        currentStage
      );

      // This is the offset from our new anchor date
      const daysFromAnchor = stageStartDays - anchorStageStartDays;

      for (const scheduleItem of stageProtocol.schedule) {
        const taskInstances = this.createTaskInstances(
          plant,
          currentStage,
          scheduleItem,
          anchorDate, // Use the new anchor date
          daysFromAnchor // Use the calculated offset
        );
        tasks.push(...taskInstances);
      }
    }

    return tasks;
  }

  static async transpilePlantProtocol(
    plant: PlantRecord,
    variety: VarietyRecord
  ): Promise<ScheduledTask[]> {
    return this.transpileProtocolFromStage(
      plant,
      variety,
      "germination",
      plant.plantedDate
    );
  }
  private static calculateStageStartDays(
    growthTimeline: GrowthTimeline, // Corrected from Record<string, number>
    stageName: GrowthStage
  ): number {
    switch (stageName) {
      case "germination":
        return 0;
      case "seedling":
        return growthTimeline.germination;
      case "vegetative":
        return growthTimeline.germination + growthTimeline.seedling;
      case "flowering":
        return (
          growthTimeline.germination +
          growthTimeline.seedling +
          growthTimeline.vegetative
        );
      case "fruiting":
      case "maturation":
      case "ongoing-production":
      case "harvest":
        return growthTimeline.maturation;
      default:
        console.warn(
          `Unknown stage name: ${stageName} in calculateStageStartDays`
        );
        return 0;
    }
  }

  /**
   * Create individual task instances for a schedule item
   */
  private static createTaskInstances(
    plant: PlantRecord,
    stage: GrowthStage,
    scheduleItem: FertilizationScheduleItem,
    anchorDate: Date,
    stageStartDays: number
  ): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    const absoluteStartDays = stageStartDays + scheduleItem.startDays;

    for (let i = 0; i < scheduleItem.repeatCount; i++) {
      const dueDate = new Date(anchorDate);
      dueDate.setDate(
        dueDate.getDate() + absoluteStartDays + i * scheduleItem.frequencyDays
      );

      // Skip tasks that would have been in the past relative to today
      if (dueDate < new Date()) {
        continue;
      }

      const taskId = `${plant.id}-${stage}-${scheduleItem.taskName
        .replace(/\s+/g, "-")
        .toLowerCase()}-${i}-${new Date().getTime()}`;

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
          isDynamic: true, // Mark as dynamically scheduled
        },
        priority: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return tasks;
  }
}
