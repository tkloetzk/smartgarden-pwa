/**
 * Service for handling bulk care operations on plants in the same section/location
 */

import { PlantRecord, CareActivityType } from '@/types/consolidated';

export interface SectionPlants {
  sectionKey: string;
  location: string;
  container: string;
  section?: string;
  plants: PlantRecord[];
  varietyCount: number;
  varieties: string[];
}

export interface SectionApplyOption {
  sectionKey: string;
  plantCount: number;
  varieties: string[];
  location: string;
  container: string;
  section?: string;
  hasVarietyMix: boolean;
  displayText: string;
}

export interface BulkCareResult {
  plantId: string;
  plantName: string;
  success: boolean;
  error?: string;
}

/**
 * Generate a unique key for identifying plants in the same section
 */
export const generateSectionKey = (plant: PlantRecord): string => {
  const parts = [plant.location, plant.container];
  if (plant.section) {
    parts.push(plant.section);
  } else if (plant.structuredSection?.description) {
    parts.push(plant.structuredSection.description);
  }
  return parts.join('|').toLowerCase();
};

/**
 * Find all plants in the same section as the given plant
 */
export const findPlantsInSameSection = (
  targetPlant: PlantRecord, 
  allPlants: PlantRecord[]
): PlantRecord[] => {
  const targetKey = generateSectionKey(targetPlant);
  
  return allPlants.filter(plant => 
    plant.id !== targetPlant.id && 
    plant.isActive &&
    generateSectionKey(plant) === targetKey
  );
};

/**
 * Get section apply options for a plant
 */
export const getSectionApplyOption = (
  targetPlant: PlantRecord,
  allPlants: PlantRecord[]
): SectionApplyOption | null => {
  const sectionPlants = findPlantsInSameSection(targetPlant, allPlants);
  
  if (sectionPlants.length === 0) {
    return null;
  }

  const varieties = [...new Set(sectionPlants.map(p => p.varietyName))];
  const sectionKey = generateSectionKey(targetPlant);
  
  // Generate display text for the section
  let displayText = targetPlant.container;
  if (targetPlant.section) {
    displayText += ` • ${targetPlant.section}`;
  } else if (targetPlant.structuredSection?.description) {
    displayText += ` • ${targetPlant.structuredSection.description}`;
  }

  return {
    sectionKey,
    plantCount: sectionPlants.length,
    varieties,
    location: targetPlant.location,
    container: targetPlant.container,
    section: targetPlant.section || targetPlant.structuredSection?.description,
    hasVarietyMix: varieties.length > 1,
    displayText
  };
};

/**
 * Group all plants by their sections
 */
export const groupPlantsBySection = (plants: PlantRecord[]): SectionPlants[] => {
  const sectionMap = new Map<string, PlantRecord[]>();
  
  plants.filter(p => p.isActive).forEach(plant => {
    const key = generateSectionKey(plant);
    if (!sectionMap.has(key)) {
      sectionMap.set(key, []);
    }
    sectionMap.get(key)!.push(plant);
  });

  return Array.from(sectionMap.entries())
    .filter(([_, plants]) => plants.length > 1) // Only include sections with multiple plants
    .map(([sectionKey, plants]) => {
      const firstPlant = plants[0];
      const varieties = [...new Set(plants.map(p => p.varietyName))];
      
      return {
        sectionKey,
        location: firstPlant.location,
        container: firstPlant.container,
        section: firstPlant.section || firstPlant.structuredSection?.description,
        plants,
        varietyCount: varieties.length,
        varieties
      };
    })
    .sort((a, b) => b.plants.length - a.plants.length); // Sort by plant count
};

/**
 * Generate plant display name for bulk operations
 */
export const getPlantDisplayName = (plant: PlantRecord): string => {
  return plant.name || plant.varietyName;
};

/**
 * Validate if bulk care operation is safe for the plants
 */
export const validateBulkCareOperation = (
  plants: PlantRecord[],
  activityType: CareActivityType
): { isValid: boolean; warnings: string[]; errors: string[] } => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const varieties = [...new Set(plants.map(p => p.varietyName))];
  
  if (varieties.length > 1) {
    warnings.push(`Mixed varieties: ${varieties.join(', ')}`);
  }
  
  // Add activity-specific validations
  switch (activityType) {
    case 'water':
      if (varieties.length > 3) {
        warnings.push('Multiple plant types may have different watering needs');
      }
      break;
    case 'fertilize':
      if (varieties.length > 1) {
        warnings.push('Different plants may need different fertilizer types or dilutions');
      }
      break;
    case 'harvest':
      // Check if all plants are mature enough
      warnings.push('Verify all plants are ready for harvest');
      break;
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * Format section display text for mobile UI
 */
export const formatSectionDisplayMobile = (option: SectionApplyOption): {
  primary: string;
  secondary: string;
  emoji: string;
} => {
  const emoji = option.location === 'Indoor' ? '🏠' : '🌱';
  const primary = `${option.plantCount} plants`;
  
  let secondary = option.container;
  if (option.section) {
    secondary += ` • ${option.section}`;
  }
  
  if (option.hasVarietyMix) {
    secondary += ` • Mixed varieties`;
  }
  
  return { primary, secondary, emoji };
};