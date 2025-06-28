// In: src/pages/plants/PlantDetail.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FirebasePlantService } from "@/services/firebase/plantService";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import {
  varietyService,
  PlantRecord,
  VarietyRecord,
  GrowthStage,
} from "@/types";
import CareHistory from "@/components/plant/CareHistory";
import PlantReminderSettings from "@/components/plant/PlantReminderSettings";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import PlantInfoCard from "@/components/plant/PlantInfoCard";
import NextActivityCard from "@/components/plant/NextActivityCard";
import { toast } from "react-hot-toast";
import { StageUpdateModal } from "@/components/plant/StageUpdateModal";
import { StageManagementService } from "@/services/StageManagementService";
import { useDynamicStage } from "@/hooks/useDynamicStage";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft } from "lucide-react";

const PlantDetail: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();

  const [plant, setPlant] = useState<PlantRecord | null>(null);
  const [variety, setVariety] = useState<VarietyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);

  const { activities: careHistory } = useFirebaseCareActivities(plantId);
  const plantStage = useDynamicStage(plant!);

  useEffect(() => {
    if (!plantId || !user) {
      setError(plantId ? "User not authenticated" : "No plant ID provided");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = FirebasePlantService.subscribeToPlantsChanges(
      user.uid,
      (plants) => {
        const foundPlant = plants.find((p) => p.id === plantId);
        if (foundPlant) {
          setPlant(foundPlant);
          if (foundPlant.varietyId) {
            varietyService
              .getVariety(foundPlant.varietyId)
              .then((varietyData) => setVariety(varietyData || null))
              .catch(console.error);
          }
        } else {
          setError("Plant not found");
        }
        setIsLoading(false);
      },
      { includeInactive: true }
    );

    return () => unsubscribe();
  }, [plantId, user]);

  const handleConfirmStageChange = async (newStage: GrowthStage) => {
    if (!plant || !user) return;
    try {
      toast.loading("Updating stage and recalculating schedule...");
      await StageManagementService.confirmNewStage(
        plant.id,
        newStage,
        user.uid
      );
      toast.dismiss();
      toast.success("Plant stage updated successfully!");
    } catch (e) {
      toast.dismiss();
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred.";
      toast.error(`Failed to update stage: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsStageModalOpen(false);
    }
  };

  const handlePlantUpdate = async (updates: Partial<PlantRecord>) => {
    if (!plantId) return;
    try {
      await FirebasePlantService.updatePlant(plantId, updates);
    } catch (error) {
      console.error("Failed to update plant:", error);
    }
  };

  const handleLogCare = (activityType?: string) => {
    const params = new URLSearchParams();
    if (plantId) params.set("plantId", plantId);
    if (activityType) params.set("type", activityType);
    navigate(`/log-care?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-4 block">🌱</span>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error || "Plant not found"}
          </h2>
          <p className="text-muted-foreground mb-4">
            We couldn't load the details for this plant.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-primary hover:bg-primary/90"
          >
            <span className="mr-2">🏠</span>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
          <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReminderSettings(!showReminderSettings)}
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="mr-2">⚙️</span>
              Settings
            </Button>
          </div>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              {getPlantDisplayName(plant)}
            </h1>
            <p className="text-md text-muted-foreground mt-1">
              {plant.varietyName}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="capitalize text-sm">
              {plantStage.replace("-", " ")}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStageModalOpen(true)}
            >
              Update Stage
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PlantInfoCard plant={plant} showQuickActions={false} />
            <NextActivityCard plantId={plant.id} onTaskClick={handleLogCare} />
          </div>

          {showReminderSettings && (
            <PlantReminderSettings plant={plant} onUpdate={handlePlantUpdate} />
          )}

          <CareHistory careHistory={careHistory} />
        </div>
      </div>

      {isStageModalOpen && (
        <StageUpdateModal
          plant={plant}
          currentStage={plantStage}
          onConfirm={handleConfirmStageChange}
          onClose={() => setIsStageModalOpen(false)}
        />
      )}
    </>
  );
};

export default PlantDetail;
