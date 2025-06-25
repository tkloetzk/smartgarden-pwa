// src/hooks/useFirebaseCareActivities.ts
import { useState, useEffect } from "react";
import { FirebaseCareActivityService } from "../services/firebase/careActivityService";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { CareRecord } from "@/types";

export function useFirebaseCareActivities(plantId?: string) {
  const [activities, setActivities] = useState<CareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const unsubscribe = plantId
      ? FirebaseCareActivityService.subscribeToPlantActivities(
          plantId,
          (updatedActivities) => {
            setActivities(updatedActivities);
            setLoading(false);
            setError(null);
          }
        )
      : FirebaseCareActivityService.subscribeToUserActivities(
          user.uid,
          (updatedActivities) => {
            setActivities(updatedActivities);
            setLoading(false);
            setError(null);
          }
        );

    return unsubscribe;
  }, [user, plantId]);

  const logActivity = async (
    activity: Omit<CareRecord, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (!user) throw new Error("User not authenticated");
      setError(null);
      return await FirebaseCareActivityService.createCareActivity(
        activity,
        user.uid
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to log activity";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    activities,
    loading,
    error,
    logActivity,
  };
}
