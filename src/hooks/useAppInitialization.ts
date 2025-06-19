// src/hooks/useAppInitialization.ts
import { useEffect } from "react";
import { GrowthStageService } from "@/services/growthStageService";

export function useAppInitialization() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Update all plant stages on app load
        await GrowthStageService.updatePlantStages();
      } catch (error) {
        console.error("Error during app initialization:", error);
      }
    };

    initializeApp();
  }, []);
}
