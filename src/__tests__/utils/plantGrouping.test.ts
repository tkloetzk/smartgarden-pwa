import { groupPlantsByConditions } from "@/utils/plantGrouping";
import { PlantRecord } from "@/types/database";

describe("groupPlantsByConditions", () => {
  const createMockPlant = (overrides: Partial<PlantRecord>): PlantRecord => {
    return {
      id: `plant-${Math.random()}`,
      varietyId: "tomato-1",
      varietyName: "Cherry Tomato",
      name: "Test Plant",
      plantedDate: new Date("2024-05-10T00:00:00.000Z"),
      location: "Indoor",
      container: "5 Gallon Grow Bag",
      soilMix: "standard-mix",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  it("should group plants with identical conditions", () => {
    const p1 = createMockPlant({ id: "p1" });
    const p2 = createMockPlant({ id: "p2" });
    const plants = [p1, p2];

    const groups = groupPlantsByConditions(plants);
    expect(groups).toHaveLength(1);
    expect(groups[0].plants).toHaveLength(2);
    expect(groups[0].plants.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("should not group plants with different varieties", () => {
    const p1 = createMockPlant({ id: "p1", varietyId: "tomato-1" });
    const p2 = createMockPlant({ id: "p2", varietyId: "basil-1" });
    const plants = [p1, p2];

    const groups = groupPlantsByConditions(plants);
    expect(groups).toHaveLength(2);
  });

  it("should not group plants with different planted dates", () => {
    const p1 = createMockPlant({
      id: "p1",
      plantedDate: new Date("2024-05-10T00:00:00.000Z"),
    });
    const p2 = createMockPlant({
      id: "p2",
      plantedDate: new Date("2024-05-11T00:00:00.000Z"),
    });
    const plants = [p1, p2];

    const groups = groupPlantsByConditions(plants);
    expect(groups).toHaveLength(2);
  });

  it("should not group plants with different containers", () => {
    const p1 = createMockPlant({ id: "p1", container: "5 Gallon" });
    const p2 = createMockPlant({ id: "p2", container: "3 Gallon" });
    const plants = [p1, p2];

    const groups = groupPlantsByConditions(plants);
    expect(groups).toHaveLength(2);
  });

  it("should handle an empty array of plants", () => {
    const groups = groupPlantsByConditions([]);
    expect(groups).toHaveLength(0);
  });

  it("should create separate groups for plants with and without soil mix", () => {
    const p1 = createMockPlant({ id: "p1", soilMix: "standard-mix" });
    const p2 = createMockPlant({ id: "p2", soilMix: undefined });
    const p3 = createMockPlant({ id: "p3", soilMix: "standard-mix" });

    const plants = [p1, p2, p3];
    const groups = groupPlantsByConditions(plants);

    expect(groups).toHaveLength(2);
    const groupWithSoil = groups.find((g) => g.soilMix === "standard-mix");
    const groupWithoutSoil = groups.find((g) => g.soilMix === undefined);

    expect(groupWithSoil?.plants).toHaveLength(2);
    expect(groupWithoutSoil?.plants).toHaveLength(1);
  });
});
