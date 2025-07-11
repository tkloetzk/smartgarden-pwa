import { successionPlanningService } from "@/services/successionPlanningService";
import { bedService, plantService } from "@/types/database";
import { PlantSection } from "@/types";

// Mock the database services
jest.mock("@/types/database", () => ({
  bedService: {
    getBed: jest.fn(),
    addBed: jest.fn(),
    getActiveBeds: jest.fn(),
    updateBed: jest.fn(),
    deleteBed: jest.fn(),
  },
  plantService: {
    getActivePlants: jest.fn(),
    addPlant: jest.fn(),
    getPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
  },
}));

describe("SuccessionPlanningService", () => {
  const mockBed = {
    id: "bed-1",
    name: "Raised Bed 1",
    type: "raised-bed" as const,
    dimensions: { length: 108, width: 24, unit: "inches" as const },
    orientation: "north-south" as const,
    referencePoint: "northwest corner",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPlant = {
    id: "plant-1",
    varietyId: "lettuce-1",
    varietyName: "Lettuce",
    plantedDate: new Date(),
    location: "Raised Bed 1",
    container: "Raised Bed 1",
    isActive: true,
    createdAt: new Date(),
    structuredSection: {
      bedId: "bed-1",
      position: { start: 0, length: 6, width: 6, unit: "inches" as const },
      description: "First lettuce section",
    } as PlantSection,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateAvailableSpace", () => {
    it("should calculate available space correctly", async () => {
      (bedService.getBed as jest.Mock).mockResolvedValue(mockBed);
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([mockPlant]);

      const result = await successionPlanningService.calculateAvailableSpace("bed-1");

      expect(result.totalSpace).toBe(2592); // 108 * 24
      expect(result.occupiedSpace).toBe(36); // 6 * 6
      expect(result.availableSpace).toBe(2556); // 2592 - 36
      expect(result.suggestedPositions).toBeDefined();
      expect(result.suggestedPositions!.length).toBeGreaterThan(0);
    });

    it("should throw error for non-existent bed", async () => {
      (bedService.getBed as jest.Mock).mockResolvedValue(null);

      await expect(
        successionPlanningService.calculateAvailableSpace("non-existent")
      ).rejects.toThrow("Bed not found: non-existent");
    });

    it("should handle empty bed correctly", async () => {
      (bedService.getBed as jest.Mock).mockResolvedValue(mockBed);
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([]);

      const result = await successionPlanningService.calculateAvailableSpace("bed-1");

      expect(result.totalSpace).toBe(2592);
      expect(result.occupiedSpace).toBe(0);
      expect(result.availableSpace).toBe(2592);
    });
  });

  describe("generateSuccessionSchedule", () => {
    it("should generate succession schedule correctly", async () => {
      (bedService.getBed as jest.Mock).mockResolvedValue(mockBed);
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([mockPlant]);

      const startDate = new Date("2024-01-01");
      const schedule = await successionPlanningService.generateSuccessionSchedule(
        "bed-1",
        "lettuce-1",
        startDate,
        14, // 14 days interval
        3   // 3 successions
      );

      expect(schedule).toHaveLength(3);
      expect(schedule[0].plantingDate).toEqual(startDate);
      expect(schedule[1].plantingDate).toEqual(new Date("2024-01-15"));
      expect(schedule[2].plantingDate).toEqual(new Date("2024-01-29"));
      expect(schedule[0].varietyId).toBe("lettuce-1");
      expect(schedule[0].status).toBe("planned");
    });

    it("should limit schedule to available positions", async () => {
      (bedService.getBed as jest.Mock).mockResolvedValue(mockBed);
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([mockPlant]);

      // Mock calculateAvailableSpace to return limited positions
      jest.spyOn(successionPlanningService, 'calculateAvailableSpace').mockResolvedValue({
        totalSpace: 2592,
        occupiedSpace: 36,
        availableSpace: 2556,
        suggestedPositions: [
          { start: 6, length: 6, width: 6, unit: "inches" },
          { start: 12, length: 6, width: 6, unit: "inches" },
        ],
      });

      const schedule = await successionPlanningService.generateSuccessionSchedule(
        "bed-1",
        "lettuce-1",
        new Date("2024-01-01"),
        14,
        5 // Request 5 but only 2 positions available
      );

      expect(schedule).toHaveLength(2);
    });
  });

  describe("calculateOptimalSpacing", () => {
    it("should return correct spacing for small plants", () => {
      const spacing = successionPlanningService.calculateOptimalSpacing("small");
      
      expect(spacing.minSpacing).toBe(4);
      expect(spacing.optimalSpacing).toBe(6);
      expect(spacing.unit).toBe("inches");
    });

    it("should return correct spacing for large plants", () => {
      const spacing = successionPlanningService.calculateOptimalSpacing("large");
      
      expect(spacing.minSpacing).toBe(8);
      expect(spacing.optimalSpacing).toBe(12);
      expect(spacing.unit).toBe("inches");
    });

    it("should default to medium spacing", () => {
      const spacing = successionPlanningService.calculateOptimalSpacing();
      
      expect(spacing.minSpacing).toBe(6);
      expect(spacing.optimalSpacing).toBe(8);
      expect(spacing.unit).toBe("inches");
    });
  });

  describe("convertUnits", () => {
    it("should convert inches to feet correctly", () => {
      const result = successionPlanningService.convertUnits(12, "inches", "feet");
      expect(result).toBe(1);
    });

    it("should convert feet to inches correctly", () => {
      const result = successionPlanningService.convertUnits(2, "feet", "inches");
      expect(result).toBe(24);
    });

    it("should convert cm to inches correctly", () => {
      const result = successionPlanningService.convertUnits(2.54, "cm", "inches");
      expect(result).toBeCloseTo(1, 2);
    });

    it("should handle same unit conversion", () => {
      const result = successionPlanningService.convertUnits(10, "inches", "inches");
      expect(result).toBe(10);
    });
  });

  describe("validatePosition", () => {
    it("should validate position without conflicts", async () => {
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([mockPlant]);

      const newPosition = { start: 20, length: 6, width: 6, unit: "inches" as const };
      const result = await successionPlanningService.validatePosition("bed-1", newPosition);

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it("should detect position conflicts", async () => {
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([mockPlant]);

      const conflictingPosition = { start: 2, length: 6, width: 6, unit: "inches" as const };
      const result = await successionPlanningService.validatePosition("bed-1", conflictingPosition);

      expect(result.isValid).toBe(false);
      expect(result.conflicts).toContain("Lettuce");
    });

    it("should exclude specific plant from conflict check", async () => {
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([mockPlant]);

      const conflictingPosition = { start: 2, length: 6, width: 6, unit: "inches" as const };
      const result = await successionPlanningService.validatePosition(
        "bed-1", 
        conflictingPosition, 
        "plant-1" // Exclude the plant that would conflict
      );

      expect(result.isValid).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe("getPlantsInBed", () => {
    it("should return plants in specific bed", async () => {
      const plantInBed = { ...mockPlant, structuredSection: { ...mockPlant.structuredSection!, bedId: "bed-1" } };
      const plantInOtherBed = { ...mockPlant, id: "plant-2", structuredSection: { ...mockPlant.structuredSection!, bedId: "bed-2" } };
      
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([plantInBed, plantInOtherBed]);

      const result = await successionPlanningService.getPlantsInBed("bed-1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("plant-1");
    });

    it("should return empty array for bed with no plants", async () => {
      (plantService.getActivePlants as jest.Mock).mockResolvedValue([]);

      const result = await successionPlanningService.getPlantsInBed("bed-1");

      expect(result).toHaveLength(0);
    });
  });
});