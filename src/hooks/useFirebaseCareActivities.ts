import { CareActivityRecord } from "@/types/database";
import { FirebaseCareActivityService } from "../services/firebase/careActivityService";
import { useFirebaseSubscription } from "./useFirebaseSubscription";
import { useFirebaseAuth } from "./useFirebaseAuth";

interface CareActivitiesParams {
  plantId: string;
  userUid: string;
}

export function useFirebaseCareActivities(plantId?: string) {
  const { user } = useFirebaseAuth();

  const {
    data: activities,
    loading,
    error,
    handleError,
  } = useFirebaseSubscription<CareActivityRecord, CareActivitiesParams>({
    serviceName: "care activities",
    subscribeFunction: ({ plantId, userUid }, callback) =>
      FirebaseCareActivityService.subscribeToPlantActivities(
        plantId,
        userUid,
        callback
      ),
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
    params: {
      plantId: plantId || "",
      userUid: user?.uid || "",
    },
  });

  const logActivity = async (
    activity: Omit<CareActivityRecord, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return await FirebaseCareActivityService.createCareActivity(
        activity,
        user.uid
      );
    } catch (err) {
      handleError(err, "log activity");
    }
  };

  return {
    activities,
    loading,
    error,
    logActivity,
  };
}
