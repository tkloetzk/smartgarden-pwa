import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { DynamicSchedulingService } from "@/services/dynamicSchedulingService";
import { CareActivityDetails } from "@/types";
import { getRelevantFertilizationTasksForPlant } from "@/utils/fertilizationUtils";
import { FirebaseScheduledTaskService } from "@/services/firebase/scheduledTaskService";

export interface FertilizationTasksManager {
  upcomingFertilization: any[];
  handleTaskComplete: (taskId: string, quickData?: any) => Promise<void>;
  handleTaskBypass: (taskId: string, reason?: string) => Promise<void>;
  handleTaskLogActivity: (taskId: string) => void;
}

export const useFertilizationTasks = (
  visiblePlants: any[],
  logActivity: (activity: any) => Promise<string | null>,
  navigate: (path: string) => void,
  onActivityLogged: () => void
): FertilizationTasksManager => {
  // Calculate fertilization tasks directly from plant data (no Firebase dependency)
  const [upcomingFertilization, setUpcomingFertilization] = useState<any[]>([]);

  useEffect(() => {
    const calculateFertilizationTasks = async () => {
      if (!visiblePlants || visiblePlants.length === 0) {
        setUpcomingFertilization([]);
        return;
      }

      const allFertilizationTasks: any[] = [];
      const now = new Date();

      // Load existing fertilization tasks from Firebase for each visible plant  
      for (const plant of visiblePlants) {
        try {
          console.log(
            `Loading existing tasks for plant ${plant.name} from Firebase`
          );
          
          // Get existing tasks from Firebase instead of generating fresh
          const plantTasks = await FirebaseScheduledTaskService.getTasksForPlant(plant.id);
          
          // Filter to only fertilization tasks within our time horizon
          const now = new Date();
          const futureHorizonDays = 21; // 3 weeks ahead
          const pastHorizonDays = 14; // 2 weeks behind for overdue tasks
          
          const filteredTasks = plantTasks.filter(task => {
            if (task.taskType !== 'fertilize') return false;
            
            const daysDiff = Math.floor(
              (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return daysDiff >= -pastHorizonDays && daysDiff <= futureHorizonDays;
          });

          console.log(
            `Loaded ${filteredTasks.length} fertilization tasks for plant ${plant.name} (${plantTasks.length} total tasks in Firebase)`
          );

          // Add the filtered fertilization tasks to our collection
          allFertilizationTasks.push(...filteredTasks);
        } catch (error) {
          console.error(
            `Error loading fertilization tasks for plant ${plant.name}:`,
            error
          );
        }
      }

      // Group tasks by plant and get only the most relevant ones
      const tasksByPlant = new Map<string, any[]>();
      allFertilizationTasks.forEach((task) => {
        if (!tasksByPlant.has(task.plantId)) {
          tasksByPlant.set(task.plantId, []);
        }
        tasksByPlant.get(task.plantId)!.push(task);
      });

      // For each plant, get only the most relevant fertilization tasks
      const relevantTasks: any[] = [];

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

      setUpcomingFertilization(Array.from(groupedTasks.values()));
    };

    calculateFertilizationTasks();
  }, [visiblePlants]);

  const handleTaskComplete = useCallback(
    async (taskId: string, quickData?: any) => {
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
    },
    [upcomingFertilization, logActivity, onActivityLogged]
  );

  const handleTaskBypass = useCallback(
    async (taskId: string, reason?: string) => {
      // TODO: Implement actual task bypass logic with taskId
      // For now, we'll just show a success message
      const message = reason
        ? `Task bypassed: ${reason}`
        : "Task bypassed successfully";

      toast.success(message);

      // TODO: Add actual implementation to update task status in the database
      console.log(
        `Bypassing task ${taskId} with reason: ${
          reason || "No reason provided"
        }`
      );
    },
    []
  );

  const handleTaskLogActivity = useCallback(
    (taskId: string) => {
      const task = upcomingFertilization.find((t) => t.id === taskId);
      if (task) {
        navigate(`/log-care/${task.plantId}`);
      }
    },
    [upcomingFertilization, navigate]
  );

  return {
    upcomingFertilization,
    handleTaskComplete,
    handleTaskBypass,
    handleTaskLogActivity,
  };
};
