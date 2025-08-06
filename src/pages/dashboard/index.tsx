// src/pages/dashboard/index.tsx - Cleaned up version
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useNavigate } from "react-router-dom";
import { groupPlantsByConditions, PlantGroup } from "@/utils/plantGrouping";
import PlantGroupCard from "@/components/plant/PlantGroupCard";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { QuickActionType } from "@/components/shared/QuickActionButtons";
import { useScheduledTasks } from "@/hooks/useScheduledTasks";
import FertilizationDashboardSection from "@/components/fertilization/FertilizationDashboardSection";
import toast from "react-hot-toast";
import { QuickCompletionValues } from "@/services/smartDefaultsService";
import { DynamicSchedulingService } from "@/services/dynamicSchedulingService";
import { CareActivityDetails } from "@/types";
import { FirebaseCareSchedulingService } from "@/services/firebaseCareSchedulingService";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
// ❌ REMOVED: import { CatchUpAnalysisService } from "@/services/CatchUpAnalysisService";
import {
  initializeDatabase,
  resetDatabaseInitializationFlag,
} from "@/db/seedData";
// ❌ REMOVED: import { db } from "@/types/database";

export const Dashboard = () => {
  const { plants, loading } = useFirebasePlants();
  const { user, signOut } = useFirebaseAuth();
  const { logActivity } = useFirebaseCareActivities();
  const navigate = useNavigate();
  const [plantGroups, setPlantGroups] = useState<PlantGroup[]>([]);
  const [plantsNeedingCatchUp, setPlantsNeedingCatchUp] = useState(0);
  const [careStatusLoading, setCareStatusLoading] = useState(true);

  const {
    getUpcomingFertilizationTasks,
    // ❌ REMOVED: tasks,
    // ❌ REMOVED: loading: scheduleLoading,
    error,
  } = useScheduledTasks();

  // const upcomingFertilization = getUpcomingFertilizationTasks(7);
  const upcomingFertilization =
    typeof getUpcomingFertilizationTasks === "function"
      ? getUpcomingFertilizationTasks(37) || []
      : [];
  // Load catch-up data count for summary card
  useEffect(() => {
    const loadCatchUpCount = async () => {
      if (!plants || !user?.uid) {
        setPlantsNeedingCatchUp(0);
        setCareStatusLoading(false);
        return;
      }

      setCareStatusLoading(true);
      try {
        // TODO: Add retroactive analysis back later
        console.log("🔧 Skipping retroactive analysis for now...");

        // Get upcoming tasks using the Firebase care scheduling service
        const getLastActivityByType = async (plantId: string, type: any) => {
          return FirebaseCareActivityService.getLastActivityByType(plantId, user.uid, type);
        };
        
        const upcomingTasks = await FirebaseCareSchedulingService.getUpcomingTasks(
          plants,
          getLastActivityByType
        );
        // Count unique plants that have any tasks (indicating they need care)
        const uniquePlantIds = new Set();
        upcomingTasks.forEach((task) => {
          uniquePlantIds.add(task.plantId);
        });


        setPlantsNeedingCatchUp(uniquePlantIds.size);
      } catch (error) {
        console.error("Failed to load catch-up count:", error);
        setPlantsNeedingCatchUp(0);
      } finally {
        setCareStatusLoading(false);
      }
    };

    loadCatchUpCount();
  }, [plants, user?.uid]);

  // Initialize database
  useEffect(() => {
    const initializeApp = async () => {
      try {
        resetDatabaseInitializationFlag();
        await initializeDatabase();
      } catch (error) {
        console.error("Database initialization error:", error);
      }
    };

    initializeApp();
  }, []);

  const handleTaskComplete = async (
    taskId: string,
    quickData?: QuickCompletionValues
  ) => {
    try {
      const task = upcomingFertilization.find((t) => t.id === taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      const actualCompletionDate = new Date();

      const fertilizationDetails: CareActivityDetails = {
        type: "fertilize",
        product: quickData?.product || task.details.product,
        amount: quickData?.amount || task.details.amount,
        dilution: quickData?.dilution || task.details.dilution,
        applicationMethod: task.details.method,
        notes: quickData?.notes || `Completed task: ${task.taskName}`,
      };

      const newCareActivityId = await logActivity({
        plantId: task.plantId,
        type: "fertilize",
        date: actualCompletionDate,
        details: fertilizationDetails,
      });

      // Fix: Check if newCareActivityId is defined before proceeding
      if (!newCareActivityId) {
        throw new Error("Failed to create care activity record.");
      }

      await DynamicSchedulingService.recordTaskCompletion(
        task.plantId,
        "fertilize",
        task.dueDate,
        actualCompletionDate,
        newCareActivityId, // Now TypeScript knows this is a string
        "vegetative"
      );

      toast.success("Fertilization logged successfully! 🌱");
    } catch (error) {
      console.error("Task completion error:", error);
      toast.error("Failed to complete task");
    }
  };
  const handleTaskBypass = async (taskId: string, reason?: string) => {
    // TODO: Implement actual task bypass logic with taskId
    // For now, we'll just show a success message
    const message = reason
      ? `Task bypassed: ${reason}`
      : "Task bypassed successfully";

    toast.success(message);

    // TODO: Add actual implementation to update task status in the database
    console.log(
      `Bypassing task ${taskId} with reason: ${reason || "No reason provided"}`
    );
  };

  const handleTaskLogActivity = (taskId: string) => {
    const task = upcomingFertilization.find((t) => t.id === taskId);
    if (task) {
      navigate(`/log-care/${task.plantId}`);
    }
  };

  // Navigate to catch-up page
  const handleCatchUpClick = () => {
    console.log("🔍 Catch-up click handler triggered");
    console.log("📊 Plants needing catch-up:", plantsNeedingCatchUp);

    if (plantsNeedingCatchUp === 0) {
      console.log("✅ No plants need catch-up, showing success toast");
      toast.success("All plants are up to date! 🌱");
      return;
    }

    console.log("🚀 Navigating to /catch-up");
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

  const handleBulkLogActivity = (
    plantIds: string[],
    activityType: QuickActionType,
    group: PlantGroup
  ) => {
    setSelectedPlantIds(plantIds);
    setSelectedActivityType(activityType);
    setSelectedGroup(group);
    setBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    setSelectedPlantIds([]);
    setSelectedGroup(null);
  };

  useEffect(() => {
    if (!loading && plants) {
      const groups = groupPlantsByConditions(plants);
      setPlantGroups(groups);
    }
  }, [plants, loading]);

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
                <h1 className="text-xl font-semibold text-foreground">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Plant Care Status Card - Only catch-up UI element on dashboard */}
          <Card
            className={`cursor-pointer transition-all duration-200 ${
              careStatusLoading
                ? "border-gray-200 bg-gray-50"
                : plantsNeedingCatchUp > 0
                ? "border-orange-200 bg-orange-50 hover:bg-orange-100"
                : "border-green-200 bg-green-50 hover:bg-green-100"
            }`}
            onClick={careStatusLoading ? undefined : handleCatchUpClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Plant Care Status
                  </p>
                  {careStatusLoading ? (
                    <p className="text-2xl font-bold">⏳</p>
                  ) : (
                    <p className="text-2xl font-bold">
                      {plantsNeedingCatchUp === 0 ? "✅" : plantsNeedingCatchUp}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {careStatusLoading
                      ? "Checking plants..."
                      : plantsNeedingCatchUp === 0
                      ? "All caught up!"
                      : `plants need attention`}
                  </p>
                </div>
                <div className="text-2xl">
                  {careStatusLoading
                    ? "🔄"
                    : plantsNeedingCatchUp > 0
                    ? "⚠️"
                    : "🌱"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Plants Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Plants
                  </p>
                  <p className="text-2xl font-bold">{plants?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    in your garden
                  </p>
                </div>
                <div className="text-2xl">🪴</div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Fertilization Tasks
                  </p>
                  <p className="text-2xl font-bold">
                    {upcomingFertilization.length}
                  </p>
                  <p className="text-xs text-muted-foreground">due this week</p>
                </div>
                <div className="text-2xl">🌱</div>
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Plant Groups */}
        {plants && plants.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">
                🌱 Welcome to SmartGarden!
              </h3>
              <p className="text-muted-foreground mb-4">
                Start your gardening journey by adding your first plant. Track
                growth, log care activities, and get personalized
                recommendations.
              </p>
              <Button onClick={() => navigate("/add-plant")}>
                🌿 Add Your First Plant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Plants</h2>
              <Button onClick={() => navigate("/add-plant")}>Add Plant</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {plantGroups.map((group) => (
                <PlantGroupCard
                  key={group.id}
                  group={group}
                  onBulkLogActivity={handleBulkLogActivity}
                />
              ))}
            </div>
          </div>
        )}
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

export default Dashboard;
