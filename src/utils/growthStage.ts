// src/utils/growthStage.ts - Complete updated file
import { GrowthStage } from "../types";
import { addDays, differenceInDays } from "date-fns";
import { VarietyRecord } from "@/types/database";
import { seedVarieties } from "@/data/seedVarieties";
import { GrowthTimeline } from "@/types";
import { Logger } from "./logger";

export interface GrowthStageInfo {
  stage: GrowthStage;
  startDay: number;
  endDay: number;
  description: string;
}

// Use the centralized GrowthTimeline type - keep backward compatibility functions
// for legacy code that expects specific fields to be present

export function calculateStageFromSeedVarieties(
  plantedDate: Date,
  varietyName: string,
  currentDate: Date = new Date()
): GrowthStage {
  const variety = seedVarieties.find((v) => v.name === varietyName);

  if (!variety?.growthTimeline) {
    Logger.warn(`Variety ${varietyName} not found in seedVarieties`);
    return "germination";
  }

  const daysSincePlanted = Math.floor(
    (currentDate.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSincePlanted < 0) return "germination";

  let cumulativeDays = 0;

  // Use Object.entries to get both stage and duration at once
  for (const [stage, duration] of Object.entries(variety.growthTimeline)) {
    if (duration === undefined) continue; // Skip undefined stages
    if (daysSincePlanted < cumulativeDays + duration) {
      return stage as GrowthStage;
    }
    cumulativeDays += duration;
  }

  // Past all defined stages
  if (variety.isEverbearing) {
    const effectiveLifespan = variety.productiveLifespan ?? 730;
    if (daysSincePlanted < effectiveLifespan) {
      return "ongoing-production";
    }
  }

  return "harvest";
}

/**
 * Calculates the current growth stage of a plant based on its variety's timeline.
 * This is the primary function to use for stage calculation as it handles everbearing logic.
 * @param anchorDate - The date the plant was planted.
 * @param variety - The VarietyRecord for the plant, containing growth timeline and everbearing info.
 * @param currentDate - The current date to calculate from (defaults to now).
 * @returns The calculated GrowthStage.
 */
export function calculateCurrentStageWithVariety(
  anchorDate: Date,
  variety: VarietyRecord | undefined | null,
  currentDate: Date = new Date(),
  startingStage: GrowthStage = "germination"
): GrowthStage {
  if (!variety || !variety.growthTimeline) {
    Logger.warn("Invalid variety data, defaulting to vegetative");
    return "vegetative";
  }

  const daysSinceAnchor = differenceInDays(currentDate, anchorDate);
  if (daysSinceAnchor < 0) return startingStage;

  const timeline = variety.growthTimeline;

  // ✅ FIXED: Use Object.entries to avoid TypeScript indexing issues
  const timelineEntries = Object.entries(timeline) as [
    keyof GrowthTimeline,
    number
  ][];

  
  Logger.growthStage(
    variety.name,
    `Available stages: ${timelineEntries.map(([stage]) => stage).join(", ")}`
  );

  let cumulativeDays = 0;

  for (const [stage, stageDuration] of timelineEntries) {
    if (stageDuration === undefined) continue;

    Logger.growthStage(
      variety.name,
      `Stage "${stage}": days ${cumulativeDays}-${
        cumulativeDays + stageDuration
      } (duration: ${stageDuration})`
    );

    if (daysSinceAnchor < cumulativeDays + stageDuration) {
      // Map timeline keys to GrowthStage values
      const growthStageMap: Record<string, GrowthStage> = {
        ongoingProduction: "ongoing-production",
      };
      const mappedStage = growthStageMap[stage] || (stage as GrowthStage);
      
      
      Logger.growthStage(
        variety.name,
        `Plant is in "${mappedStage}" stage (day ${daysSinceAnchor})`
      );
      return mappedStage;
    }
    cumulativeDays += stageDuration;
  }

  // If we've gone past all defined stages
  if (variety.isEverbearing) {
    const effectiveLifespan = variety.productiveLifespan ?? 730;
    if (daysSinceAnchor < effectiveLifespan) {
      return "ongoing-production";
    }
  }

  return "harvest";
}

/**
 * Calculates the current growth stage based on a generic timeline.
 * @deprecated Use calculateCurrentStageWithVariety for more accurate, variety-specific calculations.
 * @param plantedDate The date the plant was planted.
 * @param timeline An object defining the duration of each growth stage.
 * @param currentDate The current date to calculate from (defaults to now).
 * @returns The calculated GrowthStage.
 */
export function calculateCurrentStage(
  plantedDate: Date,
  timeline: GrowthTimeline,
  currentDate: Date = new Date()
): GrowthStage {
  const daysSincePlanting = differenceInDays(currentDate, plantedDate);

  if (daysSincePlanting < 0) return "germination";

  // Handle cases where fields might be undefined by providing defaults
  const germination = timeline.germination || 14;
  const seedling = timeline.seedling || timeline.establishment || 14;
  const vegetative = timeline.vegetative || 28;
  const maturation = timeline.maturation || 60;

  if (daysSincePlanting < germination) return "germination";
  if (daysSincePlanting < germination + seedling) return "seedling";
  if (daysSincePlanting < germination + seedling + vegetative)
    return "vegetative";
  if (daysSincePlanting < maturation) return "flowering";

  return "harvest";
}

/**
 * Determines the next logical growth stage.
 * @param currentStage The current stage of the plant.
 * @returns The next GrowthStage, or null if it's the final stage.
 */
export function getNextStage(currentStage: GrowthStage): GrowthStage | null {
  const stages: GrowthStage[] = [
    "germination",
    "seedling",
    "vegetative",
    "budding",
    "flowering",
    "maturation",
    "ongoing-production",
    "harvest",
    "dormancy",
  ];
  const currentIndex = stages.indexOf(currentStage);

  if (currentIndex === -1 || currentIndex >= stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
}

export function getStageProgress(
  plantedDate: Date,
  timeline: GrowthTimeline,
  currentDate: Date = new Date()
): number {
  const daysSincePlanting = differenceInDays(currentDate, plantedDate);
  const currentStage = calculateCurrentStage(
    plantedDate,
    timeline,
    currentDate
  );

  // Handle cases where fields might be undefined by providing defaults
  const germination = timeline.germination || 14;
  const seedling = timeline.seedling || timeline.establishment || 14;
  const vegetative = timeline.vegetative || 28;
  const maturation = timeline.maturation || 60;

  let stageStart = 0;
  let stageEnd = germination;

  switch (currentStage) {
    case "seedling":
      stageStart = germination;
      stageEnd = germination + seedling;
      break;
    case "vegetative":
      stageStart = germination + seedling;
      stageEnd = germination + seedling + vegetative;
      break;
    case "flowering":
      stageStart = germination + seedling + vegetative;
      stageEnd = maturation;
      break;
    case "maturation":
    case "ongoing-production":
    case "harvest":
      return 100;
  }

  const stageProgress =
    ((daysSincePlanting - stageStart) / (stageEnd - stageStart)) * 100;
  return Math.min(Math.max(stageProgress, 0), 100);
}

export function estimateStageTransition(
  plantedDate: Date,
  timeline: GrowthTimeline,
  targetStage: GrowthStage
): Date {
  // Handle cases where fields might be undefined by providing defaults
  const germination = timeline.germination || 14;
  const seedling = timeline.seedling || timeline.establishment || 14;
  const vegetative = timeline.vegetative || 28;
  const maturation = timeline.maturation || 60;

  let daysToTarget = 0;

  switch (targetStage) {
    case "seedling":
      daysToTarget = germination;
      break;
    case "vegetative":
      daysToTarget = germination + seedling;
      break;
    case "flowering":
      daysToTarget = germination + seedling + vegetative;
      break;
    case "maturation":
    case "ongoing-production":
    case "harvest":
      daysToTarget = maturation;
      break;
  }

  return addDays(plantedDate, daysToTarget);
}

export function formatStageProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}
