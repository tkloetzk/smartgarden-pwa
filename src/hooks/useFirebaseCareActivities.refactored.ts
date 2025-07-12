/**
 * Refactored Care Activities hook using focused, single-responsibility hooks
 * This replaces the mega-hook pattern with composable, focused hooks
 */

import { useMemo } from "react";
import { CareActivityRecord } from "@/types/database";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { useDataSubscription } from "./core/useDataSubscription";
import { useFirebaseCrud } from "./core/useFirebaseCrud";

export interface UseFirebaseCareActivitiesReturn {
  activities: CareActivityRecord[];
  loading: boolean;
  error: string | null;
  isSubscribed: boolean;
  refetch: () => void;
  logActivity: (activity: Omit<CareActivityRecord, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  crudLoading: boolean;
  crudError: string | null;
}

export function useFirebaseCareActivities(plantId?: string): UseFirebaseCareActivitiesReturn {
  const { user } = useFirebaseAuth();

  // Validate parameters
  const isValidParams = useMemo(() => {
    return !!(plantId && user?.uid);
  }, [plantId, user?.uid]);

  // Memoize subscription function to prevent unnecessary re-subscriptions
  const subscriptionFunction = useMemo(() => {
    if (!isValidParams) {
      return () => () => {};
    }

    return (callback: (data: CareActivityRecord[]) => void) => {
      return FirebaseCareActivityService.subscribeToPlantActivities(
        plantId!,
        user!.uid,
        callback
      );
    };
  }, [plantId, user?.uid, isValidParams]);

  // Use focused data subscription hook
  const subscription = useDataSubscription<CareActivityRecord>(subscriptionFunction, {
    serviceName: "care activities",
    isEnabled: isValidParams,
    dependencies: [plantId, user?.uid],
  });

  // Use focused CRUD operations hook
  const crud = useFirebaseCrud(
    {
      serviceName: "care activities",
      service: FirebaseCareActivityService,
    },
    {
      createMethod: "createCareActivity",
    }
  );

  // Transform create function to match expected signature
  const logActivity = async (activity: Omit<CareActivityRecord, "id" | "createdAt" | "updatedAt">) => {
    if (!crud.create) {
      throw new Error("Create operation not available");
    }
    
    return crud.create<typeof activity, string>(activity, {
      transform: (activityData, user) => [activityData, user.uid],
    });
  };

  return {
    activities: subscription.data,
    loading: subscription.loading,
    error: subscription.error,
    isSubscribed: subscription.isSubscribed,
    refetch: subscription.refetch,
    logActivity,
    crudLoading: crud.isLoading,
    crudError: crud.error,
  };
}