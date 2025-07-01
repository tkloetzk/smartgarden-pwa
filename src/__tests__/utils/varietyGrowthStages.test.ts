import {
  calculateCurrentStage,
  getStageProgress,
} from "../../utils/growthStage";

describe("Variety-Specific Growth Stage Calculations", () => {
  beforeEach(() => {
    // ✅ Use Jest's fake timers instead of custom restoreDate()
    jest.useFakeTimers();
  });

  afterEach(() => {
    // ✅ Clean up fake timers after each test
    jest.useRealTimers();
  });

  describe("Fast-Growing Crops (21-45 days)", () => {
    const arugulaTimeline = {
      germination: 5,
      seedling: 14,
      vegetative: 14,
      maturation: 37,
    };

    it("calculates arugula stages correctly", () => {
      const plantedDate = new Date("2024-01-01");

      // Germination (0-5 days)
      expect(
        calculateCurrentStage(
          plantedDate,
          arugulaTimeline,
          new Date("2024-01-03")
        )
      ).toBe("germination");

      // Seedling (6-19 days)
      expect(
        calculateCurrentStage(
          plantedDate,
          arugulaTimeline,
          new Date("2024-01-10")
        )
      ).toBe("seedling");

      // Vegetative (20-33 days)
      expect(
        calculateCurrentStage(
          plantedDate,
          arugulaTimeline,
          new Date("2024-01-25")
        )
      ).toBe("vegetative");

      // Harvest/maturation (37+ days)
      expect(
        calculateCurrentStage(
          plantedDate,
          arugulaTimeline,
          new Date("2024-02-10")
        )
      ).toBe("harvest");
    });

    const spinachTimeline = {
      germination: 7,
      seedling: 14,
      vegetative: 9, // Updated to match seedVarieties.ts
      maturation: 30,
    };

    it("calculates spinach stages correctly", () => {
      const plantedDate = new Date("2024-01-01");

      // Now stages add up correctly: 7+14+9=30
      // Day 30 should be harvest
      expect(
        calculateCurrentStage(
          plantedDate,
          spinachTimeline,
          new Date("2024-01-31")
        )
      ).toBe("harvest"); // Day 30

      expect(
        calculateCurrentStage(
          plantedDate,
          spinachTimeline,
          new Date("2024-01-20")
        )
      ).toBe("seedling"); // Day 19 - still in seedling stage (days 7-20)
    });
  });

  describe("Medium Crops (45-70 days)", () => {
    const lettuceTimeline = {
      germination: 7,
      seedling: 18,
      vegetative: 21,
      maturation: 55,
    };

    it("calculates lettuce stages correctly", () => {
      const plantedDate = new Date("2024-01-01");

      // Head formation around day 46-55
      expect(
        calculateCurrentStage(
          plantedDate,
          lettuceTimeline,
          new Date("2024-02-20")
        )
      ).toBe("flowering"); // Day 50
      expect(
        calculateCurrentStage(
          plantedDate,
          lettuceTimeline,
          new Date("2024-02-25")
        )
      ).toBe("harvest"); // Day 55+
    });

    const beetTimeline = {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      maturation: 60,
    };

    it("calculates beet stages correctly", () => {
      const plantedDate = new Date("2024-01-01");

      // 50-70 day harvest window
      expect(
        calculateCurrentStage(plantedDate, beetTimeline, new Date("2024-03-01"))
      ).toBe("harvest"); // Day 60
    });

    const carrotTimeline = {
      germination: 14,
      seedling: 14,
      vegetative: 14,
      maturation: 70,
    };

    it("calculates carrot stages correctly with strict photoperiod needs", () => {
      const plantedDate = new Date("2024-01-01");

      // Long germination period (14 days)
      expect(
        calculateCurrentStage(
          plantedDate,
          carrotTimeline,
          new Date("2024-01-10")
        )
      ).toBe("germination");
      expect(
        calculateCurrentStage(
          plantedDate,
          carrotTimeline,
          new Date("2024-01-15")
        )
      ).toBe("seedling");

      // Harvest around day 70
      expect(
        calculateCurrentStage(
          plantedDate,
          carrotTimeline,
          new Date("2024-03-11")
        )
      ).toBe("harvest"); // Day 70
    });
  });

  describe("Long Crops (90+ days)", () => {
    const sweetPotatoTimeline = {
      germination: 14,
      seedling: 21,
      vegetative: 42,
      maturation: 100,
    };

    it("calculates sweet potato stages correctly", () => {
      const plantedDate = new Date("2024-01-01");

      // Slip production (0-14 days)
      expect(
        calculateCurrentStage(
          plantedDate,
          sweetPotatoTimeline,
          new Date("2024-01-10")
        )
      ).toBe("germination");

      // Vine growth (15-35 days)
      expect(
        calculateCurrentStage(
          plantedDate,
          sweetPotatoTimeline,
          new Date("2024-01-25")
        )
      ).toBe("seedling");

      // Tuber development (36-77 days)
      expect(
        calculateCurrentStage(
          plantedDate,
          sweetPotatoTimeline,
          new Date("2024-02-20")
        )
      ).toBe("vegetative"); // Day 50

      // Maturation/harvest (100+ days)
      expect(
        calculateCurrentStage(
          plantedDate,
          sweetPotatoTimeline,
          new Date("2024-04-15")
        )
      ).toBe("harvest"); // Day 105
    });

    const broccoliTimeline = {
      germination: 7,
      seedling: 17,
      vegetative: 30,
      maturation: 90,
    };

    it("calculates broccoli stages correctly", () => {
      const plantedDate = new Date("2024-01-01");

      // Main head harvest 90-110 days
      expect(
        calculateCurrentStage(
          plantedDate,
          broccoliTimeline,
          new Date("2024-04-01")
        )
      ).toBe("harvest"); // Day 91
      expect(
        calculateCurrentStage(
          plantedDate,
          broccoliTimeline,
          new Date("2024-03-15")
        )
      ).toBe("flowering"); // Day 74
    });

    const onionTimeline = {
      germination: 14,
      seedling: 28,
      vegetative: 42,
      maturation: 120,
    };

    it("calculates onion bulbing stages correctly", () => {
      const plantedDate = new Date("2024-01-01");

      // Long vegetative period before bulbing
      expect(
        calculateCurrentStage(
          plantedDate,
          onionTimeline,
          new Date("2024-03-01")
        )
      ).toBe("vegetative"); // Day 60

      // Bulb formation and maturation
      expect(
        calculateCurrentStage(
          plantedDate,
          onionTimeline,
          new Date("2024-05-01")
        )
      ).toBe("harvest"); // Day 121
    });
  });

  describe("Continuous Production Crops", () => {
    const strawberryTimeline = {
      germination: 21, // Establishment
      seedling: 21, // Vegetative
      vegetative: 14, // Flowering
      maturation: 91, // Through fruiting, then ongoing
    };

    it("calculates strawberry production stages correctly", () => {
      const plantedDate = new Date("2024-01-01");

      // Original issue: 106 days should be ongoing production
      expect(
        calculateCurrentStage(
          plantedDate,
          strawberryTimeline,
          new Date("2024-04-16")
        )
      ).toBe("harvest"); // Day 106

      // Establishment phase
      expect(
        calculateCurrentStage(
          plantedDate,
          strawberryTimeline,
          new Date("2024-01-15")
        )
      ).toBe("germination"); // Day 14

      // Vegetative phase
      expect(
        calculateCurrentStage(
          plantedDate,
          strawberryTimeline,
          new Date("2024-02-05")
        )
      ).toBe("seedling"); // Day 35

      // Flowering phase
      expect(
        calculateCurrentStage(
          plantedDate,
          strawberryTimeline,
          new Date("2024-02-20")
        )
      ).toBe("vegetative"); // Day 50

      // Fruiting phase
      expect(
        calculateCurrentStage(
          plantedDate,
          strawberryTimeline,
          new Date("2024-03-15")
        )
      ).toBe("flowering"); // Day 74

      // Ongoing production
      expect(
        calculateCurrentStage(
          plantedDate,
          strawberryTimeline,
          new Date("2024-04-01")
        )
      ).toBe("harvest"); // Day 91+
    });
  });

  describe("Stage Progress Calculations", () => {
    it("calculates progress correctly within stages", () => {
      const plantedDate = new Date("2024-01-01");
      const lettuceTimeline = {
        germination: 7,
        seedling: 18,
        vegetative: 21,
        maturation: 55,
      };

      // Test day 15 (mid-seedling): (15-7)/(25-7) = 8/18 = 44.4%
      const midSeedlingProgress = getStageProgress(
        plantedDate,
        lettuceTimeline,
        new Date("2024-01-16") // Day 15
      );
      expect(midSeedlingProgress).toBeCloseTo(44, 0);

      // Test early germination: day 3, should be 3/7 = 42.9%
      const earlyGerminationProgress = getStageProgress(
        plantedDate,
        lettuceTimeline,
        new Date("2024-01-04") // Day 3
      );
      expect(earlyGerminationProgress).toBeCloseTo(43, 0);

      // Test early vegetative: day 29, (29-25)/(46-25) = 4/21 = 19%
      const earlyVegetativeProgress = getStageProgress(
        plantedDate,
        lettuceTimeline,
        new Date("2024-01-30") // Day 29
      );
      expect(earlyVegetativeProgress).toBeCloseTo(19, 0);
    });

    it("returns 100% for completed crops", () => {
      const plantedDate = new Date("2024-01-01");
      const arugulaTimeline = {
        germination: 5,
        seedling: 14,
        vegetative: 14,
        maturation: 37,
      };

      const progress = getStageProgress(
        plantedDate,
        arugulaTimeline,
        new Date("2024-03-01")
      ); // Way past maturation
      expect(progress).toBe(100);
    });
  });

  describe("Edge Cases", () => {
    it("handles future planting dates gracefully", () => {
      const plantedDate = new Date("2024-12-31");
      const currentDate = new Date("2024-01-01");
      const arugulaTimeline = {
        germination: 5,
        seedling: 14,
        vegetative: 14,
        maturation: 37,
      };

      expect(
        calculateCurrentStage(plantedDate, arugulaTimeline, currentDate)
      ).toBe("germination");
    });

    it("handles same-day calculations", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-01-01");
      const spinachTimeline = {
        germination: 7,
        seedling: 14,
        vegetative: 14,
        maturation: 30,
      };

      expect(
        calculateCurrentStage(plantedDate, spinachTimeline, currentDate)
      ).toBe("germination");
    });
  });
});
