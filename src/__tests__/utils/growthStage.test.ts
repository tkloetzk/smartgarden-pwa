// src/__tests__/utils/growthStage.test.ts
import {
  calculateCurrentStage,
  calculateCurrentStageWithVariety,
  getStageProgress,
  estimateStageTransition,
  getNextStage,
} from "../../utils/growthStage";
import { VarietyRecord } from "../../types/database";
import { GrowthStage } from "@/types";

describe("Growth Stage Utilities", () => {
  const mockTimeline = {
    germination: 7,
    seedling: 14,
    vegetative: 21,
    maturation: 60,
  };

  // Mock varieties for testing
  const mockEverbearingVariety: VarietyRecord = {
    id: "albion-strawberry",
    name: "Albion Strawberries",
    normalizedName: "Albion Strawberries",
    category: "berries",
    growthTimeline: {
      germination: 14,
      seedling: 28,
      vegetative: 42,
      maturation: 90,
    },
    isEverbearing: true,
    productiveLifespan: 730, // 2 years
    createdAt: new Date(),
  };

  const mockNonEverbearingVariety: VarietyRecord = {
    id: "little-finger-carrots",
    name: "Little Finger Carrots",
    normalizedName: "Little Finger Carrots",
    category: "root-vegetables",
    growthTimeline: {
      germination: 10,
      seedling: 14,
      vegetative: 21,
      maturation: 65,
    },
    isEverbearing: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    // ✅ Use Jest's fake timers instead of custom restoreDate()
    jest.useFakeTimers();
  });

  afterEach(() => {
    // ✅ Clean up fake timers after each test
    jest.useRealTimers();
  });

  describe("calculateCurrentStage (basic function)", () => {
    it("returns germination for early days", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-01-05"); // 4 days

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("germination");
    });

    it("transitions to seedling correctly", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-01-08"); // 7 days

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("seedling");
    });

    it("transitions to vegetative correctly", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-01-22"); // 21 days

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("vegetative");
    });

    it("transitions to flowering correctly", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-02-12"); // 42 days

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("flowering");
    });

    it("returns harvest for plants past maturation date", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-03-05"); // 65 days (past 60-day maturation)

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("harvest");
    });

    it("handles future planting dates gracefully", () => {
      const plantedDate = new Date("2024-12-31");
      const currentDate = new Date("2024-01-01"); // Before planting

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("germination"); // Should default gracefully
    });

    it("handles leap year edge cases", () => {
      const plantedDate = new Date("2024-02-28"); // Leap year
      const currentDate = new Date("2024-03-01"); // Should handle Feb 29

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("germination");
    });

    it("handles timezone DST transitions", () => {
      // Test around DST boundary
      const plantedDate = new Date("2024-03-09T12:00:00"); // Before DST
      const currentDate = new Date("2024-03-11T12:00:00"); // After DST

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("germination");
    });
  });

  describe("getStageProgress", () => {
    it("calculates correct progress within a stage", () => {
      const plantedDate = new Date("2024-01-01");

      // Set current time to test specific progress points
      jest.setSystemTime(new Date("2024-01-18")); // 17 days since planting

      const progress = getStageProgress(plantedDate, mockTimeline);

      // 17 days since planting puts us 10 days into seedling stage (after 7-day germination)
      // 10 days into 14-day seedling stage = 10/14 = ~71.43%
      expect(progress).toBeCloseTo(71.43, 1);
    });
  });

  describe("getNextStage", () => {
    it("returns the correct next stage", () => {
      expect(getNextStage("germination")).toBe("seedling");
      expect(getNextStage("seedling")).toBe("vegetative");
      expect(getNextStage("vegetative")).toBe("flowering");
      // ✅ Fix: According to the actual implementation, flowering → maturation
      expect(getNextStage("flowering")).toBe("maturation");
      expect(getNextStage("maturation")).toBe("ongoing-production");
      expect(getNextStage("ongoing-production")).toBe("harvest");
    });

    it("returns null for the final stage", () => {
      expect(getNextStage("harvest")).toBe(null);
    });

    it("handles invalid stages gracefully", () => {
      expect(getNextStage(undefined as unknown as GrowthStage)).toBe(null);
      const invalidStage = "not-a-real-stage" as unknown as GrowthStage;
      expect(getNextStage(invalidStage)).toBe(null);
    });
  });

  describe("estimateStageTransition", () => {
    it("estimates correct transition dates", () => {
      const plantedDate = new Date("2024-01-01");

      const floweringDate = estimateStageTransition(
        plantedDate,
        mockTimeline,
        "flowering"
      );
      expect(floweringDate).toEqual(new Date("2024-02-12")); // 42 days later
    });

    it("handles new stage types", () => {
      const plantedDate = new Date("2024-01-01");

      const ongoingProductionDate = estimateStageTransition(
        plantedDate,
        mockTimeline,
        "ongoing-production"
      );
      expect(ongoingProductionDate).toEqual(new Date("2024-03-01")); // 60 days later

      const harvestDate = estimateStageTransition(
        plantedDate,
        mockTimeline,
        "harvest"
      );
      expect(harvestDate).toEqual(new Date("2024-03-01")); // 60 days later
    });
  });

  describe("integration tests with real variety data", () => {
    it("correctly handles Albion strawberry timeline", () => {
      const plantedDate = new Date("2024-01-01");

      // Test specific day scenarios
      const testCases = [
        { days: 10, expected: "germination" },
        { days: 20, expected: "seedling" },
        { days: 50, expected: "vegetative" },
        { days: 87, expected: "flowering" },
        { days: 103, expected: "ongoing-production" }, // The original bug scenario!
      ];

      testCases.forEach(({ days, expected }) => {
        const currentDate = new Date(plantedDate);
        currentDate.setDate(currentDate.getDate() + days);

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockEverbearingVariety,
          currentDate
        );
        expect(stage).toBe(expected);
      });
    });
  });

  describe("calculateCurrentStageWithVariety (enhanced function)", () => {
    describe("everbearing plants", () => {
      it("returns ongoing-production for everbearing plants after maturation", () => {
        const plantedDate = new Date("2024-01-01");
        const currentDate = new Date("2024-04-01"); // 91 days (past 90-day maturation)

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockEverbearingVariety,
          currentDate
        );
        expect(stage).toBe("ongoing-production");
      });

      it("eventually transitions to harvest after productive lifespan", () => {
        const plantedDate = new Date("2024-01-01");
        const currentDate = new Date("2026-01-05"); // Past 2-year productive lifespan

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockEverbearingVariety,
          currentDate
        );
        expect(stage).toBe("harvest");
      });
    });

    describe("non-everbearing plants", () => {
      it("returns harvest for non-everbearing plants after maturation", () => {
        const plantedDate = new Date("2024-01-01");
        const currentDate = new Date("2024-03-10"); // 70 days (past 65-day maturation)

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockNonEverbearingVariety,
          currentDate
        );
        expect(stage).toBe("harvest");
      });
    });
  });
});
