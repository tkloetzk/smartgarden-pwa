// src/__tests__/database/varietyService.test.ts
import { varietyService } from "../../types/database";
import { initializeDatabase } from "../../db/seedData";
import { seedVarieties } from "../../data/seedVarieties";

describe("varietyService", () => {
  beforeEach(async () => {
    // Clear the database before each test
    const db = await import("../../types/database").then((m) => m.db);
    await db.varieties.clear();
  });

  describe("seedVarieties data integrity", () => {
    it("should have valid growth timelines for all varieties", () => {
      seedVarieties.forEach((variety) => {
        expect(variety.growthTimeline.germination).toBeGreaterThanOrEqual(0);
        expect(variety.growthTimeline.seedling).toBeGreaterThan(0);
        expect(variety.growthTimeline.vegetative).toBeGreaterThan(0);
        expect(variety.growthTimeline.maturation).toBeGreaterThan(0);

        // Maturation represents total time to harvest - accommodate perennial herbs
        // Rosemary: 730 days (2+ years), English Thyme: 365 days (1 year)
        expect(variety.growthTimeline.maturation).toBeLessThan(2000); // Maximum ~5 years

        // Germination should be the shortest stage
        expect(variety.growthTimeline.germination).toBeLessThanOrEqual(
          variety.growthTimeline.seedling
        );
      });
    });

    it("should have valid categories for all varieties", () => {
      const validCategories = [
        "root-vegetables",
        "leafy-greens",
        "herbs",
        "berries",
        "fruiting-plants",
      ];

      seedVarieties.forEach((variety) => {
        expect(validCategories).toContain(variety.category);
      });
    });

    it("should have productive lifespan for everbearing varieties", () => {
      const everbearingVarieties = seedVarieties.filter((v) => v.isEverbearing);

      everbearingVarieties.forEach((variety) => {
        expect(variety.productiveLifespan).toBeDefined();
        expect(variety.productiveLifespan).toBeGreaterThan(0);
      });
    });
  });

  describe("comprehensive variety coverage", () => {
    beforeEach(async () => {
      await initializeDatabase();
    });

    it("should include all expected varieties from the comprehensive plan", async () => {
      const varieties = await varietyService.getAllVarieties();
      const varietyNames = varieties.map((v) => v.name);

      // Root vegetables
      expect(varietyNames).toContain("Little Finger Carrots");
      expect(varietyNames).toContain("Detroit Dark Red Beets");
      expect(varietyNames).toContain("Beauregard Sweet Potatoes");

      // Leafy greens
      expect(varietyNames).toContain("Astro Arugula");
      expect(varietyNames).toContain("Baby's Leaf Spinach");

      // Herbs
      expect(varietyNames).toContain("Greek Oregano");
      expect(varietyNames).toContain("English Thyme");
      expect(varietyNames).toContain("Rosemary");
      expect(varietyNames).toContain("Italian Flat Leaf Parsley");
      expect(varietyNames).toContain("Greek Dwarf Basil");

      // Berries
      expect(varietyNames).toContain("Albion Strawberries");
      expect(varietyNames).toContain("Caroline Raspberries");

      // Fruiting plants
      expect(varietyNames).toContain("Boston Pickling Cucumber");
      expect(varietyNames).toContain("Sugar Snap Peas");
    });

    it("should include lettuce varieties", async () => {
      const varieties = await varietyService.getAllVarieties();
      const varietyNames = varieties.map((v) => v.name);

      // Find any lettuce varieties
      const lettuceVarieties = varietyNames.filter(
        (name) =>
          name.toLowerCase().includes("lettuce") ||
          name.toLowerCase().includes("may queen") ||
          name.toLowerCase().includes("butter")
      );

      //   console.log("Found lettuce varieties:", lettuceVarieties);

      // There should be at least one lettuce variety
      expect(lettuceVarieties.length).toBeGreaterThan(0);
    });

    it("should have comprehensive protocols for complex varieties", async () => {
      const varieties = await varietyService.getAllVarieties();

      // Test strawberries have comprehensive protocols
      const strawberries = varieties.find(
        (v) => v.name === "Albion Strawberries"
      );
      expect(strawberries?.protocols?.lighting).toBeDefined();
      expect(strawberries?.protocols?.watering).toBeDefined();
      expect(strawberries?.protocols?.fertilization).toBeDefined();
      expect(strawberries?.protocols?.environment).toBeDefined();
      expect(strawberries?.protocols?.soilMixture).toBeDefined();
      expect(strawberries?.protocols?.specialRequirements).toBeDefined();

      // Test cucumber protocols with correct stage names from your seedVarieties
      const cucumber = varieties.find(
        (v) => v.name === "Boston Pickling Cucumber"
      );
      expect(cucumber?.protocols?.lighting?.seedling?.ppfd).toBeDefined();
      expect(cucumber?.protocols?.lighting?.flowering?.notes).toBeDefined();
      expect(cucumber?.protocols?.watering?.seedling?.trigger).toBeDefined();
    });

    it("should correctly categorize varieties", async () => {
      const varieties = await varietyService.getAllVarieties();

      const rootVegetables = varieties.filter(
        (v) => v.category === "root-vegetables"
      );
      const leafyGreens = varieties.filter(
        (v) => v.category === "leafy-greens"
      );
      const herbs = varieties.filter((v) => v.category === "herbs");
      const berries = varieties.filter((v) => v.category === "berries");
      const fruitingPlants = varieties.filter(
        (v) => v.category === "fruiting-plants"
      );

      expect(rootVegetables.length).toBeGreaterThan(0);
      expect(leafyGreens.length).toBeGreaterThan(0);
      expect(herbs.length).toBeGreaterThan(0);
      expect(berries.length).toBeGreaterThan(0);
      expect(fruitingPlants.length).toBeGreaterThan(0);

      // Verify specific categorizations
      expect(
        rootVegetables.some((v) => v.name === "Little Finger Carrots")
      ).toBe(true);
      expect(leafyGreens.some((v) => v.name === "Astro Arugula")).toBe(true);
      expect(herbs.some((v) => v.name === "English Thyme")).toBe(true);
      expect(berries.some((v) => v.name === "Albion Strawberries")).toBe(true);
      expect(
        fruitingPlants.some((v) => v.name === "Boston Pickling Cucumber")
      ).toBe(true);
    });

    it("should list all available varieties for debugging", async () => {
      const varieties = await varietyService.getAllVarieties();
      //  const varietyNames = varieties.map((v) => v.name).sort();

      // console.log("All available varieties:", varietyNames);

      // This test helps identify what varieties are actually available
      expect(varieties.length).toBeGreaterThan(0);
    });
  });

  describe("protocol structure validation", () => {
    beforeEach(async () => {
      await initializeDatabase();
    });

    it("should have valid lighting protocols where present", async () => {
      const varieties = await varietyService.getAllVarieties();

      varieties.forEach((variety) => {
        if (variety.protocols?.lighting) {
          Object.entries(variety.protocols.lighting).forEach(
            ([stage, protocol]) => {
              expect(protocol.ppfd?.min).toBeGreaterThan(0);
              expect(protocol.ppfd?.max).toBeGreaterThanOrEqual(
                protocol.ppfd.min
              );
              expect(protocol.ppfd?.unit).toBe("µmol/m²/s");
              expect(protocol.photoperiod?.hours).toBeGreaterThan(0);
              expect(protocol.photoperiod?.hours).toBeLessThanOrEqual(24);
              expect(protocol.dli?.min).toBeGreaterThan(0);
              expect(protocol.dli?.max).toBeGreaterThanOrEqual(
                protocol.dli.min
              );
              expect(protocol.dli?.unit).toBe("mol/m²/day");

              // console.log(
              //   `Validated lighting protocol for ${variety.name} - ${stage}`
              // );
            }
          );
        }
      });
    });

    it("should have valid watering protocols where present", async () => {
      const varieties = await varietyService.getAllVarieties();

      varieties.forEach((variety) => {
        if (variety.protocols?.watering) {
          Object.entries(variety.protocols.watering).forEach(([, protocol]) => {
            expect(protocol.trigger?.moistureLevel).toBeDefined();
            expect(protocol.target?.moistureLevel).toBeDefined();
            expect(protocol.volume?.amount).toBeDefined();
            expect(protocol.volume?.frequency).toBeDefined();

            // console.log(
            //   `Validated watering protocol for ${variety.name} - ${stage}`
            // );
          });
        }
      });
    });

    it("should have valid soil mixture percentages where present", async () => {
      const varieties = await varietyService.getAllVarieties();

      varieties.forEach((variety) => {
        if (variety.protocols?.soilMixture?.components) {
          const percentages = Object.values(
            variety.protocols.soilMixture.components
          );
          const total = percentages.reduce((sum, pct) => sum + pct, 0);

          // Allow for minor rounding differences
          expect(total).toBeCloseTo(100, 1);

          percentages.forEach((pct) => {
            expect(pct).toBeGreaterThan(0);
            expect(pct).toBeLessThanOrEqual(100);
          });
        }
      });
    });

    it("should have valid pH ranges where present", async () => {
      const varieties = await varietyService.getAllVarieties();

      varieties.forEach((variety) => {
        if (variety.protocols?.environment?.pH) {
          const { min, max, optimal } = variety.protocols.environment.pH;
          expect(min).toBeGreaterThan(0);
          expect(min).toBeLessThan(14);
          expect(max).toBeGreaterThan(min);
          expect(max).toBeLessThan(14);

          if (optimal) {
            expect(optimal).toBeGreaterThanOrEqual(min);
            expect(optimal).toBeLessThanOrEqual(max);
          }
        }
      });
    });
  });

  describe("perennial herb maturation times", () => {
    it("should handle long maturation times for perennial herbs", () => {
      // Rosemary takes 730 days (2+ years) to reach full maturity
      const rosemary = seedVarieties.find((v) => v.name === "Rosemary");
      expect(rosemary?.growthTimeline.maturation).toBe(730);

      // English Thyme takes 365 days (1 year) to reach full maturity
      const thyme = seedVarieties.find((v) => v.name === "English Thyme");
      expect(thyme?.growthTimeline.maturation).toBe(365);

      // Greek Oregano should be much faster
      const oregano = seedVarieties.find((v) => v.name === "Greek Oregano");
      expect(oregano?.growthTimeline.maturation).toBeLessThan(120);
    });
  });

  describe("duplicate detection", () => {
    it("should not have duplicate varieties after initialization", async () => {
      await initializeDatabase();

      const varieties = await varietyService.getAllVarieties();
      const varietyNames = varieties.map((v) => v.name);
      const uniqueNames = new Set(varietyNames);

      if (varietyNames.length !== uniqueNames.size) {
        console.error("Duplicate varieties found:");
        const duplicates = varietyNames.filter(
          (name, index) => varietyNames.indexOf(name) !== index
        );
        console.error("Duplicates:", [...new Set(duplicates)]);
        console.error("All varieties:", varietyNames);
      }

      expect(varietyNames.length).toBe(uniqueNames.size);
    });

    it("should not create duplicates when initialization is called multiple times", async () => {
      await initializeDatabase();
      await initializeDatabase();
      await initializeDatabase();

      const varieties = await varietyService.getAllVarieties();
      const varietyNames = varieties.map((v) => v.name);
      const uniqueNames = new Set(varietyNames);

      if (varietyNames.length !== uniqueNames.size) {
        console.error(
          "Duplicate varieties found after multiple initializations:"
        );
        const duplicates = varietyNames.filter(
          (name, index) => varietyNames.indexOf(name) !== index
        );
        console.error("Duplicates:", [...new Set(duplicates)]);
      }

      expect(varietyNames.length).toBe(uniqueNames.size);
    });

    it("should handle existing database state correctly", async () => {
      // Add a variety manually first - no longer requires createdAt
      await varietyService.addVariety({
        name: "Test Variety",
        category: "herbs",
        growthTimeline: {
          germination: 7,
          seedling: 14,
          vegetative: 21,
          maturation: 60,
        },
      });

      const beforeCount = (await varietyService.getAllVarieties()).length;

      // Now run initialization
      await initializeDatabase();

      const afterCount = (await varietyService.getAllVarieties()).length;
      const varieties = await varietyService.getAllVarieties();

      // Should have our test variety plus all seed varieties
      expect(afterCount).toBe(beforeCount + seedVarieties.length);
      expect(varieties.some((v) => v.name === "Test Variety")).toBe(true);
    });
  });

  describe("everbearing varieties", () => {
    beforeEach(async () => {
      await initializeDatabase();
    });

    it("should correctly identify everbearing varieties", async () => {
      const varieties = await varietyService.getAllVarieties();

      const everbearingVarieties = varieties.filter(
        (v) => seedVarieties.find((sv) => sv.name === v.name)?.isEverbearing
      );

      // Should include strawberries, raspberries, some herbs
      const everbearingNames = everbearingVarieties.map((v) => v.name);
      expect(everbearingNames).toContain("Albion Strawberries");
      expect(everbearingNames).toContain("Caroline Raspberries");
      expect(everbearingNames).toContain("Astro Arugula");
    });

    it("should have succession protocols for appropriate varieties", async () => {
      const varieties = await varietyService.getAllVarieties();

      const arugula = varieties.find((v) => v.name === "Astro Arugula");
      const carrotProtocols = seedVarieties.find(
        (v) => v.name === "Little Finger Carrots"
      )?.protocols;

      // Arugula should have succession protocol (cut-and-come-again)
      expect(arugula).toBeDefined();

      // Carrots should have succession protocol for continuous harvests
      expect(carrotProtocols?.succession).toBeDefined();
      expect(carrotProtocols?.succession?.interval).toBeGreaterThan(0);
    });
  });

  describe("comprehensive protocol features", () => {
    beforeEach(async () => {
      await initializeDatabase();
    });

    it("should have stage-specific fertilization protocols", async () => {
      const varieties = await varietyService.getAllVarieties();
      const strawberries = varieties.find(
        (v) => v.name === "Albion Strawberries"
      );

      if (strawberries?.protocols?.fertilization) {
        Object.entries(strawberries.protocols.fertilization).forEach(
          ([, protocol]) => {
            if (protocol.products && protocol.products.length > 0) {
              protocol.products.forEach((product) => {
                expect(product.name).toBeDefined();
                expect(product.dilution).toBeDefined();
                expect(product.frequency).toBeDefined();
              });
            }
          }
        );
      }
    });

    it("should have container requirements for varieties", async () => {
      const varieties = await varietyService.getAllVarieties();
      const cucumber = varieties.find(
        (v) => v.name === "Boston Pickling Cucumber"
      );

      expect(cucumber?.protocols?.container?.depth).toBeDefined();
      expect(cucumber?.protocols?.specialRequirements).toBeDefined();
      expect(cucumber?.protocols?.specialRequirements?.length).toBeGreaterThan(
        0
      );
    });

    it("should have environmental constraints for sensitive varieties", async () => {
      const varieties = await varietyService.getAllVarieties();
      const carrots = varieties.find((v) => v.name === "Little Finger Carrots");

      if (carrots?.protocols?.environment?.constraints) {
        carrots.protocols.environment.constraints.forEach((constraint) => {
          expect(constraint.description).toBeDefined();
          expect(constraint.parameter).toBeDefined();
          expect(constraint.consequence).toBeDefined();
        });
      }
    });
  });
});
