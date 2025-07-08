import { PlantRecord } from "../types/database";
import { FirebasePlantService } from "../services/firebase/plantService";
import { useFirebaseSubscription } from "./useFirebaseSubscription";
import { useFirebaseAuth } from "./useFirebaseAuth";

interface PlantsParams {
  includeInactive: boolean;
  userUid: string;
}

export function useFirebasePlants(includeInactive = false) {
  const { user } = useFirebaseAuth();

  const {
    data: plants,
    loading,
    error,
    handleError,
  } = useFirebaseSubscription<PlantRecord, PlantsParams>({
    serviceName: "plants",
    subscribeFunction: ({ userUid, includeInactive }, callback) =>
      FirebasePlantService.subscribeToPlantsChanges(userUid, callback, {
        includeInactive,
      }),
    validateParams: ({ userUid }) => {
      if (!userUid || typeof userUid !== "string") {
        if (userUid && typeof userUid !== "string") {
          console.error("❌ user.uid is not a string:", userUid);
        }
        return false;
      }
      return true;
    },
    getDependencies: ({ userUid, includeInactive }) => [
      userUid,
      includeInactive,
    ],
    params: {
      includeInactive,
      userUid: user?.uid || "",
    },
  });

  const createPlant = async (
    plant: Omit<PlantRecord, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return await FirebasePlantService.createPlant(plant, user.uid);
    } catch (err) {
      handleError(err, "create plant");
    }
  };

  const updatePlant = async (
    plantId: string,
    updates: Partial<PlantRecord>
  ) => {
    try {
      await FirebasePlantService.updatePlant(plantId, updates);
    } catch (err) {
      handleError(err, "update plant");
    }
  };

  const deletePlant = async (plantId: string) => {
    try {
      await FirebasePlantService.deletePlant(plantId);
    } catch (err) {
      handleError(err, "delete plant");
    }
  };

  return {
    plants,
    loading,
    error,
    createPlant,
    updatePlant,
    deletePlant,
  };
}
