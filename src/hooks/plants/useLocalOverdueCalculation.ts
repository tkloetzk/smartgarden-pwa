// src/hooks/plants/useLocalOverdueCalculation.ts
import { useMemo } from "react";
import { PlantRecord } from "@/types/database";
import { GrowthStage, UpcomingTask, CareRecord } from "@/types";
import { seedVarieties } from "@/data/seedVarieties";
import { differenceInDays } from "date-fns";
import { formatDueIn, calculatePriority } from "@/utils/date/dateUtils";

interface LastCareActivities {
  watering: CareRecord | null;
  fertilizing: CareRecord | null;
}

export function useLocalOverdueCalculation(
  plant: PlantRecord,
  lastCareActivities: LastCareActivities,
  currentStage: GrowthStage,
  isLoading: boolean
): { nextTask: UpcomingTask | null; isLoading: boolean } {

  const nextTask = useMemo(() => {
    if (isLoading || !plant) return null;

    // Find the plant's variety in seedVarieties
    const variety = seedVarieties.find(v => v.name === plant.varietyName);
    if (!variety) return null;

    const today = new Date();

    // Check watering overdue
    const wateringTask = checkWateringOverdue(plant, lastCareActivities.watering, currentStage, variety, today);
    if (wateringTask) return wateringTask;

    // Check fertilizing overdue
    const fertilizingTask = checkFertilizingOverdue(plant, lastCareActivities.fertilizing, currentStage, variety, today);
    if (fertilizingTask) return fertilizingTask;

    return null;
  }, [plant, lastCareActivities, currentStage, isLoading]);

  return {
    nextTask,
    isLoading
  };
}

function checkWateringOverdue(
  plant: PlantRecord,
  lastWatering: CareRecord | null,
  currentStage: GrowthStage,
  variety: any,
  today: Date
): UpcomingTask | null {
  // Get stage-specific watering info
  const stageWatering = variety.protocols?.watering?.[currentStage];
  if (!stageWatering) return null;

  // Parse frequency to get max days between watering
  const maxDaysBetweenWatering = parseWateringFrequency(stageWatering.volume?.frequency || "2-3x/week");

  // Calculate days since last watering
  // Ensure we have proper Date objects
  const lastWateringDate = lastWatering
    ? new Date(lastWatering.date)
    : (plant.plantedDate instanceof Date ? plant.plantedDate : new Date(plant.plantedDate));
  const daysSinceWatering = differenceInDays(today, lastWateringDate);

  // Check if overdue
  if (daysSinceWatering > maxDaysBetweenWatering) {
    const daysOverdue = daysSinceWatering - maxDaysBetweenWatering;
    const dueDate = new Date(lastWateringDate.getTime() + maxDaysBetweenWatering * 24 * 60 * 60 * 1000);

    return {
      id: `water-${plant.id}`,
      plantId: plant.id,
      plantName: plant.name,
      task: "Check water level",
      type: "water",
      dueIn: formatDueIn(dueDate),
      priority: calculatePriority(daysOverdue),
      plantStage: currentStage,
      dueDate,
      category: "watering",
      canBypass: true,
    };
  }

  return null;
}

function checkFertilizingOverdue(
  plant: PlantRecord,
  lastFertilizing: CareRecord | null,
  currentStage: GrowthStage,
  variety: any,
  today: Date
): UpcomingTask | null {
  // Get stage-specific fertilizing schedule
  const stageFertilizing = variety.protocols?.fertilization?.[currentStage];
  if (!stageFertilizing?.schedule?.length) return null;

  // Use the first fertilizing schedule entry to get frequency
  const firstSchedule = stageFertilizing.schedule[0];
  const frequencyDays = firstSchedule.frequencyDays || 14; // Default to 2 weeks

  // Calculate days since last fertilizing
  const lastFertilizingDate = lastFertilizing ? new Date(lastFertilizing.date) : plant.plantedDate;
  const daysSinceFertilizing = differenceInDays(today, lastFertilizingDate);

  // Check if overdue
  if (daysSinceFertilizing > frequencyDays) {
    const daysOverdue = daysSinceFertilizing - frequencyDays;
    const dueDate = new Date(lastFertilizingDate.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

    return {
      id: `fertilize-${plant.id}`,
      plantId: plant.id,
      plantName: plant.name,
      task: "Fertilize",
      type: "fertilize",
      dueIn: formatDueIn(dueDate),
      priority: calculatePriority(daysOverdue),
      plantStage: currentStage,
      dueDate,
      category: "fertilizing",
      canBypass: true,
    };
  }

  return null;
}

function parseWateringFrequency(frequency: string): number {
  // Parse frequency strings like "2-3x/week", "daily", etc.
  if (frequency.includes("daily") || frequency.includes("1x/day")) {
    return 1;
  }

  if (frequency.includes("week")) {
    // Extract numbers like "2-3x/week" -> average to 2.5x/week -> ~3 days
    const match = frequency.match(/(\d+)(?:-(\d+))?x?\/?week/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      const avgTimesPerWeek = (min + max) / 2;
      return Math.ceil(7 / avgTimesPerWeek); // Convert to days between watering
    }
  }

  // Default fallback
  return 3; // Water every 3 days if can't parse
}