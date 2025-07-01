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

  it("should group plants with same variety, date, container, and location", () => {
    const basePlant = {
      varietyId: "basil-sweet",
      varietyName: "Sweet Basil",
      plantedDate: new Date("2024-06-01T00:00:00.000Z"),
      location: "Kitchen Window",
      container: "4 inch pot",
      soilMix: "herb-mix",
    };

    const plant1 = createMockPlant({
      ...basePlant,
      id: "plant-1",
      name: "Basil Plant 1",
    });
    const plant2 = createMockPlant({
      ...basePlant,
      id: "plant-2",
      name: "Basil Plant 2",
    });
    const plant3 = createMockPlant({
      ...basePlant,
      id: "plant-3",
      name: "Basil Plant 3",
    });

    const plants = [plant1, plant2, plant3];
    const groups = groupPlantsByConditions(plants);

    expect(groups).toHaveLength(1);
    expect(groups[0].plants).toHaveLength(3);
    expect(groups[0].varietyId).toBe("basil-sweet");
    expect(groups[0].varietyName).toBe("Sweet Basil");
    expect(groups[0].plantedDate).toEqual(new Date("2024-06-01T00:00:00.000Z"));
    expect(groups[0].location).toBe("Kitchen Window");
    expect(groups[0].container).toBe("4 inch pot");
    expect(groups[0].soilMix).toBe("herb-mix");
    expect(groups[0].plants.map((p) => p.id)).toEqual([
      "plant-1",
      "plant-2",
      "plant-3",
    ]);
  });

  it("should handle plants with missing soil mix data", () => {
    const plantWithSoil = createMockPlant({
      id: "with-soil",
      name: "Plant With Soil",
      varietyId: "lettuce-1",
      varietyName: "Buttercrunch Lettuce",
      soilMix: "organic-mix",
    });

    const plantWithoutSoil = createMockPlant({
      id: "without-soil",
      name: "Plant Without Soil",
      varietyId: "lettuce-1",
      varietyName: "Buttercrunch Lettuce",
      soilMix: undefined,
    });

    const anotherPlantWithoutSoil = createMockPlant({
      id: "another-without-soil",
      name: "Another Plant Without Soil",
      varietyId: "lettuce-1",
      varietyName: "Buttercrunch Lettuce",
      soilMix: undefined,
    });

    const plants = [plantWithSoil, plantWithoutSoil, anotherPlantWithoutSoil];
    const groups = groupPlantsByConditions(plants);

    expect(groups).toHaveLength(2);

    const groupWithSoil = groups.find((g) => g.soilMix === "organic-mix");
    const groupWithoutSoil = groups.find((g) => g.soilMix === undefined);

    expect(groupWithSoil).toBeDefined();
    expect(groupWithSoil!.plants).toHaveLength(1);
    expect(groupWithSoil!.plants[0].id).toBe("with-soil");

    expect(groupWithoutSoil).toBeDefined();
    expect(groupWithoutSoil!.plants).toHaveLength(2);
    expect(groupWithoutSoil!.plants.map((p) => p.id)).toEqual([
      "another-without-soil",
      "without-soil",
    ]);
  });

  it("should sort groups by variety name", () => {
    const zucchiniPlant = createMockPlant({
      id: "zucchini",
      varietyId: "zucchini-1",
      varietyName: "Zucchini",
      name: "Summer Squash",
    });

    const basilPlant = createMockPlant({
      id: "basil",
      varietyId: "basil-1",
      varietyName: "Basil",
      name: "Herb Plant",
    });

    const tomatoPlant = createMockPlant({
      id: "tomato",
      varietyId: "tomato-1",
      varietyName: "Tomato",
      name: "Fruit Plant",
    });

    const plants = [zucchiniPlant, basilPlant, tomatoPlant];
    const groups = groupPlantsByConditions(plants);

    expect(groups).toHaveLength(3);
    expect(groups[0].varietyName).toBe("Basil");
    expect(groups[1].varietyName).toBe("Tomato");
    expect(groups[2].varietyName).toBe("Zucchini");
  });

  it("should sort plants within groups by name", () => {
    const plant1 = createMockPlant({
      id: "plant-1",
      name: "Zebra Plant",
      varietyId: "tomato-cherry",
      varietyName: "Cherry Tomato",
    });

    const plant2 = createMockPlant({
      id: "plant-2",
      name: "Alpha Plant",
      varietyId: "tomato-cherry",
      varietyName: "Cherry Tomato",
    });

    const plant3 = createMockPlant({
      id: "plant-3",
      name: "Beta Plant",
      varietyId: "tomato-cherry",
      varietyName: "Cherry Tomato",
    });

    const plant4 = createMockPlant({
      id: "plant-4",
      name: undefined, // Test handling of undefined names
      varietyId: "tomato-cherry",
      varietyName: "Cherry Tomato",
    });

    const plants = [plant1, plant2, plant3, plant4];
    const groups = groupPlantsByConditions(plants);

    expect(groups).toHaveLength(1);
    expect(groups[0].plants).toHaveLength(4);

    const sortedNames = groups[0].plants.map((p) => p.name);
    expect(sortedNames).toEqual([
      "Alpha Plant",
      "Beta Plant",
      "Zebra Plant",
      undefined,
    ]);
  });
});
