/**
 * Refactored Plants hook using focused, single-responsibility hooks
 * This replaces the mega-hook pattern with composable, focused hooks
 */

import { useMemo } from "react";
import { PlantRecord } from "@/types/database";
import { FirebasePlantService } from "@/services/firebase/plantService";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { useDataSubscription } from "./core/useDataSubscription";
import { useFirebaseCrud } from "./core/useFirebaseCrud";

export interface UseFirebasePlantsReturn {
  plants: PlantRecord[];
  loading: boolean;
  error: string | null;
  isSubscribed: boolean;
  refetch: () => void;
  createPlant: (plant: Omit<PlantRecord, "id" | "createdAt" | "updatedAt">) => Promise<string | null>;
  updatePlant: (id: string, updates: Partial<PlantRecord>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  crudLoading: boolean;
  crudError: string | null;
}

export function useFirebasePlants(includeInactive = false): UseFirebasePlantsReturn {
  const { user } = useFirebaseAuth();

  // Memoize subscription function to prevent unnecessary re-subscriptions
  const subscriptionFunction = useMemo(() => {
    if (!user?.uid) {
      return () => () => {};
    }

    return (callback: (data: PlantRecord[]) => void) => {
      return FirebasePlantService.subscribeToPlantsChanges(
        user.uid,
        callback,
        { includeInactive }
      );
    };
  }, [user?.uid, includeInactive]);

  // Use focused data subscription hook
  const subscription = useDataSubscription<PlantRecord>(subscriptionFunction, {
    serviceName: "plants",
    isEnabled: !!user?.uid,
    dependencies: [user?.uid, includeInactive],
  });

  // Use focused CRUD operations hook
  const crud = useFirebaseCrud(
    {
      serviceName: "plants",
      service: FirebasePlantService,
    },
    {
      createMethod: "createPlant",
      updateMethod: "updatePlant",
      deleteMethod: "deletePlant",
    }
  );

  // Transform create function to match expected signature
  const createPlant = async (plant: Omit<PlantRecord, "id" | "createdAt" | "updatedAt">) => {
    if (!crud.create) {
      throw new Error("Create operation not available");
    }
    
    return crud.create<typeof plant, string>(plant, {
      transform: (plantData, user) => [plantData, user.uid],
    });
  };

  // Transform update function to match expected signature
  const updatePlant = async (id: string, updates: Partial<PlantRecord>) => {
    if (!crud.update) {
      throw new Error("Update operation not available");
    }
    
    await crud.update(id, updates, {
      transform: (id, data) => [id, data],
    });
  };

  // Transform delete function to match expected signature
  const deletePlant = async (id: string) => {
    if (!crud.delete) {
      throw new Error("Delete operation not available");
    }
    
    await crud.delete(id, {
      transform: (id) => [id],
    });
  };

  return {
    plants: subscription.data,
    loading: subscription.loading,
    error: subscription.error,
    isSubscribed: subscription.isSubscribed,
    refetch: subscription.refetch,
    createPlant,
    updatePlant,
    deletePlant,
    crudLoading: crud.isLoading,
    crudError: crud.error,
  };
}