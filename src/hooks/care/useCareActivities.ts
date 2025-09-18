import { useState, useEffect, useCallback } from "react";
import { CareActivityRecord } from "@/types/database";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { useFirebaseAuth } from "@/hooks/auth/useFirebaseAuth";

interface UseCareActivitiesReturn {
  activities: CareActivityRecord[];
  loading: boolean;
  error: string | null;
  logActivity: (activity: Omit<CareActivityRecord, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  refresh: () => void;
}

/**
 * Hook for managing plant care activities with local state and manual refresh.
 * Replaces useFirebaseCareActivities with a simpler cache-first approach.
 */
export function useCareActivities(plantId?: string): UseCareActivitiesReturn {
  const [activities, setActivities] = useState<CareActivityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebaseAuth();

  const fetchActivities = useCallback(async () => {
    if (!plantId || !user?.uid) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the existing getPlantCareHistory method to fetch activities
      const careHistory = await FirebaseCareActivityService.getPlantCareHistory(plantId, user.uid);
      setActivities(careHistory);
    } catch (err) {
      console.error("Error fetching care activities:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  }, [plantId, user?.uid]);

  // Initial load
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const logActivity = useCallback(
    async (activity: Omit<CareActivityRecord, "id" | "createdAt" | "updatedAt">) => {
      if (!user?.uid) {
        throw new Error("User not authenticated");
      }

      try {
        // Optimistically add to local state
        const optimisticActivity = {
          ...activity,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CareActivityRecord;

        setActivities(prev => [optimisticActivity, ...prev]);

        // Save to Firebase
        const activityId = await FirebaseCareActivityService.createCareActivity(activity, user.uid);

        // Update the local state with the real ID
        setActivities(prev =>
          prev.map(act =>
            act.id === optimisticActivity.id
              ? { ...act, id: activityId }
              : act
          )
        );

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('care-activity-logged', {
          detail: { plantId: activity.plantId, activityId, activity }
        }));

        return activityId;
      } catch (err) {
        // Remove optimistic update on error
        setActivities(prev => prev.filter(act => act.id !== `temp-${Date.now()}`));
        console.error("Error logging activity:", err);
        throw err;
      }
    },
    [user?.uid]
  );

  const refresh = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    logActivity,
    refresh,
  };
}