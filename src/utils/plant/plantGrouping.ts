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
    .map(p => {
      // Handle both Date objects and string dates, with fallback for invalid dates
      let plantedTime: number;
      try {
        if (p.plantedDate instanceof Date) {
          plantedTime = p.plantedDate.getTime();
        } else {
          const date = new Date(p.plantedDate);
          plantedTime = isNaN(date.getTime()) ? 0 : date.getTime();
        }
      } catch (error) {
        plantedTime = 0;
      }
      return `${p.id}-${p.varietyId}-${plantedTime}-${p.container}-${p.location}-${p.section || "no-section"}`;
    })
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
    // Handle both Date objects and string dates, with fallback for invalid dates
    let plantedDateStr: string;
    try {
      if (plant.plantedDate instanceof Date) {
        plantedDateStr = plant.plantedDate.toISOString().split("T")[0];
      } else {
        const date = new Date(plant.plantedDate);
        if (isNaN(date.getTime())) {
          // Fallback for invalid dates
          plantedDateStr = "invalid-date";
        } else {
          plantedDateStr = date.toISOString().split("T")[0];
        }
      }
    } catch (error) {
      plantedDateStr = "invalid-date";
    }

    const key = `${plant.varietyId}-${plantedDateStr}-${plant.container}-${plant.soilMix || "no-soil"}-${plant.location}-${plant.section || "no-section"}`;

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

    // Handle both Date objects and string dates for template plant, with fallback for invalid dates
    let templatePlantedTime: number;
    try {
      if (templatePlant.plantedDate instanceof Date) {
        templatePlantedTime = templatePlant.plantedDate.getTime();
      } else {
        const date = new Date(templatePlant.plantedDate);
        if (isNaN(date.getTime())) {
          // Fallback for invalid dates
          templatePlantedTime = 0;
        } else {
          templatePlantedTime = date.getTime();
        }
      }
    } catch (error) {
      templatePlantedTime = 0;
    }

    groups.push({
      id: `group-${templatePlant.varietyId}-${templatePlantedTime}-${templatePlant.section || "no-section"}`,
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
