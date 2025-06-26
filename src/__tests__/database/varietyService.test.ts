import { varietyService } from "../../types/database";
import { initializeDatabase } from "../../db/seedData";
import { seedVarieties } from "../../data/seedVarieties";
import { db, PlantCategory } from "@/types";

describe("varietyService", () => {
  // Before each test, clear the varieties table and re-seed it
  // This ensures each test runs against a clean, predictable state.
  beforeEach(async () => {
    await db.varieties.clear();
    await initializeDatabase();
  });

  describe("Data Seeding and Integrity", () => {
    it("should seed all varieties from the data file without duplicates", async () => {
      const allVarieties = await varietyService.getAllVarieties();

      // Check that the number of varieties in the DB matches the seed file
      expect(allVarieties.length).toBe(seedVarieties.length);

      // Check for uniqueness by name
      const varietyNames = allVarieties.map((v) => v.name);
      const uniqueNames = new Set(varietyNames);
      expect(uniqueNames.size).toBe(varietyNames.length);
    });

    it("should prevent adding a variety with a duplicate name", async () => {
      const existingVariety = await varietyService.getVarietyByName(
        "Sugar Snap Peas"
      );
      expect(existingVariety).toBeDefined();

      const newId = await varietyService.addVariety({
        name: "Sugar Snap Peas", // Attempt to add a duplicate
        category: "fruiting-plants",
        growthTimeline: {
          germination: 1,
          seedling: 1,
          vegetative: 1,
          maturation: 1,
          rootDevelopment: 1,
        },
      });

      // The service should return the ID of the existing variety
      expect(newId).toBe(existingVariety!.id);

      // The total number of varieties should not have increased
      const allVarieties = await varietyService.getAllVarieties();
      expect(allVarieties.length).toBe(seedVarieties.length);
    });
  });

  describe("Service Functionality", () => {
    it("should retrieve a specific variety by name", async () => {
      const variety = await varietyService.getVarietyByName(
        "Baby's Leaf Spinach"
      );
      expect(variety).toBeDefined();
      expect(variety?.name).toBe("Baby's Leaf Spinach");
      expect(variety?.category).toBe("leafy-greens");
    });

    it("should retrieve all varieties for a specific category", async () => {
      const herbs = await varietyService.getVarietiesByCategory("herbs");
      const herbNames = herbs.map((v) => v.name);

      expect(herbs.length).toBeGreaterThan(0);
      expect(herbNames).toContain("Rosemary");
      expect(herbNames).toContain("English Thyme");

      // Ensure all returned items actually belong to the category
      herbs.forEach((herb) => {
        expect(herb.category).toBe("herbs");
      });
    });

    it("should return an empty array for a category with no varieties", async () => {
      // Assuming 'flowers' is not a category in the seed data
      const flowers = await varietyService.getVarietiesByCategory(
        "flowers" as PlantCategory
      );
      expect(flowers).toEqual([]);
    });
  });

  describe("Protocol and Timeline Validation", () => {
    it("should have valid growth timelines for all seeded varieties", async () => {
      const allVarieties = await varietyService.getAllVarieties();
      expect(allVarieties.length).toBeGreaterThan(0);

      allVarieties.forEach((variety) => {
        expect(variety.growthTimeline).toBeDefined();
        expect(variety.growthTimeline.germination).toBeGreaterThanOrEqual(0);
        expect(variety.growthTimeline.seedling).toBeGreaterThanOrEqual(0);
        expect(variety.growthTimeline.vegetative).toBeGreaterThanOrEqual(0);
        expect(variety.growthTimeline.maturation).toBeGreaterThan(0);
      });
    });

    it("should have a productiveLifespan for all everbearing varieties", async () => {
      const allVarieties = await varietyService.getAllVarieties();
      const everbearingVarieties = allVarieties.filter((v) => v.isEverbearing);

      expect(everbearingVarieties.length).toBeGreaterThan(0);

      everbearingVarieties.forEach((variety) => {
        expect(variety.productiveLifespan).toBeDefined();
        expect(variety.productiveLifespan!).toBeGreaterThan(0);
      });
    });

    it("should have comprehensive protocols for complex plants like Albion Strawberries", async () => {
      const strawberries = await varietyService.getVarietyByName(
        "Albion Strawberries"
      );
      expect(strawberries?.protocols?.lighting).toBeDefined();
      expect(strawberries?.protocols?.watering).toBeDefined();
      expect(strawberries?.protocols?.fertilization).toBeDefined();
      expect(strawberries?.protocols?.environment).toBeDefined();
      expect(strawberries?.protocols?.soilMixture).toBeDefined();
      expect(strawberries?.protocols?.specialRequirements).toBeDefined();
      expect(
        strawberries?.protocols?.specialRequirements?.length
      ).toBeGreaterThan(0);
    });

    it("should have valid soil mixture percentages for varieties with soil protocols", async () => {
      const allVarieties = await varietyService.getAllVarieties();
      const varietiesWithSoilMix = allVarieties.filter(
        (v) => v.protocols?.soilMixture?.components
      );

      expect(varietiesWithSoilMix.length).toBeGreaterThan(0);

      varietiesWithSoilMix.forEach((variety) => {
        const components = variety.protocols!.soilMixture!.components!;
        const totalPercentage = Object.values(components).reduce(
          (sum, pct) => sum + pct,
          0
        );
        expect(totalPercentage).toBeCloseTo(100, 1); // Allows for minor rounding differences
      });
    });
  });
});
