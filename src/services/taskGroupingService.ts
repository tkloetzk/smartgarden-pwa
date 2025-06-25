import { UpcomingTask, TaskGroup } from "@/types/scheduling";

export class TaskGroupingService {
  static groupTasksByActivity(tasks: UpcomingTask[]): TaskGroup[] {
    const groups: TaskGroup[] = [
      {
        type: "watering",
        title: "Watering",
        emoji: "💧",
        tasks: [],
        isExpanded: false,
      },
      {
        type: "fertilizing",
        title: "Fertilizing",
        emoji: "🌱",
        tasks: [],
        isExpanded: false,
      },
      {
        type: "observation",
        title: "Health Checks",
        emoji: "👁",
        tasks: [],
        isExpanded: false,
      },
      {
        type: "maintenance",
        title: "Maintenance",
        emoji: "✂️",
        tasks: [],
        isExpanded: false,
      },
    ];

    tasks.forEach((task) => {
      const taskLower = task.task.toLowerCase();

      if (this.isWateringTask(taskLower)) {
        groups.find((g) => g.type === "watering")?.tasks.push(task);
      } else if (this.isFertilizingTask(taskLower)) {
        groups.find((g) => g.type === "fertilizing")?.tasks.push(task);
      } else if (this.isObservationTask(taskLower)) {
        groups.find((g) => g.type === "observation")?.tasks.push(task);
      } else if (this.isMaintenanceTask(taskLower)) {
        groups.find((g) => g.type === "maintenance")?.tasks.push(task);
      }
    });

    // Filter out empty groups and set expanded state for important groups
    const nonEmptyGroups = groups.filter((group) => group.tasks.length > 0);

    nonEmptyGroups.forEach((group) => {
      group.isExpanded = this.shouldExpandGroup(group);
    });

    return nonEmptyGroups;
  }

  static shouldExpandGroup(group: TaskGroup): boolean {
    if (group.tasks.length === 0) return false;

    // Expand if any task is high priority
    if (group.tasks.some((task) => task.priority === "high")) {
      return true;
    }

    // Expand if any task is overdue
    if (group.tasks.some((task) => task.dueIn.includes("overdue"))) {
      return true;
    }

    return false;
  }

  private static isWateringTask(taskLower: string): boolean {
    return taskLower.includes("water") || taskLower.includes("moisture");
  }

  private static isFertilizingTask(taskLower: string): boolean {
    return (
      taskLower.includes("fertilize") ||
      taskLower.includes("feed") ||
      taskLower.includes("nutrient")
    );
  }

  private static isObservationTask(taskLower: string): boolean {
    return (
      taskLower.includes("health") ||
      taskLower.includes("check") ||
      taskLower.includes("observe") ||
      taskLower.includes("pest")
    );
  }

  private static isMaintenanceTask(taskLower: string): boolean {
    return (
      taskLower.includes("prune") ||
      taskLower.includes("transplant") ||
      taskLower.includes("clean") ||
      taskLower.includes("trim")
    );
  }
}
