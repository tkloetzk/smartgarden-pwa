import { useState, useEffect } from "react";
import { FirebaseCareSchedulingService } from "@/services/firebaseCareSchedulingService";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";

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
  // Helper function to get the most relevant fertilization tasks for a single plant
  const getRelevantFertilizationTasksForPlant = (allTasks: any[], currentDate: Date) => {
    if (allTasks.length === 0) return [];

    const now = currentDate.getTime();

    // Sort tasks by due date
    const sortedTasks = [...allTasks].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );

    // Find the most relevant task(s):
    // 1. If there's an overdue task, show the most recent overdue one
    // 2. Otherwise, show the next upcoming task

    const overdueTasks = sortedTasks.filter(
      (task) => task.dueDate.getTime() < now
    );
    const upcomingTasks = sortedTasks.filter(
      (task) => task.dueDate.getTime() >= now
    );

    const relevantTasks = [];

    // Add the most recent overdue task (if any)
    if (overdueTasks.length > 0) {
      const mostRecentOverdue = overdueTasks[overdueTasks.length - 1];
      relevantTasks.push(mostRecentOverdue);
    }

    // Add the next upcoming task (if any and no overdue, or if there's a significant gap)
    if (upcomingTasks.length > 0) {
      const nextUpcoming = upcomingTasks[0];

      // If there's no overdue task, or if the upcoming task is close, include it
      if (overdueTasks.length === 0) {
        relevantTasks.push(nextUpcoming);
      }
    }

    return relevantTasks;
  };
  const [plantsNeedingCatchUp, setPlantsNeedingCatchUp] = useState(0);
  const [careStatusLoading, setCareStatusLoading] = useState(true);

  // Load catch-up data count for summary card
  useEffect(() => {
    const loadCatchUpCount = async () => {
      console.log("🚀 loadCatchUpCount called", {
        plantsLength: plants?.length,
        userUid: userUid,
        careStatusLoading,
      });

      if (!plants || !userUid) {
        console.log("❌ Early exit - no plants or user");
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

        console.log("🔍 Plant Care Status Debug:");
        console.log(`  All plants: ${allPlants.length}`);
        console.log(`  Visible plants (using all): ${visiblePlants.length}`);
        visiblePlants.forEach((plant) => {
          const plantAge = Math.floor(
            (new Date().getTime() - plant.plantedDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          console.log(`    - ${plant.varietyName} (${plantAge} days old)`);
          console.log(
            `      Fertilizing reminders: ${plant.reminderPreferences?.fertilizing}`
          );
        });

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

        console.log(`  Standard care tasks: ${careTasks.length}`);

        // Get fertilization tasks using the SAME logic as the dashboard fertilization section
        const allFertilizationTasks = getUpcomingFertilizationTasks
          ? getUpcomingFertilizationTasks(365)
          : [];
        console.log(
          `  All fertilization tasks: ${allFertilizationTasks.length}`
        );

        // Filter fertilization tasks to only include visible plants
        const visibleFertilizationTasks = allFertilizationTasks.filter((task) =>
          visiblePlants.some((plant) => plant.id === task.plantId)
        );
        console.log(
          `  Visible fertilization tasks: ${visibleFertilizationTasks.length}`
        );

        // Group tasks by plant and get only the most relevant ones (same as dashboard)
        const tasksByPlant = new Map<string, any[]>();
        visibleFertilizationTasks.forEach((task) => {
          if (!tasksByPlant.has(task.plantId)) {
            tasksByPlant.set(task.plantId, []);
          }
          tasksByPlant.get(task.plantId)!.push(task);
        });
        console.log(`  Plants with fertilization tasks: ${tasksByPlant.size}`);

        // For each plant, get only the most relevant fertilization tasks
        const relevantFertilizationTasks: any[] = [];
        const now = new Date();

        tasksByPlant.forEach((tasks, plantId) => {
          const plantRelevantTasks = getRelevantFertilizationTasksForPlant(
            tasks,
            now
          );
          console.log(
            `    Plant ${plantId}: ${tasks.length} total tasks -> ${plantRelevantTasks.length} relevant tasks`
          );
          relevantFertilizationTasks.push(...plantRelevantTasks);
        });
        console.log(
          `  Total relevant fertilization tasks: ${relevantFertilizationTasks.length}`
        );

        // Count unique plants that have any tasks (indicating they need care)
        const uniquePlantIds = new Set();
        careTasks.forEach((task) => {
          uniquePlantIds.add(task.plantId);
        });
        relevantFertilizationTasks.forEach((task) => {
          uniquePlantIds.add(task.plantId);
        });

        console.log(`  Unique plants needing care: ${uniquePlantIds.size}`);
        console.log(`  Plant IDs: ${Array.from(uniquePlantIds)}`);

        setPlantsNeedingCatchUp(uniquePlantIds.size);
        console.log(
          "✅ Plant Care Status calculation complete, setting careStatusLoading = false"
        );
      } catch (error) {
        console.error("Failed to load catch-up count:", error);
        setPlantsNeedingCatchUp(0);
      } finally {
        setCareStatusLoading(false);
      }
    };

    loadCatchUpCount();
  }, [plants, userUid, activityLoggedTrigger, hiddenGroups, getUpcomingFertilizationTasks]); // Remove fertilization dependency to prevent infinite loop

  return {
    plantsNeedingCatchUp,
    careStatusLoading,
  };
};