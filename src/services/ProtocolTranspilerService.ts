// src/services/ProtocolTranspilerService.ts
import {
  PlantRecord,
  VarietyRecord,
  GrowthStage,
  GrowthTimeline,
  CareActivityType,
  FertilizationScheduleItem,
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

// Handle stage name aliases for protocols that use non-standard names
const STAGE_ALIASES: Record<string, GrowthStage> = {
  establishment: "seedling", // Some protocols use 'establishment' instead of 'seedling'
};

export interface TaskGenerationOptions {
  futureHorizonDays?: number; // How far into the future to generate tasks
  pastHorizonDays?: number; // How far into the past to include overdue tasks
  callContext?: string; // Track where this call is coming from for debugging
}

export class ProtocolTranspilerService {
  static async transpileProtocolFromStage(
    plant: PlantRecord,
    variety: VarietyRecord,
    startStage: GrowthStage,
    anchorDate: Date = new Date(),
    options: TaskGenerationOptions = {}
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

    // Calculate plant age once at the top of the function
    const plantAge = Math.floor(
      (anchorDate.getTime() - plant.plantedDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    // Process all fertilization protocol stages defined in the variety
    const fertilizationStages = Object.keys(variety.protocols.fertilization);
    const callContext = options.callContext || "unknown";

    for (const stageName of fertilizationStages) {
      const stageProtocol =
        variety.protocols.fertilization[
          stageName as keyof typeof variety.protocols.fertilization
        ];

      if (!stageProtocol || !stageProtocol.schedule) {
        continue;
      }

      // Calculate stage start days using timeline data or custom stages
      const stageStartDays = this.calculateStageStartDaysForAnyStage(
        variety.growthTimeline,
        stageName
      );
      // Stage filtering: determine if this fertilization stage should be included
      // Apply stage name aliases for compatibility with different naming conventions
      const normalizedStageName = STAGE_ALIASES[stageName] || stageName;
      const currentStageIndex = STAGE_ORDER.indexOf(
        normalizedStageName as GrowthStage
      );

      // Determine if this stage should be excluded with explicit reasoning
      let shouldExclude = false;
      let excludeReason = "";

      if (currentStageIndex !== -1 && currentStageIndex < startStageIndex) {
        if (plantAge > 7) {
          // Calculate when this stage ended to determine if it's recent enough to include
          const stageEndDays =
            stageStartDays +
            (variety.growthTimeline[stageName as keyof GrowthTimeline] || 0);
          const daysSinceStageEnded = plantAge - stageEndDays;

          if (daysSinceStageEnded > (options.pastHorizonDays ?? 14)) {
            shouldExclude = true;
            excludeReason = `old past stage (ended ${daysSinceStageEnded} days ago)`;
          }
        } else {
          // New plants: exclude stages that come before our start stage
          shouldExclude = true;
          excludeReason = "past stage for new plant";
        }
      }

      // Check future stages (only if not already excluded)
      if (!shouldExclude) {
        if (plantAge > 7) {
          // Existing plants: exclude stages that won't start for a while yet
          const daysUntilStage = stageStartDays - plantAge;

          if (stageStartDays > plantAge + 30) {
            shouldExclude = true;
            excludeReason = `future stage (starts in ${daysUntilStage} days)`;
          }
        } else {
          // New plants: exclude stages that come before our anchor stage
          if (stageStartDays < anchorStageStartDays) {
            shouldExclude = true;
            excludeReason = "before anchor stage for new plant";
          }
        }
      }

      // Apply exclusion decision
      if (shouldExclude) {
        continue;
      }

      for (const scheduleItem of stageProtocol.schedule) {
        const taskInstances = this.createTaskInstances(
          plant,
          stageName as GrowthStage,
          scheduleItem,
          anchorDate, // Use the anchor date (planted date for new plants, current date for existing)
          stageStartDays, // Pass the calculated stage start days from planted date
          options
        );

        tasks.push(...taskInstances);
      }
    }

    return tasks;
  }

  static async transpilePlantProtocol(
    plant: PlantRecord,
    variety: VarietyRecord,
    options: TaskGenerationOptions = {}
  ): Promise<ScheduledTask[]> {
    const callContext = options.callContext || "unknown";
    const timestamp = new Date().toISOString();
    // For existing plants, we need to generate tasks from current date, not from germination
    const now = new Date();
    const plantAge = Math.floor(
      (now.getTime() - plant.plantedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If plant is new (less than 7 days), generate from germination
    if (plantAge < 7) {
      return this.transpileProtocolFromStage(
        plant,
        variety,
        "germination",
        plant.plantedDate,
        options
      );
    }

    // For existing plants, determine current stage and generate future tasks from now
    const currentStage = this.determineCurrentStage(
      variety.growthTimeline,
      plantAge
    );

    // Dynamic stage transition detection: if we're at a stage boundary,
    // include both the ending stage and the starting stage to catch tasks that are due right now
    const stageTransition = this.isAtStageTransition(
      variety.growthTimeline,
      plantAge
    );

    if (
      stageTransition.isTransition &&
      stageTransition.previousStage &&
      stageTransition.currentStage
    ) {
      // Get tasks from the ending stage (which might be due today)
      const previousStageTasks = await this.transpileProtocolFromStage(
        plant,
        variety,
        stageTransition.previousStage,
        now,
        { ...options, callContext: `${callContext}/prev-stage` }
      );

      // Get tasks from the starting stage
      const currentStageTasks = await this.transpileProtocolFromStage(
        plant,
        variety,
        stageTransition.currentStage,
        now,
        { ...options, callContext: `${callContext}/curr-stage` }
      );

      return [...previousStageTasks, ...currentStageTasks];
    }

    return this.transpileProtocolFromStage(
      plant,
      variety,
      currentStage,
      now, // Use current date as anchor for existing plants
      { ...options, callContext: `${callContext}/single-stage` }
    );
  }

  private static determineCurrentStage(
    growthTimeline: GrowthTimeline,
    plantAge: number
  ): GrowthStage {
    // Calculate cumulative days for each standard stage
    const germinationEnd = growthTimeline.germination || 0;
    const seedlingEnd =
      germinationEnd +
      (growthTimeline.seedling || growthTimeline.establishment || 0);
    const vegetativeEnd = seedlingEnd + (growthTimeline.vegetative || 0);
    const floweringEnd = vegetativeEnd + (growthTimeline.flowering || 0);
    const fruitingEnd = floweringEnd + (growthTimeline.fruiting || 0);

    if (plantAge < germinationEnd) return "germination";
    if (plantAge < seedlingEnd) return "seedling";
    if (plantAge < vegetativeEnd) return "vegetative";
    if (plantAge < floweringEnd) return "flowering";
    if (plantAge < fruitingEnd) return "fruiting";

    // After fruiting, most plants go to maturation or ongoing production
    return "ongoing-production";
  }

  private static isAtStageTransition(
    growthTimeline: GrowthTimeline,
    plantAge: number
  ): {
    isTransition: boolean;
    previousStage?: GrowthStage;
    currentStage?: GrowthStage;
  } {
    // Calculate cumulative days for each standard stage
    const germinationEnd = growthTimeline.germination || 0;
    const seedlingEnd =
      germinationEnd +
      (growthTimeline.seedling || growthTimeline.establishment || 0);
    const vegetativeEnd = seedlingEnd + (growthTimeline.vegetative || 0);
    const floweringEnd = vegetativeEnd + (growthTimeline.flowering || 0);
    const fruitingEnd = floweringEnd + (growthTimeline.fruiting || 0);

    // Check if we're exactly at a stage transition boundary
    if (plantAge === germinationEnd && germinationEnd > 0) {
      return {
        isTransition: true,
        previousStage: "germination",
        currentStage: "seedling",
      };
    }

    if (plantAge === seedlingEnd && seedlingEnd > germinationEnd) {
      return {
        isTransition: true,
        previousStage: "seedling",
        currentStage: "vegetative",
      };
    }

    if (plantAge === vegetativeEnd && vegetativeEnd > seedlingEnd) {
      return {
        isTransition: true,
        previousStage: "vegetative",
        currentStage: "flowering",
      };
    }

    if (plantAge === floweringEnd && floweringEnd > vegetativeEnd) {
      return {
        isTransition: true,
        previousStage: "flowering",
        currentStage: "fruiting",
      };
    }

    if (plantAge === fruitingEnd && fruitingEnd > floweringEnd) {
      return {
        isTransition: true,
        previousStage: "fruiting",
        currentStage: "ongoing-production",
      };
    }

    return { isTransition: false };
  }

  private static calculateStageStartDaysForAnyStage(
    growthTimeline: GrowthTimeline,
    stageName: string
  ): number {
    // Define the standard stage order for calculating start days
    // All timeline values represent DURATION, so we accumulate them to get start days
    const standardStageOrder = [
      "germination",
      "seedling",
      "establishment", // Alternative to seedling
      "vegetative",
      "flowering",
      "fruiting",
      "maturation",
      "ongoingProduction",
    ];

    // Handle stage name aliases
    const stageAliases: Record<string, string> = {
      ongoing: "ongoingProduction",
      "ongoing-production": "ongoingProduction",
      caneEstablishment: "establishment",
    };

    const normalizedStageName = stageAliases[stageName] || stageName;

    // Calculate start day by accumulating all previous stage durations
    let startDay = 0;

    for (const stage of standardStageOrder) {
      if (stage === normalizedStageName) {
        return startDay;
      }

      // Get duration for this stage, handling seedling/establishment equivalence
      let stageDuration = 0;
      if (stage === "seedling" || stage === "establishment") {
        // Only add the duration once for seedling/establishment equivalence
        // If timeline has establishment but not seedling, use establishment
        // If timeline has both, prefer establishment
        if (
          stage === "seedling" &&
          growthTimeline.establishment &&
          !growthTimeline.seedling
        ) {
          // Skip seedling if we have establishment but no seedling
          stageDuration = 0;
        } else if (
          stage === "establishment" &&
          growthTimeline.seedling &&
          !growthTimeline.establishment
        ) {
          // Skip establishment if we have seedling but no establishment
          stageDuration = 0;
        } else {
          // Use whichever one exists, preferring establishment
          stageDuration =
            growthTimeline.establishment || growthTimeline.seedling || 0;
        }
      } else {
        stageDuration = growthTimeline[stage as keyof GrowthTimeline] || 0;
      }

      startDay += stageDuration;
    }

    // Handle custom stages not in standard order
    const customStageStart = this.calculateCustomStageStart(
      growthTimeline,
      normalizedStageName
    );
    if (customStageStart >= 0) {
      return customStageStart;
    }

    console.warn(`Unknown stage: ${stageName}. Defaulting to start day 0.`);
    return 0;
  }

  /**
   * Handle custom stages that don't follow the standard order
   */
  private static calculateCustomStageStart(
    growthTimeline: GrowthTimeline,
    stageName: string
  ): number {
    // Custom stage calculations based on known plant varieties
    switch (stageName) {
      case "floweringFruiting":
        // For raspberries - starts after vegetative growth
        return (
          (growthTimeline.germination || 0) +
          (growthTimeline.seedling || growthTimeline.establishment || 0) +
          (growthTimeline.vegetative || 0)
        );

      case "slipProduction":
        // For sweet potatoes - starts immediately
        return 0;

      case "vegetativeGrowth":
        // Alternative name for vegetative stage
        return (
          (growthTimeline.germination || 0) +
          (growthTimeline.seedling || growthTimeline.establishment || 0)
        );

      case "tuberDevelopment":
        // For sweet potatoes - after slip and vegetative growth
        return (
          (growthTimeline.slipProduction || 0) +
          (growthTimeline.vegetativeGrowth || 0)
        );

      case "rootDevelopment":
        // For root vegetables - typically after vegetative stage
        return (
          (growthTimeline.germination || 0) +
          (growthTimeline.seedling || 0) +
          (growthTimeline.vegetative || 0)
        );

      case "budding":
      case "dormancy":
        // For flowers - these would need specific calculations per variety
        return (
          (growthTimeline.germination || 0) +
          (growthTimeline.seedling || 0) +
          (growthTimeline.vegetative || 0)
        );

      default:
        return -1; // Signal that this isn't a recognized custom stage
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
    stageStartDays: number,
    options: TaskGenerationOptions = {}
  ): ScheduledTask[] {
    const tasks: ScheduledTask[] = [];
    const now = new Date();
    const plantAge = Math.floor(
      (now.getTime() - plant.plantedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const callContext = options.callContext || "unknown";


    // Set default time horizons for rolling task generation
    const futureHorizonDays = options.futureHorizonDays ?? 21; // 3 weeks into the future
    const pastHorizonDays = options.pastHorizonDays ?? 14; // 2 weeks into the past for overdue

    // For existing plants using current date as anchor, we need different logic
    const isExistingPlant = plantAge > 7;

    if (isExistingPlant) {
      // For existing plants, startDays represents absolute days from planting date
      // This is consistent across all stages in the protocol definitions
      const taskStartDayFromPlanting = scheduleItem.startDays;
      const taskStartDate = new Date(
        plant.plantedDate.getTime() +
          taskStartDayFromPlanting * 24 * 60 * 60 * 1000
      );


      // If task hasn't started yet, generate normally from start date
      if (taskStartDate > now) {
        // Apply time horizons to future tasks too
        const maxTasks = Math.min(
          scheduleItem.repeatCount,
          Math.ceil(
            futureHorizonDays / Math.max(scheduleItem.frequencyDays, 1)
          ) + 1
        );

        // Calculate timing for future task generation with horizon limits
        for (let i = 0; i < maxTasks; i++) {
          const dueDate = new Date(
            taskStartDate.getTime() +
              i * scheduleItem.frequencyDays * 24 * 60 * 60 * 1000
          );

          if (dueDate >= now) {
            // Check if within future horizon
            const daysDiff = Math.floor(
              (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff <= futureHorizonDays) {
              const task = this.createTask(
                plant,
                stage,
                scheduleItem,
                dueDate,
                i
              );
              tasks.push(task);
            }
          }
        }
      } else {
        // Task has already started - find next occurrence
        const daysSinceStart = Math.floor(
          (now.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Handle one-time tasks (frequency = 0) separately
        if (scheduleItem.frequencyDays === 0) {
          // One-time task - just check if it's within our time horizon
          const dueDate = taskStartDate;
          const daysDiff = Math.floor(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff >= -pastHorizonDays && daysDiff <= futureHorizonDays) {
            const task = this.createTask(
              plant,
              stage,
              scheduleItem,
              dueDate,
              0
            );
            tasks.push(task);
          }
        } else {
          // Recurring tasks
          const missedCycles = Math.floor(
            daysSinceStart / scheduleItem.frequencyDays
          );

          // Generate tasks within the rolling time horizon instead of all future tasks
          // Calculate how many cycles fit within our time horizons
          const maxFutureCycles = Math.ceil(
            futureHorizonDays / scheduleItem.frequencyDays
          );
          const maxPastCycles = Math.ceil(
            pastHorizonDays / scheduleItem.frequencyDays
          );

          // Start from cycles that might be overdue within our past horizon
          const startCycle = Math.max(0, missedCycles - maxPastCycles);
          const endCycle = Math.min(
            scheduleItem.repeatCount,
            missedCycles + maxFutureCycles
          );

          for (let i = startCycle; i < endCycle; i++) {
            const dueDate = new Date(
              taskStartDate.getTime() +
                i * scheduleItem.frequencyDays * 24 * 60 * 60 * 1000
            );

            // Include tasks within our time horizons
            const daysDiff = Math.floor(
              (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff >= -pastHorizonDays && daysDiff <= futureHorizonDays) {
              const task = this.createTask(
                plant,
                stage,
                scheduleItem,
                dueDate,
                i
              );
              tasks.push(task);
            }
          }
        }
      }
    } else {
      // Logic for new plants - use anchor date as stage start if provided, otherwise calculate from planted date
      // If anchorDate equals plant.plantedDate, we're generating from germination and need to calculate stage start
      // If anchorDate is different, it represents a custom stage start date
      const isFromPlantedDate =
        Math.abs(anchorDate.getTime() - plant.plantedDate.getTime()) < 1000; // Within 1 second
      const stageStartDate = isFromPlantedDate
        ? new Date(
            plant.plantedDate.getTime() + stageStartDays * 24 * 60 * 60 * 1000
          )
        : anchorDate;

      // Limit task generation for new plants as well
      const maxTasks = Math.min(
        scheduleItem.repeatCount,
        Math.ceil(futureHorizonDays / scheduleItem.frequencyDays) + 1
      );

      for (let i = 0; i < maxTasks; i++) {
        const daysFromStageStart =
          scheduleItem.startDays + i * scheduleItem.frequencyDays;
        const dueDate = new Date(
          stageStartDate.getTime() + daysFromStageStart * 24 * 60 * 60 * 1000
        );

        // Skip tasks that would have been in the past relative to today
        if (dueDate < now) {
          continue;
        }

        // Only include tasks within future horizon
        const daysDiff = Math.floor(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= futureHorizonDays) {
          tasks.push(this.createTask(plant, stage, scheduleItem, dueDate, i));
        }
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
