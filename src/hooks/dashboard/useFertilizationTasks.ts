import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { DynamicSchedulingService } from "@/services/dynamicSchedulingService";
import { CareActivityDetails, CareRecord } from "@/types";
import { getRelevantFertilizationTasksForPlant } from "@/utils/care/fertilizationUtils";
import { seedVarieties } from "@/data/seedVarieties";
import { differenceInDays, addDays } from "date-fns";
import { calculateCurrentStageWithVariety } from "@/utils/plant/growthStage";
import { getPlantDisplayName } from "@/utils/plant/plantDisplay";
import {
  groupTasksByVarietyAndDetails,
  GroupingKeyGenerators,
  completeGroupedTask,
  bypassGroupedTask
} from "@/utils/tasks/taskGrouping";

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
  onActivityLogged: () => void,
  getLastActivityByType: (plantId: string, type: string) => Promise<CareRecord | null>
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

      // Generate fertilization tasks locally for each visible plant
      for (const plant of visiblePlants) {
        try {
          console.log(
            `Calculating fertilization tasks for plant ${plant.name} locally`
          );

          // Get the seed variety for this plant
          const variety = seedVarieties.find(v => v.name === plant.varietyName);
          if (!variety) {
            console.log(`No variety found for ${plant.varietyName}`);
            continue;
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

          // Get last fertilizing activity
          const lastFertilizing = await getLastActivityByType(plant.id, "fertilize");

          // Create fertilizing task using local calculation
          const fertilizingTask = createFertilizingTask(plant, variety, currentStage, lastFertilizing, now);

          if (fertilizingTask) {
            console.log(
              `Created fertilization task for plant ${plant.name}: due ${fertilizingTask.dueDate.toDateString()}`
            );
            allFertilizationTasks.push(fertilizingTask);
          }
        } catch (error) {
          console.error(
            `Error calculating fertilization tasks for plant ${plant.name}:`,
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

      // Group identical tasks using shared utility
      const groupedTasks = groupTasksByVarietyAndDetails(
        relevantTasks,
        visiblePlants,
        GroupingKeyGenerators.fertilization
      );

      setUpcomingFertilization(groupedTasks);
    };

    calculateFertilizationTasks();
  }, [visiblePlants, getLastActivityByType]);

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
      try {
        const task = upcomingFertilization.find((t) => t.id === taskId);
        if (!task) {
          toast.error("Task not found");
          return;
        }

        // Use shared utility for grouped task bypass
        await bypassGroupedTask(task, reason, logActivity);

        // Remove the bypassed task from the list
        setUpcomingFertilization((prev) => prev.filter((t) => t.id !== taskId));

        toast.success(reason ? `Task bypassed: ${reason}` : "Task bypassed successfully");
        onActivityLogged();

        console.log(`✅ Bypassed fertilization task ${taskId}`);
      } catch (error) {
        console.error(`❌ Error bypassing fertilization task ${taskId}:`, error);
        toast.error("Failed to bypass task");
      }
    },
    [upcomingFertilization, logActivity, onActivityLogged]
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

// Helper function to create fertilizing task locally (adapted from localCareCalculations)
function createFertilizingTask(
  plant: any,
  variety: any,
  currentStage: any,
  lastFertilizing: CareRecord | null,
  today: Date
): any | null {
  const stageFertilizing = variety.protocols?.fertilization?.[currentStage];
  if (!stageFertilizing?.schedule?.length) return null;

  const firstSchedule = stageFertilizing.schedule[0];
  const frequencyDays = firstSchedule.frequencyDays || 14;

  const lastFertilizingDate = lastFertilizing ? new Date(lastFertilizing.date) : plant.plantedDate;

  const dueDate = addDays(lastFertilizingDate, frequencyDays);
  const thresholdDate = addDays(today, 21); // 3 weeks ahead threshold

  if (dueDate > thresholdDate) return null;

  const daysOverdue = differenceInDays(today, dueDate);
  const isOverdue = daysOverdue > 0;

  // Create detailed fertilization task with Firebase-compatible format
  return {
    id: `fertilize-${plant.id}`,
    plantId: plant.id,
    plantName: getPlantDisplayName(plant),
    taskName: `Apply ${firstSchedule.product || 'Fertilizer'}`,
    taskType: 'fertilize',
    details: {
      type: 'fertilize',
      product: firstSchedule.product || 'Liquid Fertilizer',
      dilution: firstSchedule.dilution || '1:10',
      amount: firstSchedule.amount || '200ml',
      method: firstSchedule.applicationMethod || 'soil-drench'
    },
    dueDate,
    status: 'pending',
    sourceProtocol: 'fertilization',
    createdAt: today,
    updatedAt: today,
    isCompleted: false,
    isDynamic: true,
    isOverdue,
    priority: isOverdue ? 'high' : 'medium'
  };
}
