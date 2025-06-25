// src/__tests__/utils/plantRegistration.test.ts
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";

describe("Plant Registration Utils", () => {
  const mockVariety = {
    id: "test-variety",
    name: "Test Plant",
    category: "herbs" as const,
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      maturation: 45,
    },
    createdAt: new Date(),
  };

  describe("calculateCurrentStageWithVariety", () => {
    it("calculates germination stage correctly", () => {
      const plantedDate = new Date();
      plantedDate.setDate(plantedDate.getDate() - 3); // 3 days ago

      const stage = calculateCurrentStageWithVariety(plantedDate, mockVariety);
      expect(stage).toBe("germination");
    });

    it("calculates seedling stage correctly", () => {
      const plantedDate = new Date();
      plantedDate.setDate(plantedDate.getDate() - 10); // 10 days ago

      const stage = calculateCurrentStageWithVariety(plantedDate, mockVariety);
      expect(stage).toBe("seedling");
    });

    it("calculates vegetative stage correctly", () => {
      const plantedDate = new Date();
      plantedDate.setDate(plantedDate.getDate() - 25); // 25 days ago

      const stage = calculateCurrentStageWithVariety(plantedDate, mockVariety);
      expect(stage).toBe("vegetative");
    });

    it("handles invalid variety gracefully", () => {
      const plantedDate = new Date();
      const stage = calculateCurrentStageWithVariety(plantedDate, null);
      expect(stage).toBe("vegetative"); // fallback stage
    });
  });
});
