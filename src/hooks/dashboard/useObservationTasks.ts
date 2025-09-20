import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PlantRecord } from "@/types/database";
import toast from "react-hot-toast";
import {
  groupTasksByVarietyAndDetails,
  GroupingKeyGenerators,
  completeGroupedTask,
  bypassGroupedTask
} from "@/utils/tasks/taskGrouping";

interface ObservationTask {
  id: string;
  plantId: string;
  taskName: string;
  taskType: "observe";
  dueDate: Date;
  priority: "low" | "medium" | "high";
  details: {
    type: "observe";
    focus?: string;
    notes?: string;
  };
  plantCount?: number;
  varietyName?: string;
  affectedPlants?: Array<{ id: string; name: string }>;
}

export const useObservationTasks = (
  visiblePlants: PlantRecord[],
  logActivity: (activity: any) => Promise<void>,
  navigate: ReturnType<typeof useNavigate>,
  handleActivityLogged: () => void,
  getLastActivityByType: (plantId: string, type: string) => Promise<any>
) => {
  const [upcomingObservation, setUpcomingObservation] = useState<ObservationTask[]>([]);

  const calculateObservationTasks = useCallback(async () => {
    if (!visiblePlants || visiblePlants.length === 0) {
      setUpcomingObservation([]);
      return;
    }

    const allObservationTasks: ObservationTask[] = [];
    const now = new Date();

    // Generate observation tasks for each visible plant
    for (const plant of visiblePlants) {
      try {
        console.log(`Calculating observation tasks for plant ${plant.name} locally`);

        // Get last observation activity
        const lastObservation = await getLastActivityByType(plant.id, "observe");

        // Create observation task based on last observation and plant needs
        const observationTask = createObservationTask(plant, lastObservation, now);

        if (observationTask) {
          console.log(
            `Created observation task for plant ${plant.name}: due ${observationTask.dueDate.toDateString()}`
          );
          allObservationTasks.push(observationTask);
        }
      } catch (error) {
        console.error(
          `Error calculating observation tasks for plant ${plant.name}:`,
          error
        );
      }
    }

    // Get only the most relevant observation tasks
    const relevantTasks = getRelevantObservationTasksForPlants(allObservationTasks, now);

    // Group identical tasks using shared utility
    const groupedTasks = groupTasksByVarietyAndDetails(
      relevantTasks,
      visiblePlants,
      GroupingKeyGenerators.observation
    );

    setUpcomingObservation(groupedTasks);
  }, [visiblePlants, getLastActivityByType]);

  useEffect(() => {
    calculateObservationTasks();
  }, [calculateObservationTasks]);

  const handleTaskComplete = useCallback(
    async (taskId: string, quickData?: any) => {
      try {
        const task = upcomingObservation.find((t) => t.id === taskId);
        if (!task) return;

        // Prepare quick data for grouped completion
        const observationQuickData = {
          observationFocus: quickData?.observationFocus || task.details.focus || "general",
          healthStatus: quickData?.healthStatus || "healthy",
          ...quickData,
        };

        // Use shared utility for grouped task completion
        await completeGroupedTask(task, observationQuickData, logActivity);

        // Remove the completed task from the list
        setUpcomingObservation((prev) => prev.filter((t) => t.id !== taskId));
        handleActivityLogged();

        console.log(`✅ Completed observation task ${taskId}`);
      } catch (error) {
        console.error(`❌ Error completing observation task ${taskId}:`, error);
      }
    },
    [upcomingObservation, logActivity, handleActivityLogged]
  );

  const handleTaskBypass = useCallback(
    async (taskId: string, reason?: string) => {
      try {
        const task = upcomingObservation.find((t) => t.id === taskId);
        if (!task) return;

        // Use shared utility for grouped task bypass
        await bypassGroupedTask(task, reason, logActivity);

        // Remove the bypassed task from the list
        setUpcomingObservation((prev) => prev.filter((t) => t.id !== taskId));
        handleActivityLogged();

        toast.success(
          reason ? `Task bypassed: ${reason}` : "Task bypassed successfully"
        );

        console.log(`⏭️ Bypassed observation task ${taskId}`);
      } catch (error) {
        console.error(`❌ Error bypassing observation task ${taskId}:`, error);
        toast.error("Failed to bypass task");
      }
    },
    [upcomingObservation, logActivity, handleActivityLogged]
  );

  const handleTaskLogActivity = useCallback(
    (taskId: string) => {
      const task = upcomingObservation.find((t) => t.id === taskId);
      if (!task) return;

      // Navigate to log care page with pre-filled observation data
      navigate(`/log-care/${task.plantId}?type=observe&focus=${encodeURIComponent(task.details.focus || "general")}`);
    },
    [upcomingObservation, navigate]
  );

  return {
    upcomingObservation,
    handleTaskComplete,
    handleTaskBypass,
    handleTaskLogActivity,
  };
};

