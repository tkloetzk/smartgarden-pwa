// src/hooks/useFirebaseCareActivities.ts
import { useState, useEffect } from "react";
import { FirebaseCareActivityService } from "../services/firebase/careActivityService";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { CareActivityRecord } from "@/types/database";

export function useFirebaseCareActivities(plantId?: string) {
  const [activities, setActivities] = useState<CareActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    if (!plantId || !user?.uid) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const unsubscribe = FirebaseCareActivityService.subscribeToPlantActivities(
      plantId,
      (updatedActivities: CareActivityRecord[]) => {
        setActivities(updatedActivities);
        setLoading(false);
        setError(null);
      },
      user.uid // Fixed parameter order
    );

    return unsubscribe;
  }, [plantId, user?.uid]);

  const logActivity = async (
    activity: Omit<CareActivityRecord, "id" | "createdAt" | "updatedAt">
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
