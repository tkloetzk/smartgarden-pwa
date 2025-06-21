// src/__tests__/services/careSchedulingService.test.ts
import { CareSchedulingService } from "@/services/careSchedulingService";
import { plantService, varietyService, careService } from "@/types/database";
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
  describe.only("getUpcomingTasks Edge Cases", () => {
    it("handles plants with no variety data gracefully", async () => {
      // Create a plant with invalid variety ID
      const orphanedPlant = await plantService.addPlant({
        varietyId: "non-existent-variety",
        varietyName: "Unknown Variety",
        plantedDate: subDays(new Date(), 5),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Should not include tasks for plants with missing variety data
      const orphanedPlantTasks = tasks.filter(
        (task) => task.plantId === orphanedPlant
      );
      expect(orphanedPlantTasks).toHaveLength(0);
    });
    it("correctly prioritizes overdue vs upcoming tasks", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create plants with different care scenarios
      const recentPlant = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 1), // Very recent
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      const overduePlant = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10), // Older, likely overdue
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      // Add a watering log that makes one plant overdue
      await careService.addCareActivity({
        plantId: overduePlant,
        type: "water",
        date: subDays(new Date(), 5), // 5 days ago
        details: {
          type: "water",
          amount: { value: 8, unit: "oz" },
        },
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Should sort by due date (overdue first)
      const sortedTasks = tasks.sort(
        (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
      );

      // Verify overdue tasks come first
      const overdueTasks = sortedTasks.filter((task) =>
        task.dueIn.includes("overdue")
      );
      const upcomingTasks = sortedTasks.filter(
        (task) => !task.dueIn.includes("overdue")
      );

      if (overdueTasks.length > 0 && upcomingTasks.length > 0) {
        expect(overdueTasks[0].dueDate.getTime()).toBeLessThanOrEqual(
          upcomingTasks[0].dueDate.getTime()
        );
      }
    });
    it("respects reminder preferences filtering", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const plantWithSelectivePrefs = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 8),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
        reminderPreferences: {
          watering: true,
          fertilizing: false,
          observation: false,
          lighting: false,
          pruning: false,
        },
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();
      const plantTasks = tasks.filter(
        (task) => task.plantId === plantWithSelectivePrefs
      );

      // Should only have watering tasks
      const wateringTasks = plantTasks.filter(
        (task) =>
          task.task.toLowerCase().includes("water") ||
          task.task === "Check water level"
      );
      const nonWateringTasks = plantTasks.filter(
        (task) =>
          !task.task.toLowerCase().includes("water") &&
          task.task !== "Check water level"
      );

      expect(wateringTasks.length).toBeGreaterThan(0);
      expect(nonWateringTasks).toHaveLength(0);
    });
    it("handles database errors gracefully", async () => {
      // Mock plantService to throw an error
      const originalGetActivePlants = plantService.getActivePlants;
      jest
        .spyOn(plantService, "getActivePlants")
        .mockRejectedValue(new Error("Database connection failed"));

      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Should return empty array instead of throwing
      expect(tasks).toEqual([]);

      // Restore original method
      plantService.getActivePlants = originalGetActivePlants;
    });

    it("handles plants with corrupt variety references", async () => {
      const varieties = await varietyService.getAllVarieties();
      const validVariety = varieties[0];

      // Create a plant with valid variety first
      const validPlant = await plantService.addPlant({
        varietyId: validVariety.id,
        varietyName: validVariety.name,
        plantedDate: subDays(new Date(), 5),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      // Mock varietyService.getVariety to return null for this specific plant
      const originalGetVariety = varietyService.getVariety;
      jest
        .spyOn(varietyService, "getVariety")
        .mockImplementation(async (id) => {
          if (id === validVariety.id) {
            return null; // Simulate corrupted variety data
          }
          return originalGetVariety(id);
        });

      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Should not crash and should handle the corrupted variety gracefully
      expect(Array.isArray(tasks)).toBe(true);

      // Should not include tasks for the plant with corrupted variety
      const corruptedPlantTasks = tasks.filter(
        (task) => task.plantId === validPlant
      );
      expect(corruptedPlantTasks).toHaveLength(0);

      // Restore original method
      varietyService.getVariety = originalGetVariety;
    });
    it("correctly calculates priority levels", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const testPlant = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      // Add care activities at different intervals to create different priorities
      await careService.addCareActivity({
        plantId: testPlant,
        type: "water",
        date: subDays(new Date(), 3), // Should be overdue
        details: {
          type: "water",
          amount: { value: 8, unit: "oz" },
        },
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();
      const plantTasks = tasks.filter((task) => task.plantId === testPlant);

      if (plantTasks.length > 0) {
        const wateringTask = plantTasks.find(
          (task) => task.task === "Check water level"
        );

        if (wateringTask) {
          // Should be high priority if 2+ days overdue
          if (wateringTask.dueIn.includes("overdue")) {
            const overdueDays = parseInt(
              wateringTask.dueIn.match(/\d+/)?.[0] || "0"
            );
            if (overdueDays >= 2) {
              expect(wateringTask.priority).toBe("high");
            } else if (overdueDays >= 0) {
              expect(wateringTask.priority).toBe("medium");
            }
          }
        }
      }
    });

    it("handles empty plant database", async () => {
      // Clear all plants
      await plantService.getActivePlants().then(async (plants) => {
        for (const plant of plants) {
          await plantService.deletePlant(plant.id);
        }
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();

      expect(tasks).toEqual([]);
    });
    it("handles inactive plants correctly", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      // Create an inactive plant
      const inactivePlant = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10),
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: false, // Inactive
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();

      // Should not include tasks for inactive plants
      const inactivePlantTasks = tasks.filter(
        (task) => task.plantId === inactivePlant
      );
      expect(inactivePlantTasks).toHaveLength(0);
    });
  });
});
