// src/components/plant/CatchUpAssistant.tsx - Restored original functionality and styling
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  CatchUpAnalysisService,
  MissedOpportunity,
} from "@/services/CatchUpAnalysisService";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { Clock, CheckCircle, Calendar, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useCatchUpSummary } from "@/hooks/useCatchUpSummary";
import { Logger } from "@/utils/logger";
import { PlantRecord } from "@/types/database";

interface CatchUpAssistantProps {
  plantId?: string;
  plantIds?: string[];
  mode?: "full" | "summary";
  onOpportunityHandled?: () => void;
  onDataLoaded?: (opportunityCount: number) => void;
}

interface PlantCatchUpSummary {
  plantId: string;
  plantName: string;
  opportunityCount: number;
  opportunities: MissedOpportunity[];
}

export const CatchUpAssistant = ({
  plantId,
  plantIds,
  mode = "full",
  onOpportunityHandled,
  onDataLoaded,
}: CatchUpAssistantProps) => {
  const [opportunities, setOpportunities] = useState<MissedOpportunity[]>([]);
  const [plantSummaries, setPlantSummaries] = useState<PlantCatchUpSummary[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [handlingOpportunity, setHandlingOpportunity] = useState<string | null>(
    null
  );
  const [showAllPlants, setShowAllPlants] = useState(false);
  const catchUpSummary = useCatchUpSummary();

  const navigate = useNavigate();
  const { user } = useFirebaseAuth();
  const { plants, loading: plantsLoading } = useFirebasePlants();

  const loadOpportunities = useCallback(async () => {
    console.log("loadOpportunities: Starting...");
    if (!user?.uid || plantsLoading) {
      console.log("loadOpportunities: User not ready or plants loading.");
      setLoading(false); // Clear initial loading state
      return;
    }

    setLoading(false); // Clear initial loading state
    setAnalyzing(true);
    try {
      let allOpportunities: MissedOpportunity[] = [];
      if (plantIds && plants) {
        console.log("loadOpportunities: Fetching for specific plantIds.");
        const targetPlants = plants.filter((p) => plantIds.includes(p.id));
        allOpportunities =
          await CatchUpAnalysisService.findAllMissedOpportunitiesForUser(
            targetPlants,
            user.uid
          );
      } else if (plantId && plants) {
        console.log("loadOpportunities: Fetching for single plantId.");
        const plant = plants.find((p) => p.id === plantId);
        if (plant) {
          const singlePlantOpportunities =
            await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
              plantId,
              user.uid,
              14,
              plant
            );
          allOpportunities = singlePlantOpportunities.map((opp) => ({
            ...opp,
            plantName: plant.name || plant.varietyName,
          }));
        }
      } else if (plants && plants.length > 0) {
        console.log("loadOpportunities: Fetching for all plants.");
        allOpportunities =
          await CatchUpAnalysisService.findAllMissedOpportunitiesForUser(
            plants,
            user.uid
          );
      }

      console.log("loadOpportunities: Fetched opportunities:", allOpportunities.length);
      setOpportunities(allOpportunities);

      // Create plant summaries for summary mode
      if (mode === "summary") {
        const summaries = createPlantSummaries(allOpportunities, plants || []);
        setPlantSummaries(summaries);
      }

      // Notify parent component of data load
      onDataLoaded?.(allOpportunities.length);
    } catch (error) {
      Logger.error("Failed to load catch-up opportunities:", error);
      toast.error("Failed to load catch-up data");
    } finally {
      console.log("loadOpportunities: Finished.");
      setAnalyzing(false);
    }
  }, [plantId, plantIds, user?.uid, plants, plantsLoading, mode, onDataLoaded]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  useEffect(() => {
    if (!plantId && !plantIds && mode === "summary") {
      onDataLoaded?.(catchUpSummary.totalOpportunities);
    }
  }, [
    catchUpSummary.totalOpportunities,
    plantId,
    plantIds,
    mode,
    onDataLoaded,
  ]);

  const createPlantSummaries = (
    opportunities: MissedOpportunity[],
    plants: PlantRecord[]
  ): PlantCatchUpSummary[] => {
    const plantGroups: Record<string, MissedOpportunity[]> = {};

    opportunities.forEach((opp) => {
      if (!plantGroups[opp.plantId]) {
        plantGroups[opp.plantId] = [];
      }
      plantGroups[opp.plantId].push(opp);
    });

    return Object.entries(plantGroups).map(([plantId, opps]) => {
      const plant = plants.find((p) => p.id === plantId);
      return {
        plantId,
        plantName: plant?.name || plant?.varietyName || "Unknown Plant",
        opportunityCount: opps.length,
        opportunities: opps,
      };
    });
  };

  // Restore original functionality
  const handleLogAsDone = async (opportunity: MissedOpportunity) => {
    setHandlingOpportunity(opportunity.id);
    try {
      // Navigate to the logging page for this plant and activity type
      navigate(
        `/log-care/${opportunity.plantId}?type=${opportunity.taskType}&fromCatchUp=true`
      );
    } catch (error) {
      toast.error("Failed to open logging form");
      Logger.error("CatchUpAssistant error:", error);
    } finally {
      setHandlingOpportunity(null);
    }
  };

  const handleReschedule = async (opportunity: MissedOpportunity) => {
    setHandlingOpportunity(opportunity.id);
    try {
      // Navigate to the logging page to "do now"
      navigate(
        `/log-care/${opportunity.plantId}?type=${opportunity.taskType}&fromCatchUp=true`
      );
    } catch (error) {
      toast.error("Failed to open logging form");
      Logger.error("CatchUpAssistant error:", error);
    } finally {
      setHandlingOpportunity(null);
    }
  };

  const handleSkip = async (opportunity: MissedOpportunity) => {
    console.log("handleSkip: Starting for opportunity:", opportunity.id);
    setHandlingOpportunity(opportunity.id);
    try {
      console.log("handleSkip: Calling skipOpportunity...");
      await CatchUpAnalysisService.skipOpportunity(opportunity.id);
      console.log("handleSkip: skipOpportunity finished. Calling loadOpportunities...");
      await loadOpportunities(); // Refresh the list
      console.log("handleSkip: loadOpportunities finished. Calling onOpportunityHandled...");
      onOpportunityHandled?.();
      toast.success("Task skipped");
    } catch (error) {
      toast.error("Failed to skip task");
      Logger.error("CatchUpAssistant error:", error);
    } finally {
      console.log("handleSkip: Finished.");
      setHandlingOpportunity(null);
    }
  };

  const getActionButton = (opportunity: MissedOpportunity) => {
    const isHandling = handlingOpportunity === opportunity.id;

    switch (opportunity.suggestedAction) {
      case "log-as-done":
        return (
          <Button
            size="sm"
            onClick={() => handleLogAsDone(opportunity)}
            disabled={isHandling}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {isHandling ? "Opening..." : "Log as Done"}
          </Button>
        );
      case "reschedule":
        return (
          <Button
            size="sm"
            onClick={() => handleReschedule(opportunity)}
            disabled={isHandling}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Calendar className="h-3 w-3 mr-1" />
            {isHandling ? "Opening..." : "Do Now"}
          </Button>
        );
      case "skip":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSkip(opportunity)}
            disabled={isHandling}
            className="border-gray-300 text-gray-600"
          >
            <X className="h-3 w-3 mr-1" />
            {isHandling ? "Skipping..." : "Skip"}
          </Button>
        );
      default:
        return null;
    }
  };

  const getPriorityColor = (daysMissed: number) => {
    if (daysMissed <= 2) return "bg-yellow-100 text-yellow-800";
    if (daysMissed <= 7) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  // Show loading state with original styling
  if (loading || plantsLoading) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <LoadingSpinner />
            <span className="text-amber-700 dark:text-amber-300">
              Analyzing your plants for catch-up opportunities...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show analyzing state
  if (analyzing) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <LoadingSpinner />
            <span className="text-amber-700 dark:text-amber-300">
              Checking care history...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No opportunities found
  if (opportunities.length === 0) {
    return null;
  }

  const totalOpportunities = opportunities.length;
  const uniquePlantCount = new Set(opportunities.map((opp) => opp.plantId))
    .size;

  // Summary mode - show overview like the original MultiPlantCatchUpAssistant
  if (mode === "summary") {
    const displayedPlants = plantSummaries
      ? plantSummaries.slice(0, 3)
      : [];
    const hasMorePlants = plantSummaries && plantSummaries.length > 3;

    return (
      <div className="space-y-4">
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-amber-800">
                  Plants Need Attention
                </CardTitle>
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800"
              >
                {totalOpportunities}{" "}
                {totalOpportunities === 1 ? "task" : "tasks"}
              </Badge>
            </div>
            <p className="text-sm text-amber-700">
              {uniquePlantCount}{" "}
              {uniquePlantCount === 1 ? "plant has" : "plants have"} missed care
              opportunities
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayedPlants.map((plantSummary) => (
              <div
                key={plantSummary.plantId}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-amber-900">
                      {plantSummary.plantName}
                    </p>
                    <p className="text-sm text-amber-700">
                      {plantSummary.opportunityCount}{" "}
                      {plantSummary.opportunityCount === 1
                        ? "activity"
                        : "activities"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Navigate to plant detail page
                    navigate(`/plants/${plantSummary.plantId}`);
                  }}
                  className="border-amber-200 text-amber-700 hover:bg-amber-100"
                >
                  View Details
                </Button>
              </div>
            ))}

            {hasMorePlants && !showAllPlants && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllPlants(true)}
                  className="text-amber-700 hover:text-amber-800"
                >
                  + {plantSummaries.length - 3} more plants need attention
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Show the full interface below the summary, like the original */}
        <CatchUpAssistant
          plantIds={plantSummaries.map((p) => p.plantId)}
          mode="full"
          onOpportunityHandled={onOpportunityHandled}
        />
      </div>
    );
  }

  // Full mode - render with original styling and functionality
  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Catch-Up Opportunities
        </CardTitle>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Found {opportunities.length} missed care{" "}
          {opportunities.length === 1 ? "activity" : "activities"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunities.map((opportunity) => (
          <div
            key={opportunity.id}
            className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h6 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {opportunity.plantName} - {opportunity.taskName}
                  </h6>
                  <Badge
                    className={`text-xs ${getPriorityColor(
                      opportunity.daysMissed
                    )}`}
                  >
                    {opportunity.daysMissed}d ago
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {opportunity.reason}
                </p>
                <p className="text-xs text-gray-500">
                  Originally due:{" "}
                  {formatDistanceToNow(opportunity.originalDueDate)} ago
                </p>
                {opportunity.canCombineWithRecent && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs">
                    <p className="text-blue-800 dark:text-blue-200">
                      💡 {opportunity.canCombineWithRecent.reasoning}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {getActionButton(opportunity)}
              </div>
            </div>
          </div>
        ))}

        {opportunities.length > 5 && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
              Use bulk actions for plants of the same variety planted on the
              same day for best efficiency
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};