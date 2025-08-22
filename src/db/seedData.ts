// src/db/seedData.ts
import { db } from "@/types/database";
import { getVarietiesForDatabase } from "@/data";

export let isDatabaseInitialized = false;
export const resetDatabaseInitializationFlag = () => {
  isDatabaseInitialized = false;
};

export const initializeDatabase = async (): Promise<void> => {
  if (isDatabaseInitialized) {
    return;
  }

  try {
    const existingCount = await db.varieties.count();
    if (existingCount > 0) {
      console.log("✅ Database already seeded.");
      isDatabaseInitialized = true;
      return;
    }

    console.log("🌱 Initializing database with seed data...");

    // Get varieties with proper database IDs and timestamps
    const varietyRecords = await getVarietiesForDatabase();

    await db.varieties.bulkAdd(varietyRecords);

    isDatabaseInitialized = true;
    console.log(`✅ Successfully seeded ${varietyRecords.length} varieties`);
  } catch (error) {
    if (error instanceof Error && error.name === "BulkError") {
      console.warn(
        "Seeding encountered a bulk error, likely due to duplicate keys."
      );
      isDatabaseInitialized = true;
    } else {
      isDatabaseInitialized = false;
      console.error("❌ Error initializing database:", error);
      throw error;
    }
  }
};
