// src/pages/plants/PlantDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  plantService,
  careService,
  varietyService,
  PlantRecord,
  CareRecord,
  VarietyRecord,
} from "@/types/database";
import PlantStageDisplay from "@/components/plant/PlantStageDisplay";
import NextTaskDisplay from "@/components/plant/NextTaskDisplay";
import CareHistory from "@/components/plant/CareHistory";
import PlantReminderSettings from "@/components/plant/PlantReminderSettings";
import { formatDate, getDaysSincePlanting } from "@/utils/dateUtils";
import { getPlantDisplayName } from "@/utils/plantDisplay";

const PlantDetail: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();

  const [plant, setPlant] = useState<PlantRecord | null>(null);
  const [variety, setVariety] = useState<VarietyRecord | null>(null);
  const [careHistory, setCareHistory] = useState<CareRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReminderSettings, setShowReminderSettings] = useState(false); // Add this state

  useEffect(() => {
    if (!plantId) {
      setError("No plant ID provided");
      setIsLoading(false);
      return;
    }

    async function loadPlantDetails() {
      try {
        setIsLoading(true);
        setError(null);

        const [plantData, careHistoryData] = await Promise.all([
          plantService.getPlant(plantId as string),
          careService.getPlantCareHistory(plantId as string),
        ]);

        if (!plantData) {
          setError("Plant not found");
          return;
        }

        setPlant(plantData);
        setCareHistory(careHistoryData);

        if (plantData.varietyId) {
          const varietyData = await varietyService.getVariety(
            plantData.varietyId
          );
          setVariety(varietyData || null);
        }
      } catch (error) {
        console.error("Failed to load plant details:", error);
        setError("Failed to load plant details");
      } finally {
        setIsLoading(false);
      }
    }

    loadPlantDetails();
  }, [plantId]);

  const handlePlantUpdate = (updatedPlant: PlantRecord) => {
    setPlant(updatedPlant);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "Plant not found"}
          </h2>
          <p className="text-gray-600 mb-4">
            We couldn't load the details for this plant.
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <span>←</span>
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReminderSettings(!showReminderSettings)}
              className="flex items-center gap-2"
            >
              <span>⚙️</span>
              {showReminderSettings ? "Hide" : "Settings"}
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {getPlantDisplayName(plant)}
          </h1>

          <div className="flex gap-3">
            <Button className="flex-1">
              <span className="mr-2">💧</span>
              Log Care
            </Button>
            <Button variant="outline" className="flex-1">
              <span className="mr-2">📷</span>
              Add Photo
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Reminder Settings - Show when toggled */}
        {showReminderSettings && plant && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>🔔</span>
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlantReminderSettings
                plant={plant}
                onUpdate={handlePlantUpdate}
              />
            </CardContent>
          </Card>
        )}

        {/* Plant Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🌿</span>
              Plant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Variety:</span>
                <div className="text-gray-900">{plant.varietyName}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Location:</span>
                <div className="text-gray-900">📍 {plant.location}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Container:</span>
                <div className="text-gray-900">📦 {plant.container}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Planted:</span>
                <div className="text-gray-900">
                  📅 {formatDate(plant.plantedDate)} (
                  {getDaysSincePlanting(plant.plantedDate)} days ago)
                </div>
              </div>
            </div>

            {/* Soil Mix */}
            {plant.soilMix && (
              <div>
                <span className="font-medium text-gray-600">Soil Mix:</span>
                <div className="text-gray-900">🌱 {plant.soilMix}</div>
              </div>
            )}

            {/* Category */}
            {variety && variety.category && (
              <div>
                <span className="font-medium text-gray-600">Category:</span>
                <div className="text-gray-900 capitalize">
                  {variety.category.replace("-", " ")}
                </div>
              </div>
            )}

            {/* Growth Stage */}
            <div>
              <span className="font-medium text-gray-600">Growth Stage:</span>
              <div className="mt-1">
                <PlantStageDisplay
                  plant={plant}
                  showEmoji={true}
                  className="text-base"
                />
              </div>
            </div>

            {/* Expected Timeline */}
            {variety && variety.growthTimeline && (
              <div>
                <span className="font-medium text-gray-600">
                  Expected Timeline:
                </span>
                <div className="text-gray-900 text-sm mt-1 grid grid-cols-2 gap-2">
                  <div>
                    Germination: {variety.growthTimeline.germination} days
                  </div>
                  <div>Seedling: {variety.growthTimeline.seedling} days</div>
                  <div>
                    Vegetative: {variety.growthTimeline.vegetative} days
                  </div>
                  <div>
                    Maturation: {variety.growthTimeline.maturation} days
                  </div>
                </div>
              </div>
            )}

            {/* Next Task */}
            <div>
              <span className="font-medium text-gray-600">Next Task:</span>
              <div className="mt-1">
                <NextTaskDisplay plantId={plantId!} className="text-base" />
              </div>
            </div>

            {/* Reminder Preferences Summary */}
            {plant.reminderPreferences && (
              <div>
                <span className="font-medium text-gray-600">
                  Active Reminders:
                </span>
                <div className="text-gray-900 text-sm mt-1 flex flex-wrap gap-2">
                  {Object.entries(plant.reminderPreferences)
                    .filter(([, enabled]) => enabled)
                    .map(([type]) => (
                      <span
                        key={type}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 capitalize"
                      >
                        {type === "observation" ? "Health Checks" : type}
                      </span>
                    ))}
                  {Object.values(plant.reminderPreferences).every(
                    (enabled) => !enabled
                  ) && (
                    <span className="text-gray-500 text-xs">
                      All reminders disabled
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {plant.notes && plant.notes.length > 0 && (
              <div>
                <span className="font-medium text-gray-600">Notes:</span>
                <div className="text-gray-900 text-sm mt-1 space-y-1">
                  {plant.notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded">
                      📝 {note}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Care History */}
        <CareHistory careHistory={careHistory} />
      </div>
    </div>
  );
};

export default PlantDetail;
