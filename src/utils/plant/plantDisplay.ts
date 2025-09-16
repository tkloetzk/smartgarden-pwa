// src/utils/plantDisplay.ts
import { PlantRecord } from "@/types/database";

/**
 * Gets a user-friendly display name for a plant.
 * Uses custom name first, then variety name + container info, then fallback.
 */
export function getPlantDisplayName(plant: PlantRecord): string {
  // If user gave it a custom name, use that
  if (plant.name?.trim()) {
    return plant.name.trim();
  }

  // Otherwise, use variety name with container info
  if (plant.varietyName?.trim()) {
    let displayName = plant.varietyName.trim();
    
    // Add container size/type info if available
    if (plant.container?.trim()) {
      // Extract size info from container string (e.g., "🪣 4-inch pot" -> "4-inch pot")
      const containerInfo = plant.container.replace(/^[^\w\s]*\s*/, '').trim();
      if (containerInfo) {
        displayName += ` (${containerInfo})`;
      }
    }
    
    return displayName;
  }

  return "Unknown Plant";
}
