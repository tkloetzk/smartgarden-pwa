import { PlantRecord } from "../types/database";
import { FirebasePlantService } from "../services/firebase/plantService";
import { useFirebaseResource } from "./useFirebaseResource";

interface PlantsParams {
  includeInactive: boolean;
  userUid: string;
}

export function useFirebasePlants(includeInactive = false) {
  const result = useFirebaseResource<PlantRecord, PlantsParams, typeof FirebasePlantService>({
    serviceName: "plants",
    service: FirebasePlantService,
    subscriptionMethod: "subscribeToPlantsChanges",
    subscriptionParams: (user, includeInactive) => ({
      includeInactive,
      userUid: user?.uid || "",
    }),
    validateParams: ({ userUid }) => {
      if (!userUid || typeof userUid !== "string") {
        return false;
      }
      return true;
    },
    getDependencies: ({ userUid, includeInactive }) => [userUid, includeInactive],
    crudOperations: {
      create: {
        method: "createPlant",
        transform: (plant, user) => [plant, user.uid],
      },
      update: {
        method: "updatePlant",
        transform: (id, updates) => [id, updates],
      },
      delete: {
        method: "deletePlant",
        transform: (id) => [id],
      },
    },
  }, includeInactive);

  return {
    plants: result.data,
    loading: result.loading,
    error: result.error,
    createPlant: result.create!,
    updatePlant: result.update!,
    deletePlant: result.delete!,
  };
}
