// src/__tests__/database/plantService.test.ts
import { plantService, PlantRecord } from "../../types/database";

describe("plantService", () => {
  beforeEach(async () => {
    // Clear the database before each test
    const db = await import("../../types/database").then((m) => m.db);
    await db.plants.clear();
  });

  it("adds and retrieves a plant", async () => {
    const plantData: Omit<PlantRecord, "id" | "createdAt" | "updatedAt"> = {
      varietyId: "test-variety",
      name: "Test Plant",
      varietyName: "Test Variety",
      plantedDate: new Date("2024-01-01"),
      currentStage: "seedling",
      location: "Indoor",
      container: "Test Container",
      isActive: true,
      notes: ["Test note"],
    };

    const plantId = await plantService.addPlant(plantData);
    expect(plantId).toBeDefined();

    const retrievedPlant = await plantService.getPlant(plantId);
    expect(retrievedPlant).toBeDefined();
    expect(retrievedPlant?.name).toBe("Test Plant");
    expect(retrievedPlant?.varietyId).toBe("test-variety");
  });

  it("retrieves only active plants", async () => {
    // Add active plant
    await plantService.addPlant({
      varietyId: "active-variety",
      varietyName: "Active Variety",
      plantedDate: new Date(),
      currentStage: "vegetative",
      location: "Location 1",
      container: "Container 1",
      isActive: true,
    });

    // Add inactive plant
    const inactiveId = await plantService.addPlant({
      varietyId: "inactive-variety",
      varietyName: "Inactive Variety",
      plantedDate: new Date(),
      currentStage: "vegetative",
      location: "Location 2",
      container: "Container 2",
      isActive: true,
    });

    // Deactivate the second plant
    await plantService.updatePlant(inactiveId, { isActive: false });

    const activePlants = await plantService.getActivePlants();
    expect(activePlants).toHaveLength(1);
    expect(activePlants[0].varietyId).toBe("active-variety");
  });
});
