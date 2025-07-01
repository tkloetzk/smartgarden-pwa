// In: src/__tests__/services/careSchedulingService.test.ts

import { CareSchedulingService } from "@/services/careSchedulingService";
import { plantService, varietyService, VarietyRecord } from "@/types/database";
import {
  initializeDatabase,
  resetDatabaseInitializationFlag,
} from "../../db/seedData";
import { subDays } from "date-fns";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";

jest.mock("@/hooks/useFirebasePlants");

describe("CareSchedulingService", () => {
  let testVariety: VarietyRecord;

  beforeEach(async () => {
    // ✅ Don't use fake timers during setup - it interferes with async operations
    resetDatabaseInitializationFlag();

    (useFirebasePlants as jest.Mock).mockClear();

    const { db } = await import("@/types/database");
    await db.plants.clear();
    await db.varieties.clear();
    await initializeDatabase();

    const variety = await varietyService.getVarietyByName("Astro Arugula");
    if (!variety) {
      throw new Error(
        "Test setup failed: Could not find 'Astro Arugula' seed variety."
      );
    }
    testVariety = variety;
  });

  afterEach(() => {
    // ✅ Only restore timers if a test used them
    jest.useRealTimers();
  });

  describe("Reminder Filtering", () => {
    it("filters tasks based on reminder preferences", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-01"));
      const plantWithSelectiveReminders = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10),
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
        reminderPreferences: {
          watering: false,
          fertilizing: true,
          observation: true,
          lighting: false,
          pruning: true,
        },
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();
      const plantTasks = tasks.filter(
        (task) => task.plantId === plantWithSelectiveReminders
      );
      const wateringTasks = plantTasks.filter((task) =>
        task.task.toLowerCase().includes("water")
      );
      const observationTasks = plantTasks.filter((task) =>
        task.task.toLowerCase().includes("health")
      );

      expect(wateringTasks).toHaveLength(0);
      expect(observationTasks.length).toBeGreaterThan(0);
      jest.useRealTimers(); // Clean up at end of test
    });

    it("shows all tasks when no reminder preferences are set", async () => {
      const plantWithoutPreferences = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10),
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      const tasks = await CareSchedulingService.getUpcomingTasks();
      const plantTasks = tasks.filter(
        (task) => task.plantId === plantWithoutPreferences
      );

      expect(plantTasks.length).toBeGreaterThan(0);
      const hasWateringTask = plantTasks.some((task) =>
        task.task.toLowerCase().includes("water")
      );
      const hasObservationTask = plantTasks.some((task) =>
        task.task.toLowerCase().includes("health")
      );
      expect(hasWateringTask).toBe(true);
      expect(hasObservationTask).toBe(true);
    });

    // This test was failing because testVariety was undefined. Now it's guaranteed to exist.
    it("handles plants with all reminders disabled", async () => {
      const plantWithNoReminders = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        plantedDate: subDays(new Date(), 10),
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
      const plantTasks = tasks.filter(
        (task) => task.plantId === plantWithNoReminders
      );
      expect(plantTasks).toHaveLength(0);
    });
  });

  // All other tests will now work because `testVariety` is reliably defined.
  // No further changes are needed for the other test cases.
});
