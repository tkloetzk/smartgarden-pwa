// src/services/taskGroupingService.ts

import { UpcomingTask, TaskGroup } from "@/types/scheduling";

export class TaskGroupingService {
  static groupTasksByActivity(tasks: UpcomingTask[]): TaskGroup[] {
    const groups: TaskGroup[] = [
      {
        type: "watering",
        title: "Watering",
        emoji: "💧",
        tasks: [],
        isExpanded: true, // Always expand critical tasks
      },
      {
        type: "fertilizing",
        title: "Fertilizing",
        emoji: "🌱",
        tasks: [],
        isExpanded: true,
      },
      {
        type: "observation",
        title: "Health Checks",
        emoji: "👁",
        tasks: [],
        isExpanded: true,
      },
      {
        type: "maintenance",
        title: "Maintenance",
        emoji: "✂️",
        tasks: [],
        isExpanded: false, // Start collapsed for non-critical
      },
    ];

    // Categorize tasks
    tasks.forEach((task) => {
      const taskName = task.task.toLowerCase();

      if (taskName.includes("water") || taskName.includes("moisture")) {
        groups[0].tasks.push(task);
      } else if (taskName.includes("fertiliz") || taskName.includes("feed")) {
        groups[1].tasks.push(task);
      } else if (
        taskName.includes("observe") ||
        taskName.includes("health") ||
        taskName.includes("check")
      ) {
        groups[2].tasks.push(task);
      } else {
        groups[3].tasks.push(task);
      }
    });

    // Auto-expand groups with high priority tasks
    groups.forEach((group) => {
      const hasHighPriority = group.tasks.some(
        (task) => task.priority === "high"
      );
      if (hasHighPriority) {
        group.isExpanded = true;
      }
    });

    // Filter out empty groups
    return groups.filter((group) => group.tasks.length > 0);
  }

  static shouldExpandGroup(group: TaskGroup): boolean {
    // Expand if has overdue or high priority tasks
    return group.tasks.some(
      (task) => task.priority === "high" || task.dueIn.includes("overdue")
    );
  }
}
