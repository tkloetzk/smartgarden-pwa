import { useState, useEffect } from "react";
import { PlantRecord } from "@/types/database";
import { UpcomingTask, CareActivityType, CareRecord } from "@/types";
import { seedVarieties } from "@/data/seedVarieties";
import { differenceInDays, addDays } from "date-fns";
import { formatDueIn, calculatePriority } from "@/utils/date/dateUtils";
import { calculateCurrentStageWithVariety } from "@/utils/plant/growthStage";
import { getPlantDisplayName } from "@/utils/plant/plantDisplay";

interface UseLocalNextTaskProps {
  plantId: string;
  plant: PlantRecord | null;
  getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>;
  isLoading: boolean;
}

// Simple hook for getting the next task for a single plant
export function useLocalNextTask({
  plantId,
  plant,
  getLastActivityByType,
  isLoading
}: UseLocalNextTaskProps) {
  const [nextTask, setNextTask] = useState<UpcomingTask | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);

  useEffect(() => {
    const calculateNextTask = async () => {
      if (isLoading || !plant) {
        setNextTask(null);
        return;
      }

      setTaskLoading(true);
      try {
        const variety = seedVarieties.find(v => v.name === plant.varietyName);
        if (!variety) {
          setNextTask(null);
          return;
        }

        // Calculate current growth stage
        const currentStage = calculateCurrentStageWithVariety(plant.plantedDate, {
          ...variety,
          id: plant.varietyId || "seed-variety",
          normalizedName: variety.name.toLowerCase(),
          isCustom: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Get last activities
        const [lastWatering, lastFertilizing, lastObservation] = await Promise.all([
          getLastActivityByType(plant.id, "water"),
          getLastActivityByType(plant.id, "fertilize"),
          getLastActivityByType(plant.id, "observe"),
        ]);

        const today = new Date();
        const tasks: UpcomingTask[] = [];

        // Check watering
        const wateringTask = createWateringTask(plant, variety, currentStage, lastWatering, today);
        if (wateringTask) tasks.push(wateringTask);

        // Check fertilizing
        const fertilizingTask = createFertilizingTask(plant, variety, currentStage, lastFertilizing, today);
        if (fertilizingTask) tasks.push(fertilizingTask);

        // Check observation
        const observationTask = createObservationTask(plant, variety, currentStage, lastObservation, today);
        if (observationTask) tasks.push(observationTask);

        // Return the most urgent task (earliest due date)
        tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        setNextTask(tasks.length > 0 ? tasks[0] : null);
      } catch (error) {
        console.error("Error calculating next task:", error);
        setNextTask(null);
      } finally {
        setTaskLoading(false);
      }
    };

    calculateNextTask();
  }, [plantId, plant, getLastActivityByType, isLoading]);

  return {
    nextTask,
    isLoading: isLoading || taskLoading
  };
}

// Helper functions (same as useLocalUpcomingTasks)
function createWateringTask(
  plant: PlantRecord,
  variety: any,
  currentStage: any,
  lastWatering: CareRecord | null,
  today: Date
): UpcomingTask | null {
  const stageWatering = variety.protocols?.watering?.[currentStage];
  if (!stageWatering) return null;

  const maxDaysBetweenWatering = parseWateringFrequency(stageWatering.volume?.frequency || "2-3x/week");
  const lastWateringDate = lastWatering ? new Date(lastWatering.date) : plant.plantedDate;

  const dueDate = addDays(lastWateringDate, maxDaysBetweenWatering);
  const thresholdDate = addDays(today, 2);

  if (dueDate > thresholdDate) return null;

  const daysOverdue = differenceInDays(today, dueDate);

  return {
    id: `water-${plant.id}`,
    plantId: plant.id,
    plantName: getPlantDisplayName(plant),
    task: "Check water level",
    type: "water",
    dueIn: formatDueIn(dueDate),
    priority: calculatePriority(daysOverdue),
    dueDate,
    isOverdue: daysOverdue > 0,
  };
}

function createFertilizingTask(
  plant: PlantRecord,
  variety: any,
  currentStage: any,
  lastFertilizing: CareRecord | null,
  today: Date
): UpcomingTask | null {
  const stageFertilizing = variety.protocols?.fertilization?.[currentStage];
  if (!stageFertilizing?.schedule?.length) return null;

  const firstSchedule = stageFertilizing.schedule[0];
  const frequencyDays = firstSchedule.frequencyDays || 14;

  const lastFertilizingDate = lastFertilizing ? new Date(lastFertilizing.date) : plant.plantedDate;

  const dueDate = addDays(lastFertilizingDate, frequencyDays);
  const thresholdDate = addDays(today, 2);

  if (dueDate > thresholdDate) return null;

  const daysOverdue = differenceInDays(today, dueDate);

  return {
    id: `fertilize-${plant.id}`,
    plantId: plant.id,
    plantName: getPlantDisplayName(plant),
    task: "Fertilize",
    type: "fertilize",
    dueIn: formatDueIn(dueDate),
    priority: calculatePriority(daysOverdue),
    dueDate,
    isOverdue: daysOverdue > 0,
  };
}

function createObservationTask(
  plant: PlantRecord,
  _variety: any,
  _currentStage: any,
  lastObservation: CareRecord | null,
  today: Date
): UpcomingTask | null {
  const frequencyDays = 7;

  const lastObservationDate = lastObservation ? new Date(lastObservation.date) : plant.plantedDate;

  const dueDate = addDays(lastObservationDate, frequencyDays);
  const thresholdDate = addDays(today, 1);

  if (dueDate > thresholdDate) return null;

  const daysOverdue = differenceInDays(today, dueDate);

  return {
    id: `observe-${plant.id}`,
    plantId: plant.id,
    plantName: getPlantDisplayName(plant),
    task: "Health check",
    type: "observe",
    dueIn: formatDueIn(dueDate),
    priority: calculatePriority(daysOverdue),
    dueDate,
    isOverdue: daysOverdue > 0,
  };
}

function parseWateringFrequency(frequency: string): number {
  if (frequency.includes("daily") || frequency.includes("1x/day")) {
    return 1;
  }

  if (frequency.includes("week")) {
    const match = frequency.match(/(\d+)(?:-(\d+))?x?\/?week/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      const avgTimesPerWeek = (min + max) / 2;
      return Math.ceil(7 / avgTimesPerWeek);
    }
  }

  return 3;
}