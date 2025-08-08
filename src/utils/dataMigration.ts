/**
 * Data Migration Utilities
 * 
 * Provides safe utilities to validate and migrate plant data structures
 * to ensure they match the current schema.
 */

import { PlantRecord } from '@/types/database';
import { Logger } from '@/utils/logger';

// Current schema version
const CURRENT_SCHEMA_VERSION = '2024-08-07';

interface MigrationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  migratedCount: number;
  totalCount: number;
}

interface PlantDataValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  needsMigration: boolean;
}

/**
 * Validates a plant record against the current schema
 */
export function validatePlantRecord(plant: any): PlantDataValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  let needsMigration = false;

  // Required fields validation
  if (!plant.id || typeof plant.id !== 'string') {
    errors.push('Missing or invalid id');
  }
  
  if (!plant.varietyId || typeof plant.varietyId !== 'string') {
    errors.push('Missing or invalid varietyId');
  }
  
  if (!plant.varietyName || typeof plant.varietyName !== 'string') {
    errors.push('Missing or invalid varietyName');
  }
  
  if (!plant.plantedDate) {
    errors.push('Missing plantedDate');
  } else if (!(plant.plantedDate instanceof Date) && typeof plant.plantedDate !== 'string') {
    errors.push('Invalid plantedDate format');
  }
  
  if (!plant.location || typeof plant.location !== 'string') {
    errors.push('Missing or invalid location');
  }
  
  if (!plant.container || typeof plant.container !== 'string') {
    errors.push('Missing or invalid container');
  }
  
  if (typeof plant.isActive !== 'boolean') {
    errors.push('Missing or invalid isActive flag');
  }

  // Optional fields validation
  if (plant.name && typeof plant.name !== 'string') {
    warnings.push('Invalid name field - should be string');
  }
  
  if (plant.soilMix && typeof plant.soilMix !== 'string') {
    warnings.push('Invalid soilMix field - should be string');
  }
  
  if (plant.quantity && typeof plant.quantity !== 'number') {
    warnings.push('Invalid quantity field - should be number');
  }
  
  if (plant.notes && !Array.isArray(plant.notes)) {
    warnings.push('Invalid notes field - should be array');
    needsMigration = true;
  }

  // Check for timestamps
  if (!plant.createdAt) {
    warnings.push('Missing createdAt timestamp');
    needsMigration = true;
  }
  
  if (!plant.updatedAt) {
    warnings.push('Missing updatedAt timestamp');
    needsMigration = true;
  }

  // Check for deprecated fields that need migration
  if (plant.bedId) {
    warnings.push('Deprecated bedId field found - needs migration');
    needsMigration = true;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    needsMigration
  };
}

/**
 * Migrates a plant record to the current schema
 */
export function migratePlantRecord(plant: any): PlantRecord {
  const now = new Date();
  
  // Create base migrated plant
  const migrated: PlantRecord = {
    id: plant.id,
    varietyId: plant.varietyId,
    varietyName: plant.varietyName,
    name: plant.name || undefined,
    plantedDate: plant.plantedDate instanceof Date ? plant.plantedDate : new Date(plant.plantedDate),
    location: plant.location,
    container: plant.container,
    soilMix: plant.soilMix || undefined,
    isActive: plant.isActive ?? true,
    quantity: plant.quantity || undefined,
    notes: Array.isArray(plant.notes) ? plant.notes : (plant.notes ? [plant.notes] : undefined),
    createdAt: plant.createdAt ? (plant.createdAt instanceof Date ? plant.createdAt : new Date(plant.createdAt)) : now,
    updatedAt: plant.updatedAt ? (plant.updatedAt instanceof Date ? plant.updatedAt : new Date(plant.updatedAt)) : now,
    
    // New fields added over time
    setupType: plant.setupType || 'multiple-containers',
    section: plant.section || undefined,
    growthRateModifier: plant.growthRateModifier || 1.0,
  };

  return migrated;
}

/**
 * Generates a data validation report for existing plants
 */
