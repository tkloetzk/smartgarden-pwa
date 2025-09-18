import { PlantRecord } from "@/types/database";
import { UpcomingTask, CareActivityType, CareRecord } from "@/types";
import { seedVarieties } from "@/data/seedVarieties";
import { differenceInDays, addDays } from "date-fns";
import { formatDueIn, calculatePriority } from "@/utils/date/dateUtils";
import { calculateCurrentStageWithVariety } from "@/utils/plant/growthStage";
import { getPlantDisplayName } from "@/utils/plant/plantDisplay";

interface GetLastActivityByType {
  (plantId: string, type: CareActivityType): Promise<CareRecord | null>;
}

// Service-like function that can be called directly (not a hook)
export async function calculateUpcomingTasks(
  plants: PlantRecord[],
  getLastActivityByType: GetLastActivityByType,
  enableGrouping: boolean = false
): Promise<UpcomingTask[]> {
  if (!plants.length) return [];

  const allTasks: UpcomingTask[] = [];

  for (const plant of plants) {
    const variety = seedVarieties.find(v => v.name === plant.varietyName);
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
  const sortedTasks = allTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  if (!enableGrouping) {
    return sortedTasks;
  }

  // Group tasks by plants with same conditions
  return groupTasksByPlantConditions(sortedTasks, plants);
}

export async function calculateNextTaskForPlant(
  plant: PlantRecord,
  getLastActivityByType: GetLastActivityByType
): Promise<UpcomingTask | null> {
  const tasks = await calculateUpcomingTasks([plant], getLastActivityByType);
  return tasks.length > 0 ? tasks[0] : null;
}

export function getTasksForPlant(tasks: UpcomingTask[], plantId: string): UpcomingTask[] {
  return tasks.filter(task => task.plantId === plantId);
}

// Helper functions
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

// Group tasks by plants with same conditions (similar to Firebase grouping logic)
function groupTasksByPlantConditions(tasks: UpcomingTask[], plants: PlantRecord[]): UpcomingTask[] {
  const taskGroups = new Map<string, {
    tasks: UpcomingTask[];
    plants: PlantRecord[];
    representative: UpcomingTask;
  }>();

  // Group tasks by task type + plant grouping key
  tasks.forEach(task => {
    const plant = plants.find(p => p.id === task.plantId);
    if (!plant) return;

    // Create grouping key based on plant conditions (same logic as Firebase services)
    const plantedDateStr = plant.plantedDate.toISOString().split("T")[0];
    const location = plant.location || "unknown";
    const soilMix = plant.soilMix || "default";
    const hasSection = plant.section || plant.structuredSection;

    let plantGroupKey: string;
    if (hasSection) {
      plantGroupKey = `section_${plant.container}_${plant.varietyName}_${plant.section || "section"}_${plantedDateStr}`;
    } else {
      plantGroupKey = `group_${plant.varietyName}_${plant.container}_${plantedDateStr}_${location}_${soilMix}`;
    }

    // Combine task type with plant group
    const taskGroupKey = `${task.type}_${plantGroupKey}`;

    if (taskGroups.has(taskGroupKey)) {
      const group = taskGroups.get(taskGroupKey)!;
      group.tasks.push(task);
      group.plants.push(plant);
    } else {
      taskGroups.set(taskGroupKey, {
        tasks: [task],
        plants: [plant],
        representative: task
      });
    }
  });

  // Convert groups to grouped tasks
  const groupedTasks: UpcomingTask[] = [];

  taskGroups.forEach((group) => {
    if (group.tasks.length === 1) {
      // Single task, return as-is
      groupedTasks.push(group.representative);
    } else {
      // Multiple tasks, create grouped task
      const representative = group.representative;
      const firstPlant = group.plants[0];
      const plantCount = group.plants.length;

      // Determine the group plant ID for navigation
      const plantedDateStr = firstPlant.plantedDate.toISOString().split("T")[0];
      const location = firstPlant.location || "unknown";
      const soilMix = firstPlant.soilMix || "default";
      const hasSection = firstPlant.section || firstPlant.structuredSection;

      let groupPlantId: string;
      if (hasSection) {
        groupPlantId = `section_${firstPlant.container}_${firstPlant.varietyName}_${firstPlant.section || "section"}_${plantedDateStr}`;
      } else {
        groupPlantId = `group_${firstPlant.varietyName}_${firstPlant.container}_${plantedDateStr}_${location}_${soilMix}`;
      }

      // Create grouped task name
      const groupedPlantName = `${firstPlant.container} (${plantCount}x ${firstPlant.varietyName})${hasSection ? ` - ${firstPlant.section}` : ""}`;

      groupedTasks.push({
        ...representative,
        id: `${representative.type}-${groupPlantId}`,
        plantId: groupPlantId,
        plantName: groupedPlantName,
      });
    }
  });

  return groupedTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}