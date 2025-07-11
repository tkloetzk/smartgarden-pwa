import { BulkActivityService, BulkActivityData } from "@/services/bulkActivityService";
import { careService } from "@/types/database";

// Mock the database service
jest.mock("@/types/database", () => ({
  careService: {
    addCareActivity: jest.fn(),
  },
}));

describe("BulkActivityService", () => {
  const mockPlantIds = ["plant-1", "plant-2", "plant-3"];
  const mockCareId = "care-activity-123";

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    
    // Setup default successful responses
    (careService.addCareActivity as jest.Mock).mockResolvedValue(mockCareId);
  });

  describe("logActivityForPlants", () => {
    const mockActivityData: BulkActivityData = {
      type: "water",
      date: new Date("2024-01-15"),
      details: {
        type: "water",
        waterAmount: 16,
        waterUnit: "oz",
      },
    };

    it("logs activity for all plants successfully", async () => {
      const results = await BulkActivityService.logActivityForPlants(
        mockPlantIds,
        mockActivityData
      );

      expect(results).toHaveLength(3);
      expect(results).toEqual([mockCareId, mockCareId, mockCareId]);
      
      expect(careService.addCareActivity).toHaveBeenCalledTimes(3);
      expect(careService.addCareActivity).toHaveBeenCalledWith({
        plantId: "plant-1",
        type: "water",
        date: new Date("2024-01-15"),
        details: {
          type: "water",
          waterAmount: 16,
          waterUnit: "oz",
        },
      });
    });

    it("uses current date when no date provided", async () => {
      const activityWithoutDate: BulkActivityData = {
        type: "fertilize",
        details: {
          type: "fertilize",
          product: "NPK 10-10-10",
        },
      };

      const beforeTime = Date.now();
      await BulkActivityService.logActivityForPlants(
        ["plant-1"],
        activityWithoutDate
      );
      const afterTime = Date.now();

      expect(careService.addCareActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          plantId: "plant-1",
          type: "fertilize",
          date: expect.any(Date),
          details: {
            type: "fertilize",
            product: "NPK 10-10-10",
          },
        })
      );

      const callArgs = (careService.addCareActivity as jest.Mock).mock.calls[0][0];
      const usedDate = callArgs.date.getTime();
      expect(usedDate).toBeGreaterThanOrEqual(beforeTime);
      expect(usedDate).toBeLessThanOrEqual(afterTime);
    });

    it("continues processing other plants when one fails", async () => {
      (careService.addCareActivity as jest.Mock)
        .mockResolvedValueOnce(mockCareId) // plant-1 succeeds
        .mockRejectedValueOnce(new Error("Database error")) // plant-2 fails
        .mockResolvedValueOnce(mockCareId); // plant-3 succeeds

      const results = await BulkActivityService.logActivityForPlants(
        mockPlantIds,
        mockActivityData
      );

      expect(results).toHaveLength(2);
      expect(results).toEqual([mockCareId, mockCareId]);
      expect(careService.addCareActivity).toHaveBeenCalledTimes(3);
      expect(console.error).toHaveBeenCalledWith(
        "Failed to log activity for plant plant-2:",
        expect.any(Error)
      );
    });

    it("returns empty array when all plants fail", async () => {
      (careService.addCareActivity as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const results = await BulkActivityService.logActivityForPlants(
        mockPlantIds,
        mockActivityData
      );

      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
      expect(console.error).toHaveBeenCalledTimes(3);
    });

    it("handles empty plant list", async () => {
      const results = await BulkActivityService.logActivityForPlants(
        [],
        mockActivityData
      );

      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
      expect(careService.addCareActivity).not.toHaveBeenCalled();
    });

    it("preserves activity details structure", async () => {
      const complexActivityData: BulkActivityData = {
        type: "observe",
        date: new Date("2024-01-20"),
        details: {
          type: "observe",
          healthAssessment: "good",
          observations: "New growth visible",
          photos: ["photo1.jpg", "photo2.jpg"],
          notes: "Looking healthy after fertilizing",
        },
      };

      await BulkActivityService.logActivityForPlants(
        ["plant-1"],
        complexActivityData
      );

      expect(careService.addCareActivity).toHaveBeenCalledWith({
        plantId: "plant-1",
        type: "observe",
        date: new Date("2024-01-20"),
        details: {
          type: "observe",
          healthAssessment: "good",
          observations: "New growth visible",
          photos: ["photo1.jpg", "photo2.jpg"],
          notes: "Looking healthy after fertilizing",
        },
      });
    });
  });

  describe("createBulkWateringActivity", () => {
    it("creates basic watering activity data", async () => {
      const result = await BulkActivityService.createBulkWateringActivity(
        16,
        "oz"
      );

      expect(result).toEqual({
        type: "water",
        details: {
          type: "water",
          amount: { value: 16, unit: "oz" },
          moistureLevel: undefined,
          notes: undefined,
        },
      });
    });

    it("creates watering activity with moisture levels", async () => {
      const result = await BulkActivityService.createBulkWateringActivity(
        250,
        "ml",
        3,
        7
      );

      expect(result).toEqual({
        type: "water",
        details: {
          type: "water",
          amount: { value: 250, unit: "ml" },
          moistureLevel: {
            before: 3,
            after: 7,
            scale: "1-10",
          },
          notes: undefined,
        },
      });
    });

    it("creates watering activity with notes", async () => {
      const result = await BulkActivityService.createBulkWateringActivity(
        1,
        "cup",
        undefined,
        undefined,
        "Soil was dry, needed extra water"
      );

      expect(result).toEqual({
        type: "water",
        details: {
          type: "water",
          amount: { value: 1, unit: "cup" },
          moistureLevel: undefined,
          notes: "Soil was dry, needed extra water",
        },
      });
    });

    it("creates watering activity with all parameters", async () => {
      const result = await BulkActivityService.createBulkWateringActivity(
        500,
        "ml",
        2,
        8,
        "Deep watering session"
      );

      expect(result).toEqual({
        type: "water",
        details: {
          type: "water",
          amount: { value: 500, unit: "ml" },
          moistureLevel: {
            before: 2,
            after: 8,
            scale: "1-10",
          },
          notes: "Deep watering session",
        },
      });
    });

    it("skips moisture level when only one value provided", async () => {
      const resultOnlyBefore = await BulkActivityService.createBulkWateringActivity(
        200,
        "ml",
        4,
        undefined
      );

      expect(resultOnlyBefore.details.moistureLevel).toBeUndefined();

      const resultOnlyAfter = await BulkActivityService.createBulkWateringActivity(
        200,
        "ml",
        undefined,
        6
      );

      expect(resultOnlyAfter.details.moistureLevel).toBeUndefined();
    });
  });

  describe("createBulkFertilizeActivity", () => {
    it("creates basic fertilize activity data", async () => {
      const result = await BulkActivityService.createBulkFertilizeActivity(
        "General Hydroponics Flora Series",
        "1:1000",
        "2 cups"
      );

      expect(result).toEqual({
        type: "fertilize",
        details: {
          type: "fertilize",
          product: "General Hydroponics Flora Series",
          dilution: "1:1000",
          amount: "2 cups",
          notes: undefined,
        },
      });
    });

    it("creates fertilize activity with notes", async () => {
      const result = await BulkActivityService.createBulkFertilizeActivity(
        "Miracle-Gro",
        "1 tsp per gallon",
        "1 gallon",
        "First feeding of the season"
      );

      expect(result).toEqual({
        type: "fertilize",
        details: {
          type: "fertilize",
          product: "Miracle-Gro",
          dilution: "1 tsp per gallon",
          amount: "1 gallon",
          notes: "First feeding of the season",
        },
      });
    });

    it("handles empty strings for optional parameters", async () => {
      const result = await BulkActivityService.createBulkFertilizeActivity(
        "NPK 20-20-20",
        "half strength",
        "500ml",
        ""
      );

      expect(result).toEqual({
        type: "fertilize",
        details: {
          type: "fertilize",
          product: "NPK 20-20-20",
          dilution: "half strength",
          amount: "500ml",
          notes: "",
        },
      });
    });
  });

  describe("createBulkObservationActivity", () => {
    it("creates basic observation activity data", async () => {
      const result = await BulkActivityService.createBulkObservationActivity(
        "good",
        "Plants are growing well with new leaves visible"
      );

      expect(result).toEqual({
        type: "observe",
        details: {
          type: "observe",
          healthAssessment: "good",
          observations: "Plants are growing well with new leaves visible",
          notes: undefined,
        },
      });
    });

    it("creates observation activity with notes", async () => {
      const result = await BulkActivityService.createBulkObservationActivity(
        "excellent",
        "Rapid growth, vibrant green color",
        "Best growth I've seen this season"
      );

      expect(result).toEqual({
        type: "observe",
        details: {
          type: "observe",
          healthAssessment: "excellent",
          observations: "Rapid growth, vibrant green color",
          notes: "Best growth I've seen this season",
        },
      });
    });

    it("handles different health assessment levels", async () => {
      const healthLevels: Array<"excellent" | "good" | "fair" | "concerning" | "critical"> = [
        "excellent",
        "good", 
        "fair",
        "concerning",
        "critical"
      ];

      for (const health of healthLevels) {
        const result = await BulkActivityService.createBulkObservationActivity(
          health,
          `Observation for ${health} health`
        );

        expect(result.details.healthAssessment).toBe(health);
        expect(result.details.observations).toBe(`Observation for ${health} health`);
      }
    });

    it("handles empty observations and notes", async () => {
      const result = await BulkActivityService.createBulkObservationActivity(
        "fair",
        "",
        ""
      );

      expect(result).toEqual({
        type: "observe",
        details: {
          type: "observe",
          healthAssessment: "fair",
          observations: "",
          notes: "",
        },
      });
    });
  });

  describe("Activity Type Consistency", () => {
    it("ensures type consistency in watering activity", async () => {
      const result = await BulkActivityService.createBulkWateringActivity(100, "ml");
      
      expect(result.type).toBe("water");
      expect(result.details.type).toBe("water");
    });

    it("ensures type consistency in fertilize activity", async () => {
      const result = await BulkActivityService.createBulkFertilizeActivity(
        "Test Product", 
        "1:1", 
        "1L"
      );
      
      expect(result.type).toBe("fertilize");
      expect(result.details.type).toBe("fertilize");
    });

    it("ensures type consistency in observation activity", async () => {
      const result = await BulkActivityService.createBulkObservationActivity(
        "good", 
        "Test observation"
      );
      
      expect(result.type).toBe("observe");
      expect(result.details.type).toBe("observe");
    });
  });

  describe("Integration Scenarios", () => {
    it("creates and logs watering activity for multiple plants", async () => {
      const wateringData = await BulkActivityService.createBulkWateringActivity(
        200,
        "ml",
        3,
        7,
        "Morning watering"
      );

      const results = await BulkActivityService.logActivityForPlants(
        ["plant-1", "plant-2"],
        wateringData
      );

      expect(results).toHaveLength(2);
      expect(careService.addCareActivity).toHaveBeenCalledTimes(2);
      expect(careService.addCareActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "water",
          details: expect.objectContaining({
            type: "water",
            amount: { value: 200, unit: "ml" },
            moistureLevel: {
              before: 3,
              after: 7,
              scale: "1-10",
            },
            notes: "Morning watering",
          }),
        })
      );
    });

    it("creates and logs fertilize activity for multiple plants", async () => {
      const fertilizeData = await BulkActivityService.createBulkFertilizeActivity(
        "NPK 10-10-10",
        "1:500",
        "1 liter",
        "Weekly feeding"
      );

      const results = await BulkActivityService.logActivityForPlants(
        ["plant-1", "plant-2", "plant-3"],
        fertilizeData
      );

      expect(results).toHaveLength(3);
      expect(careService.addCareActivity).toHaveBeenCalledTimes(3);
      expect(careService.addCareActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "fertilize",
          details: expect.objectContaining({
            type: "fertilize",
            product: "NPK 10-10-10",
            dilution: "1:500",
            amount: "1 liter",
            notes: "Weekly feeding",
          }),
        })
      );
    });

    it("creates and logs observation activity for multiple plants", async () => {
      const observationData = await BulkActivityService.createBulkObservationActivity(
        "excellent",
        "All plants showing great progress",
        "Very pleased with growth rate"
      );

      const results = await BulkActivityService.logActivityForPlants(
        ["plant-1"],
        observationData
      );

      expect(results).toHaveLength(1);
      expect(careService.addCareActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "observe",
          details: expect.objectContaining({
            type: "observe",
            healthAssessment: "excellent",
            observations: "All plants showing great progress",
            notes: "Very pleased with growth rate",
          }),
        })
      );
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles partial success in bulk operations gracefully", async () => {
      const activityData: BulkActivityData = {
        type: "water",
        details: { type: "water", waterAmount: 100 },
      };

      (careService.addCareActivity as jest.Mock)
        .mockResolvedValueOnce("success-1")
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success-2")
        .mockRejectedValueOnce(new Error("Validation error"));

      const results = await BulkActivityService.logActivityForPlants(
        ["plant-1", "plant-2", "plant-3", "plant-4"],
        activityData
      );

      expect(results).toEqual(["success-1", "success-2"]);
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        "Failed to log activity for plant plant-2:",
        expect.any(Error)
      );
      expect(console.error).toHaveBeenCalledWith(
        "Failed to log activity for plant plant-4:",
        expect.any(Error)
      );
    });

    it("maintains data integrity across all activity types", async () => {
      const activities = [
        await BulkActivityService.createBulkWateringActivity(100, "ml"),
        await BulkActivityService.createBulkFertilizeActivity("Product", "1:1", "1L"),
        await BulkActivityService.createBulkObservationActivity("good", "Healthy"),
      ];

      activities.forEach((activity) => {
        expect(activity).toHaveProperty("type");
        expect(activity).toHaveProperty("details");
        expect(activity.details).toHaveProperty("type");
        expect(activity.type).toBe(activity.details.type);
      });
    });
  });
});