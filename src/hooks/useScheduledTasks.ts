// src/hooks/useScheduledTasks.ts
import { useState, useEffect } from "react";
import { FirebaseScheduledTaskService } from "../services/firebase/scheduledTaskService";
import { ScheduledTask } from "../services/ProtocolTranspilerService";
import { useFirebaseAuth } from "./useFirebaseAuth";

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
  };
}