// Helper function to create observation tasks
function createObservationTask(
  plant: PlantRecord,
  lastObservation: any,
  now: Date
): ObservationTask | null {
  // Ensure plantedDate is a Date object
  const plantedDateObj = plant.plantedDate instanceof Date ? plant.plantedDate : new Date(plant.plantedDate);
  const plantAge = Math.floor((now.getTime() - plantedDateObj.getTime()) / (1000 * 60 * 60 * 24));

  // Determine observation frequency based on plant age and type
  let observationIntervalDays = 7; // Default to weekly observations

  // Adjust based on plant characteristics (simplified logic)
  if (plantAge < 7) {
    observationIntervalDays = 2; // Young plants need frequent observation
  } else if (plantAge < 21) {
    observationIntervalDays = 3; // Growing plants every 3 days
  } else if (plantAge < 60) {
    observationIntervalDays = 7; // Established plants weekly
  } else {
    observationIntervalDays = 14; // Mature plants bi-weekly
  }

  // Calculate next observation date
  let nextObservationDate: Date;
  if (lastObservation) {
    const lastObservationDate = new Date(lastObservation.timestamp);
    nextObservationDate = new Date(lastObservationDate);
    nextObservationDate.setDate(nextObservationDate.getDate() + observationIntervalDays);
  } else {
    // If no previous observation, schedule for today or within 2 days
    nextObservationDate = new Date(now);
    nextObservationDate.setDate(nextObservationDate.getDate() + Math.min(2, observationIntervalDays));
  }

  // Only create task if observation is due within the next 14 days
  const daysDifference = Math.ceil((nextObservationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDifference > 14) {
    return null;
  }

  // Determine priority based on how overdue or soon the task is
  let priority: "low" | "medium" | "high" = "medium";
  if (daysDifference < 0) {
    priority = "high"; // Overdue
  } else if (daysDifference <= 1) {
    priority = "medium"; // Due today/tomorrow
  } else {
    priority = "low"; // Future
  }

  // Determine observation focus based on plant age and characteristics
  let focus = "general health";
  if (plantAge < 7) {
    focus = "germination and early growth";
  } else if (plantAge < 21) {
    focus = "growth development";
  } else if (plantAge < 60) {
    focus = "health and pest check";
  } else {
    focus = "harvest readiness and health";
  }

  return {
    id: `observe-${plant.id}-${nextObservationDate.getTime()}`,
    plantId: plant.id,
    taskName: `Observe ${plant.name}`,
    taskType: "observe",
    dueDate: nextObservationDate,
    priority,
    details: {
      type: "observe",
      focus,
      notes: `Check ${plant.name} for ${focus} in ${plant.container || "container"}`,
    },
  };
}

// Helper function to get relevant observation tasks
function getRelevantObservationTasksForPlants(
  tasks: ObservationTask[],
  now: Date
): ObservationTask[] {
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const fourteenDaysFromNow = new Date(now);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  // Filter tasks within our time window
  return tasks.filter((task) => {
    return task.dueDate >= threeDaysAgo && task.dueDate <= fourteenDaysFromNow;
  }).sort((a, b) => {
    // Sort by due date (overdue first, then by date)
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}