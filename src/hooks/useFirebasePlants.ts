// src/hooks/useFirebasePlants.ts
import { useState, useEffect } from "react";
import { FirebasePlantService } from "../services/firebase/plantService";
import { PlantRecord } from "../types/database";
import { useFirebaseAuth } from "./useFirebaseAuth";

export function useFirebasePlants(includeInactive = false) {
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    if (!user) {
      setPlants([]);
      setLoading(false);
      return;
    }

    const unsubscribe = FirebasePlantService.subscribeToPlantsChanges(
      user.uid,
      (updatedPlants) => {
        setPlants(updatedPlants);
        setLoading(false);
        setError(null);
      },
      { includeInactive }
    );

    return unsubscribe;
  }, [user, includeInactive]);

  const createPlant = async (
    plant: Omit<PlantRecord, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      setError(null);
      return await FirebasePlantService.createPlant(plant, user.uid);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create plant";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePlant = async (
    plantId: string,
    updates: Partial<PlantRecord>
  ) => {
    try {
      setError(null);
      await FirebasePlantService.updatePlant(plantId, updates);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update plant";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deletePlant = async (plantId: string) => {
    try {
      setError(null);
      await FirebasePlantService.deletePlant(plantId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete plant";
      setError(errorMessage);
      throw new Error(errorMessage);
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
