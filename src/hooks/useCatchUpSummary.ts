// src/hooks/useCatchUpSummary.ts
import { useState, useEffect, useCallback } from "react";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { useFirebasePlants } from "./useFirebasePlants";
import { CatchUpAnalysisService } from "@/services/CatchUpAnalysisService";

interface CatchUpSummary {
  totalOpportunities: number;
  plantsNeedingCatchUp: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCatchUpSummary = (): CatchUpSummary => {
  const [totalOpportunities, setTotalOpportunities] = useState(0);
  const [plantsNeedingCatchUp, setPlantsNeedingCatchUp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useFirebaseAuth();
  const { plants, loading: plantsLoading } = useFirebasePlants();

  const loadCatchUpData = useCallback(async () => {
    if (!plants || !user?.uid || plantsLoading) {
      setTotalOpportunities(0);
      setPlantsNeedingCatchUp(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let totalCount = 0;
      let plantsWithOpportunities = 0;

      for (const plant of plants) {
        const opportunities =
          await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
            plant.id,
            user.uid,
            14,
            plant
          );

        if (opportunities.length > 0) {
          totalCount += opportunities.length;
          plantsWithOpportunities++;
        }
      }

      setTotalOpportunities(totalCount);
      setPlantsNeedingCatchUp(plantsWithOpportunities);
    } catch (err) {
      console.error("Failed to load catch-up data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load catch-up data"
      );
    } finally {
      setLoading(false);
    }
  }, [plants, user?.uid, plantsLoading]);

  useEffect(() => {
    loadCatchUpData();
  }, [loadCatchUpData]);

  return {
    totalOpportunities,
    plantsNeedingCatchUp,
    loading,
    error,
    refetch: loadCatchUpData,
  };
};
