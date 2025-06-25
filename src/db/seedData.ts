// src/db/seedData.ts
import { PlantProtocols, varietyService } from "@/types/database";
import { seedVarieties } from "../data/seedVarieties";

// Add a flag to prevent concurrent initialization
let isInitializing = false;

export async function initializeDatabase() {
  // Prevent concurrent initialization
  if (isInitializing) {
    console.log("Database initialization already in progress, skipping...");
    return;
  }

  try {
    isInitializing = true;

    const existingVarieties = await varietyService.getAllVarieties();

    // Create a more robust duplicate check using names
    const existingNames = new Set(existingVarieties.map((v) => v.name.trim()));

    const varietiesToAdd = seedVarieties.filter(
      (variety) => !existingNames.has(variety.name.trim())
    );

    if (varietiesToAdd.length > 0) {
      for (const variety of varietiesToAdd) {
        // Double-check before adding to prevent race conditions
        const existing = await varietyService.getVarietyByName(
          variety.name.trim()
        );
        if (existing) {
          continue;
        }

        await varietyService.addVariety({
          name: variety.name.trim(),
          category: variety.category,
          growthTimeline: variety.growthTimeline,
          protocols: (variety.protocols as PlantProtocols) || {},
          isEverbearing: variety.isEverbearing,
          productiveLifespan: variety.productiveLifespan,
        });
      }
    } else {
      console.log("✅ All seed varieties already exist in database");
    }

    // Final verification - check for any duplicates
    const finalVarieties = await varietyService.getAllVarieties();
    const finalNames = finalVarieties.map((v) => v.name);
    const uniqueFinalNames = new Set(finalNames);

    if (finalNames.length !== uniqueFinalNames.size) {
      const duplicates = finalNames.filter(
        (name, index) => finalNames.indexOf(name) !== index
      );
      console.error("Duplicate names:", [...new Set(duplicates)]);
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  } finally {
    isInitializing = false;
  }
}
