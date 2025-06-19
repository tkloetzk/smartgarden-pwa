// src/__tests__/utils/growthStage.test.ts
import {
  calculateCurrentStage,
  getStageProgress,
  estimateStageTransition,
  // getNextStage,
} from "../../utils/growthStage";
import { restoreDate } from "../../setupTests";

describe("Growth Stage Utilities", () => {
  const mockTimeline = {
    germination: 7,
    seedling: 14,
    vegetative: 21,
    maturation: 60,
  };

  beforeEach(() => {
    restoreDate();
  });

  describe("calculateCurrentStage", () => {
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
  });
});
