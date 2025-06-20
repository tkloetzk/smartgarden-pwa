// Create src/hooks/useNextPlantTask.ts

import { useState, useEffect } from "react";
import { CareSchedulingService } from "@/services/careSchedulingService";
import { UpcomingTask } from "@/types/scheduling";

export const useNextPlantTask = (plantId: string) => {
  const [nextTask, setNextTask] = useState<UpcomingTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadNextTask = async () => {
      try {
        setIsLoading(true);
        const task = await CareSchedulingService.getNextTaskForPlant(plantId);
        if (mounted) {
          setNextTask(task);
        }
      } catch (error) {
        console.error(`Failed to load next task for plant ${plantId}:`, error);
        if (mounted) {
          setNextTask(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadNextTask();

    return () => {
      mounted = false;
    };
  }, [plantId]);

  return { nextTask, isLoading };
};
