// src/__tests__/utils/growthStage.test.ts - Updated test expectations
import {
  calculateCurrentStage,
  calculateCurrentStageWithVariety,
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

  // Updated mock varieties to match actual seed data
  const mockEverbearingVariety: VarietyRecord = {
    id: "albion-strawberry",
    name: "Albion Strawberries",
    normalizedName: "Albion Strawberries",
    category: "berries",
    growthTimeline: {
      germination: 14,
      seedling: 14,
      vegetative: 28,
      flowering: 56,
      fruiting: 91,
      ongoingProduction: 98,
    } as any, // Allow additional stages beyond base GrowthTimeline
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
    jest.useFakeTimers();
  });

  afterEach(() => {
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

    it("returns flowering for late vegetative period", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-02-15"); // 45 days

      const stage = calculateCurrentStage(
        plantedDate,
        mockTimeline,
        currentDate
      );
      expect(stage).toBe("flowering");
    });
  });

  describe("getNextStage", () => {
    it("returns correct next stages", () => {
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
      expect(getNextStage(undefined as unknown as GrowthStage)).toBe(null);
      const invalidStage = "not-a-real-stage" as unknown as GrowthStage;
      expect(getNextStage(invalidStage)).toBe(null);
    });
  });

  describe("calculateCurrentStageWithVariety (enhanced function)", () => {
    describe("everbearing plants", () => {
      it("returns ongoing-production for everbearing plants after all stages", () => {
        const plantedDate = new Date("2024-01-01");
        // After all stages: 14+14+28+56+91+98 = 301 days, so test at 350 days
        const currentDate = new Date("2024-12-16"); // ~350 days

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
        // After all stages: 10+14+21+65 = 110 days, so test at 120 days
        const currentDate = new Date("2024-04-30"); // ~120 days

        const stage = calculateCurrentStageWithVariety(
          plantedDate,
          mockNonEverbearingVariety,
          currentDate
        );
        expect(stage).toBe("harvest");
      });
    });
  });

  describe("integration tests with real variety data", () => {
    it("correctly handles Albion strawberry timeline", () => {
      const plantedDate = new Date("2024-01-01");

      // Updated test cases based on actual Albion strawberry timeline
      const testCases = [
        { days: 10, expected: "germination" }, // 0-14 days
        { days: 20, expected: "seedling" }, // 14-28 days 
        { days: 50, expected: "vegetative" }, // 28-56 days
        { days: 87, expected: "flowering" }, // 56-112 days
        { days: 200, expected: "fruiting" }, // 112-203 days
        { days: 350, expected: "ongoing-production" }, // 203-301 days, within productive lifespan
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
});
