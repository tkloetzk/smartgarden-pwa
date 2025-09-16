// src/utils/plantGrouping.ts
import { PlantRecord } from "@/types/database";

// Memoization cache for plant grouping
const groupingCache = new Map<string, PlantGroup[]>();
const cacheTimestamps = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface PlantGroup {
  id: string;
  varietyId: string;
  varietyName: string;
  plantedDate: Date;
  container: string;
  soilMix?: string;
  location: string;
  section?: string;
  plants: PlantRecord[];
  setupType: "multiple-containers" | "same-container";
}

// Generate cache key based on plant data
const generateCacheKey = (plants: PlantRecord[]): string => {
  return plants
    .map(p => `${p.id}-${p.varietyId}-${p.plantedDate.getTime()}-${p.container}-${p.location}-${p.section || "no-section"}`)
    .sort()
    .join('|');
};

// Check if cache is valid
const isCacheValid = (key: string): boolean => {
  const timestamp = cacheTimestamps.get(key);
  return timestamp !== undefined && (Date.now() - timestamp) < CACHE_DURATION;
};

export const groupPlantsByConditions = (
  plants: PlantRecord[]
): PlantGroup[] => {
  // Check cache first
  const cacheKey = generateCacheKey(plants);
  if (isCacheValid(cacheKey)) {
    const cached = groupingCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const groupMap = new Map<string, PlantRecord[]>();

  plants.forEach((plant) => {
    // Create a key based on matching criteria
    // Use full container name to distinguish between sections like "Row 3, Column 1" vs "Row 3, Column 2"
    const key = `${plant.varietyId}-${
      plant.plantedDate.toISOString().split("T")[0]
    }-${plant.container}-${plant.soilMix || "no-soil"}-${plant.location}-${plant.section || "no-section"}`;

    // Debug logging removed

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(plant);
  });

  const groups: PlantGroup[] = [];

  groupMap.forEach((plantsInGroup) => {
    if (plantsInGroup.length === 0) return;

    // Use the first plant as the template for group properties
    const templatePlant = plantsInGroup[0];

    groups.push({
      id: `group-${
        templatePlant.varietyId
      }-${templatePlant.plantedDate.getTime()}-${templatePlant.section || "no-section"}`,
      varietyId: templatePlant.varietyId,
      varietyName: templatePlant.varietyName,
      plantedDate: templatePlant.plantedDate,
      container: templatePlant.container,
      soilMix: templatePlant.soilMix,
      location: templatePlant.location,
      section: templatePlant.section,
      plants: plantsInGroup.sort(
        (a, b) => a.name?.localeCompare(b.name || "") || 0
      ),
      setupType: templatePlant.setupType || "multiple-containers",
    });
  });

  const result = groups.sort((a, b) => a.varietyName.localeCompare(b.varietyName));
  
  // Debug logging removed
  
  // Cache the result
  groupingCache.set(cacheKey, result);
  cacheTimestamps.set(cacheKey, Date.now());
  
  return result;
};
