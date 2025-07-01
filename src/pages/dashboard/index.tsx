// src/pages/dashboard/index.tsx (UPDATED)
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useNavigate } from "react-router-dom";
import { groupPlantsByConditions, PlantGroup } from "@/utils/plantGrouping";
import PlantGroupCard from "@/components/plant/PlantGroupCard";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { useScheduledTasks } from "@/hooks/useScheduledTasks";
import FertilizationDashboardSection from "@/components/fertilization/FertilizationDashboardSection";
import toast from "react-hot-toast";
import { QuickCompletionValues } from "@/services/smartDefaultsService";
import { DynamicSchedulingService } from "@/services/dynamicSchedulingService";
import { CareActivityDetails } from "@/types";

export const Dashboard = () => {
  const { plants, loading } = useFirebasePlants();
  const { user, signOut } = useFirebaseAuth();
  const { logActivity } = useFirebaseCareActivities();
  const navigate = useNavigate();
  const [plantGroups, setPlantGroups] = useState<PlantGroup[]>([]);

  const {
    getUpcomingFertilizationTasks,
    tasks,
    loading: scheduleLoading,
    error,
  } = useScheduledTasks();

  const upcomingFertilization = getUpcomingFertilizationTasks(7);
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

      if (!newCareActivityId) {
        throw new Error("Failed to get new care activity record.");
      }

      await DynamicSchedulingService.recordTaskCompletion(
        task.plantId,
        "fertilize",
        task.dueDate,
        actualCompletionDate,
        newCareActivityId, // Use the string ID directly
        "vegetative" // You might want to get the actual plant stage here
      );

      toast.success("Fertilization task completed!");
    } catch (error) {
      console.error("Failed to complete task:", error);
      toast.error("Failed to complete task");
    }
  };

  const handleTaskBypass = async (taskId: string, reason?: string) => {
    try {
      // Find the task
      const task = upcomingFertilization.find((t) => t.id === taskId);
      if (!task) {
        toast.error("Task not found");
        return;
      }

      // Log a note about bypassing
      await logActivity({
        plantId: task.plantId,
        type: "observe",
        date: new Date(),
        details: {
          type: "observe",
          notes: `Bypassed fertilization task: ${task.taskName}${
            reason ? ` - Reason: ${reason}` : ""
          }`,
        },
      });

      // TODO: Update task status to bypassed
      // This depends on your task management system

      toast.success("Task bypassed");
    } catch (error) {
      console.error("Failed to bypass task:", error);
      toast.error("Failed to bypass task");
    }
  };

  const handleTaskLogActivity = (taskId: string) => {
    // Find the task to get the plant ID
    const task = upcomingFertilization.find((t) => t.id === taskId);
    if (!task) {
      toast.error("Task not found");
      return;
    }

    // Navigate to the care log form with pre-filled data
    navigate(`/care/log?plantId=${task.plantId}&type=fertilize`);
  };

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
        <div className="text-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      {/* Remove the wrapping grid div and fix the structure */}
      <div className="space-y-6">
        <OfflineIndicator />

        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-40">
          <div className="flex justify-between items-center p-4">
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
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Debug Card */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">
                🌱 Fertilization Tasks (Debug)
              </h3>
              {scheduleLoading && <p>Loading fertilization tasks...</p>}
              {error && <p className="text-red-600">Error: {error}</p>}
              {!scheduleLoading && !error && (
                <div>
                  <p className="mb-2">Found {tasks.length} total tasks</p>
                  {tasks.length === 0 ? (
                    <p className="text-muted-foreground">
                      No fertilization tasks found
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="border p-3 rounded">
                          <p className="font-medium">{task.taskName}</p>
                          <p className="text-sm">
                            Product: {task.details.product}
                          </p>
                          <p className="text-sm">
                            Due: {task.dueDate.toLocaleDateString()}
                          </p>
                          <p className="text-sm">Status: {task.status}</p>
                          <p className="text-sm">Plant ID: {task.plantId}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Plants Card */}
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
              <p className="text-sm text-muted-foreground">Plants registered</p>
            </CardContent>
          </Card>

          {/* Today's Tasks Card */}
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

          {/* Garden Health Card */}
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-xl">📊</span>
                Garden Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">Great</p>
              <p className="text-sm text-muted-foreground">All systems green</p>
            </CardContent>
          </Card>
        </div>

        {/* Fertilization Tasks Section - Full width */}
        {upcomingFertilization.length > 0 && (
          <FertilizationDashboardSection
            tasks={upcomingFertilization}
            onTaskComplete={handleTaskComplete}
            onTaskBypass={handleTaskBypass}
            onTaskLogActivity={handleTaskLogActivity}
          />
        )}

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {plantGroups.slice(0, 6).map((group) => (
                <PlantGroupCard
                  key={group.id}
                  group={group}
                  onBulkLogActivity={handleBulkLogActivity}
                />
              ))}
            </div>

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
