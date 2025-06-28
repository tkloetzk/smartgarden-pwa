// src/utils/growthStage.ts - Complete updated file
import { GrowthStage } from "../types";
import { addDays, differenceInDays } from "date-fns";
import { VarietyRecord } from "@/types/database";

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

/**
 * Calculates the current growth stage of a plant based on its variety's timeline.
 * This is the primary function to use for stage calculation as it handles everbearing logic.
 * @param plantedDate - The date the plant was planted.
 * @param variety - The VarietyRecord for the plant, containing growth timeline and everbearing info.
 * @param currentDate - The current date to calculate from (defaults to now).
 * @returns The calculated GrowthStage.
 */
export function calculateCurrentStageWithVariety(
  anchorDate: Date, // Renamed from plantedDate for clarity
  variety: VarietyRecord | undefined | null,
  currentDate: Date = new Date(),
  startingStage: GrowthStage = "germination" // New parameter
): GrowthStage {
  if (!variety || !variety.growthTimeline) {
    console.warn(
      "❌ calculateCurrentStageWithVariety: Invalid variety data, defaulting to vegetative."
    );
    return "vegetative";
  }

  const daysSinceAnchor = differenceInDays(currentDate, anchorDate);
  if (daysSinceAnchor < 0) return startingStage; // Return starting stage if anchor is in the future

  const timeline = variety.growthTimeline;
  const stageOrder: GrowthStage[] = [
    "germination",
    "seedling",
    "vegetative",
    "flowering",
    "maturation",
    "ongoing-production",
    "harvest",
  ];

  const stageDurations: Record<string, number> = {
    germination: timeline.germination,
    seedling: timeline.seedling,
    vegetative: timeline.vegetative,
    // The time from vegetative end to full maturation is the flowering period.
    flowering:
      timeline.maturation -
      (timeline.germination + timeline.seedling + timeline.vegetative),
    maturation: 0, // Maturation is a point in time, not a duration in this context
  };

  let cumulativeDays = 0;
  const currentStageIndex = stageOrder.indexOf(startingStage);

  for (let i = currentStageIndex; i < stageOrder.length; i++) {
    const stage = stageOrder[i];
    const duration = stageDurations[stage];

    if (daysSinceAnchor < cumulativeDays + duration) {
      return stage;
    }
    cumulativeDays += duration;
  }

  if (variety.isEverbearing) {
    const effectiveLifespan = variety.productiveLifespan ?? 730; // Default to 2 years
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

// --- NEW FUNCTION ---
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

// --- Other existing functions (getStageProgress, estimateStageTransition) can remain for now ---
// They may need updating later if you want progress bars to respect the new confirmed stage.

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
