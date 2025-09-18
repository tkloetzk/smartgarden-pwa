// src/hooks/useScheduledTasks.ts
import { useState, useEffect, useCallback } from "react";
import { ScheduledTask } from "@/services/ProtocolTranspilerService";
import { CareRecord, PlantRecord } from "@/types";
import { calculateUpcomingTasks } from "@/utils/care/localCareCalculations";
import { addDays } from "date-fns";

export function useScheduledTasks(
  plants: PlantRecord[],
  getLastActivityByType: (plantId: string, type: string) => Promise<CareRecord | null>
) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateTasks = async () => {
      if (!plants || plants.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Calculate tasks locally using plant data and care history
        const upcomingTasks = await calculateUpcomingTasks(
          plants,
          getLastActivityByType,
          true // Enable grouping
        );

        // Convert to ScheduledTask format for compatibility
        const scheduledTasks: ScheduledTask[] = upcomingTasks.map(task => ({
          id: task.id,
          plantId: task.plantId,
          taskName: task.task,
          taskType: task.type as any,
          details: {
            type: task.type,
            product: 'Default Product',
            dilution: '1:10',
            amount: '200ml',
            method: 'soil-drench'
          },
          dueDate: task.dueDate,
          status: 'pending',
          sourceProtocol: 'local-calculation',
          createdAt: new Date(),
          updatedAt: new Date(),
          isCompleted: false,
          isDynamic: true
        }));

        setTasks(scheduledTasks);
        setLoading(false);
      } catch (err) {
        console.error('Error calculating scheduled tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to calculate tasks');
        setLoading(false);
      }
    };

    calculateTasks();
  }, [plants, getLastActivityByType]);

  const getFertilizationTasksBeforeNextWatering = useCallback(
    async (plantId?: string) => {
      const allTasks = tasks.filter((t) =>
        plantId ? t.plantId === plantId : true
      );

      const fertilizeTasks = allTasks.filter((t) => t.taskType === "fertilize");
      const waterTasks = allTasks.filter((t) => t.taskType === "water");

      return fertilizeTasks.filter((fertTask) => {
        const nextWatering = waterTasks
          .filter(
            (w) =>
              w.plantId === fertTask.plantId && w.dueDate > fertTask.dueDate
          )
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

        // Show fertilizer tasks that are due before the next watering + 1 day buffer
        return (
          !nextWatering || fertTask.dueDate <= addDays(nextWatering.dueDate, 1)
        );
      });
    },
    [tasks]
  );

  // Get fertilization tasks due soon - memoized to prevent unnecessary re-creation
  const getUpcomingFertilizationTasks = useCallback(
    (daysAhead = 7) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const fertilizationTasks = tasks.filter(
        (task) => task.taskType === "fertilize" && task.dueDate <= cutoffDate
      );

      return fertilizationTasks;
    },
    [tasks]
  );

  const returnValue = {
    tasks,
    loading,
    error,
    getUpcomingFertilizationTasks,
    getFertilizationTasksBeforeNextWatering,
  };

  return returnValue;
}
