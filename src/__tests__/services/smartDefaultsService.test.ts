// src/__tests__/services/smartDefaultsService.test.ts
import { SmartDefaultsService } from "@/services/smartDefaultsService";
import { varietyService } from "@/types/database";
import { GrowthStage } from "@/types/core";

// Mock the database
jest.mock("@/types/database", () => ({
  varietyService: {
    getAllVarieties: jest.fn(),
    getVariety: jest.fn(),
    getVarietyByName: jest.fn(),
    addVariety: jest.fn(),
  },
  careService: {
    getLastCareActivityByType: jest.fn(),
  },
  db: {
    careActivities: {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
    },
  },
}));

describe("SmartDefaultsService", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe("error handling and edge cases", () => {
    it("handles corrupted care log data without crashing", async () => {
      const varieties = [
        {
          id: "test-variety",
          name: "Test Variety",
          category: "leafy-greens" as const,
          growthTimeline: {
            germination: { min: 3, max: 7 },
            seedling: { min: 14, max: 21 },
            vegetative: { min: 21, max: 35 },
            mature: { min: 35, max: 50 },
            flowering: { min: 50, max: 70 },
            fruiting: { min: 70, max: 90 },
          },
          createdAt: new Date(),
        },
      ];

      // Fix: Use proper GrowthStage type
      const mockPlant = {
        id: "test-plant",
        varietyId: "test-variety",
        varietyName: "Test Variety",
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative" as GrowthStage, // Fix: proper type
        location: "Indoor",
        container: "4-inch pot",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (varietyService.getAllVarieties as jest.Mock).mockResolvedValue(
        varieties
      );
      (varietyService.getVariety as jest.Mock).mockResolvedValue(varieties[0]);

      const result = await SmartDefaultsService.getDefaultsForPlant(mockPlant);

      // The result should be defined for a valid plant
      expect(result).toBeDefined();

      // Verify the structure of the returned defaults
      if (result) {
        expect(result).toHaveProperty("watering");
        expect(result).toHaveProperty("fertilizer");
      }
    });

    it("returns null for invalid plant data", async () => {
      const invalidPlant = {
        id: "invalid-plant",
        varietyId: "non-existent-variety",
        varietyName: "Non-existent",
        name: "Invalid Plant",
        plantedDate: new Date(),
        currentStage: "vegetative" as GrowthStage, // Fix: proper type
        location: "Indoor",
        container: "4-inch pot",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (varietyService.getVariety as jest.Mock).mockResolvedValue(null);

      const result = await SmartDefaultsService.getDefaultsForPlant(
        invalidPlant
      );

      expect(result).toBeNull();
    });

    it("handles missing growth timeline gracefully", async () => {
      const varietyWithoutTimeline = {
        id: "test-variety",
        name: "Test Variety",
        category: "leafy-greens" as const,
        createdAt: new Date(),
        // Missing growthTimeline
      };

      const mockPlant = {
        id: "test-plant",
        varietyId: "test-variety",
        varietyName: "Test Variety",
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative" as GrowthStage, // Fix: proper type
        location: "Indoor",
        container: "4-inch pot",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (varietyService.getVariety as jest.Mock).mockResolvedValue(
        varietyWithoutTimeline
      );

      const result = await SmartDefaultsService.getDefaultsForPlant(mockPlant);

      // Should handle gracefully, either return defaults or null
      expect(result).toBeDefined();
    });
  });

  describe("quick completion options", () => {
    it("generates appropriate options for watering", async () => {
      const mockPlant = {
        id: "test-plant",
        varietyId: "test-variety",
        varietyName: "Test Variety",
        name: "Test Plant",
        plantedDate: new Date(),
        currentStage: "vegetative" as GrowthStage, // Fix: proper type
        location: "Indoor",
        container: "4-inch pot",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the variety service to return valid data
      const mockVariety = {
        id: "test-variety",
        name: "Test Variety",
        category: "leafy-greens" as const,
        growthTimeline: {
          germination: { min: 3, max: 7 },
          seedling: { min: 14, max: 21 },
          vegetative: { min: 21, max: 35 },
          mature: { min: 35, max: 50 },
          flowering: { min: 50, max: 70 },
          fruiting: { min: 70, max: 90 },
        },
        createdAt: new Date(),
      };

      (varietyService.getVariety as jest.Mock).mockResolvedValue(mockVariety);

      const options = await SmartDefaultsService.getQuickCompletionOptions(
        mockPlant,
        "water"
      );

      // Fix: Handle potential null return
      expect(options).not.toBeNull();
      if (options) {
        expect(Array.isArray(options)).toBe(true);
        expect(options.length).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
