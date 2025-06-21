// src/__tests__/services/taskGroupingService.test.ts
import { TaskGroupingService } from "@/services/taskGroupingService";
import { UpcomingTask, TaskGroup } from "@/types/scheduling";

describe("TaskGroupingService", () => {
  const createMockTask = (
    task: string,
    priority: "low" | "medium" | "high" = "medium"
  ): UpcomingTask => ({
    id: `task-${Date.now()}-${Math.random()}`,
    plantId: "test-plant-1",
    name: "Test Plant",
    task,
    dueIn: "Due in 2 days",
    plantStage: "vegetative",
    dueDate: new Date(),
    priority,
    canBypass: true,
  });

  describe("groupTasksByActivity", () => {
    it("groups watering tasks correctly", () => {
      const tasks = [
        createMockTask("Check water level"),
        createMockTask("Water plant"),
        createMockTask("Check moisture"),
      ];

      const groups = TaskGroupingService.groupTasksByActivity(tasks);
      const wateringGroup = groups.find((g) => g.type === "watering");

      expect(wateringGroup).toBeDefined();
      expect(wateringGroup!.tasks).toHaveLength(3);
      expect(wateringGroup!.title).toBe("Watering");
      expect(wateringGroup!.emoji).toBe("💧");
    });

    it("groups fertilizing tasks correctly", () => {
      const tasks = [
        createMockTask("Fertilize plant"),
        createMockTask("Feed with nutrients"),
      ];

      const groups = TaskGroupingService.groupTasksByActivity(tasks);
      const fertilizingGroup = groups.find((g) => g.type === "fertilizing");

      expect(fertilizingGroup!.tasks).toHaveLength(2);
      expect(fertilizingGroup!.title).toBe("Fertilizing");
      expect(fertilizingGroup!.emoji).toBe("🌱");
    });

    it("groups observation tasks correctly", () => {
      const tasks = [
        createMockTask("Health check"),
        createMockTask("Observe growth"),
        createMockTask("Check for pests"),
      ];

      const groups = TaskGroupingService.groupTasksByActivity(tasks);
      const observationGroup = groups.find((g) => g.type === "observation");

      expect(observationGroup!.tasks).toHaveLength(3);
      expect(observationGroup!.title).toBe("Health Checks");
      expect(observationGroup!.emoji).toBe("👁");
    });

    it("groups maintenance tasks correctly", () => {
      const tasks = [
        createMockTask("Prune leaves"),
        createMockTask("Transplant"),
        createMockTask("Clean pot"),
      ];

      const groups = TaskGroupingService.groupTasksByActivity(tasks);
      const maintenanceGroup = groups.find((g) => g.type === "maintenance");

      expect(maintenanceGroup!.tasks).toHaveLength(3);
      expect(maintenanceGroup!.title).toBe("Maintenance");
      expect(maintenanceGroup!.emoji).toBe("✂️");
      expect(maintenanceGroup!.isExpanded).toBe(false);
    });

    it("expands groups with high priority tasks", () => {
      const tasks = [
        createMockTask("Prune leaves", "high"),
        createMockTask("Transplant", "low"),
      ];

      const groups = TaskGroupingService.groupTasksByActivity(tasks);
      const maintenanceGroup = groups.find((g) => g.type === "maintenance");

      expect(maintenanceGroup!.isExpanded).toBe(true);
    });

    it("filters out empty groups", () => {
      const tasks = [createMockTask("Check water level")];

      const groups = TaskGroupingService.groupTasksByActivity(tasks);

      expect(groups).toHaveLength(1);
      expect(groups[0].type).toBe("watering");
    });

    it("handles empty task list", () => {
      const groups = TaskGroupingService.groupTasksByActivity([]);
      expect(groups).toHaveLength(0);
    });

    it("handles case insensitive task matching", () => {
      const tasks = [
        createMockTask("WATER plant"),
        createMockTask("fertilize PLANT"),
        createMockTask("HEALTH check"),
      ];

      const groups = TaskGroupingService.groupTasksByActivity(tasks);

      expect(groups).toHaveLength(3);
      expect(groups.find((g) => g.type === "watering")!.tasks).toHaveLength(1);
      expect(groups.find((g) => g.type === "fertilizing")!.tasks).toHaveLength(
        1
      );
      expect(groups.find((g) => g.type === "observation")!.tasks).toHaveLength(
        1
      );
    });
  });

  describe("shouldExpandGroup", () => {
    it("expands group with high priority tasks", () => {
      const group: TaskGroup = {
        type: "watering",
        title: "Watering",
        emoji: "💧",
        tasks: [createMockTask("Water", "high")],
        isExpanded: false,
      };

      expect(TaskGroupingService.shouldExpandGroup(group)).toBe(true);
    });

    it("expands group with overdue tasks", () => {
      const overdueTask = createMockTask("Water");
      overdueTask.dueIn = "overdue by 2 days";

      const group: TaskGroup = {
        type: "watering",
        title: "Watering",
        emoji: "💧",
        tasks: [overdueTask],
        isExpanded: false,
      };

      expect(TaskGroupingService.shouldExpandGroup(group)).toBe(true);
    });

    it("does not expand group with only low priority tasks", () => {
      const group: TaskGroup = {
        type: "watering",
        title: "Watering",
        emoji: "💧",
        tasks: [createMockTask("Water", "low")],
        isExpanded: false,
      };

      expect(TaskGroupingService.shouldExpandGroup(group)).toBe(false);
    });

    it("does not expand empty group", () => {
      const group: TaskGroup = {
        type: "watering",
        title: "Watering",
        emoji: "💧",
        tasks: [],
        isExpanded: false,
      };

      expect(TaskGroupingService.shouldExpandGroup(group)).toBe(false);
    });
  });
});
