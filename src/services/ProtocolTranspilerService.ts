// src/services/ProtocolTranspilerService.ts
import {
  PlantRecord,
  VarietyRecord,
  GrowthStage,
  CareActivityType,
  FertilizationScheduleItem,
  GrowthTimeline,
  ApplicationMethod,
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
    method: ApplicationMethod;
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

    const anchorStageStartDays = this.calculateStageStartDaysForAnyStage(
      variety.growthTimeline,
      startStage
    );

    // Process all fertilization protocol stages defined in the variety
    const fertilizationStages = Object.keys(variety.protocols.fertilization);
    
    for (const stageName of fertilizationStages) {
      const stageProtocol = variety.protocols.fertilization[stageName as keyof typeof variety.protocols.fertilization];

      if (!stageProtocol || !stageProtocol.schedule) {
        continue;
      }

      // Calculate stage start days using timeline data or custom stages
      const stageStartDays = this.calculateStageStartDaysForAnyStage(
        variety.growthTimeline,
        stageName
      );



      // Check if this stage should be included based on the startStage parameter
      const currentStageIndex = STAGE_ORDER.indexOf(stageName as GrowthStage);
      if (currentStageIndex !== -1 && currentStageIndex < startStageIndex) {
        // Skip stages that come before our start stage in the canonical order
        continue;
      }

      // For existing plants, we want to include ongoing stages even if they started before our anchor
      // Skip stages that haven't started yet relative to the plant's actual age
      const plantAge = Math.floor((anchorDate.getTime() - plant.plantedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If this is an existing plant (plantAge > 7) and we're using current date as anchor,
      // include stages that are currently active or will be active
      if (plantAge > 7) {
        // Skip stages that won't start for a while yet (more than 30 days from plant age)
        if (stageStartDays > plantAge + 30) {
          continue;
        }
      } else {
        // For new plants, also check against anchor stage start days
        if (stageStartDays < anchorStageStartDays) {
          continue;
        }
      }

      // This is the offset from our new anchor date (not used with current implementation)
      // const daysFromAnchor = stageStartDays - anchorStageStartDays;

      for (const scheduleItem of stageProtocol.schedule) {
        const taskInstances = this.createTaskInstances(
          plant,
          stageName as GrowthStage,
          scheduleItem,
          anchorDate, // Use the new anchor date
          stageStartDays // Pass the actual stage start days, not the offset
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
    // For existing plants, we need to generate tasks from current date, not from germination
    const now = new Date();
    const plantAge = Math.floor((now.getTime() - plant.plantedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If plant is new (less than 7 days), generate from germination
    if (plantAge < 7) {
      return this.transpileProtocolFromStage(
        plant,
        variety,
        "germination",
        plant.plantedDate
      );
    }
    
    // For existing plants, determine current stage and generate future tasks from now
    const currentStage = this.determineCurrentStage(variety.growthTimeline, plantAge);
    
    return this.transpileProtocolFromStage(
      plant,
      variety,
      currentStage,
      now // Use current date as anchor for existing plants
    );
  }

  private static determineCurrentStage(
    growthTimeline: any,
    plantAge: number
  ): GrowthStage {
    // Calculate cumulative days for each standard stage
    const germinationEnd = growthTimeline.germination || 0;
    const establishmentEnd = germinationEnd + (growthTimeline.establishment || 0);
    const vegetativeEnd = establishmentEnd + (growthTimeline.vegetative || 0);
    const floweringEnd = vegetativeEnd + (growthTimeline.flowering || 0);
    const fruitingEnd = floweringEnd + (growthTimeline.fruiting || 0);
    
    if (plantAge < germinationEnd) return "germination";
    if (plantAge < establishmentEnd) return "seedling"; // establishment maps to seedling stage
    if (plantAge < vegetativeEnd) return "vegetative";
    if (plantAge < floweringEnd) return "flowering";
    if (plantAge < fruitingEnd) return "fruiting";
    
    // After fruiting, most plants go to maturation or ongoing production
    return "ongoing-production";
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

  private static calculateStageStartDaysForAnyStage(
    growthTimeline: any, // Use any to handle extended timelines
    stageName: string
  ): number {
    // Handle special berry stages BEFORE checking timeline directly
    // This prevents returning duration instead of start day
    switch (stageName) {
      case "caneEstablishment":
      case "establishment":
        return growthTimeline.germination || 0; // These start after germination
      case "vegetative":
        // For strawberries: germination (14) + establishment (14) = 28
        return (growthTimeline.germination || 0) + (growthTimeline.establishment || growthTimeline.seedling || 0);
      case "flowering":
        // For strawberries: germination (14) + establishment (14) + vegetative (28) = 56
        return (growthTimeline.germination || 0) + 
               (growthTimeline.establishment || growthTimeline.seedling || 0) + 
               (growthTimeline.vegetative || 0);
      case "fruiting":
        // For strawberries: germination (14) + establishment (14) + vegetative (28) + flowering (28) = 84
        return (growthTimeline.germination || 0) + 
               (growthTimeline.establishment || growthTimeline.seedling || 0) + 
               (growthTimeline.vegetative || 0) + 
               (growthTimeline.flowering || 0);
      case "floweringFruiting":
        // Use floweringFruiting from timeline if available, otherwise use flowering stage
        return growthTimeline.floweringFruiting || 
               growthTimeline.flowering || 
               (growthTimeline.germination || 0) + (growthTimeline.seedling || 0) + (growthTimeline.vegetative || 0);
      case "ongoing":
      case "ongoing-production":
      case "ongoingProduction":
        // Calculate ongoing production start day as sum of all previous stage durations
        const germinationDays = growthTimeline.germination || 0;
        const establishmentDays = growthTimeline.establishment || growthTimeline.seedling || 0;
        const vegetativeDays = growthTimeline.vegetative || 0;
        const floweringDays = growthTimeline.flowering || 0;
        const fruitingDays = growthTimeline.fruiting || 0;
        return germinationDays + establishmentDays + vegetativeDays + floweringDays + fruitingDays;
    }

    // Try the standard stage calculation for STAGE_ORDER stages
    if (STAGE_ORDER.includes(stageName as GrowthStage)) {
      return this.calculateStageStartDays(growthTimeline, stageName as GrowthStage);
    }

    // Handle custom stages that might be directly defined in timeline
    // This should only be used for stages that ARE start days, not durations
    if (growthTimeline[stageName] !== undefined) {
      return growthTimeline[stageName];
    }

    console.warn(
      `Unknown stage name: ${stageName} in calculateStageStartDaysForAnyStage`
    );
    return 0;
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
    const now = new Date();
    const plantAge = Math.floor((now.getTime() - plant.plantedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // For existing plants using current date as anchor, we need different logic
    const isExistingPlant = plantAge > 7;
    
    if (isExistingPlant) {
      // For existing plants, calculate when tasks should have started relative to planted date
      // Special case: ongoingProduction stage startDays are absolute from planted date, not relative to stage start
      const taskStartDayFromPlanting = (stage === "ongoing-production") ? 
        scheduleItem.startDays : 
        stageStartDays + scheduleItem.startDays;
      const taskStartDate = new Date(plant.plantedDate.getTime() + taskStartDayFromPlanting * 24 * 60 * 60 * 1000);
      
      // If task hasn't started yet, generate normally from start date
      if (taskStartDate > now) {
        // Calculate timing for future task generation
        for (let i = 0; i < scheduleItem.repeatCount; i++) {
          const dueDate = new Date(taskStartDate.getTime() + i * scheduleItem.frequencyDays * 24 * 60 * 60 * 1000);
          if (dueDate >= now) {
            tasks.push(this.createTask(plant, stage, scheduleItem, dueDate, i));
          }
        }
      } else {
        // Task has already started - find next occurrence
        const daysSinceStart = Math.floor((now.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24));
        const missedCycles = Math.floor(daysSinceStart / scheduleItem.frequencyDays);
        
        
        // Generate upcoming tasks (including potentially overdue ones)
        // For ongoing production, extend beyond original repeat count if needed
        const maxTasks = stage === "ongoing-production" ? Math.max(scheduleItem.repeatCount, missedCycles + 10) : scheduleItem.repeatCount;
        
        for (let i = missedCycles; i < maxTasks; i++) {
          const dueDate = new Date(taskStartDate.getTime() + i * scheduleItem.frequencyDays * 24 * 60 * 60 * 1000);
          
          // Include tasks from up to 14 days ago (for overdue) and all future tasks
          const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= -14) { // Include overdue tasks up to 14 days old
            tasks.push(this.createTask(plant, stage, scheduleItem, dueDate, i));
          }
        }
      }
    } else {
      // Logic for new plants - use anchor date as stage start if provided, otherwise calculate from planted date
      // If anchorDate equals plant.plantedDate, we're generating from germination and need to calculate stage start
      // If anchorDate is different, it represents a custom stage start date
      const isFromPlantedDate = Math.abs(anchorDate.getTime() - plant.plantedDate.getTime()) < 1000; // Within 1 second
      const stageStartDate = isFromPlantedDate ? 
        new Date(plant.plantedDate.getTime() + stageStartDays * 24 * 60 * 60 * 1000) :
        anchorDate;
      
      for (let i = 0; i < scheduleItem.repeatCount; i++) {
        const daysFromStageStart = scheduleItem.startDays + i * scheduleItem.frequencyDays;
        const dueDate = new Date(stageStartDate.getTime() + daysFromStageStart * 24 * 60 * 60 * 1000);

        // Skip tasks that would have been in the past relative to today
        if (dueDate < now) {
          continue;
        }
        
        tasks.push(this.createTask(plant, stage, scheduleItem, dueDate, i));
      }
    }

    return tasks;
  }

  private static createTask(
    plant: PlantRecord,
    stage: GrowthStage,
    scheduleItem: FertilizationScheduleItem,
    dueDate: Date,
    index: number
  ): ScheduledTask {
    const taskId = `${plant.id}-${stage}-${scheduleItem.taskName
      .replace(/\s+/g, "-")
      .toLowerCase()}-${index}-${new Date().getTime()}`;

    return {
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
    };
  }
}
