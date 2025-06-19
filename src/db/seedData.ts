// src/db/seedData.ts
import { varietyService } from "@/types/database";
import { seedVarieties } from "../data/seedVarieties";

export async function initializeDatabase() {
  try {
    // console.log("Checking database initialization...");

    const existingVarieties = await varietyService.getAllVarieties();
    const existingNames = new Set(existingVarieties.map((v) => v.name));

    // console.log(`Found ${existingVarieties.length} existing varieties`);

    const varietiesToAdd = seedVarieties.filter(
      (variety) => !existingNames.has(variety.name)
    );

    if (varietiesToAdd.length > 0) {
      // console.log(`Adding ${varietiesToAdd.length} new varieties...`);

      for (const variety of varietiesToAdd) {
        await varietyService.addVariety({
          name: variety.name,
          category: variety.category,
          growthTimeline: variety.growthTimeline,
          protocols: variety.protocols || {},
          isEverbearing: variety.isEverbearing, // ← ADD THIS
          productiveLifespan: variety.productiveLifespan, // ← ADD THIS
        });
      }

      // console.log(`Successfully added ${varietiesToAdd.length} new varieties`);
    } else {
      console.log("All seed varieties already exist in database");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}
