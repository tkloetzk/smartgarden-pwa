// src/__tests__/utils/testSetup.ts
import {
  VarietyRecord,
  PlantRecord,
  CareActivityRecord,
} from "@/types/database";
import { varietyService } from "@/types/database";
import {
  createMockVariety,
  createMockPlantWithDefaults,
  createMockWateringActivity,
  createCompleteWateringProtocol,
} from "./testDataFactories";

interface TestScenario {
  varieties: VarietyRecord[];
  plants: PlantRecord[];
  activities: CareActivityRecord[];
}

export const createTestScenario = {
  singlePlantWithWateringHistory: (): TestScenario => {
    const variety = createMockVariety({
      id: "test-variety-1",
      name: "Test Basil",
      category: "herbs",
      protocols: {
        watering: createCompleteWateringProtocol({
          vegetative: { volume: { amount: 12, unit: "oz" } },
        }),
      },
    });

    const plant = createMockPlantWithDefaults({
      id: "test-plant-1",
      varietyId: variety.id,
      varietyName: variety.name,
    });

    const activities = [
      createMockWateringActivity(plant.id, 3, 12, "oz"),
      createMockWateringActivity(plant.id, 1, 14, "oz"),
    ];

    return { varieties: [variety], plants: [plant], activities };
  },

  multiPlantGarden: (): TestScenario => {
    const varieties = [
      createMockVariety({
        id: "variety-herbs",
        name: "Sweet Basil",
        category: "herbs",
      }),
      createMockVariety({
        id: "variety-fruiting",
        name: "Cherry Tomato",
        category: "fruiting-plants",
      }),
    ];

    const plants = [
      createMockPlantWithDefaults({
        id: "plant-basil",
        varietyId: varieties[0].id,
        varietyName: varieties[0].name,
      }),
      createMockPlantWithDefaults({
        id: "plant-tomato",
        varietyId: varieties[1].id,
        varietyName: varieties[1].name,
      }),
    ];

    const activities = [
      createMockWateringActivity(plants[0].id, 2),
      createMockWateringActivity(plants[1].id, 1),
    ];

    return { varieties, plants, activities };
  },
};

// Mock service setup helper
export const setupMockServices = (scenario: TestScenario) => {
  const mockVarietyService = varietyService as jest.Mocked<
    typeof varietyService
  >;

  mockVarietyService.getVariety.mockImplementation(async (id: string) => {
    return scenario.varieties.find((v) => v.id === id) || undefined;
  });

  mockVarietyService.getAllVarieties.mockResolvedValue(scenario.varieties);

  return { mockVarietyService };
};
