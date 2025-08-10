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
    const fetchLastActivities = async () => {
      if (!user?.uid || !plantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [lastWatering, lastFertilizing] = await Promise.all([
          FirebaseCareActivityService.getLastActivityByType(plantId, user.uid, "water"),
          FirebaseCareActivityService.getLastActivityByType(plantId, user.uid, "fertilize"),
        ]);

        setActivities({
          watering: lastWatering,
          fertilizing: lastFertilizing,
        });
      } catch (error) {
        console.error("Failed to fetch last care activities:", error);
        setActivities({
          watering: null,
          fertilizing: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLastActivities();
  }, [plantId, user?.uid, refreshTrigger]);

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { activities, loading, refetch };
}