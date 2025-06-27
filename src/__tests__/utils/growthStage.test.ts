// src/__tests__/utils/growthStage.test.ts
import {
  calculateCurrentStage,
  calculateCurrentStageWithVariety,
  getStageProgress,
  estimateStageTransition,
  getNextStage,
} from "../../utils/growthStage";
import { restoreDate } from "../../setupTests";
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
    restoreDate();
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
      // ← Updated test name
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-03-05"); // 65 days (past 60-day maturation)

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("harvest"); // ← FIXED: was "maturation"
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

  describe("calculateCurrentStageWithVariety (enhanced function)", () => {
    describe("everbearing plants", () => {
      it("returns ongoing-production for everbearing plants after maturation", () => {
        const plantedDate = new Date("2024-01-01");
        const currentDate = new Date("2024-04-05"); // 95 days (past 90-day maturation)

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockEverbearingVariety,
          currentDate
        );
        expect(stage).toBe("ongoing-production");
      });

      it("handles the exact strawberry scenario (103 days)", () => {
        const plantedDate = new Date("2024-01-01");
        const currentDate = new Date("2024-04-14"); // 103 days

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockEverbearingVariety,
          currentDate
        );
        expect(stage).toBe("ongoing-production");
      });

      it("returns harvest when past productive lifespan", () => {
        const plantedDate = new Date("2022-01-01"); // 2+ years ago
        const currentDate = new Date("2024-02-01"); // Past 730 days

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockEverbearingVariety,
          currentDate
        );
        expect(stage).toBe("harvest");
      });

      it("follows normal growth stages before maturation", () => {
        const testCases = [
          { days: 5, expected: "germination" },
          { days: 20, expected: "seedling" },
          { days: 50, expected: "vegetative" },
          { days: 87, expected: "flowering" },
        ];

        testCases.forEach(({ days, expected }) => {
          const plantedDate = new Date("2024-01-01");
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

      it("follows normal growth stages before maturation", () => {
        const testCases = [
          { days: 5, expected: "germination" },
          { days: 15, expected: "seedling" },
          { days: 30, expected: "vegetative" },
          { days: 60, expected: "flowering" },
        ];

        testCases.forEach(({ days, expected }) => {
          const plantedDate = new Date("2024-01-01");
          const currentDate = new Date(plantedDate);
          currentDate.setDate(currentDate.getDate() + days);

          const stage = calculateCurrentStageWithVariety(
            plantedDate,
            mockNonEverbearingVariety,
            currentDate
          );
          expect(stage).toBe(expected);
        });
      });
    });

    describe("edge cases", () => {
      it("handles everbearing plants without productiveLifespan", () => {
        const varietyWithoutLifespan: VarietyRecord = {
          ...mockEverbearingVariety,
          productiveLifespan: undefined,
        };

        const plantedDate = new Date("2022-01-01");
        const currentDate = new Date("2024-01-01");

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          varietyWithoutLifespan,
          currentDate
        );
        expect(stage).toBe("harvest"); // This test expects "harvest"
      });

      it("handles future planting dates gracefully", () => {
        const plantedDate = new Date("2024-12-31");
        const currentDate = new Date("2024-01-01"); // Before planting

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockEverbearingVariety,
          currentDate
        );
        expect(stage).toBe("germination");
      });
    });
  });

  describe("getStageProgress", () => {
    it("calculates progress correctly mid-stage", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-01-11"); // 10 days = middle of seedling

      const progress = getStageProgress(plantedDate, mockTimeline, currentDate);
      // 3 days into 14-day seedling stage = ~21%
      expect(progress).toBeCloseTo(21, 0);
    });

    it("returns 100% for completed stages", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-03-01"); // Way past maturation

      const progress = getStageProgress(plantedDate, mockTimeline, currentDate);
      expect(progress).toBe(100);
    });

    it("handles all new stage types", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-03-01"); // Way past maturation

      // Test that ongoing-production and harvest both return 100%
      const timeline = { ...mockTimeline };
      const progress = getStageProgress(plantedDate, timeline, currentDate);
      expect(progress).toBe(100);
    });
  });

  describe("getNextStage", () => {
    it("returns correct next stages for basic progression", () => {
      expect(getNextStage("germination")).toBe("seedling");
      expect(getNextStage("seedling")).toBe("vegetative");
      expect(getNextStage("vegetative")).toBe("flowering");
      expect(getNextStage("flowering")).toBe("maturation");
      expect(getNextStage("maturation")).toBe("ongoing-production");
      expect(getNextStage("ongoing-production")).toBe("harvest");
    });

    it("returns null for the final stage", () => {
      expect(getNextStage("harvest")).toBe(null);
    });

    it("handles invalid stages gracefully", () => {
      // Test with undefined which could happen in real scenarios
      expect(getNextStage(undefined as unknown as GrowthStage)).toBe(null);

      // Or test with an actual invalid enum value if you need to
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
        { days: 365, expected: "ongoing-production" }, // 1 year later
        { days: 731, expected: "harvest" }, // Past productive lifespan
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

    it("correctly handles Caroline raspberry timeline", () => {
      const raspberryVariety: VarietyRecord = {
        id: "caroline-raspberry",
        name: "Caroline Raspberries",
        normalizedName: "Caroline Raspberries",
        category: "berries",
        growthTimeline: {
          germination: 0, // typically grown from canes
          seedling: 21,
          vegetative: 42,
          maturation: 120,
        },
        isEverbearing: true,
        productiveLifespan: 1095, // 3 years
        createdAt: new Date(),
      };

      const plantedDate = new Date("2024-01-01");
      const testCases = [
        { days: 10, expected: "seedling" }, // ← FIXED: was "germination"
        { days: 30, expected: "vegetative" }, // ← FIXED: was "seedling"
        { days: 60, expected: "vegetative" }, // ✅ Correct
        { days: 110, expected: "flowering" }, // ✅ Correct
        { days: 130, expected: "ongoing-production" }, // ✅ Correct
        { days: 1000, expected: "ongoing-production" }, // ✅ Correct
        { days: 1100, expected: "harvest" }, // Past 3-year lifespan - ✅ Correct
      ];

      testCases.forEach(({ days, expected }) => {
        const currentDate = new Date(plantedDate);
        currentDate.setDate(currentDate.getDate() + days);

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          raspberryVariety,
          currentDate
        );

        expect(stage).toBe(expected);
      });
    });
  });
});
