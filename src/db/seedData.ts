// src/db/seedData.ts
import { varietyService } from "@/types/database";
import { seedVarieties } from "../data/seedVarieties";

export async function initializeDatabase() {
  try {
    // Get existing varieties
    const existingVarieties = await varietyService.getAllVarieties();
    const existingNames = new Set(existingVarieties.map((v) => v.name));

    // Only add varieties that don't already exist
    const varietiesToAdd = seedVarieties.filter(
      (variety) => !existingNames.has(variety.name)
    );

    if (varietiesToAdd.length > 0) {
      // Add only new varieties
      for (const variety of varietiesToAdd) {
        await varietyService.addVariety({
          name: variety.name,
          category: variety.category,
          growthTimeline: variety.growthTimeline,
          protocols: variety.protocols || {},
        });
      }
    } else {
      console.log("All seed varieties already exist in database");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}
