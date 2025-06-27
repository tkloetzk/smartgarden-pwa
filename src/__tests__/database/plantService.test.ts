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

  it("should update a plant's name", async () => {
    // Arrange: Add a plant to the in-memory database
    const plantData: Omit<PlantRecord, "id" | "createdAt" | "updatedAt"> = {
      varietyId: "test-variety",
      name: "Old Name",
      varietyName: "Test Variety",
      plantedDate: new Date("2024-01-01"),
      location: "Indoor",
      container: "Test Container",
      isActive: true,
    };
    const plantId = await plantService.addPlant(plantData);
    const originalPlant = await plantService.getPlant(plantId);

    // Add a small delay to ensure timestamps are different
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Act: Call the service method to update the plant
    const newName = "New Updated Name";
    await plantService.updatePlant(plantId, { name: newName });

    // Assert: Retrieve the plant and check if the update was successful
    const updatedPlant = await plantService.getPlant(plantId);
    expect(updatedPlant).toBeDefined();
    expect(updatedPlant?.name).toBe(newName);
    // More robust check: updatedAt should be later than createdAt
    expect(updatedPlant?.updatedAt?.getTime()).toBeGreaterThan(
      originalPlant!.createdAt.getTime()
    );
  });

  it("should mark a plant as inactive on delete, but not remove it", async () => {
    // Arrange: Add a plant to the in-memory database
    const plantData: Omit<PlantRecord, "id" | "createdAt" | "updatedAt"> = {
      varietyId: "test-variety-2",
      name: "To Be Deleted",
      varietyName: "Test Variety 2",
      plantedDate: new Date("2024-01-01"),
      location: "Outdoor",
      container: "Another Container",
      isActive: true,
    };
    const plantId = await plantService.addPlant(plantData);

    // Act: Call the "delete" service method
    await plantService.deletePlant(plantId);

    // Assert: The plant should still exist but be marked as inactive
    const deletedPlant = await plantService.getPlant(plantId);
    expect(deletedPlant).toBeDefined();
    expect(deletedPlant?.isActive).toBe(false);

    // Also assert that it no longer appears in the standard "getActivePlants" list
    const activePlants = await plantService.getActivePlants();
    const findDeleted = activePlants.find((p) => p.id === plantId);
    expect(findDeleted).toBeUndefined();
  });

  it("retrieves only active plants", async () => {
    // Add active plant
    await plantService.addPlant({
      varietyId: "active-variety",
      varietyName: "Active Variety",
      plantedDate: new Date(),
      location: "Location 1",
      container: "Container 1",
      isActive: true,
    });

    // Add inactive plant
    const inactiveId = await plantService.addPlant({
      varietyId: "inactive-variety",
      varietyName: "Inactive Variety",
      plantedDate: new Date(),
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
