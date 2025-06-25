// src/pages/dashboard/index.tsx (UPDATED)
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useNavigate } from "react-router-dom";
import { groupPlantsByConditions, PlantGroup } from "@/utils/plantGrouping";
import PlantGroupCard from "@/components/plant/PlantGroupCard";
import BulkActivityModal from "@/components/plant/BulkActivityModal";

export const Dashboard = () => {
  const { plants, loading } = useFirebasePlants();
  const { user, signOut } = useFirebaseAuth();
  const navigate = useNavigate();
  const [plantGroups, setPlantGroups] = useState<PlantGroup[]>([]);

  // Bulk activity modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [selectedActivityType, setSelectedActivityType] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<PlantGroup | null>(null);

  useEffect(() => {
    if (plants && plants.length > 0) {
      const groups = groupPlantsByConditions(plants);
      setPlantGroups(groups);
    } else {
      setPlantGroups([]);
    }
  }, [plants]);

  const handleBulkLogActivity = (plantIds: string[], activityType: string) => {
    const group = plantGroups.find((g) =>
      g.plants.some((p) => plantIds.includes(p.id))
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🌱</div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    SmartGarden
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome, {user?.displayName || user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">🌿</span>
                  Total Plants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {plants?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Plants registered
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  Today's Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent">0</p>
                <p className="text-sm text-muted-foreground">Tasks due</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Garden Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-600">Great</p>
                <p className="text-sm text-muted-foreground">
                  All systems green
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Welcome / Empty State */}
          {plantGroups.length === 0 && (
            <Card className="bg-gradient-to-br from-card to-muted/30">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  Welcome to SmartGarden!
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start your gardening journey by adding your first plant. Track
                  growth, log care activities, and get personalized
                  recommendations.
                </p>
                <Button
                  onClick={() => navigate("/add-plant")}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <span className="mr-2">🌿</span>
                  Add Your First Plant
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Your Plants Section */}
          {plantGroups.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <span className="text-2xl">🌿</span>
                  Your Plants
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/plants")}
                    size="sm"
                  >
                    View All
                  </Button>
                  <Button
                    onClick={() => navigate("/add-plant")}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <span className="mr-2">➕</span>
                    Add Plant
                  </Button>
                </div>
              </div>

              {/* Plant Groups Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plantGroups.slice(0, 6).map((group) => (
                  <PlantGroupCard
                    key={group.id}
                    group={group}
                    onBulkLogActivity={handleBulkLogActivity}
                  />
                ))}
              </div>

              {/* Show more link if there are more than 6 groups */}
              {plantGroups.length > 6 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => navigate("/plants")}>
                    View All {plantGroups.length} Plant Groups
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <Navigation />
      </div>

      {/* Bulk Activity Modal */}
      <BulkActivityModal
        isOpen={bulkModalOpen}
        onClose={closeBulkModal}
        plantIds={selectedPlantIds}
        activityType={selectedActivityType}
        plantCount={selectedPlantIds.length}
        varietyName={selectedGroup?.varietyName || ""}
      />
    </>
  );
};
