import { PlantRecord } from "@/types/database";

// Base interface that all task types should extend
export interface BaseTask {
  id: string;
  plantId: string;
  taskName: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  details: Record<string, any>;
}

// Enhanced task with grouping properties
export interface GroupedTask extends BaseTask {
  plantIds: string[];
  plantCount: number;
  varietyName: string;
  affectedPlants: Array<{
    id: string;
    name: string;
    varietyName: string;
  }>;
}

/**
 * Groups tasks by variety and custom details using a provided grouping key function.
 * This utility creates grouped tasks that combine multiple plants with identical tasks.
 *
 * @param tasks - Array of tasks to group
 * @param visiblePlants - Array of plants for variety and name lookup
 * @param getGroupingKey - Function that generates a unique key for grouping tasks
 * @returns Array of grouped tasks with plantCount and affectedPlants
 */
export function groupTasksByVarietyAndDetails<T extends BaseTask>(
  tasks: T[],
  visiblePlants: PlantRecord[],
  getGroupingKey: (task: T, plant: PlantRecord) => string
): (T & GroupedTask)[] {
  const groupedTasks = new Map<string, T & GroupedTask>();

  tasks.forEach((task) => {
    const plant = visiblePlants.find((p) => p.id === task.plantId);
    if (!plant) return;

    const groupKey = getGroupingKey(task, plant);

    if (groupedTasks.has(groupKey)) {
      // Add this plant to the existing group
      const existingTask = groupedTasks.get(groupKey)!;
      existingTask.plantIds.push(task.plantId);
      existingTask.plantCount = existingTask.plantIds.length;
      existingTask.affectedPlants.push({
        id: plant.id,
        name: plant.name || 'Unknown Plant',
        varietyName: plant.varietyName || 'Unknown',
      });
    } else {
      // Create a new grouped task
      const groupedTask: T & GroupedTask = {
        ...task,
        id: `grouped-${groupKey}`, // Use a grouped ID
        plantIds: [task.plantId], // Array of all plant IDs in this group
        plantCount: 1,
        varietyName: plant.varietyName || 'Unknown',
        affectedPlants: [
          {
            id: plant.id,
            name: plant.name || 'Unknown Plant',
            varietyName: plant.varietyName || 'Unknown',
          },
        ],
      };

      groupedTasks.set(groupKey, groupedTask);
    }
  });

  return Array.from(groupedTasks.values());
}

/**
 * Standard grouping key generators for common task types
 */
export const GroupingKeyGenerators = {
  /**
   * Groups fertilization tasks by variety + task name + product + due date
   */
  fertilization: (task: BaseTask, plant: PlantRecord): string => {
    const dueDateStr = task.dueDate.toDateString();
    const product = task.details.product || 'unknown';
    return `${plant.varietyName}-${task.taskName}-${product}-${dueDateStr}`;
  },

  /**
   * Groups watering tasks by variety + task name + amount + due date
   */
  watering: (task: BaseTask, plant: PlantRecord): string => {
    const dueDateStr = task.dueDate.toDateString();
    const amount = task.details.amount || 'standard';
    return `${plant.varietyName}-${task.taskName}-${amount}-${dueDateStr}`;
  },

  /**
   * Groups observation tasks by variety + task name + focus + due date
   */
  observation: (task: BaseTask, plant: PlantRecord): string => {
    const dueDateStr = task.dueDate.toDateString();
    const focus = task.details.focus || 'general';
    return `${plant.varietyName}-${task.taskName}-${focus}-${dueDateStr}`;
  },
};

/**
 * Helper function to handle task completion for grouped tasks.
 * When a grouped task is completed, it should log activities for all plants in the group.
 *
 * @param groupedTask - The grouped task being completed
 * @param quickData - Quick completion data
 * @param logActivity - Function to log activities
 * @returns Promise that resolves when all plant activities are logged
 */
export async function completeGroupedTask(
  groupedTask: GroupedTask,
  quickData: any,
  logActivity: (activity: any) => Promise<void>
): Promise<void> {
  const promises = groupedTask.plantIds.map((plantId) => {
    const activity = {
      plantId,
      type: groupedTask.details.type,
      details: quickData,
      notes: `Grouped completion: ${groupedTask.taskName} for ${groupedTask.varietyName}`,
      timestamp: new Date(),
    };
    return logActivity(activity);
  });

  await Promise.all(promises);
}

/**
 * Helper function to handle task bypass for grouped tasks.
 * When a grouped task is bypassed, it should log bypass notes for all plants in the group.
 *
 * @param groupedTask - The grouped task being bypassed
 * @param reason - Optional bypass reason
 * @param logActivity - Function to log activities
 * @returns Promise that resolves when all plant bypass notes are logged
 */
export async function bypassGroupedTask(
  groupedTask: GroupedTask,
  reason: string | undefined,
  logActivity: (activity: any) => Promise<void>
): Promise<void> {
  const promises = groupedTask.plantIds.map((plantId) => {
    const activity = {
      plantId,
      type: "note",
      details: {
        noteText: `Bypassed ${groupedTask.details.type} task: ${groupedTask.taskName}${reason ? ` - Reason: ${reason}` : ""}`,
      },
      notes: `Grouped bypass: ${groupedTask.taskName} for ${groupedTask.varietyName}`,
      timestamp: new Date(),
    };
    return logActivity(activity);
  });

  await Promise.all(promises);
}