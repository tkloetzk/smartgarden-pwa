import { useState, useEffect } from "react";
import { FirebaseCareSchedulingService } from "@/services/firebaseCareSchedulingService";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { getRelevantFertilizationTasksForPlant } from "@/utils/fertilizationUtils";

export interface CareStatus {
  plantsNeedingCatchUp: number;
  careStatusLoading: boolean;
}

export const useCareStatus = (
  plants: any[] | null,
  userUid: string | undefined,
  activityLoggedTrigger: number,
  hiddenGroups: Set<string>,
  getUpcomingFertilizationTasks: ((days: number) => any[]) | undefined
): CareStatus => {
  const [plantsNeedingCatchUp, setPlantsNeedingCatchUp] = useState(0);
  const [careStatusLoading, setCareStatusLoading] = useState(true);

  // Load catch-up data count for summary card
  useEffect(() => {
    const loadCatchUpCount = async () => {
      if (!plants || !userUid) {
        setPlantsNeedingCatchUp(0);
        setCareStatusLoading(false);
        return;
      }

      setCareStatusLoading(true);
      try {
        // For Plant Care Status, use plants directly (plantGroups might not be ready yet)
        // We'll handle hiding logic by checking individual plant group membership
        const allPlants = plants || [];

        // Simple visible plants logic: just use all plants for now
        // (Plant hiding is a UI convenience, not a core care tracking feature)
        const visiblePlants = allPlants;

        // Debug logging removed for cleaner test output

        // TODO: Add retroactive analysis back later
        // Skip retroactive analysis for now

        // Get upcoming tasks using the Firebase care scheduling service
        const getLastActivityByType = async (plantId: string, type: any) => {
          return FirebaseCareActivityService.getLastActivityByType(
            plantId,
            userUid,
            type
          );
        };

        // Get standard care tasks (watering, observation)
        const careTasks = await FirebaseCareSchedulingService.getUpcomingTasks(
          visiblePlants, // Use visible plants only, not all plants
          getLastActivityByType
        );

        // Get fertilization tasks using the SAME logic as the dashboard fertilization section
        const allFertilizationTasks = getUpcomingFertilizationTasks
          ? getUpcomingFertilizationTasks(365)
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

        tasksByPlant.forEach((tasks, plantId) => {
          const plantRelevantTasks = getRelevantFertilizationTasksForPlant(
            tasks,
            now
          );
          relevantFertilizationTasks.push(...plantRelevantTasks);
        });

        //  console.log("relevantFertilizationTasks:", relevantFertilizationTasks);
        // Count unique plants that have any tasks (indicating they need care)
        const uniquePlantIds = new Set();
        careTasks.forEach((task) => {
          uniquePlantIds.add(task.plantId);
        });
        relevantFertilizationTasks.forEach((task) => {
          uniquePlantIds.add(task.plantId);
        });
        setPlantsNeedingCatchUp(uniquePlantIds.size);
      } catch (error) {
        console.error("Failed to load catch-up count:", error);
        setPlantsNeedingCatchUp(0);
      } finally {
        setCareStatusLoading(false);
      }
    };

    loadCatchUpCount();
  }, [
    plants,
    userUid,
    activityLoggedTrigger,
    hiddenGroups,
    getUpcomingFertilizationTasks,
  ]); // Re-added getUpcomingFertilizationTasks - it should be stable from useCallback

  return {
    plantsNeedingCatchUp,
    careStatusLoading,
  };
};
