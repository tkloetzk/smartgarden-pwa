import { findVarietyByName } from "@/lib/seedVarietiesUtils";
import { CareActivityType, CareRecord, UpcomingTask } from "@/types";
import { PlantRecord } from "@/types/database";
import { calculatePriority, formatDueIn } from "@/utils/date/dateUtils";
import { calculateCurrentStageWithVariety } from "@/utils/plant/growthStage";
import { getPlantDisplayName } from "@/utils/plant/plantDisplay";
import { addDays, differenceInDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";

interface UseLocalUpcomingTasksProps {
  plants: PlantRecord[];
  getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>;
  isLoading: boolean;
}

// Main hook that replaces Firebase scheduling service
export function useLocalUpcomingTasks({
  plants,
  getLastActivityByType,
  isLoading
}: UseLocalUpcomingTasksProps) {
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    const calculateTasks = async () => {
      if (isLoading || !plants.length) {
        setUpcomingTasks([]);
        return;
      }

      setTasksLoading(true);
      try {
        const allTasks: UpcomingTask[] = [];

        for (const plant of plants) {
          const variety = findVarietyByName(plant.varietyName);
          if (!variety) continue;

          // Calculate current growth stage
          const currentStage = calculateCurrentStageWithVariety(plant.plantedDate, {
            ...variety,
            id: plant.varietyId || "seed-variety",
            normalizedName: variety.name.toLowerCase(),
            isCustom: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Get last activities for this plant
          const [lastWatering, lastFertilizing, lastObservation] = await Promise.all([
            getLastActivityByType(plant.id, "water"),
            getLastActivityByType(plant.id, "fertilize"),
            getLastActivityByType(plant.id, "observe"),
          ]);

          const today = new Date();

          // Check watering task
          const wateringTask = createWateringTask(plant, variety, currentStage, lastWatering, today);
          if (wateringTask) allTasks.push(wateringTask);

          // Check fertilizing task
          const fertilizingTask = createFertilizingTask(plant, variety, currentStage, lastFertilizing, today);
          if (fertilizingTask) allTasks.push(fertilizingTask);

          // Check observation task
          const observationTask = createObservationTask(plant, variety, currentStage, lastObservation, today);
          if (observationTask) allTasks.push(observationTask);
        }

        // Sort by due date
        allTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        setUpcomingTasks(allTasks);
      } catch (error) {
        console.error("Error calculating local upcoming tasks:", error);
        setUpcomingTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    calculateTasks();
  }, [plants, getLastActivityByType, isLoading]);

  const getTasksForPlant = useMemo(() => {
    return (plantId: string): UpcomingTask[] => {
      return upcomingTasks.filter(task => task.plantId === plantId);
    };
  }, [upcomingTasks]);

  const getNextTaskForPlant = useMemo(() => {
    return (plantId: string): UpcomingTask | null => {
      const plantTasks = getTasksForPlant(plantId);
      return plantTasks.length > 0 ? plantTasks[0] : null;
    };
  }, [getTasksForPlant]);

  return {
    upcomingTasks,
    getTasksForPlant,
    getNextTaskForPlant,
    isLoading: isLoading || tasksLoading
  };
}

// Helper functions (same as in useLocalOverdueCalculation but with threshold logic)
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
  const thresholdDate = addDays(today, 2); // 2-day threshold

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
  const thresholdDate = addDays(today, 2); // 2-day threshold

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
  const frequencyDays = 7; // Weekly observations

  const lastObservationDate = lastObservation ? new Date(lastObservation.date) : plant.plantedDate;

  const dueDate = addDays(lastObservationDate, frequencyDays);
  const thresholdDate = addDays(today, 1); // 1-day threshold for observations

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

  return 3; // Default to every 3 days
}