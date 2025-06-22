import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { plantService, PlantRecord, careService } from "@/types/database";
import { CareSchedulingService } from "@/services/careSchedulingService";
import { TaskGroupingService } from "@/services/taskGroupingService";
import { SmartDefaultsService } from "@/services/smartDefaultsService";
import {
  QuickCompleteOption,
  QuickCompletionValues,
  TaskGroup as TaskGroupType,
  UpcomingTask,
} from "@/types/scheduling";
import { getPlantDisplayName } from "@/utils/plantDisplay";
import TaskGroup from "@/pages/dashboard/TaskGroup";
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
import Welcome from "@/components/layouts/Welcome";
import { WateringDetails, FertilizingDetails } from "@/types/database";
import { BypassAnalysisService } from "@/services/bypassAnalysisService"; // Changed from BypassAnalysisService
import { CareActivityType, GrowthStage } from "@/types";
import toast from "react-hot-toast";

interface QuickAction {
  id: string;
  label: string;
  emoji: string;
  action: () => void;
  variant?: "primary" | "outline" | "destructive" | "secondary" | "ghost";
  isContextual?: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { isFirstTime, isLoading: isCheckingFirstTime } = useFirstTimeUser();

  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroupType[]>([]);
  const [allTasks, setAllTasks] = useState<UpcomingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [plantsData, rawTasks] = await Promise.all([
        plantService.getActivePlants(),
        CareSchedulingService.getUpcomingTasks(),
      ]);

      const enhancedTasks = await Promise.all(
        rawTasks.map(async (task) => {
          const plant = plantsData.find((p) => p.id === task.plantId);
          if (!plant) {
            return { ...task, quickCompleteOptions: [], canBypass: true };
          }

          const taskType = getTaskTypeFromName(task.task);
          let quickOptions: QuickCompleteOption[] = [];

          try {
            // Pass isForDashboard = true to only get the main quick option
            const options =
              await SmartDefaultsService.getQuickCompletionOptions(
                plant,
                taskType,
                true // This is for dashboard
              );
            quickOptions = options || [];
          } catch (error) {
            console.error("Failed to get quick completion options:", error);
            quickOptions = [];
          }

          return {
            ...task,
            quickCompleteOptions: quickOptions,
            canBypass: true,
          };
        })
      );

      const grouped = TaskGroupingService.groupTasksByActivity(enhancedTasks);

      setPlants(plantsData);
      setTaskGroups(grouped);
      setAllTasks(enhancedTasks);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getTaskTypeFromName = (taskName: string): CareActivityType => {
    const name = taskName.toLowerCase();
    if (name.includes("water") || name.includes("moisture")) return "water";
    if (name.includes("fertiliz") || name.includes("feed")) return "fertilize";
    if (name.includes("observe") || name.includes("health")) return "observe";
    if (name.includes("harvest")) return "harvest";
    if (name.includes("transplant")) return "transplant";
    return "water"; // Default fallback
  };

