import { CareActivityType, CareRecord, PlantRecord } from "@/types";
import { useLocalNextTask } from "@/hooks/care/useLocalNextTask";

export const useNextPlantTask = (
  plantId: string,
  plant: PlantRecord | null,
  getLastActivityByType: (plantId: string, type: CareActivityType) => Promise<CareRecord | null>,
  isLoading?: boolean
) => {
  const { nextTask, isLoading: taskLoading } = useLocalNextTask({
    plantId,
    plant,
    getLastActivityByType,
    isLoading: isLoading || false
  });

  return {
    nextTask,
    isLoading: isLoading || taskLoading
  };
};
