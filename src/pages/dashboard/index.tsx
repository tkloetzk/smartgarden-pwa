import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useNavigate } from "react-router-dom";
import { PlantGroup } from "@/utils/plantGrouping";
import { findContainerMates } from "@/utils/containerGrouping";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { QuickActionType } from "@/components/shared/QuickActionButtons";
import FertilizationDashboardSection from "@/components/fertilization/FertilizationDashboardSection";
import toast from "react-hot-toast";
import {
  initializeDatabase,
  resetDatabaseInitializationFlag,
} from "@/db/seedData";
import { seedVarieties } from "@/data/seedVarieties";
import { TaskManagementService } from "@/services/TaskManagementService";
import {
  useDashboardData,
  useHiddenGroupsManager,
  useContainerGroups,
  useFertilizationTasks,
  useCareStatus,
} from "@/hooks/dashboard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { PlantGarden } from "@/components/dashboard/PlantGarden";

// Protocol sync function
async function syncPlantProtocols(plants: any[], userId: string) {
  try {
    // Use centralized task management service for bulk regeneration

    await TaskManagementService.bulkRegenerateTasksForPlants(
      plants,
      (plantId: string) => {
        const plant = plants.find(p => p.id === plantId);
        if (!plant) return undefined;
        
        const variety = seedVarieties.find((v) => v.name === plant.varietyName);
        if (!variety) return undefined;
        
        return {
          ...variety,
          normalizedName: variety.name.toLowerCase().replace(/\s+/g, "-"),
          id: variety.name.toLowerCase().replace(/\s+/g, "-"),
          createdAt: new Date(),
        };
      },
      userId,
      "dashboard-sync"
    );

    console.log("🎉 Protocol sync completed successfully");
  } catch (error) {
    console.error("❌ Protocol sync failed:", error);
  }
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [activityLoggedTrigger, setActivityLoggedTrigger] = useState(0);

  // Custom hooks for data and state management
  const {
    plants,
    loading,
    user,
    signOut,
    logActivity,
    getUpcomingFertilizationTasks,
    scheduledTasksError: error,
  } = useDashboardData();

  const { hiddenGroups, hideGroup, restoreAllHidden } =
    useHiddenGroupsManager();

  const { plantGroups, containerGroups, visiblePlants, visiblePlantsCount } =
    useContainerGroups(plants, loading, hiddenGroups);

  const { plantsNeedingCatchUp, careStatusLoading } = useCareStatus(
    plants,
    user?.uid,
    activityLoggedTrigger,
    hiddenGroups,
    getUpcomingFertilizationTasks
  );

  const handleActivityLogged = useCallback(() => {
    // Trigger refresh for all components that need to update after activity logging
    setActivityLoggedTrigger((prev) => prev + 1);
  }, []);

  const {
    upcomingFertilization,
    handleTaskComplete,
    handleTaskBypass,
    handleTaskLogActivity,
  } = useFertilizationTasks(
    visiblePlants,
    logActivity,
    navigate,
    handleActivityLogged
  );

  // Initialize database and sync protocols
  useEffect(() => {
    const initializeApp = async () => {
      try {
        resetDatabaseInitializationFlag();
        await initializeDatabase();

        // Sync protocols for existing plants
        if (plants && plants.length > 0 && user?.uid) {
          await syncPlantProtocols(plants, user.uid);
        }
      } catch (error) {
        console.error("Database initialization error:", error);
      }
    };

    initializeApp();
  }, [plants, user?.uid]); // Re-run when plants or user changes

  // Navigate to catch-up page
  const handleCatchUpClick = () => {
    console.log("📊 Plants needing catch-up:", plantsNeedingCatchUp);

    if (plantsNeedingCatchUp === 0) {
      console.log("✅ No plants need catch-up, showing success toast");
      toast.success("All plants are up to date! 🌱");
      return;
    }

    try {
      navigate("/catch-up");
    } catch (error) {
      console.error("❌ Navigation error:", error);
      toast.error("Failed to navigate to catch-up page");
    }
  };

  // Bulk Activity Modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [selectedActivityType, setSelectedActivityType] =
    useState<QuickActionType>("water");
  const [selectedGroup, setSelectedGroup] = useState<PlantGroup | null>(null);
  const [selectedContainerMates, setSelectedContainerMates] = useState<
    Array<{
      groupId: string;
      plantIds: string[];
      varietyName: string;
      location: string;
      plantCount: number;
    }>
  >([]);

  const handleBulkLogActivity = (
    plantIds: string[],
    activityType: QuickActionType,
    group: PlantGroup
  ) => {
    setSelectedPlantIds(plantIds);
    setSelectedActivityType(activityType);
    setSelectedGroup(group);

    // Find container mates for this plant group
    const containerMates = findContainerMates(group, plantGroups);
    const containerMatesData = containerMates.map((mate) => ({
      groupId: mate.id,
      plantIds: mate.plants.map((p) => p.id),
      varietyName: mate.varietyName,
      location: mate.location,
      plantCount: mate.plants.length,
    }));
    setSelectedContainerMates(containerMatesData);

    setBulkModalOpen(true);
  };

  const handleRemoveFromView = (group: PlantGroup) => {
    hideGroup(group.id, group.varietyName);
  };

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    setSelectedPlantIds([]);
    setSelectedGroup(null);
  };

  // Listen for care activity logged events from other parts of the app
  useEffect(() => {
    const handleCareActivityLogged = () => {
      handleActivityLogged();
    };

    window.addEventListener(
      "care-activity-logged",
      handleCareActivityLogged as EventListener
    );

    return () => {
      window.removeEventListener(
        "care-activity-logged",
        handleCareActivityLogged as EventListener
      );
    };
  }, [handleActivityLogged]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <OfflineIndicator />

        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-40">
          <div className="flex justify-between items-center p-4">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => navigate("/")}
            >
              <div className="text-2xl">🌱</div>
              <div>
                <h1
                  className="text-xl font-semibold text-foreground"
                  data-testid="smartgarden-title"
                >
                  SmartGarden
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {user?.displayName || user?.email || "Guest"}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards>
          <SummaryCards.CareStatus
            plantsNeedingCatchUp={plantsNeedingCatchUp}
            careStatusLoading={careStatusLoading}
            onCatchUpClick={handleCatchUpClick}
          />
          <SummaryCards.PlantCount visiblePlantsCount={visiblePlantsCount} />
        </SummaryCards>

        {/* Fertilization Tasks Section */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">Error loading tasks: {error}</p>
            </CardContent>
          </Card>
        )}

        <FertilizationDashboardSection
          tasks={upcomingFertilization}
          onTaskComplete={handleTaskComplete}
          onTaskBypass={handleTaskBypass}
          onTaskLogActivity={handleTaskLogActivity}
        />

        {/* Plant Garden */}
        <PlantGarden.Container
          plants={plants}
          containerGroups={containerGroups}
          hiddenGroupsCount={hiddenGroups.size}
          onNavigateToAddPlant={() => navigate("/add-plant")}
          onRestoreAllHidden={restoreAllHidden}
          onBulkLogActivity={handleBulkLogActivity}
          onRemoveFromView={handleRemoveFromView}
          refreshTrigger={activityLoggedTrigger}
        >
          {plants && plants.length === 0 ? (
            <PlantGarden.Empty
              onNavigateToAddPlant={() => navigate("/add-plant")}
            />
          ) : (
            <>
              <PlantGarden.Header
                hiddenGroupsCount={hiddenGroups.size}
                onRestoreAllHidden={restoreAllHidden}
                onNavigateToAddPlant={() => navigate("/add-plant")}
              />
              {containerGroups.map((container) => (
                <PlantGarden.ContainerGroup
                  key={container.containerName}
                  container={container}
                  onBulkLogActivity={handleBulkLogActivity}
                  onRemoveFromView={handleRemoveFromView}
                  refreshTrigger={activityLoggedTrigger}
                />
              ))}
              {containerGroups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>
                    No plant groups found. Start by adding your first plant!
                  </p>
                </div>
              )}
            </>
          )}
        </PlantGarden.Container>
      </div>

      {/* Bulk Activity Modal */}
      <BulkActivityModal
        isOpen={bulkModalOpen}
        onClose={closeBulkModal}
        plantIds={selectedPlantIds}
        activityType={selectedActivityType}
        plantCount={selectedPlantIds.length}
        varietyName={selectedGroup?.varietyName || ""}
        containerMates={selectedContainerMates}
        onActivityLogged={handleActivityLogged}
      />
    </>
  );
};

export default Dashboard;
