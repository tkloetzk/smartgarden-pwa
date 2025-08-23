import { useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { DynamicSchedulingService } from "@/services/dynamicSchedulingService";
import { CareActivityDetails } from "@/types";

export interface FertilizationTasksManager {
  upcomingFertilization: any[];
  handleTaskComplete: (taskId: string, quickData?: any) => Promise<void>;
  handleTaskBypass: (taskId: string, reason?: string) => Promise<void>;
  handleTaskLogActivity: (taskId: string) => void;
}

export const useFertilizationTasks = (
  getUpcomingFertilizationTasks: ((days: number) => any[]) | undefined,
  visiblePlants: any[],
  logActivity: (activity: any) => Promise<string | null>,
  navigate: (path: string) => void,
  onActivityLogged: () => void
): FertilizationTasksManager => {
  // Helper function to get the most relevant fertilization tasks for a single plant
  const getRelevantFertilizationTasksForPlant = useCallback(
    (allTasks: any[], currentDate: Date) => {
      if (allTasks.length === 0) return [];

      const now = currentDate.getTime();

      // Sort tasks by due date
      const sortedTasks = [...allTasks].sort(
        (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
      );

      // Find the most relevant task(s):
      // 1. If there's an overdue task, show the most recent overdue one
      // 2. Otherwise, show the next upcoming task

      const overdueTasks = sortedTasks.filter(
        (task) => task.dueDate.getTime() < now
      );
      const upcomingTasks = sortedTasks.filter(
        (task) => task.dueDate.getTime() >= now
      );

      const relevantTasks = [];

      // Add the most recent overdue task (if any)
      if (overdueTasks.length > 0) {
        const mostRecentOverdue = overdueTasks[overdueTasks.length - 1];
        relevantTasks.push(mostRecentOverdue);
      }

      // Add the next upcoming task (if any and no overdue, or if there's a significant gap)
      if (upcomingTasks.length > 0) {
        const nextUpcoming = upcomingTasks[0];

        // If there's no overdue task, or if the upcoming task is close, include it
        if (overdueTasks.length === 0) {
          relevantTasks.push(nextUpcoming);
        }
      }

      return relevantTasks;
    },
    []
  );

  // Get relevant fertilization tasks for dashboard (not the full 2-year schedule)
  const upcomingFertilization = useMemo(() => {
    const allFertilizationTasks =
      typeof getUpcomingFertilizationTasks === "function"
        ? getUpcomingFertilizationTasks(365) || [] // Get full year of tasks for filtering
        : [];

    // Filter fertilization tasks to only include visible plants
    const visiblePlantTasks = allFertilizationTasks.filter((task) => {
      return visiblePlants.some((plant) => plant.id === task.plantId);
    });

    // Group tasks by plant and get only the most relevant ones
    const tasksByPlant = new Map<string, any[]>();
    visiblePlantTasks.forEach((task) => {
      if (!tasksByPlant.has(task.plantId)) {
        tasksByPlant.set(task.plantId, []);
      }
      tasksByPlant.get(task.plantId)!.push(task);
    });

    // For each plant, get only the most relevant fertilization tasks
    const relevantTasks: any[] = [];
    const now = new Date();

    tasksByPlant.forEach((tasks, _plantId) => {
      const plantRelevantTasks = getRelevantFertilizationTasksForPlant(
        tasks,
        now
      );
      relevantTasks.push(...plantRelevantTasks);
    });

    // Group identical tasks by variety, task name, product, and due date
    const groupedTasks = new Map<string, any>();

    relevantTasks.forEach((task) => {
      // Find the plant for this task to get variety info
      const plant = visiblePlants.find((p) => p.id === task.plantId);
      if (!plant) return;

      // Create a unique key for grouping identical tasks
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
          id: `grouped-${groupKey}`, // Use a grouped ID
          plantIds: [task.plantId], // Array of all plant IDs in this group
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

    return Array.from(groupedTasks.values());
  }, [
    getUpcomingFertilizationTasks,
    visiblePlants,
    getRelevantFertilizationTasksForPlant,
  ]);

  const handleTaskComplete = useCallback(async (
    taskId: string,
    quickData?: any
  ) => {
    try {
      const task = upcomingFertilization.find((t) => t.id === taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      const actualCompletionDate = new Date();

      const fertilizationDetails: CareActivityDetails = {
        type: "fertilize",
        product: quickData?.product || task.details.product,
        amount: quickData?.amount || task.details.amount,
        dilution: quickData?.dilution || task.details.dilution,
        applicationMethod: task.details.method,
        notes: quickData?.notes || `Completed task: ${task.taskName}`,
      };

      // Handle grouped tasks (multiple plants) vs single plant tasks
      const plantIds = task.plantIds || [task.plantId];
      const completedActivities: string[] = [];

      // Log activity for each plant in the group
      for (const plantId of plantIds) {
        const newCareActivityId = await logActivity({
          plantId: plantId,
          type: "fertilize",
          date: actualCompletionDate,
          details: fertilizationDetails,
        });

        if (!newCareActivityId) {
          throw new Error(
            `Failed to create care activity record for plant ${plantId}.`
          );
        }

        completedActivities.push(newCareActivityId);

        await DynamicSchedulingService.recordTaskCompletion(
          plantId,
          "fertilize",
          task.dueDate,
          actualCompletionDate,
          newCareActivityId,
          "vegetative"
        );
      }

      const plantCount = plantIds.length;
      const message =
        plantCount > 1
          ? `Fertilization logged for ${plantCount} ${
              task.varietyName || "plants"
            } successfully! 🌱`
          : "Fertilization logged successfully! 🌱";

      toast.success(message);

      // Trigger a refresh
      onActivityLogged();
    } catch (error) {
      console.error("Task completion error:", error);
      toast.error("Failed to complete task");
    }
  }, [upcomingFertilization, logActivity, onActivityLogged]);

  const handleTaskBypass = useCallback(async (taskId: string, reason?: string) => {
    // TODO: Implement actual task bypass logic with taskId
    // For now, we'll just show a success message
    const message = reason
      ? `Task bypassed: ${reason}`
      : "Task bypassed successfully";

    toast.success(message);

    // TODO: Add actual implementation to update task status in the database
    console.log(
      `Bypassing task ${taskId} with reason: ${reason || "No reason provided"}`
    );
  }, []);

  const handleTaskLogActivity = useCallback((taskId: string) => {
    const task = upcomingFertilization.find((t) => t.id === taskId);
    if (task) {
      navigate(`/log-care/${task.plantId}`);
    }
  }, [upcomingFertilization, navigate]);

  return {
    upcomingFertilization,
    handleTaskComplete,
    handleTaskBypass,
    handleTaskLogActivity,
  };
};