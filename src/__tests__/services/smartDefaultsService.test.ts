// src/__tests__/services/smartDefaultsService.test.ts
import { SmartDefaultsService } from "@/services/smartDefaultsService";
import { varietyService } from "@/types/database";
import { calculateCurrentStage } from "@/utils/growthStage";
import { GrowthStage } from "@/types";
import { VarietyRecord } from "@/types/database";

// Import the centralized factories
import {
  createMockPlant,
  createMockVariety,
} from "../test-utils";

// Mock the database service and utility
jest.mock("@/types/database", () => ({
  varietyService: {
    getVariety: jest.fn(),
  },
}));

jest.mock("@/utils/growthStage", () => ({
  calculateCurrentStage: jest.fn(),
}));

// Mock WateringResolver since the service now uses it
jest.mock("@/utils/wateringResolver", () => ({
  WateringResolver: {
    resolveWateringAmount: jest.fn(),
  },
}));

// Mock the Logger utility
jest.mock("@/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    service: jest.fn(),
    database: jest.fn(),
    growthStage: jest.fn(),
  },
}));

const mockVarietyService = varietyService as jest.Mocked<typeof varietyService>;
const mockCalculateCurrentStage = calculateCurrentStage as jest.Mock;

// Import the mocked WateringResolver and Logger
import { WateringResolver } from "@/utils/wateringResolver";
import { Logger } from "@/utils/logger";
const mockWateringResolver = WateringResolver as jest.Mocked<
  typeof WateringResolver
>;
const mockLogger = Logger as jest.Mocked<typeof Logger>;

