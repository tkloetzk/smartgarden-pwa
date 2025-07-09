# Succession Planting Data Model Design

## Problem Statement
User has a large planting area (24" × 9") divided into sections for succession planting. Need to:
1. Track multiple planting events in the same physical space
2. Log care activities (watering) at the section level, not just per-plant
3. Support succession planning and tracking
4. Handle different care needs for plants at different stages

## Proposed Data Model

### 1. Planting Areas & Sections

```typescript
interface PlantingArea {
  id: string;
  userId: string;
  name: string;                    // "Main Garden Bed A"
  location: string;                // "Backyard"
  type: "raised-bed" | "ground-plot" | "container-group";
  dimensions?: {
    width: number;                 // inches
    length: number;                // inches
    depth?: number;                // inches
  };
  soilMix?: string;
  notes?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PlantingSection {
  id: string;
  areaId: string;
  name: string;                    // "Row 1 - Section A" or "6" section starting at 0""
  position?: {
    x: number;                     // position within area
    y: number;
  };
  dimensions?: {
    width: number;                 // 6 inches
    length: number;
  };
  status: "available" | "planted" | "reserved" | "fallow";
  reservedFor?: string;            // "succession wave 2"
  notes?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Succession Planning

```typescript
interface SuccessionPlan {
  id: string;
  userId: string;
  name: string;                    // "Lettuce Summer Succession"
  varietyId: string;
  areaId: string;
  intervalDays: number;            // 14 days between plantings
  totalWaves: number;              // 4 waves total
  currentWave: number;             // currently on wave 2
  status: "planning" | "active" | "completed" | "paused";
  startDate: Date;
  nextPlantingDate?: Date;
  template?: {                     // for future waves
    seedCount: number;
    spacing: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface SuccessionWave {
  id: string;
  successionPlanId: string;
  waveNumber: number;              // 1, 2, 3, 4
  plannedDate: Date;
  actualDate?: Date;
  sectionId?: string;              // which section this wave uses
  seedCount: number;
  status: "planned" | "planted" | "germinated" | "harvested" | "completed";
  notes?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Enhanced Plant Records

```typescript
interface PlantRecord extends BaseRecord {
  // Existing fields...
  varietyId: string;
  varietyName: string;
  name?: string;
  plantedDate: Date;
  isActive: boolean;
  
  // New area/succession fields
  areaId?: string;                 // links to PlantingArea
  sectionId?: string;              // links to PlantingSection
  successionPlanId?: string;       // links to SuccessionPlan
  successionWaveId?: string;       // links to SuccessionWave
  waveNumber?: number;             // 1, 2, 3, 4 for easy sorting
  
  // Enhanced location tracking
  location: string;                // now derived from area + section
  container: string;
  position?: {                     // position within section
    row?: number;
    plant?: number;
  };
  
  // Existing quantity/count fields
  quantity?: number;
  currentPlantCount?: number;
  originalPlantCount?: number;
  
  // Rest of existing fields...
}
```

### 4. Section-Based Care Activities

```typescript
interface SectionCareActivity {
  id: string;
  userId: string;
  areaId: string;
  sectionId: string;
  type: CareActivityType;
  date: Date;
  details: CareActivityDetails;
  
  // Which plants this activity applies to
  affectedPlantIds: string[];      // auto-populated based on section
  affectedWaves?: number[];        // [1, 2] if only waves 1 & 2 were watered
  
  // Activity-specific data
  volume?: string;                 // "2 gallons" for the whole section
  notes?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced individual plant care activity
interface CareActivityRecord extends BaseRecord {
  plantId: string;
  type: CareActivityType;
  date: Date;
  details: CareActivityDetails;
  
  // New fields for section-based activities
  sectionActivityId?: string;      // if this was part of a section-wide activity
  isIndividual: boolean;           // true = plant-specific, false = from section activity
}
```

## Implementation Strategy

### Phase 1: Area & Section Management
1. Create `PlantingArea` and `PlantingSection` management UI
2. Allow users to define areas and subdivide into sections
3. Update plant creation to assign to areas/sections
4. Migrate existing plants to use new area-based location system

### Phase 2: Section-Based Care Logging
1. Add section-level care activity logging
2. UI to select "water entire section" vs "water specific plants"
3. Auto-populate affected plants when logging section activities
4. Update care history views to show both individual and section activities

### Phase 3: Succession Planning
1. Create succession plan creation UI
2. Implement automatic wave scheduling
3. Section reservation for future waves
4. Succession planning dashboard

### Phase 4: Enhanced Analytics
1. Section-based care analytics
2. Succession performance tracking
3. Harvest planning across waves
4. Resource planning (water, fertilizer per section)

## User Experience Examples

### Creating a Succession Plan
1. User creates "Main Garden Bed" area (24" × 9")
2. Divides into 4 sections of 6" × 9" each
3. Creates succession plan: "Lettuce Summer" with 14-day intervals
4. Plants wave 1 in section 1, reserves sections 2-4 for future waves
5. System automatically schedules future plantings

### Section-Based Watering
1. User goes to log care activity
2. Selects "Water" → "Section 1 of Main Garden Bed"
3. Logs volume and notes
4. System automatically applies to all plants in that section
5. Plants in other sections are unaffected

### Mixed-Stage Management
1. Section 1: 30-day-old lettuce ready for harvest
2. Section 2: 16-day-old lettuce in vegetative stage
3. Section 3: 2-day-old lettuce just germinated
4. Section 4: Reserved for next week's planting
5. Each can be watered/cared for independently

## Benefits
- ✅ Granular care logging at appropriate level (section vs plant)
- ✅ Succession planning and automatic scheduling
- ✅ Efficient space utilization tracking
- ✅ Realistic representation of gardening practices
- ✅ Maintains existing plant-level detail when needed
- ✅ Supports complex growing scenarios