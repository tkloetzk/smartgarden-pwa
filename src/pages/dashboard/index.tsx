// src/pages/dashboard/index.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { plantService, PlantRecord } from "@/types/database";
import { CareSchedulingService } from "@/services/careSchedulingService";
import { useDynamicStage } from "@/hooks/useDynamicStage";
import { UpcomingTask } from "@/types/scheduling";

function PlantStageDisplay({ plant }: { plant: PlantRecord }) {
  const calculatedStage = useDynamicStage(plant);

  return (
    <div className="text-sm font-medium text-gray-600 capitalize">
      Stage: {calculatedStage}
    </div>
  );
}

const Dashboard = () => {
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setError(null);

      const [plantsData, tasksData] = await Promise.all([
        plantService.getActivePlants(),
        CareSchedulingService.getUpcomingTasks(),
      ]);

      setPlants(plantsData);
      setUpcomingTasks(tasksData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setError("Failed to load plants");
    } finally {
      setIsLoading(false);
    }
  }

  // Helper function to get the display name for a plant
  function getPlantDisplayName(plant: PlantRecord): string {
    // If user gave it a custom name, use that
    if (plant.name) {
      return plant.name;
    }

    // Otherwise, use the stored variety name instead of formatting varietyId
    return plant.varietyName || "Unknown Plant";
  }

  // Helper function to map task priority to StatusBadge status
  function getTaskStatus(
    priority: "low" | "medium" | "high"
  ): "healthy" | "attention" | "critical" | "new" {
    switch (priority) {
      case "high":
        return "critical";
      case "medium":
        return "attention";
      case "low":
      default:
        return "healthy";
    }
  }

  function getDaysSincePlanting(plantedDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - plantedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌱</div>
          <div className="text-lg font-medium">Loading your garden...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚨</div>
          <div className="text-lg font-medium text-red-600 mb-4">{error}</div>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Show empty state when no plants exist
  if (plants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🌱</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Start Your Digital Garden
          </h1>
          <p className="text-gray-600 mb-8">
            Add your first plant to begin tracking its growth, scheduling care
            tasks, and building healthy growing habits.
          </p>
          <Link to="/add-plant">
            <Button className="w-full h-14 text-base">
              <span className="mr-2 text-xl">🌿</span>
              Add Your First Plant
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">My Smart Garden</h1>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div
              className="text-2xl font-bold"
              data-testid="active-plants-count"
            >
              {plants.length}
            </div>
            <div className="text-sm opacity-90">Active Plants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" data-testid="tasks-due-count">
              {upcomingTasks.length}
            </div>
            <div className="text-sm opacity-90">Tasks Due</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Today's Tasks */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold flex items-center">
              <span className="mr-2 text-2xl">📋</span>
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✅</div>
                <div className="font-medium text-gray-600">All caught up!</div>
                <div className="text-sm text-gray-500">No tasks due today</div>
              </div>
            ) : (
              <>
                {upcomingTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-1">
                        {task.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {task.task}
                      </div>
                      <StatusBadge
                        status={getTaskStatus(task.priority)}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
                {upcomingTasks.length > 3 && (
                  <Link to="/plants" className="block">
                    <Button variant="outline" className="w-full">
                      View All Tasks ({upcomingTasks.length})
                    </Button>
                  </Link>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Plants */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold flex items-center">
              <span className="mr-2 text-2xl">🌿</span>
              Recent Plants
            </CardTitle>
          </CardHeader>
          <CardContent
            className="space-y-3"
            data-testid="recent-plants-content"
          >
            {plants.slice(0, 3).map((plant) => (
              <div
                key={plant.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-100"
              >
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">
                    {getPlantDisplayName(plant)}
                  </div>
                  <PlantStageDisplay plant={plant} />

                  <StatusBadge status="healthy" size="sm" />
                </div>
                <div className="text-right">
                  <div className="text-4xl mb-2">🌿</div>
                  <div className="text-xs font-semibold text-gray-500">
                    {getDaysSincePlanting(plant.plantedDate)} days
                  </div>
                </div>
              </div>
            ))}
            <Link to="/plants" className="block">
              <Button variant="outline" className="w-full">
                View All Plants →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to="/add-plant">
            <Button className="w-full h-14 text-base" variant="outline">
              <span className="mr-2 text-xl">➕</span>
              Add Plant
            </Button>
          </Link>
          <Link to="/log-care">
            <Button className="w-full h-14 text-base">
              <span className="mr-2 text-xl">💧</span>
              Log Care
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
