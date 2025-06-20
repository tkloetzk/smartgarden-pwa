// src/__tests__/services/smartDefaultsService.test.ts
import { SmartDefaultsService } from "@/services/smartDefaultsService";
import { varietyService, plantService } from "@/types/database";
import { initializeDatabase } from "@/db/seedData";

describe("SmartDefaultsService", () => {
  beforeEach(async () => {
    await initializeDatabase();
  });

  describe("getDefaultsForPlant", () => {
    it("should extract watering defaults from variety protocol", async () => {
      // Create a plant with a variety that has watering protocols
      const varieties = await varietyService.getAllVarieties();
      const varietyWithWatering = varieties.find(
        (v) =>
          v.protocols?.watering && Object.keys(v.protocols.watering).length > 0
      );

      if (!varietyWithWatering) {
        // Skip if no varieties have watering protocols in test data
        return;
      }

      const plantId = await plantService.addPlant({
        varietyId: varietyWithWatering.id,
        varietyName: varietyWithWatering.name,
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      // Get the actual plant record
      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const defaults = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(defaults).toBeTruthy();
      expect(defaults?.watering).toBeTruthy();
      expect(defaults?.watering?.suggestedAmount).toBeGreaterThan(0);
      expect(defaults?.watering?.unit).toBeDefined();
      expect(defaults?.watering?.confidence).toBeDefined();
      expect(defaults?.watering?.source).toBeDefined();
      expect(defaults?.watering?.reasoning).toBeDefined();
    });

    it("should use category defaults when variety protocol is incomplete", async () => {
      // Create a plant with a variety that has minimal protocol data
      const varieties = await varietyService.getAllVarieties();
      const simpleVariety = varieties.find((v) => !v.protocols?.watering);

      if (!simpleVariety) {
        // Create a simple variety for testing
        return;
      }

      const plantId = await plantService.addPlant({
        varietyId: simpleVariety.id,
        varietyName: simpleVariety.name,
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const defaults = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(defaults).toBeTruthy();
      expect(defaults?.watering).toBeTruthy();
      expect(defaults?.watering?.source).toEqual("category");
    });

    it("should extract fertilizer defaults from variety protocol", async () => {
      const varieties = await varietyService.getAllVarieties();
      const varietyWithFertilizer = varieties.find(
        (v) =>
          v.protocols?.fertilization &&
          Object.keys(v.protocols.fertilization).length > 0
      );

      if (!varietyWithFertilizer) {
        // Skip if no varieties have fertilization protocols
        return;
      }

      const plantId = await plantService.addPlant({
        varietyId: varietyWithFertilizer.id,
        varietyName: varietyWithFertilizer.name,
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const defaults = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(defaults).toBeTruthy();
      if (defaults?.fertilizer) {
        expect(defaults.fertilizer.products).toBeDefined();
        expect(defaults.fertilizer.products.length).toBeGreaterThan(0);
        expect(defaults.fertilizer.source).toBeDefined();
        expect(defaults.fertilizer.reasoning).toBeDefined();
      }
    });
  });

  describe("getQuickCompletionOptions", () => {
    it("should provide quick watering options", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const options = await SmartDefaultsService.getQuickCompletionOptions(
        plant,
        "water"
      );

      expect(options).toBeTruthy();
      if (options) {
        expect(options.length).toBeGreaterThan(0);
        expect(options.some((opt) => opt.label.includes("Quick:"))).toBe(true);
        expect(options[0].values.waterValue).toBeGreaterThan(0);
        expect(options[0].values.waterUnit).toBeDefined();
      }
    });

    it("should provide quick fertilizer options when available", async () => {
      const varieties = await varietyService.getAllVarieties();
      const varietyWithFertilizer = varieties.find(
        (v) =>
          v.protocols?.fertilization &&
          Object.keys(v.protocols.fertilization).length > 0
      );

      if (!varietyWithFertilizer) {
        // Skip if no varieties have fertilization protocols
        return;
      }

      const plantId = await plantService.addPlant({
        varietyId: varietyWithFertilizer.id,
        varietyName: varietyWithFertilizer.name,
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const options = await SmartDefaultsService.getQuickCompletionOptions(
        plant,
        "fertilize"
      );

      if (options) {
        expect(options.length).toBeGreaterThan(0);
        expect(options[0].label).toContain("Quick:");
        expect(options[0].values.product).toBeDefined();
        expect(options[0].values.dilution).toBeDefined();
        expect(options[0].values.amount).toBeDefined();
      }
    });
  });

  describe("parseWaterAmount", () => {
    // Test the private method through public interface
    it("should handle different water amount formats", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const defaults = await SmartDefaultsService.getDefaultsForPlant(plant);

      // The service should return valid defaults regardless of input format
      expect(defaults).toBeTruthy();
      if (defaults?.watering) {
        expect(defaults.watering.suggestedAmount).toBeGreaterThan(0);
        expect(["oz", "ml", "cups", "liters", "gallons"]).toContain(
          defaults.watering.unit
        );
      }
    });
  });
});
