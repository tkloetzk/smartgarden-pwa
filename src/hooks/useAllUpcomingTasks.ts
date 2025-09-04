import { useState, useEffect } from "react";
import { useFirebasePlants } from "./useFirebasePlants";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { useScheduledTasks } from "./useScheduledTasks";
import { FirebaseCareSchedulingService } from "@/services/firebaseCareSchedulingService";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { UpcomingTask } from "@/types";

interface AllUpcomingTasksResult {
  careTasks: UpcomingTask[];
  fertilizationTasks: any[];
  allTasks: UpcomingTask[];
  loading: boolean;
  error: string | null;
}

export const useAllUpcomingTasks = (): AllUpcomingTasksResult => {
  const { plants, loading: plantsLoading } = useFirebasePlants();
  const { user } = useFirebaseAuth();
  const { getUpcomingFertilizationTasks } = useScheduledTasks();

  const [careTasks, setCareTasks] = useState<UpcomingTask[]>([]);
  const [fertilizationTasks, setFertilizationTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllTasks = async () => {
      if (!plants || !user?.uid) {
        setLoading(false);
        return;
      }

      // Don't start loading if plants are still loading
      if (plantsLoading) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get last activity function for care tasks
        const getLastActivityByType = async (plantId: string, type: any) => {
          return FirebaseCareActivityService.getLastActivityByType(
            plantId,
            user.uid,
            type
          );
        };

        // Get standard care tasks (watering, observation)
        const careTasksResult =
          await FirebaseCareSchedulingService.getUpcomingTasks(
            plants,
            getLastActivityByType
          );

        // Get fertilization tasks from scheduled tasks hook (get all tasks for filtering/grouping)
        const fertTasksResult = getUpcomingFertilizationTasks
          ? getUpcomingFertilizationTasks(365)
          : [];


        setCareTasks(careTasksResult);
        setFertilizationTasks(fertTasksResult);
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setError(err instanceof Error ? err.message : "Failed to load tasks");
        setCareTasks([]);
        setFertilizationTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllTasks();
  }, [plants, user?.uid, plantsLoading, getUpcomingFertilizationTasks]);

  // Combine all tasks for convenience
  const allTasks = [...careTasks];

  return {
    careTasks,
    fertilizationTasks,
    allTasks,
    loading,
    error,
  };
};
