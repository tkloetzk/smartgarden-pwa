# Data Migration & Validation Tools

This document explains how to safely inspect, validate, and migrate your SmartGarden plant data to ensure it matches the current schema format.

## 🚨 Important Safety Notice

**Always create a backup before making any changes to production data.**

## Available Tools

### 1. Browser-Based Data Inspection (Recommended)

The safest and easiest way to inspect your data:

1. **Navigate to**: `http://localhost:5173/admin/data-inspection` (or your deployed URL)
2. **Features**:
   - Real-time data structure analysis  
   - Validation against current schema
   - Backup creation with download
   - Visual data insights
   - Field analysis across all plants

### 2. Migration Utilities

Located in `src/utils/dataMigration.ts`:

```typescript
// Validate a single plant record
const validation = validatePlantRecord(plant);

// Generate full data report
const report = await generatePlantDataReport(plants);

// Create backup
const backup = createDataBackup(plants, careActivities);

// Migrate plant structure
const migratedPlant = migratePlantRecord(oldPlant);
```

### 3. Console Inspector

For quick debugging:

```typescript
import { inspectPlantData } from '@/utils/dataMigration';

// In browser console or component
inspectPlantData(plants);
```

## Current Plant Record Schema (2024-08-07)

```typescript
interface PlantRecord {
  // Required fields
  id: string;
  varietyId: string;
  varietyName: string;
  plantedDate: Date;
  location: string;
  container: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields  
  name?: string;
  soilMix?: string;
  notes?: string[];
  quantity?: number;
  section?: string;
  setupType?: "multiple-containers" | "same-container";
  growthRateModifier?: number;
}
```

## Common Data Issues & Solutions

### Issue: Missing Required Fields
- **Problem**: Plants missing `id`, `varietyId`, `plantedDate`, etc.
- **Solution**: Add missing fields with appropriate defaults

### Issue: Invalid Date Formats
- **Problem**: `plantedDate` is string instead of Date object  
- **Solution**: Convert strings to Date objects during migration

### Issue: Inconsistent Field Types
- **Problem**: `quantity` as string instead of number
- **Solution**: Type coercion during validation

### Issue: Legacy Field Names
- **Problem**: Old field names like `bedId` instead of `container`
- **Solution**: Field mapping during migration

## Step-by-Step Data Validation Process

### Step 1: Inspect Current Data
1. Go to `/admin/data-inspection`
2. Review the data structure analysis
3. Check for validation errors or warnings

### Step 2: Create Backup
1. Click "Create Backup" button
2. Download the JSON backup file
3. Store safely for rollback if needed

### Step 3: Analyze Issues
Review the detailed issues section to understand:
- Invalid plant records
- Missing required fields
- Type mismatches
- Migration needs

### Step 4: Plan Migration
Based on the inspection results:
- Identify plants that need updates
- Plan field mappings
- Determine data cleanup needs

## Manual Data Cleanup Options

### Option 1: Firebase Console (Safest)
1. Go to Firebase Console → Firestore
2. Navigate to your `plants` collection  
3. Edit individual documents as needed
4. Update field types and add missing fields

### Option 2: Batch Updates via Code
Create a migration script that:
1. Fetches all plants
2. Validates each plant
3. Updates invalid records
4. Preserves original data structure

### Option 3: Export/Import
1. Export current data via backup tool
2. Clean up data in JSON file
3. Clear collection (with extreme caution)
4. Import cleaned data

## Field Migration Examples

### Adding Missing Timestamps
```typescript
// If createdAt/updatedAt are missing
const now = new Date();
await updatePlant(plantId, {
  createdAt: plantedDate, // Use planting date as creation
  updatedAt: now
});
```

### Converting String Dates
```typescript
// Convert string dates to Date objects
if (typeof plant.plantedDate === 'string') {
  plant.plantedDate = new Date(plant.plantedDate);
}
```

### Normalizing Container Names
```typescript
// Standardize container naming
const normalizedContainer = plant.container
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '-');
```

## Validation Checklist

Before considering your data "clean":

- [ ] All plants have required fields
- [ ] All dates are valid Date objects  
- [ ] Field types match schema expectations
- [ ] No orphaned or duplicate records
- [ ] Consistent naming conventions
- [ ] Valid foreign key references (varietyId)

## Emergency Rollback

If something goes wrong:

1. Stop all application instances
2. Restore from backup:
   - Clear affected collections
   - Import backup data
3. Verify data integrity  
4. Restart applications

## Need Help?

- Review validation errors in `/admin/data-inspection`
- Check browser console for detailed error logs
- Test migrations in development environment first
- Consider gradual migration of small batches

Remember: **Data safety first!** Always backup before making changes.