// src/utils/plantDisplay.ts
import { PlantRecord } from "@/types/database";

/**
 * Gets a user-friendly display name for a plant.
 * Uses custom name first, then variety name, then fallback.
 */
export function getPlantDisplayName(plant: PlantRecord): string {
  // If user gave it a custom name, use that
  if (plant.name?.trim()) {
    return plant.name.trim();
  }

  // Otherwise, use the stored variety name instead of varietyId UUID
  if (plant.varietyName?.trim()) {
    return plant.varietyName.trim();
  }

  return "Unknown Plant";
}
