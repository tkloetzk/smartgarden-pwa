// Unit test for fertilizer water dual logging functionality
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { requiresWater, getWaterAmountForMethod } from "@/utils/fertilizationUtils";
import { ApplicationMethod } from "@/types";

describe("Fertilizer Water Dual Logging Integration", () => {
  describe("requiresWater utility", () => {
    it("should return true for all application methods (all fertilizers need water)", () => {
      const methods: ApplicationMethod[] = ["soil-drench", "foliar-spray", "top-dress", "side-dress"];
      
      methods.forEach(method => {
        expect(requiresWater(method)).toBe(true);
      });
      
      // Also test with all valid methods plus string casting for edge cases
      expect(requiresWater("mix-in-soil")).toBe(true);
      expect(requiresWater("" as any)).toBe(true);
    });
  });

  describe("getWaterAmountForMethod utility", () => {
    it("should return appropriate water amounts for different application methods", () => {
      expect(getWaterAmountForMethod("soil-drench")).toEqual({ amount: 250, unit: "ml" });
      expect(getWaterAmountForMethod("foliar-spray")).toEqual({ amount: 100, unit: "ml" });
      expect(getWaterAmountForMethod("top-dress")).toEqual({ amount: 200, unit: "ml" });
      expect(getWaterAmountForMethod("side-dress")).toEqual({ amount: 200, unit: "ml" });
    });

    it("should use provided fertilizer amount when available", () => {
      expect(getWaterAmountForMethod("soil-drench", 500)).toEqual({ amount: 500, unit: "ml" });
      expect(getWaterAmountForMethod("foliar-spray", 50)).toEqual({ amount: 50, unit: "ml" });
    });

    it("should handle unknown methods with default amount", () => {
      expect(getWaterAmountForMethod("mix-in-soil")).toEqual({ amount: 150, unit: "ml" });
      expect(getWaterAmountForMethod("" as any)).toEqual({ amount: 150, unit: "ml" });
    });
  });

  describe("fertilizer water logging workflow", () => {
    const mockLogActivity = jest.fn() as jest.MockedFunction<any>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockLogActivity.mockResolvedValue(undefined);
    });

    it("should simulate dual logging for liquid fertilizer (soil-drench)", async () => {
      const plantId = "test-plant-1";
      const fertilizerMethod: ApplicationMethod = "soil-drench";
      const fertilizerAmount = 150;
      const date = new Date();

      // Simulate fertilizer activity details
      const fertilizerDetails = {
        type: "fertilize" as const,
        fertilizer: "Fish Emulsion",
        method: fertilizerMethod,
        amount: { value: fertilizerAmount, unit: "ml" },
        notes: "Regular feeding"
      };

      // Simulate logging the fertilizer activity
      await mockLogActivity({
        plantId,
        type: "fertilize",
        date,
        details: fertilizerDetails,
      });

      // Check if fertilizer requires water (should be true)
      const needsWater = requiresWater(fertilizerMethod);
      expect(needsWater).toBe(true);

      // If it requires water, calculate appropriate amount
      if (needsWater) {
        const { amount: waterAmount, unit: waterUnit } = getWaterAmountForMethod(
          fertilizerMethod, 
          fertilizerAmount
        );

        // Simulate logging the automatic water activity
        await mockLogActivity({
          plantId,
          type: "water",
          date,
          details: {
            type: "water" as const,
            amount: { value: waterAmount, unit: waterUnit },
            notes: `Watered in fertilizer (Soil Drench)`,
          },
        });
      }

      // Verify both activities were logged
      expect(mockLogActivity).toHaveBeenCalledTimes(2);
      
      // Verify fertilizer activity
      expect(mockLogActivity).toHaveBeenNthCalledWith(1, {
        plantId: "test-plant-1",
        type: "fertilize",
        date: expect.any(Date),
        details: expect.objectContaining({
          type: "fertilize",
          fertilizer: "Fish Emulsion",
          method: "soil-drench"
        }),
      });
      
      // Verify water activity  
      expect(mockLogActivity).toHaveBeenNthCalledWith(2, {
        plantId: "test-plant-1",
        type: "water",
        date: expect.any(Date),
        details: expect.objectContaining({
          type: "water",
          amount: { value: 150, unit: "ml" }, // Uses provided fertilizer amount
          notes: expect.stringContaining("Watered in fertilizer")
        }),
      });
    });

    it("should simulate dual logging for granular fertilizer (top-dress)", async () => {
      const plantId = "test-plant-2";
      const fertilizerMethod: ApplicationMethod = "top-dress";
      const date = new Date();

      // Simulate fertilizer activity details (no amount provided)
      const fertilizerDetails = {
        type: "fertilize" as const,
        fertilizer: "Kelp Meal",
        method: fertilizerMethod,
        notes: "Granular fertilizer application"
      };

      // Simulate logging the fertilizer activity
      await mockLogActivity({
        plantId,
        type: "fertilize",
        date,
        details: fertilizerDetails,
      });

      // Check if fertilizer requires water (should be true)
      const needsWater = requiresWater(fertilizerMethod);
      expect(needsWater).toBe(true);

      // Calculate water amount for granular fertilizer
      if (needsWater) {
        const { amount: waterAmount, unit: waterUnit } = getWaterAmountForMethod(fertilizerMethod);

        // Simulate logging the automatic water activity
        await mockLogActivity({
          plantId,
          type: "water",
          date,
          details: {
            type: "water" as const,
            amount: { value: waterAmount, unit: waterUnit },
            notes: `Watered in fertilizer (Top Dress)`,
          },
        });
      }

      // Verify both activities were logged
      expect(mockLogActivity).toHaveBeenCalledTimes(2);
      
      // Verify water activity uses default amount for top-dress (200ml)
      expect(mockLogActivity).toHaveBeenNthCalledWith(2, {
        plantId: "test-plant-2",
        type: "water",
        date: expect.any(Date),
        details: expect.objectContaining({
          type: "water",
          amount: { value: 200, unit: "ml" }, // Default for top-dress
          notes: expect.stringContaining("Top Dress")
        }),
      });
    });

    it("should simulate dual logging for all fertilizer methods", async () => {
      const methods: ApplicationMethod[] = ["soil-drench", "foliar-spray", "top-dress", "side-dress"];
      const plantId = "test-plant-3";
      const date = new Date();

      for (const method of methods) {
        // Clear previous calls
        mockLogActivity.mockClear();

        // Simulate fertilizer activity
        await mockLogActivity({
          plantId,
          type: "fertilize",
          date,
          details: {
            type: "fertilize" as const,
            fertilizer: "Test Fertilizer",
            method,
            notes: `Testing ${method} method`
          },
        });

        // All methods should require water now
        expect(requiresWater(method)).toBe(true);

        // Simulate automatic water logging
        const { amount: waterAmount, unit: waterUnit } = getWaterAmountForMethod(method);
        await mockLogActivity({
          plantId,
          type: "water",
          date,
          details: {
            type: "water" as const,
            amount: { value: waterAmount, unit: waterUnit },
            notes: `Watered in fertilizer`,
          },
        });

        // Each method should log both fertilizer and water
        expect(mockLogActivity).toHaveBeenCalledTimes(2);
      }
    });
  });
});