import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FirebasePlantService } from "@/services/firebase/plantService";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { varietyService, PlantRecord, VarietyRecord } from "@/types/database";
import CareHistory from "@/components/plant/CareHistory";
import PlantReminderSettings from "@/components/plant/PlantReminderSettings";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import PlantInfoCard from "@/components/plant/PlantInfoCard";
import NextActivityCard from "@/components/plant/NextActivityCard";

const PlantDetail: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();

  const [plant, setPlant] = useState<PlantRecord | null>(null);
  const [variety, setVariety] = useState<VarietyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  // Use Firebase care activities hook
  const { activities: careHistory } = useFirebaseCareActivities(plantId);

  useEffect(() => {
    if (!plantId) {
      setError("No plant ID provided");
      setIsLoading(false);
      return;
    }

    // This check now correctly informs TypeScript that 'user' is not null for the rest of the hook.
    if (!user) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // The subscription is initiated directly inside the effect.
    // 'user.uid' is now safe to access.
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

    // The return from useEffect MUST be the cleanup function itself.
    // This now correctly returns the unsubscribe function from the service.
    return () => {
      unsubscribe();
    };
  }, [plantId, user]);

  const handlePlantUpdate = async (updates: Partial<PlantRecord>) => {
    if (!plantId) return;

    try {
      await FirebasePlantService.updatePlant(plantId, updates);
      // The subscription will automatically update the plant state
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

  const plantDisplayName = getPlantDisplayName(plant);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <span className="mr-2">←</span>
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

      <div className="space-y-4">
        {/* Plant Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {plantDisplayName}
                </h1>
                <div className="text-sm text-muted-foreground">
                  {variety?.name}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <PlantInfoCard plant={plant} onLogCare={handleLogCare} />

        <NextActivityCard plantId={plant.id} onTaskClick={handleLogCare} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleLogCare("water")}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <span className="mr-2">💧</span>
                Water
              </Button>
              <Button
                onClick={() => handleLogCare("fertilize")}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <span className="mr-2">🌱</span>
                Fertilize
              </Button>
              <Button
                onClick={() => handleLogCare("photo")}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <span className="mr-2">📸</span>
                Photo
              </Button>
              <Button
                onClick={() => handleLogCare("note")}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <span className="mr-2">📝</span>
                Note
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reminder Settings */}
        {showReminderSettings && (
          <PlantReminderSettings plant={plant} onUpdate={handlePlantUpdate} />
        )}

        {/* Care History */}
        <CareHistory careHistory={careHistory} />
      </div>
    </div>
  );
};

export default PlantDetail;
