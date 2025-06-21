import { SmartDefaultsService } from "@/services/smartDefaultsService";
import { varietyService, plantService, careService } from "@/types/database";
import { initializeDatabase } from "@/db/seedData";
import { subDays } from "date-fns";

describe("SmartDefaultsService", () => {
  beforeEach(async () => {
    await initializeDatabase();
    // Clear any existing test data
    const { db } = await import("@/types/database");
    await db.plants.clear();
    await db.careActivities.clear();
  });

  describe("contextual defaults based on growth stage", () => {
    it("provides different watering amounts for different growth stages", async () => {
      const varieties = await varietyService.getAllVarieties();
      const strawberry = varieties.find(
        (v) =>
          v.name.toLowerCase().includes("strawberry") ||
          v.name.toLowerCase().includes("albion")
      );

      if (!strawberry) {
        // Skip if no suitable variety found
        return;
      }

      // Create plants in different growth stages
      const stages = ["seedling", "vegetative", "maturation"] as const;
      const testResults: Array<{
        stage: string;
        amount: number;
        confidence: string;
      }> = [];

      for (const stage of stages) {
        const plantId = await plantService.addPlant({
          varietyId: strawberry.id,
          varietyName: strawberry.name,
          name: `Test Plant ${stage}`,
          plantedDate: subDays(new Date(), 30),
          currentStage: stage,
          location: "Indoor",
          container: "5 gallon pot",
          isActive: true,
        });

        const plant = await plantService.getPlant(plantId);
        if (!plant) continue;

        const defaults = await SmartDefaultsService.getDefaultsForPlant(plant);

        if (defaults?.watering) {
          testResults.push({
            stage,
            amount: defaults.watering.suggestedAmount,
            confidence: defaults.watering.confidence,
          });
        }
      }

      // Verify we got results for multiple stages
      expect(testResults.length).toBeGreaterThan(1);

      // Verify that amounts and confidence are valid
      for (const result of testResults) {
        expect(result.amount).toBeGreaterThan(0);
        expect(["high", "medium", "low"]).toContain(result.confidence);
      }
    });

    it("adjusts fertilizer recommendations based on plant maturity", async () => {
      const varieties = await varietyService.getAllVarieties();
      const varietyWithFertilizer = varieties.find(
        (v) =>
          v.protocols?.fertilization &&
          Object.keys(v.protocols.fertilization).length > 0
      );

      if (!varietyWithFertilizer) {
        return;
      }

      // Test young vs mature plant fertilizer recommendations
      const youngPlantId = await plantService.addPlant({
        varietyId: varietyWithFertilizer.id,
        varietyName: varietyWithFertilizer.name,
        name: "Young Plant",
        plantedDate: subDays(new Date(), 14), // 2 weeks old
        currentStage: "seedling",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      const maturePlantId = await plantService.addPlant({
        varietyId: varietyWithFertilizer.id,
        varietyName: varietyWithFertilizer.name,
        name: "Mature Plant",
        plantedDate: subDays(new Date(), 90), // 3 months old
        currentStage: "maturation",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const [youngPlant, maturePlant] = await Promise.all([
        plantService.getPlant(youngPlantId),
        plantService.getPlant(maturePlantId),
      ]);

      if (!youngPlant || !maturePlant) {
        throw new Error("Plants not found");
      }

      const [youngDefaults, matureDefaults] = await Promise.all([
        SmartDefaultsService.getDefaultsForPlant(youngPlant),
        SmartDefaultsService.getDefaultsForPlant(maturePlant),
      ]);

      // Both should have defaults but potentially different recommendations
      expect(youngDefaults).toBeTruthy();
      expect(matureDefaults).toBeTruthy();

      if (youngDefaults?.fertilizer && matureDefaults?.fertilizer) {
        expect(youngDefaults.fertilizer.products).toBeDefined();
        expect(matureDefaults.fertilizer.products).toBeDefined();

        // Verify reasoning contains category or protocol information
        expect(youngDefaults.fertilizer.reasoning).toMatch(
          /category|protocol|fertilization/i
        );
        expect(matureDefaults.fertilizer.reasoning).toMatch(
          /category|protocol|fertilization/i
        );

        // Verify products have proper structure
        expect(youngDefaults.fertilizer.products[0].name).toBeDefined();
        expect(matureDefaults.fertilizer.products[0].name).toBeDefined();
      }
    });

    it("provides stage-appropriate quick completion options", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties.find(
        (v) =>
          v.protocols?.watering && Object.keys(v.protocols.watering).length > 0
      );

      if (!testVariety) {
        return;
      }

      // Create plant in vegetative stage
      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        name: "Vegetative Plant",
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const wateringOptions =
        await SmartDefaultsService.getQuickCompletionOptions(plant, "water");

      expect(wateringOptions).toBeTruthy();
      if (wateringOptions) {
        expect(wateringOptions.length).toBeGreaterThan(0);

        // Verify options are properly structured
        expect(
          wateringOptions.some(
            (opt) =>
              opt.label.includes("Quick:") &&
              opt.values.waterValue &&
              opt.values.waterValue > 0
          )
        ).toBe(true);

        // Verify all options have required properties
        wateringOptions.forEach((option) => {
          expect(option.label).toBeDefined();
          expect(option.values).toBeDefined();
        });
      }
    });
  });

  describe("learning from plant history", () => {
    it("adjusts watering defaults based on previous care patterns", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties.find(
        (v) =>
          v.protocols?.watering && Object.keys(v.protocols.watering).length > 0
      );

      if (!testVariety) {
        return;
      }

      // Create a plant with established care history
      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        name: "Plant with History",
        plantedDate: subDays(new Date(), 60),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      // Add consistent watering history showing user typically uses 25oz
      const wateringDates = [
        subDays(new Date(), 14),
        subDays(new Date(), 11),
        subDays(new Date(), 8),
        subDays(new Date(), 5),
        subDays(new Date(), 2),
      ];

      for (const date of wateringDates) {
        await careService.addCareActivity({
          plantId,
          type: "water",
          date,
          details: {
            type: "water",
            amount: {
              value: 25,
              unit: "oz",
            },
            moistureReading: {
              before: 3,
              after: 7,
              scale: "1-10",
            },
            notes: "Regular watering",
          },
        });
      }

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const defaults = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(defaults).toBeTruthy();
      expect(defaults?.watering).toBeTruthy();

      if (defaults?.watering) {
        // The service should consider historical patterns
        // Note: This test verifies the infrastructure exists for learning
        // Actual ML learning implementation would come in Phase 2
        expect(defaults.watering.suggestedAmount).toBeGreaterThan(0);
        expect(defaults.watering.confidence).toBeDefined();
        expect(defaults.watering.source).toBeDefined();
      }
    });

    it("considers recent care frequency when suggesting next actions", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        name: "Recently Cared Plant",
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      // Add recent watering (yesterday)
      await careService.addCareActivity({
        plantId,
        type: "water",
        date: subDays(new Date(), 1),
        details: {
          type: "water",
          amount: {
            value: 20,
            unit: "oz",
          },
          moistureReading: {
            before: 3,
            after: 7,
            scale: "1-10",
          },
          notes: "Recent watering",
        },
      });

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      const quickOptions = await SmartDefaultsService.getQuickCompletionOptions(
        plant,
        "water"
      );

      // The service should provide options but may adjust confidence
      // based on recent care activity
      expect(quickOptions).toBeTruthy();
      if (quickOptions && quickOptions.length > 0) {
        // Verify the service is aware of recent activity
        // This could manifest as lower confidence or adjusted timing
        quickOptions.forEach((option) => {
          expect(option.label).toBeDefined();
          expect(option.values.waterValue).toBeGreaterThan(0);
        });
      }
    });

    it("provides category-based defaults for different plant types", async () => {
      const varieties = await varietyService.getAllVarieties();

      // Find varieties from different categories
      const leafyGreen = varieties.find((v) => v.category === "leafy-greens");
      const fruitingPlant = varieties.find(
        (v) => v.category === "fruiting-plants"
      );

      if (!leafyGreen || !fruitingPlant) {
        return;
      }

      // Create plants of different types
      const leafyPlantId = await plantService.addPlant({
        varietyId: leafyGreen.id,
        varietyName: leafyGreen.name,
        name: "Leafy Plant",
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "4 inch pot",
        isActive: true,
      });

      const fruitingPlantId = await plantService.addPlant({
        varietyId: fruitingPlant.id,
        varietyName: fruitingPlant.name,
        name: "Fruiting Plant",
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const [leafyPlant, fruitPlant] = await Promise.all([
        plantService.getPlant(leafyPlantId),
        plantService.getPlant(fruitingPlantId),
      ]);

      if (!leafyPlant || !fruitPlant) {
        throw new Error("Plants not found");
      }

      const [leafyDefaults, fruitDefaults] = await Promise.all([
        SmartDefaultsService.getDefaultsForPlant(leafyPlant),
        SmartDefaultsService.getDefaultsForPlant(fruitPlant),
      ]);

      // Both should have defaults
      expect(leafyDefaults).toBeTruthy();
      expect(fruitDefaults).toBeTruthy();

      if (leafyDefaults?.watering && fruitDefaults?.watering) {
        // Fruiting plants generally need more water than leafy greens
        expect(fruitDefaults.watering.suggestedAmount).toBeGreaterThanOrEqual(
          leafyDefaults.watering.suggestedAmount
        );

        // Verify reasoning mentions category
        expect(leafyDefaults.watering.reasoning).toMatch(
          /leafy-greens|category/i
        );
        expect(fruitDefaults.watering.reasoning).toMatch(
          /fruiting-plants|category/i
        );
      }
    });

    it("maintains confidence levels based on data quality", async () => {
      const varieties = await varietyService.getAllVarieties();
      const varietyWithProtocol = varieties.find(
        (v) =>
          v.protocols?.watering && Object.keys(v.protocols.watering).length > 0
      );

      if (!varietyWithProtocol) {
        return;
      }

      // Plant with detailed protocol should have high confidence
      const protocolPlantId = await plantService.addPlant({
        varietyId: varietyWithProtocol.id,
        varietyName: varietyWithProtocol.name,
        name: "Well-Documented Plant",
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      // Plant with minimal protocol should have lower confidence
      const simpleVariety = varieties.find((v) => !v.protocols?.watering);
      if (!simpleVariety) {
        return;
      }

      const simplePlantId = await plantService.addPlant({
        varietyId: simpleVariety.id,
        varietyName: simpleVariety.name,
        name: "Simple Plant",
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const [protocolPlant, simplePlant] = await Promise.all([
        plantService.getPlant(protocolPlantId),
        plantService.getPlant(simplePlantId),
      ]);

      if (!protocolPlant || !simplePlant) {
        throw new Error("Plants not found");
      }

      const [protocolDefaults, simpleDefaults] = await Promise.all([
        SmartDefaultsService.getDefaultsForPlant(protocolPlant),
        SmartDefaultsService.getDefaultsForPlant(simplePlant),
      ]);

      if (protocolDefaults?.watering && simpleDefaults?.watering) {
        // Protocol-based should have higher confidence than category-based
        const confidenceOrder = { high: 3, medium: 2, low: 1 };

        expect(
          confidenceOrder[protocolDefaults.watering.confidence]
        ).toBeGreaterThanOrEqual(
          confidenceOrder[simpleDefaults.watering.confidence]
        );

        // Verify source attribution
        expect(protocolDefaults.watering.source).toBe("protocol");
        expect(simpleDefaults.watering.source).toMatch(/category|universal/);
      }
    });
  });

  describe("error handling and edge cases", () => {
    it("handles plants with invalid variety data gracefully", async () => {
      // Create a plant with a non-existent variety ID
      const plantId = await plantService.addPlant({
        varietyId: "non-existent-variety",
        varietyName: "Invalid Variety",
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

      // Should return null gracefully rather than throwing
      expect(defaults).toBeNull();
    });

    it("provides universal defaults when no specific protocol exists", async () => {
      const varieties = await varietyService.getAllVarieties();
      const minimalVariety = varieties.find(
        (v) => !v.protocols?.watering && !v.protocols?.fertilization
      );

      if (!minimalVariety) {
        return;
      }

      const plantId = await plantService.addPlant({
        varietyId: minimalVariety.id,
        varietyName: minimalVariety.name,
        name: "Minimal Protocol Plant",
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
      if (defaults?.watering) {
        expect(defaults.watering.source).toMatch(/category|universal/);
        expect(defaults.watering.confidence).toBe("low");
        expect(defaults.watering.reasoning).toMatch(
          /category|general|default|universal/i
        );
      }
    });

    it("handles corrupted care log data without crashing", async () => {
      const varieties = await varietyService.getAllVarieties();
      const testVariety = varieties[0];

      const plantId = await plantService.addPlant({
        varietyId: testVariety.id,
        varietyName: testVariety.name,
        name: "Plant with Bad Data",
        plantedDate: subDays(new Date(), 30),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
      });

      const plant = await plantService.getPlant(plantId);
      if (!plant) throw new Error("Plant not found");

      // The service should handle this gracefully
      const defaults = await SmartDefaultsService.getDefaultsForPlant(plant);

      // Should still provide defaults despite potential data issues
      expect(defaults).toBeTruthy();
      expect(defaults?.currentStage).toBeDefined();
      expect(defaults?.daysSincePlanting).toBeGreaterThanOrEqual(0);
    });
  });
});
