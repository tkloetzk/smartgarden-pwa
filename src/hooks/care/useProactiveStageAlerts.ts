// In: src/hooks/useProactiveStageAlerts.ts

import { useState, useEffect } from "react";
import { varietyService, PlantRecord } from "@/types/database";
import { GrowthStage } from "@/types";
import { estimateStageTransition, getNextStage } from "@/utils/plant/growthStage";
import { addDays, differenceInDays } from "date-fns";

export interface StageAlert {
  plant: PlantRecord;
  predictedNextStage: GrowthStage;
  predictedTransitionDate: Date;
  daysUntilTransition: number;
}

export const useProactiveStageAlerts = (
  plants: PlantRecord[],
  isLoading?: boolean
): {
  alerts: StageAlert[];
  isLoading: boolean;
} => {
  const [alerts, setAlerts] = useState<StageAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    const calculateAlerts = async () => {
      if (isLoading || !plants) {
        setAlertsLoading(false);
        return;
      }

      setAlertsLoading(true);
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
      setAlertsLoading(false);
    };

    calculateAlerts();
  }, [plants, isLoading]);

  return { alerts, isLoading: isLoading || alertsLoading };
};
