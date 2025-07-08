// src/hooks/useCatchUpData.ts
import { useState, useEffect, useCallback } from "react";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { useFirebasePlants } from "./useFirebasePlants";
import {
  CatchUpAnalysisService,
  MissedOpportunity,
} from "@/services/CatchUpAnalysisService";

interface UseCatchUpDataProps {
  plantId?: string;
  plantIds?: string[];
  enabled?: boolean;
}

interface UseCatchUpDataReturn {
  opportunities: MissedOpportunity[];
  opportunityCount: number;
  plantCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCatchUpData = ({
  plantId,
  plantIds,
  enabled = true,
}: UseCatchUpDataProps = {}): UseCatchUpDataReturn => {
  const [opportunities, setOpportunities] = useState<MissedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useFirebaseAuth();
  const { plants, loading: plantsLoading } = useFirebasePlants();

  const fetchOpportunities = useCallback(async () => {
    if (!enabled || !user?.uid || plantsLoading) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let allOpportunities: MissedOpportunity[] = [];

      if (plantIds && plants) {
        const targetPlants = plants.filter((p) => plantIds.includes(p.id));
        allOpportunities =
          await CatchUpAnalysisService.findAllMissedOpportunitiesForUser(
            targetPlants,
            user.uid
          );
      } else if (plantId && plants) {
        const plant = plants.find((p) => p.id === plantId);
        if (plant) {
          allOpportunities =
            await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
              plantId,
              user.uid,
              14,
              plant
            );
        }
      } else if (plants && plants.length > 0) {
        allOpportunities =
          await CatchUpAnalysisService.findAllMissedOpportunitiesForUser(
            plants,
            user.uid
          );
      }

      setOpportunities(allOpportunities);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load catch-up data";
      setError(errorMessage);
      console.error("Failed to load catch-up opportunities:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled, plantId, plantIds, user?.uid, plants, plantsLoading]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const opportunityCount = opportunities.length;
  const plantCount = new Set(opportunities.map((opp) => opp.plantId)).size;

  return {
    opportunities,
    opportunityCount,
    plantCount,
    loading,
    error,
    refetch: fetchOpportunities,
  };
};
