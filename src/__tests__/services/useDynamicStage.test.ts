// src/__tests__/hooks/useDynamicStage.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useDynamicStage } from "@/hooks/useDynamicStage";
import { calculateStageFromSeedVarieties } from "@/utils/growthStage";
import { subDays } from "date-fns";
import { createMockPlant } from "../utils/testDataFactories";

// Mock the growth stage calculation function
jest.mock("@/utils/growthStage");

const mockCalculateStage = calculateStageFromSeedVarieties as jest.Mock;

describe("useDynamicStage Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate stage using plantedDate and varietyName", async () => {
    const plantedDate = subDays(new Date(), 10);
    const plant = createMockPlant({
      plantedDate,
      varietyName: "Tomato",
    });

    mockCalculateStage.mockReturnValue("seedling");

    renderHook(() => useDynamicStage(plant));

    await waitFor(() => {
      expect(mockCalculateStage).toHaveBeenCalledWith(plantedDate, "Tomato");
    });
  });

  it("should return the calculated stage", async () => {
    const plant = createMockPlant({ varietyName: "Tomato" });
    mockCalculateStage.mockReturnValue("vegetative");

    const { result } = renderHook(() => useDynamicStage(plant));

    await waitFor(() => {
      expect(result.current).toBe("vegetative");
    });
  });

  it("should return germination when plant has no varietyName", () => {
    const plant = createMockPlant({ varietyName: undefined });

    const { result } = renderHook(() => useDynamicStage(plant));

    expect(result.current).toBe("germination");
    expect(mockCalculateStage).not.toHaveBeenCalled();
  });

  it("should return germination when plant is null/undefined", () => {
    const { result } = renderHook(() => useDynamicStage(null as any));

    expect(result.current).toBe("germination");
    expect(mockCalculateStage).not.toHaveBeenCalled();
  });

  it("should recalculate when plant changes", async () => {
    const initialPlant = createMockPlant({
      varietyName: "Tomato",
      plantedDate: subDays(new Date(), 10),
    });

    mockCalculateStage.mockReturnValue("seedling");

    const { result, rerender } = renderHook(
      ({ plant }) => useDynamicStage(plant),
      { initialProps: { plant: initialPlant } }
    );

    await waitFor(() => {
      expect(result.current).toBe("seedling");
    });

    // Update plant with different variety
    const updatedPlant = createMockPlant({
      varietyName: "Lettuce",
      plantedDate: subDays(new Date(), 20),
    });

    mockCalculateStage.mockReturnValue("vegetative");

    rerender({ plant: updatedPlant });

    await waitFor(() => {
      expect(mockCalculateStage).toHaveBeenCalledWith(
        updatedPlant.plantedDate,
        "Lettuce"
      );
      expect(result.current).toBe("vegetative");
    });
  });
});
