// In: src/__tests__/services/growthRateService.test.ts

import { GrowthRateService } from "@/services/GrowthRateService";
import {
  plantService,
  varietyService,
  PlantRecord,
  VarietyRecord,
} from "@/types/database";

// Mock the dependent services
jest.mock("@/types/database", () => ({
  ...jest.requireActual("@/types/database"),
  plantService: {
    getPlant: jest.fn(),
    updatePlant: jest.fn(),
  },
  varietyService: {
    getVariety: jest.fn(),
  },
}));

const mockPlantService = plantService as jest.Mocked<typeof plantService>;
const mockVarietyService = varietyService as jest.Mocked<typeof varietyService>;

describe("GrowthRateService", () => {
  const plantId = "plant-1";

  const mockVariety: VarietyRecord = {
    id: "v1",
    name: "Test Variety",
    growthTimeline: {
      germination: 10,
      seedling: 20,
      vegetative: 30,
      maturation: 60,
    },
  } as VarietyRecord;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVarietyService.getVariety.mockResolvedValue(mockVariety);
  });

  it("should do nothing if the plant has no confirmed stage", async () => {
    const plantWithoutConfirmation = {
      id: plantId,
      plantedDate: new Date(),
    } as PlantRecord;
    mockPlantService.getPlant.mockResolvedValue(plantWithoutConfirmation);

    await GrowthRateService.updateGrowthRateModifier(plantId);

    expect(mockPlantService.updatePlant).not.toHaveBeenCalled();
  });

  it("should calculate a modifier < 1 for a plant growing faster than expected", async () => {
    const plantedDate = new Date("2025-06-01");
    // Expected seedling stage on June 11 (10 days after planting)
    // User confirms it on June 9th (2 days early)
    const stageConfirmedDate = new Date("2025-06-09");
    const mockPlant = {
      id: plantId,
      plantedDate,
      varietyId: "v1",
      confirmedStage: "seedling",
      stageConfirmedDate,
    } as PlantRecord;

    mockPlantService.getPlant.mockResolvedValue(mockPlant);

    await GrowthRateService.updateGrowthRateModifier(plantId);

    // Actual duration was 8 days, expected was 10. Modifier = 8/10 = 0.8
    expect(mockPlantService.updatePlant).toHaveBeenCalledWith(plantId, {
      growthRateModifier: 0.8,
    });
  });

  it("should calculate a modifier > 1 for a plant growing slower than expected", async () => {
    const plantedDate = new Date("2025-06-01");
    // Expected seedling stage on June 11 (10 days)
    // User confirms it on June 16th (5 days late)
    const stageConfirmedDate = new Date("2025-06-16");
    const mockPlant = {
      id: plantId,
      plantedDate,
      varietyId: "v1",
      confirmedStage: "seedling",
      stageConfirmedDate,
    } as PlantRecord;

    mockPlantService.getPlant.mockResolvedValue(mockPlant);

    await GrowthRateService.updateGrowthRateModifier(plantId);

    // Actual duration was 15 days, expected was 10. Modifier = 15/10 = 1.5
    expect(mockPlantService.updatePlant).toHaveBeenCalledWith(plantId, {
      growthRateModifier: 1.5,
    });
  });

  it("should calculate a modifier of 1 for a plant growing exactly on schedule", async () => {
    const plantedDate = new Date("2025-06-01");
    // Expected seedling stage on June 11 (10 days)
    const stageConfirmedDate = new Date("2025-06-11");
    const mockPlant = {
      id: plantId,
      plantedDate,
      varietyId: "v1",
      confirmedStage: "seedling",
      stageConfirmedDate,
    } as PlantRecord;

    mockPlantService.getPlant.mockResolvedValue(mockPlant);

    await GrowthRateService.updateGrowthRateModifier(plantId);

    // Actual duration was 10 days, expected was 10. Modifier = 10/10 = 1.0
    expect(mockPlantService.updatePlant).toHaveBeenCalledWith(plantId, {
      growthRateModifier: 1.0,
    });
  });
});
