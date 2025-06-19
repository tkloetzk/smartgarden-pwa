// src/__tests__/utils/plantDisplay.test.ts
import { getPlantDisplayName } from "@/utils/plantDisplay";
import { PlantRecord } from "@/types/database";

describe("getPlantDisplayName", () => {
  const basePlant: PlantRecord = {
    id: "test-id",
    varietyId: "some-uuid-123",
    varietyName: "Roma Tomato",
    plantedDate: new Date(),
    currentStage: "vegetative",
    location: "Indoor",
    container: "5 gallon",
    isActive: true,
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("returns custom name when provided", () => {
    const plant = { ...basePlant, name: "My Special Tomato" };
    expect(getPlantDisplayName(plant)).toBe("My Special Tomato");
  });

  it("returns variety name when no custom name", () => {
    const plant = { ...basePlant, name: undefined };
    expect(getPlantDisplayName(plant)).toBe("Roma Tomato");
  });

  it("returns fallback when no custom name or variety name", () => {
    const plant = { ...basePlant, name: undefined, varietyName: "" };
    expect(getPlantDisplayName(plant)).toBe("Unknown Plant");
  });

  it("returns fallback when varietyName is empty", () => {
    const plant = { ...basePlant, name: undefined, varietyName: "" };
    expect(getPlantDisplayName(plant)).toBe("Unknown Plant");
  });

  it("returns fallback when varietyName is whitespace only", () => {
    const plant = { ...basePlant, name: undefined, varietyName: "   " };
    expect(getPlantDisplayName(plant)).toBe("Unknown Plant");
  });
});
