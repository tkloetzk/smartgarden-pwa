// src/pages/dashboard/index.tsx - Cleaned up version
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useNavigate } from "react-router-dom";
import { groupPlantsByConditions, PlantGroup } from "@/utils/plantGrouping";
import {
  groupPlantGroupsByContainer,
  ContainerGroup,
  findContainerMates,
} from "@/utils/containerGrouping";
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
  const [containerGroups, setContainerGroups] = useState<ContainerGroup[]>([]);
  const [plantsNeedingCatchUp, setPlantsNeedingCatchUp] = useState(0);
  const [careStatusLoading, setCareStatusLoading] = useState(true);
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(() => {
    // Load hidden groups from localStorage on initialization
    try {
      const saved = localStorage.getItem("hiddenPlantGroups");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.warn("Failed to load hidden groups from localStorage:", error);
      return new Set();
    }
  });
  const [activityLoggedTrigger, setActivityLoggedTrigger] = useState(0);

  const {
    getUpcomingFertilizationTasks,
    // ❌ REMOVED: tasks,
    // ❌ REMOVED: loading: scheduleLoading,
    error,
  } = useScheduledTasks();

  // Define helper functions before using them in useMemo
  // Get all visible plants (not in hidden groups)
  const getVisiblePlants = useCallback(() => {
    if (!plants) return [];

    // Find all plants that are in visible groups (not hidden)
    const visibleGroups = plantGroups.filter(
      (group) => !hiddenGroups.has(group.id)
    );
    const visiblePlants = visibleGroups.flatMap((group) => group.plants);

    return visiblePlants;
  }, [plants, plantGroups, hiddenGroups]);

  // Calculate visible plants count (total plants minus plants in hidden groups)
  const getVisiblePlantsCount = useCallback(() => {
    return getVisiblePlants().length;
  }, [getVisiblePlants]);

  // Helper function to get the most relevant fertilization tasks for a single plant
  const getRelevantFertilizationTasksForPlant = useCallback(
    (allTasks: any[], currentDate: Date) => {
      if (allTasks.length === 0) return [];

      const now = currentDate.getTime();

      // Sort tasks by due date
      const sortedTasks = [...allTasks].sort(
        (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
      );

      // Find the most relevant task(s):
      // 1. If there's an overdue task, show the most recent overdue one
      // 2. Otherwise, show the next upcoming task

      const overdueTasks = sortedTasks.filter(
        (task) => task.dueDate.getTime() < now
      );
      const upcomingTasks = sortedTasks.filter(
        (task) => task.dueDate.getTime() >= now
      );

      const relevantTasks = [];

      // Add the most recent overdue task (if any)
      if (overdueTasks.length > 0) {
        const mostRecentOverdue = overdueTasks[overdueTasks.length - 1];
        relevantTasks.push(mostRecentOverdue);
      }

      // Add the next upcoming task (if any and no overdue, or if there's a significant gap)
      if (upcomingTasks.length > 0) {
        const nextUpcoming = upcomingTasks[0];

        // If there's no overdue task, or if the upcoming task is close, include it
        if (overdueTasks.length === 0) {
          relevantTasks.push(nextUpcoming);
        }
      }

      return relevantTasks;
    },
    []
  );

  // Get relevant fertilization tasks for dashboard (not the full 2-year schedule)
  const upcomingFertilization = useMemo(() => {
    const allFertilizationTasks =
      typeof getUpcomingFertilizationTasks === "function"
        ? getUpcomingFertilizationTasks(365) || [] // Get full year of tasks for filtering
        : [];


    // Get visible plants for filtering
    const visiblePlants = getVisiblePlants();

    // Filter fertilization tasks to only include visible plants
    const visiblePlantTasks = allFertilizationTasks.filter((task) => {
      return visiblePlants.some((plant) => plant.id === task.plantId);
    });

    // Group tasks by plant and get only the most relevant ones
    const tasksByPlant = new Map<string, any[]>();
    visiblePlantTasks.forEach((task) => {
      if (!tasksByPlant.has(task.plantId)) {
        tasksByPlant.set(task.plantId, []);
      }
      tasksByPlant.get(task.plantId)!.push(task);
    });

    // For each plant, get only the most relevant fertilization tasks
    const relevantTasks: any[] = [];
    const now = new Date();

    tasksByPlant.forEach((tasks, _plantId) => {
      const plantRelevantTasks = getRelevantFertilizationTasksForPlant(
        tasks,
        now
      );
      relevantTasks.push(...plantRelevantTasks);
    });

    // Group identical tasks by variety, task name, product, and due date
    const groupedTasks = new Map<string, any>();

    relevantTasks.forEach((task) => {
      // Find the plant for this task to get variety info
      const plant = visiblePlants.find((p) => p.id === task.plantId);
      if (!plant) return;

      // Create a unique key for grouping identical tasks
      const dueDateStr = task.dueDate.toDateString();
      const groupKey = `${plant.varietyName}-${task.taskName}-${task.details.product}-${dueDateStr}`;

      if (groupedTasks.has(groupKey)) {
        // Add this plant to the existing group
        const existingTask = groupedTasks.get(groupKey);
        existingTask.plantIds.push(task.plantId);
        existingTask.plantCount = existingTask.plantIds.length;
        existingTask.affectedPlants.push({
          id: plant.id,
          name: plant.name,
          varietyName: plant.varietyName,
        });
      } else {
        // Create a new grouped task
        groupedTasks.set(groupKey, {
          ...task,
          id: `grouped-${groupKey}`, // Use a grouped ID
          plantIds: [task.plantId], // Array of all plant IDs in this group
          plantCount: 1,
          varietyName: plant.varietyName,
          affectedPlants: [
            {
              id: plant.id,
              name: plant.name,
              varietyName: plant.varietyName,
            },
          ],
        });
      }
    });

    return Array.from(groupedTasks.values());
  }, [
    getUpcomingFertilizationTasks,
    getVisiblePlants,
    getRelevantFertilizationTasksForPlant,
  ]);
  // Load catch-up data count for summary card
  useEffect(() => {
    const loadCatchUpCount = async () => {
      console.log("🚀 loadCatchUpCount called", {
        plantsLength: plants?.length,
        userUid: user?.uid,
        careStatusLoading,
      });

      if (!plants || !user?.uid) {
        console.log("❌ Early exit - no plants or user");
        setPlantsNeedingCatchUp(0);
        setCareStatusLoading(false);
        return;
      }

      setCareStatusLoading(true);
      try {
        // For Plant Care Status, use plants directly (plantGroups might not be ready yet)
        // We'll handle hiding logic by checking individual plant group membership
        const allPlants = plants || [];

        // Simple visible plants logic: just use all plants for now
        // (Plant hiding is a UI convenience, not a core care tracking feature)
        const visiblePlants = allPlants;

        console.log("🔍 Plant Care Status Debug:");
        console.log(`  All plants: ${allPlants.length}`);
        console.log(`  Visible plants (using all): ${visiblePlants.length}`);
        visiblePlants.forEach((plant) => {
          const plantAge = Math.floor(
            (new Date().getTime() - plant.plantedDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          console.log(`    - ${plant.varietyName} (${plantAge} days old)`);
          console.log(
            `      Fertilizing reminders: ${plant.reminderPreferences?.fertilizing}`
          );
        });

        // TODO: Add retroactive analysis back later
        // Skip retroactive analysis for now

        // Get upcoming tasks using the Firebase care scheduling service
        const getLastActivityByType = async (plantId: string, type: any) => {
          return FirebaseCareActivityService.getLastActivityByType(
            plantId,
            user.uid,
            type
          );
        };

        // Get standard care tasks (watering, observation)
        const careTasks = await FirebaseCareSchedulingService.getUpcomingTasks(
          visiblePlants, // Use visible plants only, not all plants
          getLastActivityByType
        );

        console.log(`  Standard care tasks: ${careTasks.length}`);

        // Get fertilization tasks using the SAME logic as the dashboard fertilization section
        const allFertilizationTasks = getUpcomingFertilizationTasks
          ? getUpcomingFertilizationTasks(365)
          : [];
        console.log(
          `  All fertilization tasks: ${allFertilizationTasks.length}`
        );

        // Filter fertilization tasks to only include visible plants
        const visibleFertilizationTasks = allFertilizationTasks.filter((task) =>
          visiblePlants.some((plant) => plant.id === task.plantId)
        );
        console.log(
          `  Visible fertilization tasks: ${visibleFertilizationTasks.length}`
        );

        // Group tasks by plant and get only the most relevant ones (same as dashboard)
        const tasksByPlant = new Map<string, any[]>();
        visibleFertilizationTasks.forEach((task) => {
          if (!tasksByPlant.has(task.plantId)) {
            tasksByPlant.set(task.plantId, []);
          }
          tasksByPlant.get(task.plantId)!.push(task);
        });
        console.log(`  Plants with fertilization tasks: ${tasksByPlant.size}`);

        // For each plant, get only the most relevant fertilization tasks
        const relevantFertilizationTasks: any[] = [];
        const now = new Date();

        tasksByPlant.forEach((tasks, plantId) => {
          const plantRelevantTasks = getRelevantFertilizationTasksForPlant(
            tasks,
            now
          );
          console.log(
            `    Plant ${plantId}: ${tasks.length} total tasks -> ${plantRelevantTasks.length} relevant tasks`
          );
          relevantFertilizationTasks.push(...plantRelevantTasks);
        });
        console.log(
          `  Total relevant fertilization tasks: ${relevantFertilizationTasks.length}`
        );

        // Count unique plants that have any tasks (indicating they need care)
        const uniquePlantIds = new Set();
        careTasks.forEach((task) => {
          uniquePlantIds.add(task.plantId);
        });
        relevantFertilizationTasks.forEach((task) => {
          uniquePlantIds.add(task.plantId);
        });

        console.log(`  Unique plants needing care: ${uniquePlantIds.size}`);
        console.log(`  Plant IDs: ${Array.from(uniquePlantIds)}`);

        setPlantsNeedingCatchUp(uniquePlantIds.size);
        console.log(
          "✅ Plant Care Status calculation complete, setting careStatusLoading = false"
        );
      } catch (error) {
        console.error("Failed to load catch-up count:", error);
        setPlantsNeedingCatchUp(0);
      } finally {
        setCareStatusLoading(false);
      }
    };

    loadCatchUpCount();
  }, [plants, user?.uid, activityLoggedTrigger, hiddenGroups]); // Remove fertilization dependency to prevent infinite loop

  // Save hidden groups to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "hiddenPlantGroups",
        JSON.stringify([...hiddenGroups])
      );
    } catch (error) {
      console.warn("Failed to save hidden groups to localStorage:", error);
    }
  }, [hiddenGroups]);

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

      // Handle grouped tasks (multiple plants) vs single plant tasks
      const plantIds = task.plantIds || [task.plantId];
      const completedActivities: string[] = [];

      // Log activity for each plant in the group
      for (const plantId of plantIds) {
        const newCareActivityId = await logActivity({
          plantId: plantId,
          type: "fertilize",
          date: actualCompletionDate,
          details: fertilizationDetails,
        });

        if (!newCareActivityId) {
          throw new Error(
            `Failed to create care activity record for plant ${plantId}.`
          );
        }

        completedActivities.push(newCareActivityId);

        await DynamicSchedulingService.recordTaskCompletion(
          plantId,
          "fertilize",
          task.dueDate,
          actualCompletionDate,
          newCareActivityId,
          "vegetative"
        );
      }

      const plantCount = plantIds.length;
      const message =
        plantCount > 1
          ? `Fertilization logged for ${plantCount} ${
              task.varietyName || "plants"
            } successfully! 🌱`
          : "Fertilization logged successfully! 🌱";

      toast.success(message);

      // Trigger a refresh
      setActivityLoggedTrigger((prev) => prev + 1);
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
    setHiddenGroups((prev) => new Set([...prev, group.id]));
    toast.success(`${group.varietyName} removed from view`);
  };

  const handleRestoreAllHidden = () => {
    const count = hiddenGroups.size;
    setHiddenGroups(new Set());
    toast.success(
      `${count} plant group${count !== 1 ? "s" : ""} restored to view`
    );
  };

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    setSelectedPlantIds([]);
    setSelectedGroup(null);
  };

  const handleActivityLogged = useCallback(() => {
    // Trigger refresh for all components that need to update after activity logging
    setActivityLoggedTrigger((prev) => prev + 1);
  }, []);

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

  useEffect(() => {
    if (!loading && plants) {
      const groups = groupPlantsByConditions(plants);
      setPlantGroups(groups);

      // Filter out hidden groups
      const visibleGroups = groups.filter(
        (group) => !hiddenGroups.has(group.id)
      );
      const containers = groupPlantGroupsByContainer(visibleGroups);
      setContainerGroups(containers);
    }
  }, [plants, loading, hiddenGroups]);

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Plant Care Status Card - Only catch-up UI element on dashboard */}
          <Card
            className={`cursor-pointer transition-all duration-200 ${
              careStatusLoading
                ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                : plantsNeedingCatchUp > 0
                ? "border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:hover:bg-orange-950/50"
                : "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:hover:bg-green-950/50"
            }`}
            onClick={careStatusLoading ? undefined : handleCatchUpClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-medium ${
                      careStatusLoading
                        ? "text-gray-600 dark:text-gray-400"
                        : plantsNeedingCatchUp > 0
                        ? "text-orange-800 dark:text-orange-200"
                        : "text-green-800 dark:text-green-200"
                    }`}
                  >
                    Plant Care Status
                  </p>
                  {careStatusLoading ? (
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      ⏳
                    </p>
                  ) : (
                    <p
                      className={`text-2xl font-bold ${
                        plantsNeedingCatchUp > 0
                          ? "text-orange-900 dark:text-orange-100"
                          : "text-green-900 dark:text-green-100"
                      }`}
                    >
                      {plantsNeedingCatchUp === 0 ? "✅" : plantsNeedingCatchUp}
                    </p>
                  )}
                  <p
                    className={`text-xs ${
                      careStatusLoading
                        ? "text-gray-500 dark:text-gray-400"
                        : plantsNeedingCatchUp > 0
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-green-700 dark:text-green-300"
                    }`}
                  >
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
                  <p className="text-2xl font-bold">
                    {getVisiblePlantsCount()}
                  </p>
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
              <h3
                className="text-lg font-semibold mb-2"
                data-testid="welcome-message-title"
              >
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
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Your Garden</h2>
                {hiddenGroups.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestoreAllHidden}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Show {hiddenGroups.size} hidden group
                    {hiddenGroups.size !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>
              <Button onClick={() => navigate("/add-plant")}>Add Plant</Button>
            </div>

            {containerGroups.map((container) => (
              <div key={container.containerName} className="mb-8">
                {/* Container Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📦</div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {container.containerName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {container.plantGroups.length} section
                        {container.plantGroups.length !== 1 ? "s" : ""} •{" "}
                        {container.totalPlants} plant
                        {container.totalPlants !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {container.needsCareCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-orange-600 dark:text-orange-400">
                        {container.needsCareCount} need
                        {container.needsCareCount !== 1 ? "" : "s"} care
                      </span>
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Plant Groups in Container */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ml-6">
                  {container.plantGroups.map((group) => (
                    <PlantGroupCard
                      key={group.id}
                      group={group}
                      onBulkLogActivity={handleBulkLogActivity}
                      onRemoveFromView={handleRemoveFromView}
                      refreshTrigger={activityLoggedTrigger}
                    />
                  ))}
                </div>
              </div>
            ))}

            {containerGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No plant groups found. Start by adding your first plant!</p>
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
        containerMates={selectedContainerMates}
        onActivityLogged={handleActivityLogged}
      />
    </>
  );
};

export default Dashboard;
