// src/__tests__/services/growthStageService.test.ts - Updated with correct expectations
import { GrowthStageService } from "@/services/growthStageService";
import { plantService, varietyService } from "@/types/database";
import { initializeDatabase } from "@/db/seedData";
import { subDays } from "date-fns";

describe("GrowthStageService", () => {
  beforeEach(async () => {
    const { db } = await import("@/types/database");
    await db.plants.clear();
    await db.varieties.clear();
    await initializeDatabase();
  });

  it("updates plant stages when they are out of sync", async () => {
    const varieties = await varietyService.getAllVarieties();
    const albion = varieties.find((v) => v.name === "Albion Strawberries");

    // Create plant with wrong stage
    const plantedDate = subDays(new Date(), 103);
    const plantId = await plantService.addPlant({
      varietyId: albion!.id,
      varietyName: albion!.name,
      plantedDate,
      currentStage: "germination", // Wrong!
      location: "Indoor",
      container: "5 gallon",
      isActive: true,
    });

    // Verify wrong stage is stored
    let plant = await plantService.getPlant(plantId);
    expect(plant?.currentStage).toBe("germination");

    // Run stage update service
    await GrowthStageService.updatePlantStages();

    // Verify stage was corrected - should be ongoing-production for everbearing at 103 days
    plant = await plantService.getPlant(plantId);
    expect(plant?.currentStage).toBe("ongoing-production"); // ← FIXED: was "maturation"
  });

  it("updates multiple plants with different stage corrections", async () => {
    const varieties = await varietyService.getAllVarieties();
    const albion = varieties.find((v) => v.name === "Albion Strawberries");

    // Create multiple plants with wrong stages
    const plants = [
      { daysAgo: 5, expectedStage: "germination" },
      { daysAgo: 20, expectedStage: "seedling" },
      { daysAgo: 103, expectedStage: "ongoing-production" }, // ← FIXED: was "maturation"
    ];

    const plantIds = [];
    for (const plantData of plants) {
      const plantId = await plantService.addPlant({
        varietyId: albion!.id,
        varietyName: albion!.name,
        plantedDate: subDays(new Date(), plantData.daysAgo),
        currentStage: "germination", // All wrong
        location: "Indoor",
        container: "5 gallon",
        isActive: true,
      });
      plantIds.push({ id: plantId, expected: plantData.expectedStage });
    }

    // Run update
    await GrowthStageService.updatePlantStages();

    // Verify all were corrected
    for (const { id, expected } of plantIds) {
      const plant = await plantService.getPlant(id);
      expect(plant?.currentStage).toBe(expected);
    }
  });

  it("handles non-everbearing plants correctly", async () => {
    const varieties = await varietyService.getAllVarieties();
    const carrots = varieties.find((v) => v.name === "Little Finger Carrots");

    // Create carrot plant past maturation (non-everbearing should show "harvest")
    const plantedDate = subDays(new Date(), 70); // Past 65-day maturation
    const plantId = await plantService.addPlant({
      varietyId: carrots!.id,
      varietyName: carrots!.name,
      plantedDate,
      currentStage: "germination", // Wrong!
      location: "Indoor",
      container: "4 inch pot",
      isActive: true,
    });

    // Run stage update service
    await GrowthStageService.updatePlantStages();

    // Verify non-everbearing shows "harvest" after maturation
    const plant = await plantService.getPlant(plantId);
    expect(plant?.currentStage).toBe("harvest");
  });

  it("handles plants past productive lifespan", async () => {
    const varieties = await varietyService.getAllVarieties();
    const albion = varieties.find((v) => v.name === "Albion Strawberries");

    // Create plant past 730-day productive lifespan
    const plantedDate = subDays(new Date(), 800); // Past 2-year lifespan
    const plantId = await plantService.addPlant({
      varietyId: albion!.id,
      varietyName: albion!.name,
      plantedDate,
      currentStage: "ongoing-production", // Wrong - should be harvest
      location: "Indoor",
      container: "5 gallon",
      isActive: true,
    });

    // Run stage update service
    await GrowthStageService.updatePlantStages();

    // Verify plants past productive lifespan show "harvest"
    const plant = await plantService.getPlant(plantId);
    expect(plant?.currentStage).toBe("harvest");
  });
});
