import { ApplicationMethod } from "@/types";

/**
 * Gets the most relevant fertilization tasks for a single plant
 * Prioritizes overdue tasks, then upcoming tasks
 */
export const getRelevantFertilizationTasksForPlant = (
  allTasks: any[],
  currentDate: Date
) => {
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
};

export const getMethodIcon = (method: ApplicationMethod | string) => {
  switch (method) {
    case "soil-drench":
      return "💧";
    case "foliar-spray":
      return "🌿";
    case "top-dress":
      return "🥄";
    case "side-dress":
      return "🔄";
    default:
      return "🌱";
  }
};

export const getMethodDisplay = (method: ApplicationMethod | string) => {
  switch (method) {
    case "soil-drench":
      return "Soil Drench";
    case "foliar-spray":
      return "Foliar Spray";
    case "top-dress":
      return "Top Dress";
    case "side-dress":
      return "Side Dress";
    default:
      return method;
  }
};

export const getMethodDescription = (method: ApplicationMethod | string) => {
  switch (method) {
    case "soil-drench":
      return "Apply diluted fertilizer solution directly to soil, watering thoroughly";
    case "foliar-spray":
      return "Spray diluted fertilizer directly onto leaves and stems";
    case "top-dress":
      return "Sprinkle dry fertilizer on soil surface and work in lightly";
    case "side-dress":
      return "Apply fertilizer around the base of the plant, avoiding direct contact with stems";
    default:
      return "Follow fertilizer package instructions";
  }
};

export const requiresWater = (_method: ApplicationMethod | string): boolean => {
  // All fertilizer application methods require water
  // Liquid methods: soil-drench and foliar-spray use water directly
  // Granular methods: top-dress and side-dress need to be watered in
  return true;
};

export const getWaterAmountForMethod = (method: ApplicationMethod | string, fertilizerAmount?: number): { amount: number; unit: string } => {
  // Default water amounts based on application method
  switch (method) {
    case "soil-drench":
      // Soil drench typically uses more water to thoroughly wet soil
      return { amount: fertilizerAmount || 250, unit: "ml" };
    case "foliar-spray":
      // Foliar spray uses less water as it's applied to leaves
      return { amount: fertilizerAmount || 100, unit: "ml" };
    case "top-dress":
    case "side-dress":
      // Granular fertilizers need water to activate and wash into soil
      return { amount: fertilizerAmount || 200, unit: "ml" };
    default:
      return { amount: fertilizerAmount || 150, unit: "ml" };
  }
};
