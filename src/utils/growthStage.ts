// src/utils/growthStage.ts - Complete updated file
import { GrowthStage } from "../types";
import { addDays, differenceInDays } from "date-fns";
import { VarietyRecord } from "@/types/database";
import { seedVarieties } from "@/data/seedVarieties";
import { GrowthTimeline } from "@/types/protocols";
import { Logger } from "./logger";

export interface GrowthStageInfo {
  stage: GrowthStage;
  startDay: number;
  endDay: number;
  description: string;
}

export interface VarietyTimeline {
  germination: number;
  seedling: number;
  vegetative: number;
  maturation: number;
}

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
    `Available stages: ${timelineEntries.map(([stage]) => stage).join(', ')}`
  );

  let cumulativeDays = 0;

  // ✅ FIXED: Iterate through the timeline entries directly
  for (const [stage, stageDuration] of timelineEntries) {
    if (stageDuration === undefined) continue;

    Logger.growthStage(
      variety.name,
      `Stage "${stage}": days ${cumulativeDays}-${cumulativeDays + stageDuration} (duration: ${stageDuration})`
    );

    if (daysSinceAnchor < cumulativeDays + stageDuration) {
      Logger.growthStage(variety.name, `Plant is in "${stage}" stage (day ${daysSinceAnchor})`);
      return stage as GrowthStage;
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
  timeline: VarietyTimeline,
  currentDate: Date = new Date()
): GrowthStage {
  const daysSincePlanting = differenceInDays(currentDate, plantedDate);

  if (daysSincePlanting < 0) return "germination";
  if (daysSincePlanting < timeline.germination) return "germination";
  if (daysSincePlanting < timeline.germination + timeline.seedling)
    return "seedling";
  if (
    daysSincePlanting <
    timeline.germination + timeline.seedling + timeline.vegetative
  )
    return "vegetative";
  if (daysSincePlanting < timeline.maturation) return "flowering";

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
    "flowering",
    "maturation",
    "ongoing-production",
    "harvest",
  ];
  const currentIndex = stages.indexOf(currentStage);

  if (currentIndex === -1 || currentIndex >= stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
}

export function getStageProgress(
  plantedDate: Date,
  timeline: VarietyTimeline,
  currentDate: Date = new Date()
): number {
  const daysSincePlanting = differenceInDays(currentDate, plantedDate);
  const currentStage = calculateCurrentStage(
    plantedDate,
    timeline,
    currentDate
  );

  let stageStart = 0;
  let stageEnd = timeline.germination;

  switch (currentStage) {
    case "seedling":
      stageStart = timeline.germination;
      stageEnd = timeline.germination + timeline.seedling;
      break;
    case "vegetative":
      stageStart = timeline.germination + timeline.seedling;
      stageEnd = timeline.germination + timeline.seedling + timeline.vegetative;
      break;
    case "flowering":
      stageStart =
        timeline.germination + timeline.seedling + timeline.vegetative;
      stageEnd = timeline.maturation;
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
  timeline: VarietyTimeline,
  targetStage: GrowthStage
): Date {
  let daysToTarget = 0;

  switch (targetStage) {
    case "seedling":
      daysToTarget = timeline.germination;
      break;
    case "vegetative":
      daysToTarget = timeline.germination + timeline.seedling;
      break;
    case "flowering":
      daysToTarget =
        timeline.germination + timeline.seedling + timeline.vegetative;
      break;
    case "maturation":
    case "ongoing-production":
    case "harvest":
      daysToTarget = timeline.maturation;
      break;
  }

  return addDays(plantedDate, daysToTarget);
}

export function formatStageProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}
