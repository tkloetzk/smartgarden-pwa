import { WateringResolver } from "@/utils/wateringResolver";
import { CareActivityRecord, CareActivityType, ApplicationMethod, VolumeUnit } from "@/types";

describe("WateringResolver", () => {
  const mockPlantId = "test-plant-123";

  // Helper to create mock care activities
  const createMockActivity = (
    type: CareActivityType,
    date: Date,
    applicationMethod?: ApplicationMethod,
    amount?: string | { value: number; unit: VolumeUnit }
  ): CareActivityRecord => ({
    id: `activity-${Date.now()}`,
    plantId: mockPlantId,
    type,
    date,
    details: {
      type,
      applicationMethod,
      amount,
    },
    createdAt: date,
    updatedAt: date,
  });

  describe("getLastWateringActivity", () => {
    it("should return the most recent watering activity when no fertilizing", async () => {
      const wateringDate = new Date("2024-01-15");
      const wateringActivity = createMockActivity("water", wateringDate);

      const mockGetLastActivity = jest.fn()
        .mockImplementation((_plantId: string, type: CareActivityType) => {
          if (type === "water") return Promise.resolve(wateringActivity);
          if (type === "fertilize") return Promise.resolve(null);
          return Promise.resolve(null);
        });

      const result = await WateringResolver.getLastWateringActivity(
        mockPlantId,
        mockGetLastActivity
      );

      expect(result).toBe(wateringActivity);
      expect(mockGetLastActivity).toHaveBeenCalledWith(mockPlantId, "water");
      expect(mockGetLastActivity).toHaveBeenCalledWith(mockPlantId, "fertilize");
    });

    it("should return fertilizing activity when it's more recent and water-based", async () => {
      const wateringDate = new Date("2024-01-10");
      const fertilizingDate = new Date("2024-01-15");
      
      const wateringActivity = createMockActivity("water", wateringDate);
      const fertilizingActivity = createMockActivity(
        "fertilize", 
        fertilizingDate, 
        "soil-drench", 
        { value: 250, unit: "ml" as VolumeUnit }
      );

      const mockGetLastActivity = jest.fn()
        .mockImplementation((_plantId: string, type: CareActivityType) => {
          if (type === "water") return Promise.resolve(wateringActivity);
          if (type === "fertilize") return Promise.resolve(fertilizingActivity);
          return Promise.resolve(null);
        });

      const result = await WateringResolver.getLastWateringActivity(
        mockPlantId,
        mockGetLastActivity
      );

      expect(result).toBe(fertilizingActivity);
    });

    it("should return more recent fertilizing activity when both exist and fertilizing counts as watering", async () => {
      const wateringDate = new Date("2024-01-10");
      const fertilizingDate = new Date("2024-01-15");
      
      const wateringActivity = createMockActivity("water", wateringDate);
      // All current fertilizer methods require water, so this should count
      const fertilizingActivity = createMockActivity(
        "fertilize", 
        fertilizingDate, 
        "top-dress", // Even granular methods need to be watered in
        "1 tablespoon granular fertilizer"
      );

      const mockGetLastActivity = jest.fn()
        .mockImplementation((_plantId: string, type: CareActivityType) => {
          if (type === "water") return Promise.resolve(wateringActivity);
          if (type === "fertilize") return Promise.resolve(fertilizingActivity);
          return Promise.resolve(null);
        });

      const result = await WateringResolver.getLastWateringActivity(
        mockPlantId,
        mockGetLastActivity
      );

      // Should return fertilizing activity since it's more recent and counts as watering
      expect(result).toBe(fertilizingActivity);
    });

    it("should return fertilizing activity when no watering exists but fertilizing counts", async () => {
      const fertilizingDate = new Date("2024-01-15");
      const fertilizingActivity = createMockActivity(
        "fertilize", 
        fertilizingDate, 
        "soil-drench", 
        "200ml fish emulsion"
      );

      const mockGetLastActivity = jest.fn()
        .mockImplementation((_plantId: string, type: CareActivityType) => {
          if (type === "water") return Promise.resolve(null);
          if (type === "fertilize") return Promise.resolve(fertilizingActivity);
          return Promise.resolve(null);
        });

      const result = await WateringResolver.getLastWateringActivity(
        mockPlantId,
        mockGetLastActivity
      );

      expect(result).toBe(fertilizingActivity);
    });
  });

  describe("getWaterFromFertilizing", () => {
    it("should extract water amount from fertilizing activity", () => {
      const fertilizingActivity = createMockActivity(
        "fertilize", 
        new Date(), 
        "soil-drench", 
        { value: 250, unit: "ml" }
      );

      const result = WateringResolver.getWaterFromFertilizing(fertilizingActivity);

      expect(result).toEqual({ amount: 250, unit: "ml" });
    });

    it("should parse string amounts", () => {
      const fertilizingActivity = createMockActivity(
        "fertilize", 
        new Date(), 
        "foliar-spray", 
        "100 ml"
      );

      const result = WateringResolver.getWaterFromFertilizing(fertilizingActivity);

      expect(result).toEqual({ amount: 100, unit: "ml" });
    });

    it("should return null for non-fertilizing activities", () => {
      const wateringActivity = createMockActivity("water", new Date());

      const result = WateringResolver.getWaterFromFertilizing(wateringActivity);

      expect(result).toBeNull();
    });

    it("should provide fallback estimates based on method", () => {
      const fertilizingActivity = createMockActivity(
        "fertilize", 
        new Date(), 
        "soil-drench"
        // No amount specified
      );

      const result = WateringResolver.getWaterFromFertilizing(fertilizingActivity);

      expect(result).toEqual({ amount: 250, unit: "ml" });
    });
  });
});