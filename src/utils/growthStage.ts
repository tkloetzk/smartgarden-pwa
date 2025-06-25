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
  plantedDate: Date,
  variety: VarietyRecord | undefined | null,
  currentDate: Date = new Date()
): GrowthStage {
  if (!variety || !variety.growthTimeline) {
    console.warn(
      "❌ calculateCurrentStageWithVariety: Invalid variety data, defaulting to vegetative."
    );
    // Default to a safe, neutral stage if variety data is missing.
    return "vegetative";
  }

  const daysSincePlanting = differenceInDays(currentDate, plantedDate);
  const timeline = variety.growthTimeline;

  if (daysSincePlanting < 0 || daysSincePlanting < timeline.germination) {
    return "germination";
  }
  if (daysSincePlanting < timeline.germination + timeline.seedling) {
    return "seedling";
  }
  if (
    daysSincePlanting <
    timeline.germination + timeline.seedling + timeline.vegetative
  ) {
    return "vegetative";
  }
  if (daysSincePlanting < timeline.maturation) {
    return "flowering";
  }

  if (variety.isEverbearing) {
    const effectiveLifespan = variety.productiveLifespan ?? 730;

    if (daysSincePlanting >= effectiveLifespan) {
      return "harvest";
    }
    return "ongoing-production";
  } else {
    return "harvest";
  }
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

  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
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
