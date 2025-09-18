// src/hooks/useCatchUpData.ts
import { useState, useEffect, useCallback } from "react";
import { PlantRecord } from "@/types/database";
import {
  CatchUpAnalysisService,
  MissedOpportunity,
} from "@/services/CatchUpAnalysisService";

interface UseCatchUpDataProps {
  plants: PlantRecord[];
  userUid: string;
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
  plants,
  userUid,
  plantId,
  plantIds,
  enabled = true,
}: UseCatchUpDataProps): UseCatchUpDataReturn => {
  const [opportunities, setOpportunities] = useState<MissedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    if (!enabled || !userUid || !plants || plants.length === 0) {
      setOpportunities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let allOpportunities: MissedOpportunity[] = [];

      if (plantIds) {
        const targetPlants = plants.filter((p) => plantIds.includes(p.id));
        allOpportunities =
          await CatchUpAnalysisService.findAllMissedOpportunitiesForUser(
            targetPlants,
            userUid
          );
      } else if (plantId) {
        const plant = plants.find((p) => p.id === plantId);
        if (plant) {
          allOpportunities =
            await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
              plantId,
              userUid,
              14,
              plant
            );
        }
      } else {
        allOpportunities =
          await CatchUpAnalysisService.findAllMissedOpportunitiesForUser(
            plants,
            userUid
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
  }, [enabled, plantId, plantIds, userUid, plants]);

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
