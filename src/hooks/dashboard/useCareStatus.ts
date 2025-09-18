import { useState, useEffect, useRef, useMemo } from "react";
import { calculateUpcomingTasks } from "@/utils/care/localCareCalculations";
import { getRelevantFertilizationTasksForPlant } from "@/utils/care/fertilizationUtils";
import { CareActivityType, CareRecord, PlantRecord } from "@/types";

export interface CareStatus {
  groupsNeedingCatchUp: number;
  careStatusLoading: boolean;
}

export const useCareStatus = (
  plants: PlantRecord[] | null,
  getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>,
  activityLoggedTrigger: number,
  hiddenGroups: Set<string>,
  getUpcomingFertilizationTasks: ((days: number) => any[]) | undefined
): CareStatus => {
  const [groupsNeedingCatchUp, setGroupsNeedingCatchUp] = useState(0);
  const [careStatusLoading, setCareStatusLoading] = useState(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize visible plants to prevent unnecessary recalculations
  const visiblePlants = useMemo(() => {
    return plants || [];
  }, [plants]);

  // Load catch-up data count for summary card with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const loadCatchUpCount = async () => {
      if (!plants || plants.length === 0) {
        setGroupsNeedingCatchUp(0);
        setCareStatusLoading(false);
        return;
      }

      setCareStatusLoading(true);
      try {
        // Use memoized visible plants to prevent unnecessary object creation

        // Debug logging removed for cleaner test output

        // TODO: Add retroactive analysis back later
        // Skip retroactive analysis for now

        // Get standard care tasks (watering, observation) using local calculation
        // Note: Enable grouping for care status to match catch-up page experience
        const careTasks = await calculateUpcomingTasks(
          visiblePlants,
          getLastActivityByType,
          true // Enable grouping to count task groups instead of individual plants
        );

        // Get fertilization tasks using the SAME logic as the dashboard fertilization section
        // Note: We capture the function reference at the time of effect execution to avoid dependency issues
        const fertTasksFunction = getUpcomingFertilizationTasks;
        const allFertilizationTasks = fertTasksFunction
          ? fertTasksFunction(365)
          : [];

        // Filter fertilization tasks to only include visible plants
        const visibleFertilizationTasks = allFertilizationTasks.filter((task) =>
          visiblePlants.some((plant) => plant.id === task.plantId)
        );

        // Group tasks by plant and get only the most relevant ones (same as dashboard)
        const tasksByPlant = new Map<string, any[]>();
        visibleFertilizationTasks.forEach((task) => {
          if (!tasksByPlant.has(task.plantId)) {
            tasksByPlant.set(task.plantId, []);
          }
          tasksByPlant.get(task.plantId)!.push(task);
        });

        // For each plant, get only the most relevant fertilization tasks
        const relevantFertilizationTasks: any[] = [];
        const now = new Date();

        tasksByPlant.forEach((tasks) => {
          const plantRelevantTasks = getRelevantFertilizationTasksForPlant(
            tasks,
            now
          );
          relevantFertilizationTasks.push(...plantRelevantTasks);
        });

        //  console.log("relevantFertilizationTasks:", relevantFertilizationTasks);
        // Count unique task groups (care tasks are already grouped, fertilization tasks need grouping)
        const uniqueTaskGroups = new Set();

        // Care tasks are already grouped by calculateUpcomingTasks, so each task represents a group
        careTasks.forEach((task) => {
          uniqueTaskGroups.add(task.id); // Use task ID as each represents a unique group
        });

        // For fertilization tasks, we need to count unique groups (same logic as useTaskProcessing)
        relevantFertilizationTasks.forEach((task) => {
          // Find the plant for this task to get grouping info
          const plant = visiblePlants.find((p) => p.id === task.plantId);
          if (!plant) return;

          // Create the same grouping key as useTaskProcessing uses
          const dueDateStr = task.dueDate.toDateString();
          const groupKey = `${plant.varietyName}-${task.taskName}-${task.details?.product || 'no-product'}-${dueDateStr}`;
          uniqueTaskGroups.add(`fert-${groupKey}`);
        });

        setGroupsNeedingCatchUp(uniqueTaskGroups.size);
      } catch (error) {
        console.error("Failed to load catch-up count:", error);
        setGroupsNeedingCatchUp(0);
      } finally {
        setCareStatusLoading(false);
      }
    };

    // Debounce the calculation to prevent rapid successive calls
    // Use shorter timeout in test environment to avoid test timing issues
    const debounceDelay = process.env.NODE_ENV === 'test' ? 0 : 300;
    debounceTimeoutRef.current = setTimeout(() => {
      loadCatchUpCount();
    }, debounceDelay);

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    visiblePlants,
    getLastActivityByType,
    activityLoggedTrigger,
    hiddenGroups,
    // Note: getUpcomingFertilizationTasks removed from deps to prevent constant re-renders
    // The function is stable enough and fertilization tasks are fetched inside the effect
  ]);

  return {
    groupsNeedingCatchUp,
    careStatusLoading,
  };
};
