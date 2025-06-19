// src/db/seedData.ts
import { varietyService } from "@/types/database";
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
    console.log("Starting database initialization...");

    const existingVarieties = await varietyService.getAllVarieties();

    // Create a more robust duplicate check using names
    const existingNames = new Set(existingVarieties.map((v) => v.name.trim()));

    console.log(`Found ${existingVarieties.length} existing varieties`);
    console.log("Existing variety names:", [...existingNames]);

    const varietiesToAdd = seedVarieties.filter(
      (variety) => !existingNames.has(variety.name.trim())
    );

    if (varietiesToAdd.length > 0) {
      console.log(
        `Adding ${varietiesToAdd.length} new varieties:`,
        varietiesToAdd.map((v) => v.name)
      );

      for (const variety of varietiesToAdd) {
        // Double-check before adding to prevent race conditions
        const existing = await varietyService.getVarietyByName(
          variety.name.trim()
        );
        if (existing) {
          console.log(`Variety "${variety.name}" already exists, skipping...`);
          continue;
        }

        await varietyService.addVariety({
          name: variety.name.trim(), // Ensure no extra whitespace
          category: variety.category,
          growthTimeline: variety.growthTimeline,
          protocols: variety.protocols || {},
          isEverbearing: variety.isEverbearing,
          productiveLifespan: variety.productiveLifespan,
        });

        console.log(`Added variety: ${variety.name}`);
      }

      console.log(
        `✅ Successfully added ${varietiesToAdd.length} new varieties`
      );
    } else {
      console.log("✅ All seed varieties already exist in database");
    }

    // Final verification - check for any duplicates
    const finalVarieties = await varietyService.getAllVarieties();
    const finalNames = finalVarieties.map((v) => v.name);
    const uniqueFinalNames = new Set(finalNames);

    if (finalNames.length !== uniqueFinalNames.size) {
      console.error("🚨 Duplicates detected after initialization!");
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
