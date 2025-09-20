import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PlantRecord } from "@/types/database";
import {
  groupTasksByVarietyAndDetails,
  GroupingKeyGenerators,
  completeGroupedTask,
  bypassGroupedTask
} from "@/utils/tasks/taskGrouping";

interface WateringTask {
  id: string;
  plantId: string;
  taskName: string;
  taskType: "water";
  dueDate: Date;
  priority: "low" | "medium" | "high";
  details: {
    type: "water";
    amount?: string;
    notes?: string;
  };
  plantCount?: number;
  varietyName?: string;
  affectedPlants?: Array<{ id: string; name: string }>;
}

export const useWateringTasks = (
  visiblePlants: PlantRecord[],
  logActivity: (activity: any) => Promise<void>,
  navigate: ReturnType<typeof useNavigate>,
  handleActivityLogged: () => void,
  getLastActivityByType: (plantId: string, type: string) => Promise<any>
) => {
  const [upcomingWatering, setUpcomingWatering] = useState<WateringTask[]>([]);

  const calculateWateringTasks = useCallback(async () => {
    if (!visiblePlants || visiblePlants.length === 0) {
      setUpcomingWatering([]);
      return;
    }

    const allWateringTasks: WateringTask[] = [];
    const now = new Date();

    // Generate watering tasks for each visible plant
    for (const plant of visiblePlants) {
      try {
        console.log(`Calculating watering tasks for plant ${plant.name} locally`);

        // Get last watering activity
        const lastWatering = await getLastActivityByType(plant.id, "water");

        // Create watering task based on last watering and plant needs
        const wateringTask = createWateringTask(plant, lastWatering, now);

        if (wateringTask) {
          console.log(
            `Created watering task for plant ${plant.name}: due ${wateringTask.dueDate.toDateString()}`
          );
          allWateringTasks.push(wateringTask);
        }
      } catch (error) {
        console.error(
          `Error calculating watering tasks for plant ${plant.name}:`,
          error
        );
      }
    }

    // Get only the most relevant watering tasks
    const relevantTasks = getRelevantWateringTasksForPlants(allWateringTasks, now);

    // Group identical tasks using shared utility
    const groupedTasks = groupTasksByVarietyAndDetails(
      relevantTasks,
      visiblePlants,
      GroupingKeyGenerators.watering
    );

    setUpcomingWatering(groupedTasks);
  }, [visiblePlants, getLastActivityByType]);

  useEffect(() => {
    calculateWateringTasks();
  }, [calculateWateringTasks]);

  const handleTaskComplete = useCallback(
    async (taskId: string, quickData?: any) => {
      try {
        const task = upcomingWatering.find((t) => t.id === taskId);
        if (!task) return;

        // Prepare quick data for grouped completion
        const wateringQuickData = {
          waterAmount: quickData?.waterAmount || 20,
          waterUnit: quickData?.waterUnit || "oz",
          ...quickData,
        };

        // Use shared utility for grouped task completion
        await completeGroupedTask(task, wateringQuickData, logActivity);

        // Remove the completed task from the list
        setUpcomingWatering((prev) => prev.filter((t) => t.id !== taskId));
        handleActivityLogged();

        console.log(`✅ Completed watering task ${taskId}`);
      } catch (error) {
        console.error(`❌ Error completing watering task ${taskId}:`, error);
      }
    },
    [upcomingWatering, logActivity, handleActivityLogged]
  );

  const handleTaskBypass = useCallback(
    async (taskId: string, reason?: string) => {
      try {
        const task = upcomingWatering.find((t) => t.id === taskId);
        if (!task) return;

        // Use shared utility for grouped task bypass
        await bypassGroupedTask(task, reason, logActivity);

        // Remove the bypassed task from the list
        setUpcomingWatering((prev) => prev.filter((t) => t.id !== taskId));
        handleActivityLogged();

        console.log(`⏭️ Bypassed watering task ${taskId}`);
      } catch (error) {
        console.error(`❌ Error bypassing watering task ${taskId}:`, error);
      }
    },
    [upcomingWatering, logActivity, handleActivityLogged]
  );

  const handleTaskLogActivity = useCallback(
    (taskId: string) => {
      const task = upcomingWatering.find((t) => t.id === taskId);
      if (!task) return;

      // Navigate to log care page with pre-filled watering data
      navigate(`/log-care/${task.plantId}?type=water&amount=${encodeURIComponent(task.details.amount || "20oz")}`);
    },
    [upcomingWatering, navigate]
  );

  return {
    upcomingWatering,
    handleTaskComplete,
    handleTaskBypass,
    handleTaskLogActivity,
  };
};

// Helper function to create watering tasks
function createWateringTask(
  plant: PlantRecord,
  lastWatering: any,
  now: Date
): WateringTask | null {
  // Ensure plantedDate is a Date object
  const plantedDateObj = plant.plantedDate instanceof Date ? plant.plantedDate : new Date(plant.plantedDate);
  const plantAge = Math.floor((now.getTime() - plantedDateObj.getTime()) / (1000 * 60 * 60 * 24));

  // Determine watering frequency based on plant age and type
  let wateringIntervalDays = 2; // Default to every 2 days

  // Adjust based on plant characteristics (simplified logic)
  if (plantAge < 14) {
    wateringIntervalDays = 1; // Young plants need daily watering
  } else if (plantAge < 30) {
    wateringIntervalDays = 2; // Mature seedlings every 2 days
  } else {
    wateringIntervalDays = 3; // Established plants every 3 days
  }

  // Calculate next watering date
  let nextWateringDate: Date;
  if (lastWatering) {
    const lastWateringDate = new Date(lastWatering.timestamp);
    nextWateringDate = new Date(lastWateringDate);
    nextWateringDate.setDate(nextWateringDate.getDate() + wateringIntervalDays);
  } else {
    // If no previous watering, assume it needs watering now
    nextWateringDate = new Date(now);
  }

  // Only create task if watering is due within the next 7 days
  const daysDifference = Math.ceil((nextWateringDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDifference > 7) {
    return null;
  }

  // Determine priority based on how overdue or soon the task is
  let priority: "low" | "medium" | "high" = "medium";
  if (daysDifference < 0) {
    priority = "high"; // Overdue
  } else if (daysDifference === 0) {
    priority = "medium"; // Due today
  } else {
    priority = "low"; // Future
  }

  // Determine amount based on container size
  let amount = "20oz"; // Default
  if (plant.container?.toLowerCase().includes("gallon")) {
    const gallons = parseInt(plant.container.match(/\d+/)?.[0] || "5");
    amount = `${Math.max(20, gallons * 4)}oz`; // Roughly 4oz per gallon capacity
  }

  return {
    id: `water-${plant.id}-${nextWateringDate.getTime()}`,
    plantId: plant.id,
    taskName: `Water ${plant.name}`,
    taskType: "water",
    dueDate: nextWateringDate,
    priority,
    details: {
      type: "water",
      amount,
      notes: `Water ${plant.name} in ${plant.container || "container"}`,
    },
  };
}

// Helper function to get relevant watering tasks
function getRelevantWateringTasksForPlants(
  tasks: WateringTask[],
  now: Date
): WateringTask[] {
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Filter tasks within our time window
  return tasks.filter((task) => {
    return task.dueDate >= threeDaysAgo && task.dueDate <= sevenDaysFromNow;
  }).sort((a, b) => {
    // Sort by due date (overdue first, then by date)
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}