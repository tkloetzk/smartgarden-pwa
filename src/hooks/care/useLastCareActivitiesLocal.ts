import { useState, useEffect, useCallback } from "react";
import { useFirebaseAuth } from "@/hooks/auth/useFirebaseAuth";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { CareRecord } from "@/types";

interface LastCareActivities {
  watering: CareRecord | null;
  fertilizing: CareRecord | null;
}

/**
 * Hook for fetching the last care activities with local state and manual refresh.
 * Replaces useLastCareActivities subscription-based approach.
 */
export function useLastCareActivitiesLocal(plantId: string) {
  const [activities, setActivities] = useState<LastCareActivities>({
    watering: null,
    fertilizing: null,
  });
  const [loading, setLoading] = useState(false);
  const { user } = useFirebaseAuth();

  const fetchLastActivities = useCallback(async () => {
    if (!user?.uid || !plantId) {
      setActivities({ watering: null, fertilizing: null });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch last activities of each type in parallel
      const [lastWatering, lastFertilizing] = await Promise.all([
        FirebaseCareActivityService.getLastActivityByType(plantId, user.uid, "water"),
        FirebaseCareActivityService.getLastActivityByType(plantId, user.uid, "fertilize"),
      ]);

      setActivities({
        watering: lastWatering,
        fertilizing: lastFertilizing,
      });
    } catch (error) {
      console.error("Error fetching last care activities:", error);
      setActivities({ watering: null, fertilizing: null });
    } finally {
      setLoading(false);
    }
  }, [plantId, user?.uid]);

  // Initial load
  useEffect(() => {
    fetchLastActivities();
  }, [fetchLastActivities]);

  // Listen for care activity logged events to refresh
  useEffect(() => {
    const handleCareActivityLogged = (event: CustomEvent) => {
      const { plantId: eventPlantId } = event.detail;
      if (eventPlantId === plantId) {
        // Refresh activities when a new activity is logged for this plant
        fetchLastActivities();
      }
    };

    window.addEventListener('care-activity-logged', handleCareActivityLogged as EventListener);

    return () => {
      window.removeEventListener('care-activity-logged', handleCareActivityLogged as EventListener);
    };
  }, [plantId, fetchLastActivities]);

  const refetch = useCallback(() => {
    fetchLastActivities();
  }, [fetchLastActivities]);

  return { activities, loading, refetch };
}