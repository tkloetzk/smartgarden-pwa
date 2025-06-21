// src/__tests__/utils/plantFactory.test.ts
import {
  createMockPlant,
  createMockCareRecord,
  createMockVariety,
  createWateringDetails,
  createFertilizingDetails,
  createPlantWithHistory,
  createMultiplePlantsWithTasks,
  createPlantAtStage,
  createMockArugula,
} from "./plantFactory";

describe("Plant Factory", () => {
  describe("createMockPlant", () => {
    it("creates a plant with default values", () => {
      const plant = createMockPlant();

      expect(plant.id).toMatch(/^plant-/);
      expect(plant.varietyName).toBe("Test Variety");
      expect(plant.currentStage).toBe("vegetative");
      expect(plant.isActive).toBe(true);
      expect(plant.reminderPreferences).toBeDefined();
      expect(plant.createdAt).toBeInstanceOf(Date);
      expect(plant.updatedAt).toBeInstanceOf(Date);
    });

    it("accepts overrides", () => {
      const plant = createMockPlant({
        name: "Custom Plant Name",
        currentStage: "flowering",
        isActive: false,
      });

      expect(plant.name).toBe("Custom Plant Name");
      expect(plant.currentStage).toBe("flowering");
      expect(plant.isActive).toBe(false);
    });
  });

  describe("createMockCareRecord", () => {
    it("creates a watering record by default", () => {
      const plantId = "test-plant-123";
      const careRecord = createMockCareRecord(plantId);

      expect(careRecord.plantId).toBe(plantId);
      expect(careRecord.type).toBe("water");
      expect(careRecord.details.type).toBe("water");
      expect(careRecord.id).toMatch(/^care-/);
    });

    it("creates different activity types", () => {
      const plantId = "test-plant-123";

      const waterRecord = createMockCareRecord(plantId, "water");
      const fertilizeRecord = createMockCareRecord(plantId, "fertilize");
      const observeRecord = createMockCareRecord(plantId, "observe");

      expect(waterRecord.type).toBe("water");
      expect(fertilizeRecord.type).toBe("fertilize");
      expect(observeRecord.type).toBe("observe");
    });
  });

  describe("createMockVariety", () => {
    it("creates a variety with growth timeline", () => {
      const variety = createMockVariety();

      expect(variety.name).toBe("Test Variety");
      expect(variety.category).toBe("leafy-greens");
      expect(variety.growthTimeline.germination).toBe(7);
      expect(variety.growthTimeline.maturation).toBe(45);
      expect(variety.isCustom).toBe(false);
    });
  });

  describe("specialized plant factories", () => {
    it("creates arugula with correct defaults", () => {
      const arugula = createMockArugula();

      expect(arugula.varietyName).toBe("Arugula");
      expect(arugula.name).toBe("My Arugula");
      expect(arugula.container).toBe("4 inch pot");
    });
  });

  describe("utility factories", () => {
    it("creates plant with care history", () => {
      const { plant, careHistory } = createPlantWithHistory({}, 5);

      expect(plant).toBeDefined();
      expect(careHistory).toHaveLength(5);
      expect(careHistory.every((record) => record.plantId === plant.id)).toBe(
        true
      );

      // Should be in chronological order (most recent first)
      for (let i = 1; i < careHistory.length; i++) {
        expect(careHistory[i - 1].date.getTime()).toBeGreaterThanOrEqual(
          careHistory[i].date.getTime()
        );
      }
    });

    it("creates multiple plants with tasks", () => {
      const { plants, tasks } = createMultiplePlantsWithTasks(3);

      expect(plants).toHaveLength(3);
      expect(tasks.length).toBeGreaterThanOrEqual(6); // At least 2 tasks per plant

      // All tasks should reference existing plants
      const plantIds = plants.map((p) => p.id);
      expect(tasks.every((task) => plantIds.includes(task.plantId))).toBe(true);
    });

    it("creates plants at specific growth stages", () => {
      const germinationPlant = createPlantAtStage("germination");
      const vegetativePlant = createPlantAtStage("vegetative");

      expect(germinationPlant.currentStage).toBe("germination");
      expect(vegetativePlant.currentStage).toBe("vegetative");

      // Vegetative plant should be planted longer ago than germination plant
      expect(vegetativePlant.plantedDate.getTime()).toBeLessThan(
        germinationPlant.plantedDate.getTime()
      );
    });
  });

  describe("care detail factories", () => {
    it("creates watering details with moisture readings", () => {
      const details = createWateringDetails();

      expect(details.type).toBe("water");
      expect(details.amount.value).toBe(16);
      expect(details.amount.unit).toBe("oz");
      expect(details.moistureReading?.before).toBe(3);
      expect(details.moistureReading?.after).toBe(7);
    });

    it("creates fertilizing details with product info", () => {
      const details = createFertilizingDetails();

      expect(details.type).toBe("fertilize");
      expect(details.product).toBe("General Purpose 10-10-10");
      expect(details.dilution).toBe("1:4");
      expect(details.amount).toBe("2 tbsp");
    });
  });
});
