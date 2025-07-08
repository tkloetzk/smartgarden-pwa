// src/hooks/useScheduledTasks.ts
import { useState, useEffect } from "react";
import { FirebaseScheduledTaskService } from "../services/firebase/scheduledTaskService";
import { ScheduledTask } from "../services/ProtocolTranspilerService";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { addDays } from "date-fns";

export function useScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const unsubscribe = FirebaseScheduledTaskService.subscribeToUserTasks(
      user.uid,
      (userTasks) => {
        setTasks(userTasks);
        setLoading(false);
        setError(null);
      },
      (err) => {
        // Handle the error from the service
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const getFertilizationTasksBeforeNextWatering = async (plantId?: string) => {
    const allTasks = tasks.filter((t) =>
      plantId ? t.plantId === plantId : true
    );

    const fertilizeTasks = allTasks.filter((t) => t.taskType === "fertilize");
    const waterTasks = allTasks.filter((t) => t.taskType === "water");

    return fertilizeTasks.filter((fertTask) => {
      const nextWatering = waterTasks
        .filter(
          (w) => w.plantId === fertTask.plantId && w.dueDate > fertTask.dueDate
        )
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

      // Show fertilizer tasks that are due before the next watering + 1 day buffer
      return (
        !nextWatering || fertTask.dueDate <= addDays(nextWatering.dueDate, 1)
      );
    });
  };

  // Get fertilization tasks due soon
  const getUpcomingFertilizationTasks = (daysAhead = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return tasks.filter(
      (task) => task.taskType === "fertilize" && task.dueDate <= cutoffDate
    );
  };

  return {
    tasks,
    loading,
    error,
    getUpcomingFertilizationTasks,
    getFertilizationTasksBeforeNextWatering,
  };
}
