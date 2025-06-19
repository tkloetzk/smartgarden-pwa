// src/__tests__/database/integration.test.ts
import {
  plantService,
  varietyService,
  careService,
} from "../../types/database";
import { initializeDatabase } from "../../db/seedData";

describe("Database Integration", () => {
  beforeEach(async () => {
    // Clear all tables
    const { db } = await import("../../types/database");
    await db.plants.clear();
    await db.varieties.clear();
    await db.careActivities.clear();
    await db.syncQueue.clear();
  });

  describe("Database initialization", () => {
    it("seeds varieties correctly", async () => {
      await initializeDatabase();

      const varieties = await varietyService.getAllVarieties();
      expect(varieties.length).toBeGreaterThan(0);
      expect(varieties.some((v) => v.name === "Little Finger Carrots")).toBe(
        true
      );
      expect(varieties.some((v) => v.name === "Astro Arugula")).toBe(true);
    });

    it("does not duplicate varieties on re-initialization", async () => {
      await initializeDatabase();
      const firstCount = (await varietyService.getAllVarieties()).length;

      await initializeDatabase(); // Run again
      const secondCount = (await varietyService.getAllVarieties()).length;

      expect(firstCount).toBe(secondCount);
    });
  });

  describe("Plant lifecycle", () => {
    beforeEach(async () => {
      await initializeDatabase();
    });

    it("creates plant with care activities", async () => {
      const varieties = await varietyService.getAllVarieties();
      const arugula = varieties.find((v) => v.name.includes("Arugula"));

      const plantId = await plantService.addPlant({
        varietyId: arugula!.id,
        name: "Test Arugula",
        plantedDate: new Date("2024-01-01"),
        currentStage: "seedling",
        location: "Test Location",
        container: "Test Container",
        isActive: true,
      });

      // Add care activity
      const careId = await careService.addCareActivity({
        plantId,
        type: "water",
        date: new Date("2024-01-02"),
        details: {
          amount: "200ml",
          moistureBefore: 3,
          moistureAfter: 7,
        },
      });

      // Verify relationships
      const plant = await plantService.getPlant(plantId);
      const careHistory = await careService.getPlantCareHistory(plantId);

      expect(plant).toBeDefined();
      expect(plant?.name).toBe("Test Arugula");
      expect(careHistory).toHaveLength(1);
      expect(careHistory[0].id).toBe(careId);
    });

    it("handles storage quota exceeded gracefully", async () => {
      // Mock storage quota exceeded
      const originalAdd = plantService.addPlant;
      plantService.addPlant = jest
        .fn()
        .mockRejectedValue(new Error("QuotaExceededError"));

      await expect(
        plantService.addPlant({
          varietyId: "test",
          plantedDate: new Date(),
          currentStage: "seedling",
          location: "test",
          container: "test",
          isActive: true,
        })
      ).rejects.toThrow("QuotaExceededError");

      // Restore
      plantService.addPlant = originalAdd;
    });
  });

  describe("Sync queue behavior", () => {
    it("queues operations correctly", async () => {
      const plantId = await plantService.addPlant({
        varietyId: "test-variety",
        plantedDate: new Date(),
        currentStage: "germination",
        location: "test",
        container: "test",
        isActive: true,
      });

      // Check sync queue was populated
      const { db } = await import("../../types/database");
      const queueItems = await db.syncQueue.toArray();

      expect(queueItems.length).toBeGreaterThan(0);
      expect(
        queueItems.some(
          (item) =>
            item.table === "plants" &&
            item.operation === "create" &&
            item.recordId === plantId
        )
      ).toBe(true);
    });

    it("queues care activity operations", async () => {
      // First add a plant
      const plantId = await plantService.addPlant({
        varietyId: "test-variety",
        plantedDate: new Date(),
        currentStage: "germination",
        location: "test",
        container: "test",
        isActive: true,
      });

      // Add care activity
      const careId = await careService.addCareActivity({
        plantId,
        type: "water",
        date: new Date(),
        details: {
          amount: "200ml",
        },
      });

      // Check sync queue
      const { db } = await import("../../types/database");
      const queueItems = await db.syncQueue.toArray();

      expect(queueItems.length).toBe(2); // One for plant, one for care activity
      expect(
        queueItems.some(
          (item) =>
            item.table === "careActivities" &&
            item.operation === "create" &&
            item.recordId === careId
        )
      ).toBe(true);
    });
  });
});
