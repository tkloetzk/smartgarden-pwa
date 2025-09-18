import { useState, useEffect } from "react";
import { calculateUpcomingTasks } from "@/utils/care/localCareCalculations";
import { UpcomingTask, CareActivityType, CareRecord, PlantRecord } from "@/types";

interface AllUpcomingTasksResult {
  careTasks: UpcomingTask[];
  fertilizationTasks: any[];
  allTasks: UpcomingTask[];
  loading: boolean;
  error: string | null;
}

export const useAllUpcomingTasks = (
  plants: PlantRecord[],
  getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>,
  getUpcomingFertilizationTasks?: (days: number) => any[]
): AllUpcomingTasksResult => {

  const [careTasks, setCareTasks] = useState<UpcomingTask[]>([]);
  const [fertilizationTasks, setFertilizationTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllTasks = async () => {
      if (!plants || plants.length === 0) {
        setCareTasks([]);
        setFertilizationTasks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get standard care tasks (watering, observation) using local calculation with grouping enabled
        const careTasksResult = await calculateUpcomingTasks(
          plants,
          getLastActivityByType,
          true // Enable grouping for catch-up page
        );

        // Get fertilization tasks from hook parameter
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
  }, [plants, getLastActivityByType, getUpcomingFertilizationTasks]);

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
