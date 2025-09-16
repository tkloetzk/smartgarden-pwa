// src/hooks/useLastCareActivities.ts
import { useState, useEffect, useCallback } from "react";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { CareRecord } from "@/types";

interface LastCareActivities {
  watering: CareRecord | null;
  fertilizing: CareRecord | null;
}

export function useLastCareActivities(plantId: string) {
  const [activities, setActivities] = useState<LastCareActivities>({
    watering: null,
    fertilizing: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    if (!user?.uid || !plantId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Use real-time subscription to get live updates
    const unsubscribe = FirebaseCareActivityService.subscribeToPlantActivities(
      plantId,
      user.uid,
      (allActivities) => {
        // Find the most recent activity of each type
        const waterActivities = allActivities.filter(a => a.type === "water");
        const fertilizeActivities = allActivities.filter(a => a.type === "fertilize");
        
        const lastWatering = waterActivities.length > 0 ? waterActivities[0] : null;
        const lastFertilizing = fertilizeActivities.length > 0 ? fertilizeActivities[0] : null;
        
        setActivities({
          watering: lastWatering,
          fertilizing: lastFertilizing,
        });
        setLoading(false);
      },
      10 // Limit to last 10 activities to find recent water/fertilize
    );

    return () => {
      unsubscribe();
    };
  }, [plantId, user?.uid, refreshTrigger]);

  const refetch = useCallback(() => {
    // Force a re-subscription by incrementing the refresh trigger
    setRefreshTrigger(prev => prev + 1);
  }, [plantId]);

  return { activities, loading, refetch };
}