export async function generatePlantDataReport(plants: any[]): Promise<{
  summary: {
    total: number;
    valid: number;
    invalid: number;
    needsMigration: number;
  };
  details: Array<{
    id: string;
    varietyName: string;
    validation: PlantDataValidation;
  }>;
}> {
  const details = plants.map(plant => ({
    id: plant.id || 'unknown',
    varietyName: plant.varietyName || 'unknown',
    validation: validatePlantRecord(plant)
  }));

  const summary = {
    total: plants.length,
    valid: details.filter(d => d.validation.isValid).length,
    invalid: details.filter(d => !d.validation.isValid).length,
    needsMigration: details.filter(d => d.validation.needsMigration).length,
  };

  return { summary, details };
}

/**
 * Creates a backup of current plant data before migration
 */
export function createDataBackup(plants: any[], careActivities: any[] = []): string {
  const backup = {
    version: CURRENT_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    plants,
    careActivities,
    metadata: {
      plantCount: plants.length,
      careActivityCount: careActivities.length,
    }
  };

  const backupData = JSON.stringify(backup, null, 2);
  
  // In a real implementation, you might want to save this to a file or send to a backup service
  Logger.info(`Data backup created with ${plants.length} plants and ${careActivities.length} care activities`);
  
  return backupData;
}

/**
 * Batch migrates plant records with progress tracking
 */
export async function batchMigratePlants(
  plants: any[],
  progressCallback?: (progress: number, current: number, total: number) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    errors: [],
    warnings: [],
    migratedCount: 0,
    totalCount: plants.length
  };

  for (let i = 0; i < plants.length; i++) {
    try {
      const plant = plants[i];
      const validation = validatePlantRecord(plant);
      
      // Collect all warnings
      result.warnings.push(...validation.warnings.map(w => `Plant ${plant.id || i}: ${w}`));
      
      if (!validation.isValid) {
        result.errors.push(...validation.errors.map(e => `Plant ${plant.id || i}: ${e}`));
        result.success = false;
      } else if (validation.needsMigration) {
        // This would be where you'd actually save the migrated data
        const migrated = migratePlantRecord(plant);
        result.migratedCount++;
        Logger.info(`Migrated plant: ${migrated.varietyName} (${migrated.id})`);
      }
      
      // Progress callback
      if (progressCallback) {
        progressCallback(Math.round(((i + 1) / plants.length) * 100), i + 1, plants.length);
      }
    } catch (error) {
      result.errors.push(`Failed to process plant ${i}: ${error}`);
      result.success = false;
    }
  }

  return result;
}

/**
 * Console utility to inspect plant data structure
 */
export function inspectPlantData(plants: any[]): void {
  console.group('🌱 Plant Data Structure Inspection');
  
  if (plants.length === 0) {
    console.log('No plants found');
    console.groupEnd();
    return;
  }

  const samplePlant = plants[0];
  console.log('Sample plant structure:', samplePlant);
  
  const fieldAnalysis = analyzeFields(plants);
  console.table(fieldAnalysis);
  
  const validation = generatePlantDataReport(plants);
  validation.then(report => {
    console.log('Validation Summary:', report.summary);
    
    if (report.details.some(d => !d.validation.isValid)) {
      console.group('❌ Invalid Plants:');
      report.details
        .filter(d => !d.validation.isValid)
        .forEach(d => {
          console.log(`${d.varietyName} (${d.id}):`, d.validation.errors);
        });
      console.groupEnd();
    }
    
    if (report.details.some(d => d.validation.needsMigration)) {
      console.group('⚠️ Plants needing migration:');
      report.details
        .filter(d => d.validation.needsMigration)
        .forEach(d => {
          console.log(`${d.varietyName} (${d.id}):`, d.validation.warnings);
        });
      console.groupEnd();
    }
  });
  
  console.groupEnd();
}

function analyzeFields(plants: any[]): Record<string, { present: number; missing: number; types: Set<string> }> {
  const fieldAnalysis: Record<string, { present: number; missing: number; types: Set<string> }> = {};
  
  plants.forEach(plant => {
    Object.keys(plant).forEach(field => {
      if (!fieldAnalysis[field]) {
        fieldAnalysis[field] = { present: 0, missing: 0, types: new Set() };
      }
      
      if (plant[field] !== undefined && plant[field] !== null) {
        fieldAnalysis[field].present++;
        fieldAnalysis[field].types.add(typeof plant[field]);
      } else {
        fieldAnalysis[field].missing++;
      }
    });
  });
  
  return fieldAnalysis;
}