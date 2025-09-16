import { CareActivityRecord } from "@/types/database";
import { FirebaseCareActivityService } from "../services/firebase/careActivityService";
import { useFirebaseResource } from "./useFirebaseResource";

interface CareActivitiesParams {
  plantId: string;
  userUid: string;
}

export function useFirebaseCareActivities(plantId?: string) {
  const result = useFirebaseResource<CareActivityRecord, CareActivitiesParams, typeof FirebaseCareActivityService>({
    serviceName: "care activities",
    service: FirebaseCareActivityService,
    subscriptionMethod: "subscribeToPlantActivities",
    subscriptionParams: (user, plantId) => ({
      plantId: plantId || "",
      userUid: user?.uid || "",
    }),
    validateParams: ({ plantId, userUid }) => {
      if (
        !plantId ||
        typeof plantId !== "string" ||
        !userUid ||
        typeof userUid !== "string"
      ) {
        return false;
      }
      return true;
    },
    getDependencies: ({ plantId, userUid }) => [plantId, userUid],
    crudOperations: {
      create: {
        method: "createCareActivity",
        transform: (activity, user) => [activity, user.uid],
      },
    },
  }, plantId);

  return {
    activities: result.data,
    loading: result.loading,
    error: result.error,
    logActivity: result.create!,
  };
}
