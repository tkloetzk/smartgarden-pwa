// Focused hook for plant-specific Firebase operations
import { useState, useEffect } from 'react';
import { PlantRecord } from '@/types';
import { FirebasePlantService } from '@/services/firebase/plantService';
import { useFirebaseAuth } from './useFirebaseAuth';
import { Logger } from '@/utils/logger';

interface UseFirebasePlantOptions {
  plantId?: string;
  autoFetch?: boolean;
  cacheTime?: number;
}

interface UseFirebasePlantResult {
  plant: PlantRecord | null;
  plants: PlantRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updatePlant: (plantId: string, updates: Partial<PlantRecord>) => Promise<void>;
  deletePlant: (plantId: string) => Promise<void>;
}

export const useFirebasePlant = (options: UseFirebasePlantOptions = {}): UseFirebasePlantResult => {
  const { plantId, autoFetch = true, cacheTime = 5 * 60 * 1000 } = options;
  const { user } = useFirebaseAuth();
  
  const [plant, setPlant] = useState<PlantRecord | null>(null);
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const shouldFetch = () => {
    return autoFetch && user && (Date.now() - lastFetch > cacheTime);
  };

  const handleError = (err: unknown, operation: string) => {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    Logger.error(`Firebase plant operation failed: ${operation}`, errorObj, { 
      plantId, 
      userId: user?.uid 
    });
    setError(errorObj);
    setIsLoading(false);
  };

  const fetchPlant = async (id: string): Promise<void> => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const plantData = await FirebasePlantService.getPlant(id, user.uid);
      setPlant(plantData);
      setLastFetch(Date.now());
      
      Logger.debug('Plant fetched successfully', { plantId: id });
    } catch (err) {
      handleError(err, 'fetchPlant');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlants = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with subscription pattern later - for now, disable this method
      const plantsData: PlantRecord[] = [];
      setPlants(plantsData);
      setLastFetch(Date.now());
      
      Logger.debug('Plants fetched successfully', { count: plantsData.length });
    } catch (err) {
      handleError(err, 'fetchPlants');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlant = async (id: string, updates: Partial<PlantRecord>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await FirebasePlantService.updatePlant(id, updates);
      
      // Optimistic update
      if (plant && plant.id === id) {
        setPlant({ ...plant, ...updates });
      }
      
      // Update in plants array
      setPlants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      
      Logger.info('Plant updated successfully', { plantId: id });
    } catch (err) {
      handleError(err, 'updatePlant');
      throw err;
    }
  };

  const deletePlant = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await FirebasePlantService.deletePlant(id);
      
      // Remove from local state
      if (plant && plant.id === id) {
        setPlant(null);
      }
      setPlants(prev => prev.filter(p => p.id !== id));
      
      Logger.info('Plant deleted successfully', { plantId: id });
    } catch (err) {
      handleError(err, 'deletePlant');
      throw err;
    }
  };

  const refetch = async (): Promise<void> => {
    if (plantId) {
      await fetchPlant(plantId);
    } else {
      await fetchPlants();
    }
  };

  // Effect for auto-fetching
  useEffect(() => {
    if (!shouldFetch()) return;

    if (plantId) {
      fetchPlant(plantId);
    } else {
      fetchPlants();
    }
  }, [user, plantId, autoFetch]);

  return {
    plant,
    plants,
    isLoading,
    error,
    refetch,
    updatePlant,
    deletePlant,
  };
};