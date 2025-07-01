// src/pages/plants/Plants.tsx - Simple version without search/filters
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import PlantGroupCard from "@/components/plant/PlantGroupCard";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { groupPlantsByConditions, PlantGroup } from "@/utils/plantGrouping";

const Plants: React.FC = () => {
  const navigate = useNavigate();
  const { plants, loading, error } = useFirebasePlants();

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [selectedActivityType, setSelectedActivityType] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<PlantGroup | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading plants: {error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const plantGroups = groupPlantsByConditions(plants);

  const handleBulkLogActivity = (plantIds: string[], activityType: string) => {
    const group = plantGroups.find((g) =>
      g.plants.some((plant) => plantIds.includes(plant.id))
    );

    setSelectedPlantIds(plantIds);
    setSelectedActivityType(activityType);
    setSelectedGroup(group || null);
    setBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    setSelectedPlantIds([]);
    setSelectedActivityType("");
    setSelectedGroup(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center pt-6">
          <h1 className="text-2xl font-bold">My Plants</h1>
          <Button onClick={() => navigate("/add-plant")}>Add Plant</Button>
        </div>

        {/* Plants Grid - No search, no filters, just the plants */}
        {plants.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No plants yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first plant to get started!
              </p>
              <Button onClick={() => navigate("/add-plant")}>Add Plant</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {plantGroups.map((group) => (
              <PlantGroupCard
                key={group.id}
                group={group}
                onBulkLogActivity={handleBulkLogActivity}
              />
            ))}
          </div>
        )}
      </div>

      <BulkActivityModal
        isOpen={bulkModalOpen}
        onClose={closeBulkModal}
        plantIds={selectedPlantIds}
        activityType={selectedActivityType}
        plantCount={selectedPlantIds.length}
        varietyName={selectedGroup?.varietyName || ""}
      />
    </div>
  );
};

export default Plants;
