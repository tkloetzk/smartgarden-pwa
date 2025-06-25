import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Input } from "@/components/ui/Input";
import Navigation from "@/components/Navigation";
import PlantGroupCard from "@/components/plant/PlantGroupCard";
import PlantInfoCard from "@/components/plant/PlantInfoCard";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { groupPlantsByConditions, PlantGroup } from "@/utils/plantGrouping";

const Plants: React.FC = () => {
  const navigate = useNavigate();
  const { plants, loading, error } = useFirebasePlants(); // Fixed: loading instead of isLoading

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"groups" | "individual">("groups");
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

  // Fixed: Handle potentially undefined plant.name and use varietyName
  const filteredPlants = plants.filter(
    (plant) =>
      (plant.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (plant.varietyName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

  // Fixed: Match PlantGroupCard interface - only 2 parameters
  const handleBulkLogActivity = (plantIds: string[], activityType: string) => {
    // Find the group to get additional data if needed
    const group = plantGroups.find((g) =>
      g.plants.some((plant) => plantIds.includes(plant.id))
    );

    setSelectedPlantIds(plantIds);
    setSelectedActivityType(activityType);
    setSelectedGroup(group || null);
    setBulkModalOpen(true);
  };

  const handleIndividualLogActivity = (
    plantId: string,
    activityType: string
  ) => {
    navigate(`/log-care?plantId=${plantId}&activityType=${activityType}`);
  };

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    setSelectedPlantIds([]);
    setSelectedActivityType("");
    setSelectedGroup(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Plants</h1>
          <Button onClick={() => navigate("/add-plant")}>Add Plant</Button>
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search plants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <Button
              variant={viewMode === "groups" ? "primary" : "outline"} // Fixed: primary instead of default
              onClick={() => setViewMode("groups")}
            >
              Groups
            </Button>
            <Button
              variant={viewMode === "individual" ? "primary" : "outline"} // Fixed: primary instead of default
              onClick={() => setViewMode("individual")}
            >
              Individual
            </Button>
          </div>
        </div>

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
          <div className="space-y-4">
            {viewMode === "groups" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plantGroups.map((group) => (
                  <PlantGroupCard
                    key={group.id}
                    group={group}
                    onBulkLogActivity={handleBulkLogActivity} // Fixed: Now matches interface
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlants.map((plant) => (
                  <PlantInfoCard
                    key={plant.id}
                    plant={plant}
                    onLogCare={handleIndividualLogActivity}
                    showQuickActions={true}
                  />
                ))}
              </div>
            )}
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
