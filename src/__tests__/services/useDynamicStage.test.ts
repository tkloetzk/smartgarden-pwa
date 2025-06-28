// Create new file: src/__tests__/hooks/useDynamicStage.test.ts

import { renderHook, waitFor } from "@testing-library/react";
import { useDynamicStage } from "@/hooks/useDynamicStage";
import { PlantRecord, VarietyRecord, varietyService } from "@/types/database";
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { subDays } from "date-fns";
import { PlantCategory } from "@/types";

// Mock dependencies
jest.mock("@/types/database");
jest.mock("@/utils/growthStage");

const mockVarietyService = varietyService as jest.Mocked<typeof varietyService>;
const mockCalculateStage = calculateCurrentStageWithVariety as jest.Mock;

// Create a complete, type-safe mock variety
const mockVariety: VarietyRecord = {
  id: "tomato-1",
  name: "Tomato",
  normalizedName: "tomato",
  category: "fruiting-plants" as PlantCategory,
  growthTimeline: {
    germination: 7,
    seedling: 14,
    vegetative: 21,
    maturation: 60,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Create a base plant record for easier test creation
const createMockPlant = (overrides: Partial<PlantRecord>): PlantRecord => ({
  id: `plant-${Math.random()}`,
  varietyId: "tomato-1",
  varietyName: "Tomato",
  name: "Test Tomato Plant",
  plantedDate: new Date(),
  location: "Indoor",
  container: "5 Gallon Grow Bag",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("useDynamicStage Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVarietyService.getVariety.mockResolvedValue(mockVariety);
  });

  it("should use plantedDate when no confirmed stage exists", async () => {
    const plantedDate = subDays(new Date(), 10);
    const plant = createMockPlant({ plantedDate });

    mockCalculateStage.mockReturnValue("seedling");

    renderHook(() => useDynamicStage(plant));

    await waitFor(() => {
      expect(mockCalculateStage).toHaveBeenCalledWith(
        plantedDate, // Should be called with the original plantedDate
        mockVariety
      );
    });
  });

  it("should use confirmedStage and stageConfirmedDate when they exist", async () => {
    const plantedDate = subDays(new Date(), 30);
    const stageConfirmedDate = subDays(new Date(), 5);
    const plant = createMockPlant({
      plantedDate,
      confirmedStage: "vegetative",
      stageConfirmedDate,
    });

    mockCalculateStage.mockReturnValue("flowering");

    renderHook(() => useDynamicStage(plant));

    await waitFor(() => {
      expect(mockCalculateStage).toHaveBeenCalledWith(
        stageConfirmedDate, // IMPORTANT: Should use the confirmed date
        mockVariety,
        expect.any(Date),
        "vegetative" // IMPORTANT: Should use the confirmed stage as the starting point
      );
    });
  });

  it("should return the result from the calculation", async () => {
    const plant = createMockPlant({});
    mockCalculateStage.mockReturnValue("vegetative");

    const { result } = renderHook(() => useDynamicStage(plant));

    await waitFor(() => {
      expect(result.current).toBe("vegetative");
    });
  });
});
