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

  useEffect(() => {
    // Early return if plantId is undefined
    if (!plantId) {
      setError("No plant ID provided");
      setIsLoading(false);
      return;
    }

    async function loadPlantDetails() {
      // TypeScript now knows plantId is defined here
      try {
        setIsLoading(true);
        setError(null);

        // Load plant, variety, and care history in parallel
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

        // Load variety data
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

  function handleBackClick() {
    navigate("/plants");
  }

  function handleLogCare() {
    // Add type guard for plantId
    if (!plantId) {
      console.error("Cannot log care: no plant ID");
      return;
    }
    navigate(`/log-care?plantId=${plantId}`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !plant || !plantId) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || "Plant not found"}
            </h3>
            <Button onClick={handleBackClick} variant="outline">
              Back to Plants
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" onClick={handleBackClick} className="p-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <h1 className="text-xl font-bold text-gray-900 flex-1">
              {getPlantDisplayName(plant)}
            </h1>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-2">
            <Button onClick={handleLogCare} className="flex-1">
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

            {/* Variety Info */}
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
                <NextTaskDisplay plantId={plantId} className="text-base" />
              </div>
            </div>

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
        <CareHistory plantId={plantId} careHistory={careHistory} />
      </div>
    </div>
  );
};

export default PlantDetail;