  // Generate contextual quick actions based on current state
  const getQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];

    // Contextual actions based on urgent tasks
    const urgentTasks = allTasks.filter(
      (task) => task.priority === "high" || task.dueIn.includes("overdue")
    );

    // Add contextual watering action for most urgent plant
    const wateringTasks = urgentTasks.filter((task) =>
      task.task.toLowerCase().includes("water")
    );
    if (wateringTasks.length > 0) {
      const firstWateringTask = wateringTasks[0];
      const plant = plants.find((p) => p.id === firstWateringTask.plantId);
      if (plant) {
        actions.push({
          id: "water-urgent",
          label: `Water ${getPlantDisplayName(plant)}`,
          emoji: "💧",
          action: () => navigate(`/log-care?plantId=${plant.id}&type=water`),
          variant: "primary",
          isContextual: true,
        });
      }
    }

    // Add contextual fertilizing action
    const fertilizingTasks = urgentTasks.filter((task) =>
      task.task.toLowerCase().includes("fertiliz")
    );
    if (fertilizingTasks.length > 0 && actions.length < 2) {
      const firstFertilizingTask = fertilizingTasks[0];
      const plant = plants.find((p) => p.id === firstFertilizingTask.plantId);
      if (plant) {
        actions.push({
          id: "fertilize-urgent",
          label: `Fertilize ${getPlantDisplayName(plant)}`,
          emoji: "🌱",
          action: () =>
            navigate(`/log-care?plantId=${plant.id}&type=fertilize`),
          variant: "primary",
          isContextual: true,
        });
      }
    }

    // Standard actions (always available)
    const standardActions: QuickAction[] = [
      {
        id: "log-care",
        label: "Log Care",
        emoji: "💧",
        action: () => navigate("/log-care"),
        variant: "outline",
      },
      {
        id: "take-photo",
        label: "Take Photo",
        emoji: "📸",
        action: () => navigate("/log-care?type=observe"),
        variant: "outline",
      },
      {
        id: "analytics",
        label: "Analytics",
        emoji: "📊",
        action: () => navigate("/analytics"),
        variant: "outline",
      },
    ];

    return [...actions, ...standardActions];
  };

  const handleQuickComplete = async (
    taskId: string,
    values: QuickCompletionValues
  ) => {
    try {
      const task = taskGroups
        .flatMap((group) => group.tasks)
        .find((t) => t.id === taskId);

      if (!task) throw new Error("Task not found");

      const taskType = getTaskTypeFromName(task.task);

      let careDetails: WateringDetails | FertilizingDetails;

      if (taskType === "water") {
        careDetails = {
          type: "water" as const,
          amount: {
            value: values.waterValue || 0,
            unit:
              (values.waterUnit as
                | "oz"
                | "ml"
                | "cups"
                | "liters"
                | "gallons") || "oz",
          },
          notes: `Quick completion: ${values.waterValue}${values.waterUnit}`,
        };
      } else {
        careDetails = {
          type: "fertilize" as const,
          product: values.product || "",
          dilution: values.dilution || "",
          amount: values.amount || "",
          notes: `Quick completion: ${values.product}`,
        };
      }

      const careData = {
        plantId: task.plantId,
        type: taskType,
        date: new Date(),
        details: careDetails,
        updatedAt: new Date(),
      };

      await careService.addCareActivity(careData);
      await loadDashboardData();

      console.log("Task completed successfully!");
    } catch (error) {
      console.error("Failed to complete task:", error);
      throw error;
    }
  };

  const handleBypass = async (taskId: string, reason: string) => {
    try {
      setIsLoading(true);

      // Find the task being bypassed
      const task = allTasks.find((t) => t.id === taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Log the bypass with pattern analysis
      await BypassAnalysisService.logBypass(
        taskId,
        task.plantId,
        getTaskTypeFromName(task.task),
        reason,
        task.dueDate,
        task.plantStage as GrowthStage
      );

      // Reload dashboard data
      await loadDashboardData();

      toast.success("Task bypassed. Your preferences are being learned.");
    } catch (error) {
      console.error("Failed to bypass task:", error);
      toast.error("Failed to bypass task");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingFirstTime) {
    return <div>Loading...</div>;
  }

  if (isFirstTime) {
    return <Welcome />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading your garden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={() => loadDashboardData()} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold mb-4">Welcome to SmartGarden!</h2>
        <p className="text-muted-foreground mb-6">
          You don't have any plants yet. Let's get started!
        </p>
        <Link to="/add-plant">
          <Button>Add Your First Plant</Button>
        </Link>
      </div>
    );
  }

  const quickActions = getQuickActions();

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Your Garden Dashboard
        </h1>
        <p className="text-muted-foreground" data-testid="active-plants-count">
          {plants.length} active plant{plants.length !== 1 ? "s" : ""} growing
          {taskGroups.reduce((total, group) => total + group.tasks.length, 0) >
            0 && (
            <span className="ml-2">
              •{" "}
              {taskGroups.reduce(
                (total, group) => total + group.tasks.length,
                0
              )}{" "}
              task
              {taskGroups.reduce(
                (total, group) => total + group.tasks.length,
                0
              ) !== 1
                ? "s"
                : ""}{" "}
              pending
            </span>
          )}
        </p>
      </div>

      {/* Task Groups */}
      <div className="space-y-4">
        {taskGroups.map((group) => (
          <TaskGroup
            key={group.type}
            group={group}
            onQuickComplete={handleQuickComplete}
            onBypass={handleBypass}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚡</span>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || "outline"}
                onClick={action.action}
                className={`h-20 flex-col gap-1 ${
                  action.isContextual
                    ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-800"
                    : ""
                }`}
              >
                <span className="text-2xl">{action.emoji}</span>
                <span className="text-sm text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            ))}
          </div>

          {/* Show contextual help text */}
          {quickActions.some((action) => action.isContextual) && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Green actions are suggested based on your urgent tasks
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