describe("SmartDefaultsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateCurrentStage.mockReturnValue("vegetative");

    // Set up default WateringResolver mock behavior
    mockWateringResolver.resolveWateringAmount.mockReturnValue({
      amount: 16,
      unit: "oz",
      confidence: "medium",
      source: "category",
      reasoning: "Based on category guidelines for vegetative stage",
    });
  });

  describe("getDefaultsForPlant", () => {
    it("should return protocol-based defaults with high confidence", async () => {
      const plant = createMockPlant();
      const variety = createMockVariety({
        protocols: {
          watering: {
            vegetative: { volume: { amount: 20, unit: "oz" } },
          },
          fertilization: {
            vegetative: {
              fertilizer: { product: "Miracle-Gro All Purpose" },
              application: {
                dilution: "1 tsp per gallon",
                amount: "Apply to runoff",
                method: "soil-drench",
              },
            },
          },
        } as VarietyRecord["protocols"],
      });

      mockVarietyService.getVariety.mockResolvedValue(variety);
      mockCalculateCurrentStage.mockReturnValue("vegetative");

      // Mock high-confidence protocol-based response
      mockWateringResolver.resolveWateringAmount.mockReturnValue({
        amount: 20,
        unit: "oz",
        confidence: "high",
        source: "protocol",
        reasoning: "Based on Test Variety protocol for vegetative stage",
      });

      const result = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(result?.watering).toEqual({
        suggestedAmount: 20,
        unit: "oz",
        confidence: "high",
        source: "protocol",
        reasoning: "Based on Test Variety protocol for vegetative stage",
      });

      expect(result?.fertilizer).toEqual({
        products: [
          {
            name: "Miracle-Gro All Purpose",
            dilution: "1 tsp per gallon",
            amount: "Apply to runoff",
            method: "soil-drench",
            confidence: "high",
          },
        ],
        source: "protocol",
        reasoning:
          "Based on Test Variety fertilization protocol for vegetative stage",
      });
    });

    it("should fallback to category defaults with medium confidence", async () => {
      const plant = createMockPlant();
      const variety = createMockVariety({
        category: "fruiting-plants",
        protocols: undefined,
      });

      mockVarietyService.getVariety.mockResolvedValue(variety);
      mockCalculateCurrentStage.mockReturnValue("flowering");

      // Mock category-based response
      mockWateringResolver.resolveWateringAmount.mockReturnValue({
        amount: 28,
        unit: "oz",
        confidence: "medium",
        source: "category",
        reasoning:
          "Based on fruiting-plants category guidelines for flowering stage",
      });

      const result = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(result?.watering).toEqual({
        suggestedAmount: 28,
        unit: "oz",
        confidence: "medium",
        source: "category",
        reasoning:
          "Based on fruiting-plants category guidelines for flowering stage",
      });

      expect(result?.fertilizer).toEqual({
        products: [
          {
            name: "Bloom booster",
            dilution: "Full strength",
            amount: "Apply bi-weekly",
            confidence: "medium",
          },
        ],
        source: "category",
        reasoning: "General fruiting-plants fertilization guidelines",
      });
    });

    it("should provide universal defaults when category not recognized", async () => {
      const plant = createMockPlant();
      const variety = createMockVariety({
        // @ts-expect-error Testing invalid category
        category: "unknown-category",
        protocols: undefined,
      });

      mockVarietyService.getVariety.mockResolvedValue(variety);
      mockCalculateCurrentStage.mockReturnValue("vegetative");

      // Mock universal fallback response
      mockWateringResolver.resolveWateringAmount.mockReturnValue({
        amount: 16,
        unit: "oz",
        confidence: "low",
        source: "universal",
        reasoning: "Using universal default amount",
      });

      const result = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(result?.watering).toEqual({
        suggestedAmount: 16,
        unit: "oz",
        confidence: "low",
        source: "universal",
        reasoning: "Using universal default amount",
      });

      expect(result?.fertilizer).toBeUndefined();
    });

    it("should handle variety not found gracefully", async () => {
      const plant = createMockPlant();
      mockVarietyService.getVariety.mockResolvedValue(undefined);

      const result = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(result).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      const plant = createMockPlant();
      mockVarietyService.getVariety.mockRejectedValue(
        new Error("Database error")
      );

      const result = await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to get defaults for plant:",
        expect.any(Error)
      );
    });
  });

  describe("fertilizer recommendations", () => {
    it("should provide stage-specific fertilizer recommendations for fruiting plants", async () => {
      const plant = createMockPlant();
      const variety = createMockVariety({
        category: "fruiting-plants",
        protocols: undefined,
      });

      mockVarietyService.getVariety.mockResolvedValue(variety);

      const testCases = [
        {
          stage: "flowering",
          expectedProduct: "Bloom booster",
          expectedDilution: "Full strength",
          expectedAmount: "Apply bi-weekly",
        },
        {
          stage: "fruiting",
          expectedProduct: "Potassium-rich fertilizer",
          expectedDilution: "Full strength",
          expectedAmount: "Apply weekly",
        },
      ];

      for (const {
        stage,
        expectedProduct,
        expectedDilution,
        expectedAmount,
      } of testCases) {
        mockCalculateCurrentStage.mockReturnValue(stage as GrowthStage);

        const result = await SmartDefaultsService.getDefaultsForPlant(plant);

        expect(result?.fertilizer?.products?.[0]).toEqual({
          name: expectedProduct,
          dilution: expectedDilution,
          amount: expectedAmount,
          confidence: "medium",
        });
        expect(result?.fertilizer?.source).toBe("category");
      }
    });

    it("should handle empty fertilization protocol", async () => {
      const plant = createMockPlant();
      const variety = createMockVariety({
        category: "herbs",
        protocols: {
          fertilization: {
            vegetative: {}, // Empty fertilization protocol
          },
        } as VarietyRecord["protocols"],
      });

      mockVarietyService.getVariety.mockResolvedValue(variety);
      mockCalculateCurrentStage.mockReturnValue("vegetative");

      const result = await SmartDefaultsService.getDefaultsForPlant(plant);

      // Should fallback to category defaults
      expect(result?.fertilizer).toEqual({
        products: [
          {
            name: "Light liquid fertilizer",
            dilution: "Quarter strength",
            amount: "Apply monthly",
            confidence: "medium",
          },
        ],
        source: "category",
        reasoning: "General herbs fertilization guidelines",
      });
    });
  });

  describe("integration with WateringResolver", () => {
    it("should call WateringResolver.resolveWateringAmount correctly", async () => {
      const plant = createMockPlant();
      const variety = createMockVariety();

      mockVarietyService.getVariety.mockResolvedValue(variety);
      mockCalculateCurrentStage.mockReturnValue("vegetative");

      await SmartDefaultsService.getDefaultsForPlant(plant);

      expect(mockWateringResolver.resolveWateringAmount).toHaveBeenCalledWith(
        variety,
        "vegetative"
      );
    });
  });
});
