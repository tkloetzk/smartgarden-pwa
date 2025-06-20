// Update src/pages/plants/Plants.tsx - make plant cards clickable
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { plantService, PlantRecord } from "@/types/database";
import { Link } from "react-router-dom";
import PlantStageDisplay from "@/components/plant/PlantStageDisplay";
import NextTaskDisplay from "@/components/plant/NextTaskDisplay";
import { formatDate, getDaysSincePlanting } from "@/utils/dateUtils"; // Update import

const Plants: React.FC = () => {
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlants();
  }, []);

  async function loadPlants() {
    try {
      const activePlants = await plantService.getActivePlants();
      setPlants(activePlants);
    } catch (error) {
      console.error("Failed to load plants:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading plants...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Plants</h1>
        <Link to="/add-plant">
          <Button variant="primary" size="sm">
            Add Plant
          </Button>
        </Link>
      </div>

      {/* Plants List */}
      {plants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No plants yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start your garden by adding your first plant
            </p>
            <Link to="/add-plant">
              <Button variant="primary">Add Your First Plant</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plants.map((plant) => (
            <Link
              key={plant.id}
              to={`/plants/${plant.id}`} // Make the entire card clickable
              className="block"
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {plant.name || plant.varietyName}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>📍 {plant.location}</div>
                        <div>📦 {plant.container}</div>
                        <PlantStageDisplay
                          plant={plant}
                          showEmoji={true}
                          className="text-sm text-gray-600 mb-2"
                        />
                        <div>
                          📅 Planted: {formatDate(plant.plantedDate)} (
                          {getDaysSincePlanting(plant.plantedDate)} days ago)
                        </div>
                        <NextTaskDisplay
                          plantId={plant.id}
                          className="mt-2 font-medium"
                        />
                      </div>
                      {plant.notes && plant.notes.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          📝 {plant.notes[0]}
                        </div>
                      )}
                    </div>
                    <div className="text-3xl ml-4">🌿</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Plants;
