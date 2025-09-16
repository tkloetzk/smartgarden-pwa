import { useMemo } from "react";
import { UpcomingTask } from "@/types";
import { getRelevantFertilizationTasksForPlant } from "@/utils/fertilizationUtils";

interface TaskProcessingResult {
  processedFertilizationTasks: UpcomingTask[];
  groupedTasks: UpcomingTask[];
  allProcessedTasks: UpcomingTask[];
}

interface ProcessTasksOptions {
  plants: any[];
  fertilizationTasks: any[];
  careTasks: UpcomingTask[];
  includeGrouping?: boolean;
}

export const useTaskProcessing = ({
  plants,
  fertilizationTasks,
  careTasks,
  includeGrouping = true,
}: ProcessTasksOptions): TaskProcessingResult => {
  const processedTasks = useMemo(() => {
    if (!plants || plants.length === 0) {
      return {
        processedFertilizationTasks: [],
        groupedTasks: [],
        allProcessedTasks: careTasks,
      };
    }

    const now = new Date();

    // Apply the same filtering logic as dashboard - get most relevant tasks per plant
    const tasksByPlant = new Map<string, any[]>();
    fertilizationTasks.forEach((task) => {
      if (!tasksByPlant.has(task.plantId)) {
        tasksByPlant.set(task.plantId, []);
      }
      tasksByPlant.get(task.plantId)!.push(task);
    });

    // Get most relevant fertilization tasks per plant using the same utility as dashboard
    const relevantFertilizationTasks: any[] = [];

    tasksByPlant.forEach((tasks, _plantId) => {
      const plantRelevantTasks = getRelevantFertilizationTasksForPlant(
        tasks,
        now
      );
      relevantFertilizationTasks.push(...plantRelevantTasks);
    });

    let processedFertilizationTasks: UpcomingTask[];

    if (includeGrouping) {
      // Apply the EXACT SAME grouping logic as the dashboard
      const groupedTasks = new Map<string, any>();

      relevantFertilizationTasks.forEach((task) => {
        // Find the plant for this task to get variety info
        const plant = plants.find((p) => p.id === task.plantId);
        if (!plant) return;

        // Create a unique key for grouping identical tasks (same as dashboard)
        const dueDateStr = task.dueDate.toDateString();
        const groupKey = `${plant.varietyName}-${task.taskName}-${task.details.product}-${dueDateStr}`;

        if (groupedTasks.has(groupKey)) {
          // Add this plant to the existing group
          const existingTask = groupedTasks.get(groupKey);
          existingTask.plantIds.push(task.plantId);
          existingTask.plantCount = existingTask.plantIds.length;
          existingTask.affectedPlants.push({
            id: plant.id,
            name: plant.name,
            varietyName: plant.varietyName,
          });
        } else {
          // Create a new grouped task
          groupedTasks.set(groupKey, {
            ...task,
            id: `grouped-catchup-${groupKey}`,
            plantIds: [task.plantId],
            plantCount: 1,
            varietyName: plant.varietyName,
            affectedPlants: [
              {
                id: plant.id,
                name: plant.name,
                varietyName: plant.varietyName,
              },
            ],
          });
        }
      });

      const finalGroupedTasks = Array.from(groupedTasks.values());

      // Convert grouped fertilization tasks to UpcomingTask format
      processedFertilizationTasks = finalGroupedTasks.map((task) => {
        const isOverdue = task.dueDate < now;
        const daysDiff = Math.ceil(
          (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const dueIn = isOverdue
          ? `Overdue by ${Math.abs(daysDiff)} day${
              Math.abs(daysDiff) !== 1 ? "s" : ""
            }`
          : daysDiff === 0
          ? "Due today"
          : daysDiff === 1
          ? "Due tomorrow"
          : `Due in ${daysDiff} day${daysDiff !== 1 ? "s" : ""}`;

        const priority = isOverdue
          ? ("overdue" as const)
          : daysDiff <= 1
          ? ("high" as const)
          : daysDiff <= 3
          ? ("medium" as const)
          : ("low" as const);

        // Use the first plant to get plant age for stage calculation
        const firstPlant = plants.find((p) => p.id === task.plantIds[0]);
        const plantAge = Math.floor(
          (now.getTime() -
            (firstPlant?.plantedDate?.getTime() || now.getTime())) /
            (1000 * 60 * 60 * 24)
        );
        let plantStage: string = "vegetative";

        if (plantAge >= 91) {
          plantStage = "ongoing-production";
        } else if (plantAge >= 84) {
          plantStage = "fruiting";
        } else if (plantAge >= 56) {
          plantStage = "flowering";
        } else if (plantAge >= 28) {
          plantStage = "vegetative";
        }

        // Create a grouped task name and plant name
        const groupedPlantName =
          task.plantCount > 1
            ? `${task.plantCount} ${task.varietyName}`
            : firstPlant?.name || "Unknown Plant";

        return {
          id: task.id,
          plantId: task.plantIds[0],
          plantName: groupedPlantName,
          task: task.taskName,
          type: "fertilize",
          dueDate: task.dueDate,
          dueIn,
          priority,
          category: "fertilizing" as const,
          plantStage: plantStage as any,
          product: task.details?.product,
        };
      });
    } else {
      // Simple processing without grouping
      processedFertilizationTasks = relevantFertilizationTasks.map((task) => {
        const plant = plants.find((p) => p.id === task.plantId);
        const isOverdue = task.dueDate < now;
        const daysDiff = Math.ceil(
          (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const dueIn = isOverdue
          ? `Overdue by ${Math.abs(daysDiff)} day${
              Math.abs(daysDiff) !== 1 ? "s" : ""
            }`
          : daysDiff === 0
          ? "Due today"
          : daysDiff === 1
          ? "Due tomorrow"
          : `Due in ${daysDiff} day${daysDiff !== 1 ? "s" : ""}`;

        const priority = isOverdue
          ? ("overdue" as const)
          : daysDiff <= 1
          ? ("high" as const)
          : daysDiff <= 3
          ? ("medium" as const)
          : ("low" as const);

        return {
          id: task.id,
          plantId: task.plantId,
          plantName: plant?.name || "Unknown Plant",
          task: task.taskName,
          type: "fertilize",
          dueDate: task.dueDate,
          dueIn,
          priority,
          category: "fertilizing" as const,
          plantStage: "vegetative" as any,
          product: task.details?.product,
        };
      });
    }

    // Combine all tasks and sort by due date
    const allProcessedTasks = [...careTasks, ...processedFertilizationTasks];
    allProcessedTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());


    return {
      processedFertilizationTasks,
      groupedTasks: processedFertilizationTasks,
      allProcessedTasks,
    };
  }, [plants, fertilizationTasks, careTasks, includeGrouping]);

  return processedTasks;
};