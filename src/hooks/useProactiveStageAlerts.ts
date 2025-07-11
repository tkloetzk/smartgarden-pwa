// In: src/hooks/useProactiveStageAlerts.ts

import { useState, useEffect } from "react";
import { useFirebasePlants } from "./useFirebasePlants";
import { varietyService, PlantRecord } from "@/types/database";
import { GrowthStage } from "@/types";
import { estimateStageTransition, getNextStage } from "@/utils/growthStage";
import { addDays, differenceInDays } from "date-fns";

export interface StageAlert {
  plant: PlantRecord;
  predictedNextStage: GrowthStage;
  predictedTransitionDate: Date;
  daysUntilTransition: number;
}

export const useProactiveStageAlerts = (): {
  alerts: StageAlert[];
  isLoading: boolean;
} => {
  const { plants, loading: plantsLoading } = useFirebasePlants();
  const [alerts, setAlerts] = useState<StageAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateAlerts = async () => {
      if (plantsLoading) return;

      const potentialAlerts: StageAlert[] = [];

      for (const plant of plants) {
        if (!plant.isActive) continue;

        const variety = await varietyService.getVariety(plant.varietyId);
        if (!variety) continue;

        const currentStage = plant.confirmedStage || "germination"; // Assume germination if none confirmed
        const nextStage = getNextStage(currentStage);
        if (!nextStage) continue;

        // 1. Get the originally expected date for the next transition
        const originalExpectedDate = estimateStageTransition(
          plant.plantedDate,
          variety.growthTimeline,
          nextStage
        );

        let predictedTransitionDate = originalExpectedDate;

        // 2. If a growthRateModifier exists, adjust the prediction
        if (plant.growthRateModifier && plant.growthRateModifier !== 1) {
          const originalDuration = differenceInDays(
            originalExpectedDate,
            plant.plantedDate
          );
          const adjustedDuration = Math.round(
            originalDuration * plant.growthRateModifier
          );
          predictedTransitionDate = addDays(
            plant.plantedDate,
            adjustedDuration
          );
        }

        // 3. Check if the predicted transition is imminent (e.g., within the next 2 days)
        const daysUntilTransition = differenceInDays(
          predictedTransitionDate,
          new Date()
        );
        if (daysUntilTransition <= 2 && daysUntilTransition >= 0) {
          potentialAlerts.push({
            plant,
            predictedNextStage: nextStage,
            predictedTransitionDate,
            daysUntilTransition,
          });
        }
      }

      setAlerts(
        potentialAlerts.sort(
          (a, b) => a.daysUntilTransition - b.daysUntilTransition
        )
      );
      setIsLoading(false);
    };

    calculateAlerts();
  }, [plants, plantsLoading]);

  return { alerts, isLoading };
};
