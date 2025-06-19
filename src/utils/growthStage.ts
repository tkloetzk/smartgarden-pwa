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

// src/utils/growthStage.ts - Add debugging version temporarily
export function calculateCurrentStageWithVariety(
  plantedDate: Date,
  variety: VarietyRecord | undefined,
  currentDate: Date = new Date()
): GrowthStage {
  if (!variety) {
    return "germination"; // Default fallback
  }
  const daysSincePlanting = differenceInDays(currentDate, plantedDate);
  const timeline = variety.growthTimeline;

  if (daysSincePlanting < 0) {
    return "germination";
  }
  if (daysSincePlanting < timeline.germination) {
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
    if (
      variety.productiveLifespan &&
      daysSincePlanting < variety.productiveLifespan
    ) {
      return "ongoing-production";
    } else {
      return "harvest";
    }
  }

  return "harvest";
}
// Keep the original function for backward compatibility
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

  return "harvest"; // ← FIXED: was "maturation"
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
    case "harvest": // ← Add this case
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
