// src/pages/catch-up/index.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useAllUpcomingTasks } from "@/hooks/useAllUpcomingTasks";
import { useTaskProcessing } from "@/hooks/useTaskProcessing";
import { ArrowLeft, Filter, X } from "lucide-react";

export const CatchUpPage = () => {
  const navigate = useNavigate();
  const { plants, loading: plantsLoading } = useFirebasePlants();

  // Use shared task hooks
  const {
    careTasks,
    fertilizationTasks,
    loading: tasksLoading,
    error,
  } = useAllUpcomingTasks();
  const { allProcessedTasks: upcomingTasks } = useTaskProcessing({
    plants: plants || [],
    fertilizationTasks,
    careTasks,
    includeGrouping: true,
  });

  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [varietyFilter, setVarietyFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Calculate combined loading state
  const loading = plantsLoading || tasksLoading;
  
  // Check if we're still processing tasks (race condition fix)
  const isProcessing = !loading && plants?.length > 0 && upcomingTasks.length === 0;

  // Filtered tasks and filter options
  const filteredTasks = useMemo(() => {
    let filtered = upcomingTasks;

    if (activityFilter !== "all") {
      filtered = filtered.filter((task) =>
        task.task.toLowerCase().includes(activityFilter.toLowerCase())
      );
    }

    if (varietyFilter !== "all") {
      filtered = filtered.filter((task) => task.plantName === varietyFilter);
    }

    return filtered;
  }, [upcomingTasks, activityFilter, varietyFilter]);

  // Get all possible activity types (not just from current tasks)
  const activityTypes = useMemo(() => {
    const types = new Set<string>();

    // Add types from current tasks
    upcomingTasks.forEach((task) => {
      if (task.task.toLowerCase().includes("water")) types.add("water");
      else if (task.task.toLowerCase().includes("fertiliz"))
        types.add("fertilize");
      else if (task.task.toLowerCase().includes("observ")) types.add("observe");
      else if (task.task.toLowerCase().includes("prune")) types.add("prune");
      else types.add("other");
    });

    // Always include common activity types even if no current tasks
    const commonTypes = ["water", "fertilize", "observe", "prune"];
    commonTypes.forEach((type) => types.add(type));

    return Array.from(types).sort();
  }, [upcomingTasks]);

  const varietyTypes = useMemo(() => {
    const varieties = new Set(upcomingTasks.map((task) => task.plantName));
    return Array.from(varieties).sort();
  }, [upcomingTasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate("/")} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Catch-Up Tasks
              </h1>
              <p className="text-muted-foreground">
                Loading your plant care tasks...
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Catch-Up Tasks
            </h1>
            <p className="text-muted-foreground">
              Review and handle missed care activities for your plants
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        {upcomingTasks.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(activityFilter !== "all" || varietyFilter !== "all") && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {[
                      activityFilter !== "all" ? 1 : 0,
                      varietyFilter !== "all" ? 1 : 0,
                    ].reduce((a, b) => a + b)}
                  </span>
                )}
              </Button>

              {(activityFilter !== "all" || varietyFilter !== "all") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setActivityFilter("all");
                    setVarietyFilter("all");
                  }}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear Filters
                </Button>
              )}

              <span className="text-sm text-muted-foreground">
                Showing {filteredTasks.length} of {upcomingTasks.length} tasks
              </span>
            </div>

            {showFilters && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Activity Type
                      </label>
                      <select
                        value={activityFilter}
                        onChange={(e) => setActivityFilter(e.target.value)}
                        className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                      >
                        <option value="all">All Activities</option>
                        {activityTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Plant Variety
                      </label>
                      <select
                        value={varietyFilter}
                        onChange={(e) => setVarietyFilter(e.target.value)}
                        className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                      >
                        <option value="all">All Varieties</option>
                        {varietyTypes.map((variety) => (
                          <option key={variety} value={variety}>
                            {variety}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">Error loading tasks: {error}</p>
            </CardContent>
          </Card>
        ) : !loading &&
          !isProcessing &&
          filteredTasks.length === 0 &&
          upcomingTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                Your plants are well taken care of. No immediate actions needed.
              </p>
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No Matching Tasks</h3>
              <p className="text-muted-foreground">
                No tasks match your current filters. Try adjusting your filter
                criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task, i) => (
              <Card
                key={task.id}
                data-testid={`catch-up-task-card-${i}`}
                className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">
                          {task.plantName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            {
                              overdue:
                                "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
                              high: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
                              medium:
                                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
                              low: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
                            }[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="text-muted-foreground mb-2">
                        <strong className="text-foreground">{task.task}</strong>{" "}
                        - {task.dueIn}
                      </p>

                      <div className="text-sm text-muted-foreground">
                        Growth Stage:{" "}
                        <span className="text-foreground">
                          {task.plantStage}
                        </span>{" "}
                        | Category:{" "}
                        <span className="text-foreground">{task.category}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {task.plantId.startsWith("group_") ||
                      task.plantId.startsWith("section_") ? (
                        // For grouped tasks, show bulk care logging option
                        <>
                          <Button
                            onClick={() => {
                              // Find plants that match the group key
                              const groupPlants = plants?.filter((plant) => {
                                const plantedDateStr = plant.plantedDate
                                  .toISOString()
                                  .split("T")[0];
                                const location = plant.location || "unknown";
                                const soilMix = plant.soilMix || "default";
                                const hasSection =
                                  plant.section || plant.structuredSection;

                                let expectedGroupKey: string;
                                if (hasSection) {
                                  expectedGroupKey = `section_${
                                    plant.container
                                  }_${plant.varietyName}_${
                                    plant.section || "section"
                                  }_${plantedDateStr}`;
                                } else {
                                  expectedGroupKey = `group_${plant.varietyName}_${plant.container}_${plantedDateStr}_${location}_${soilMix}`;
                                }

                                return task.plantId === expectedGroupKey;
                              });

                              if (groupPlants && groupPlants.length > 0) {
                                // Navigate to log care page with first plant pre-selected and activity type
                                const activityType =
                                  task.type === "observe"
                                    ? "observe"
                                    : task.type === "water"
                                    ? "water"
                                    : task.type === "fertilize"
                                    ? "fertilize"
                                    : task.type === "pruning"
                                    ? "pruning"
                                    : "observe";

                                const params = new URLSearchParams();
                                params.set("plantId", groupPlants[0].id);
                                params.set("activityType", activityType);
                                params.set("groupTask", "true"); // Indicate this is for a group

                                // For fertilization tasks, also pass the product
                                if (task.type === "fertilize" && task.product) {
                                  params.set("product", task.product);
                                }

                                navigate(`/log-care?${params.toString()}`);
                              } else {
                                console.error(
                                  "Could not find plants for group:",
                                  task.plantId
                                );
                                alert(
                                  "Could not find plants for this group. Please try logging care for individual plants."
                                );
                              }
                            }}
                            size="sm"
                          >
                            Log Group Care
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              // Find plants that match the group key
                              const groupPlants = plants?.filter((plant) => {
                                const plantedDateStr = plant.plantedDate
                                  .toISOString()
                                  .split("T")[0];
                                const location = plant.location || "unknown";
                                const soilMix = plant.soilMix || "default";
                                const hasSection =
                                  plant.section || plant.structuredSection;

                                let expectedGroupKey: string;
                                if (hasSection) {
                                  expectedGroupKey = `section_${
                                    plant.container
                                  }_${plant.varietyName}_${
                                    plant.section || "section"
                                  }_${plantedDateStr}`;
                                } else {
                                  expectedGroupKey = `group_${plant.varietyName}_${plant.container}_${plantedDateStr}_${location}_${soilMix}`;
                                }

                                return task.plantId === expectedGroupKey;
                              });

                              if (groupPlants && groupPlants.length > 0) {
                                // Navigate to the first plant's detail page
                                navigate(`/plants/${groupPlants[0].id}`);
                              } else {
                                console.error(
                                  "Could not find plants for group:",
                                  task.plantId
                                );
                                alert("Could not find plants for this group.");
                              }
                            }}
                            size="sm"
                          >
                            View Group
                          </Button>
                        </>
                      ) : (
                        // For individual plant tasks, use existing navigation
                        <>
                          <Button
                            onClick={() => {
                              const activityType =
                                task.type === "observe"
                                  ? "observe"
                                  : task.type === "water"
                                  ? "water"
                                  : task.type === "fertilize"
                                  ? "fertilize"
                                  : task.type === "pruning"
                                  ? "pruning"
                                  : "observe";

                              const params = new URLSearchParams();
                              params.set("plantId", task.plantId);
                              params.set("activityType", activityType);

                              // For fertilization tasks, also pass the product
                              if (task.type === "fertilize" && task.product) {
                                console.log(
                                  "Setting product param:",
                                  task.product
                                );
                                params.set("product", task.product);
                              }

                              navigate(`/log-care?${params.toString()}`);
                            }}
                            size="sm"
                          >
                            Log Care
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/plants/${task.plantId}`)}
                            size="sm"
                          >
                            View Plant
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatchUpPage;
