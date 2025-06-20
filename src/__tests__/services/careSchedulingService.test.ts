// src/__tests__/services/careSchedulingService.test.ts
import { CareSchedulingService } from "@/services/careSchedulingService";
import { plantService, varietyService } from "@/types/database";
import { initializeDatabase } from "@/db/seedData";
import { subDays } from "date-fns";

describe("CareSchedulingService", () => {
  beforeEach(async () => {
    // Clear and reinitialize database before each test
    const { db } = await import("@/types/database");
    await db.plants.clear();
    await db.varieties.clear();
    await db.careActivities.clear();
    await initializeDatabase();
  });

  describe("Reminder Filtering", () => {
    it("filters tasks based on reminder preferences", async () => {
      // Get a real variety from the seeded data
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0]; // Use first available variety

      // Create plant with selective reminder preferences
      // Use subDays to create a plant old enough to have due tasks
      const plantWithSelectiveReminders = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10), // 10 days old to ensure tasks are due
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
        reminderPreferences: {
          watering: false, // Disabled
          fertilizing: true,
          observation: true, // Enabled
          lighting: false, // Disabled
          pruning: true,
        },
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Filter tasks for our specific plant
      const plantTasks = tasks.filter(
        (task) => task.plantId === plantWithSelectiveReminders
      );

      // Should not include watering tasks since watering reminders are disabled
      const wateringTasks = plantTasks.filter(
        (task) =>
          task.task.toLowerCase().includes("water") ||
          task.task === "Check water level"
      );

      expect(wateringTasks).toHaveLength(0);

      // Should include observation tasks since those are enabled
      const observationTasks = plantTasks.filter(
        (task) =>
          task.task === "Health check" ||
          task.task.toLowerCase().includes("observe")
      );

      // For a 10-day old plant, observation should be due (first at day 3, so 7 days overdue)
      expect(observationTasks.length).toBeGreaterThan(0);
    });

    it("shows all tasks when no reminder preferences are set", async () => {
      // Get a real variety from the seeded data
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create plant without reminder preferences
      const plantWithoutPreferences = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10), // 10 days old
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
        // No reminderPreferences property - should default to showing all
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Should include tasks since no preferences means show all
      const plantTasks = tasks.filter(
        (task) => task.plantId === plantWithoutPreferences
      );
      expect(plantTasks.length).toBeGreaterThan(0);

      // Should have both watering and observation tasks
      const hasWateringTask = plantTasks.some(
        (task) =>
          task.task.toLowerCase().includes("water") ||
          task.task === "Check water level"
      );
      const hasObservationTask = plantTasks.some(
        (task) =>
          task.task === "Health check" ||
          task.task.toLowerCase().includes("observe")
      );

      expect(hasWateringTask).toBe(true);
      expect(hasObservationTask).toBe(true);
    });

    it("handles plants with all reminders disabled", async () => {
      // Get a real variety from the seeded data
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create plant with all reminders disabled
      const plantWithNoReminders = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
        reminderPreferences: {
          watering: false,
          fertilizing: false,
          observation: false,
          lighting: false,
          pruning: false,
        },
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Should have no tasks for this plant since all reminders are disabled
      const plantTasks = tasks.filter(
        (task) => task.plantId === plantWithNoReminders
      );
      expect(plantTasks).toHaveLength(0);
    });
  });

  describe("Task Creation", () => {
    it("creates observation tasks for plants old enough", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create a plant that's 5 days old (observation due at day 3, so 2 days overdue)
      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 5),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
        reminderPreferences: {
          watering: true,
          fertilizing: true,
          observation: true,
          lighting: true,
          pruning: true,
        },
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();
      const plantTasks = tasks.filter((task) => task.plantId === plantId);

      // Should have at least one observation task
      const observationTasks = plantTasks.filter(
        (task) => task.task === "Health check"
      );

      expect(observationTasks.length).toBeGreaterThan(0);

      // The task should indicate it's overdue
      const observationTask = observationTasks[0];
      expect(observationTask.dueIn).toContain("overdue");
      expect(observationTask.priority).toBe("high"); // Should be high priority since overdue
    });

    it("creates watering tasks for plants that need water", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create a plant that's 5 days old (seedling stage, watering every 2 days)
      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 5),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
        reminderPreferences: {
          watering: true,
          fertilizing: true,
          observation: true,
          lighting: true,
          pruning: true,
        },
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();
      const plantTasks = tasks.filter((task) => task.plantId === plantId);

      // Should have watering task
      const wateringTasks = plantTasks.filter(
        (task) => task.task === "Check water level"
      );

      expect(wateringTasks.length).toBeGreaterThan(0);
    });
  });
});
