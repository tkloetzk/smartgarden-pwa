# Succession Planting and Structured Spacing Design

## Overview

This design extends the current freeform section system to support structured spacing data for succession planting calculations. The system maintains backward compatibility while adding powerful new capabilities for space management and succession planning.

## Current State

- **Freeform sections**: Plants have an optional `section` field with text like "Row 1 - 6" section at 0""
- **Basic display**: Section information is shown in plant cards with a 🏷️ icon
- **Manual planning**: Users must manually calculate spacing and succession timing

## Proposed Enhancements

### 1. Structured Data Model

#### New Types (in `src/types/spacing.ts`):
- `BedReference`: Physical growing areas with dimensions and orientation
- `PlantSection`: Structured position data with precise measurements
- `SuccessionSpacing`: Calculated spacing information for planning
- `SuccessionPlanting`: Scheduled succession plantings

#### Database Updates:
- New `beds` table for managing growing areas
- Extended `PlantRecord` with `structuredSection` field
- Backward compatibility maintained with existing `section` field

### 2. Enhanced Plant Registration Form

#### Current Form:
```
Section/Area (Optional): [Free text input]
```

#### Proposed Enhanced Form:
```
Section/Area Configuration:
○ Simple text description (current)
○ Structured positioning (new)

[If structured positioning selected:]
Bed/Container: [Dropdown of available beds]
Position: Start: [___] Length: [___] Width: [___] Unit: [dropdown]
Grid Reference: Row: [___] Column: [___] (optional)
Description: [Free text for notes]
```

### 3. Bed Management System

#### Bed Registration:
- Name (e.g., "Raised Bed 1", "Greenhouse Bench A")
- Type (raised-bed, container, ground-bed, etc.)
- Dimensions (length × width with units)
- Orientation (north-south, east-west)
- Reference point (e.g., "northwest corner")

#### Bed Visualization:
- Grid view showing occupied and available spaces
- Visual spacing calculator
- Succession planning overlay

### 4. Succession Planning Calculator

#### Features:
- **Space Analysis**: Calculate available space in each bed
- **Conflict Detection**: Validate new plantings don't overlap
- **Optimal Spacing**: Recommend spacing based on plant variety
- **Schedule Generation**: Create succession planting timelines
- **Position Suggestions**: Recommend next available positions

#### Usage Example:
```
Bed: "Raised Bed 1" (24" × 108")
Current Plantings: 3 lettuce sections (18" occupied)
Available Space: 90" (enough for 15 more 6" sections)
Suggested Next Position: Start at 18", Length 6"
```

### 5. Implementation Phases

#### Phase 1: Foundation (Minimal working implementation)
- [x] Add structured data types
- [x] Extend database schema with beds table
- [x] Create succession planning service
- [ ] Update plant registration form with bed selection
- [ ] Add basic bed management UI

#### Phase 2: Enhanced UX
- [ ] Visual bed layout component
- [ ] Succession planning dashboard
- [ ] Conflict detection and warnings
- [ ] Spacing recommendations

#### Phase 3: Advanced Features
- [ ] Visual grid picker for position selection
- [ ] Automated succession scheduling
- [ ] Integration with care logging for bed-level activities
- [ ] Export/import bed layouts

## Technical Details

### Database Schema Changes

```typescript
interface PlantRecord {
  // Existing fields...
  section?: string; // Backward compatibility
  structuredSection?: PlantSection; // New structured data
}

interface BedRecord extends BaseRecord {
  name: string;
  type: "raised-bed" | "container" | "ground-bed" | "greenhouse-bench";
  dimensions: { length: number; width: number; unit: PositionUnit };
  orientation?: "north-south" | "east-west";
  referencePoint?: string;
  isActive: boolean;
}
```

### Service Architecture

```typescript
// Succession planning calculations
successionPlanningService.calculateAvailableSpace(bedId)
successionPlanningService.generateSuccessionSchedule(bedId, varietyId, startDate, interval)
successionPlanningService.validatePosition(bedId, position)

// Bed management
bedService.addBed(bed)
bedService.getActiveBeds()
bedService.updateBed(id, updates)
```

### Form Components

```typescript
// Enhanced registration form
<BedSelector beds={availableBeds} onSelect={setBedId} />
<PositionInput bed={selectedBed} onPositionChange={setPosition} />
<SpacingCalculator variety={selectedVariety} bed={selectedBed} />
```

## User Experience Flow

### 1. Initial Setup
1. User creates bed definitions for their growing areas
2. System provides templates for common setups

### 2. Plant Registration
1. User selects structured positioning option
2. Chooses bed from dropdown
3. System shows available positions and spacing recommendations
4. User confirms position or adjusts manually

### 3. Succession Planning
1. User views bed layout with current plantings
2. System calculates available space and suggests next positions
3. User schedules succession plantings with automated positioning
4. System tracks and reminds about upcoming plantings

### 4. Space Management
1. Visual dashboard shows space utilization across all beds
2. Conflict detection prevents overlapping plantings
3. Optimal spacing recommendations maximize productivity

## Benefits

### For Users:
- **Precise Planning**: Calculate exactly how many plants fit in available space
- **Succession Automation**: Automated scheduling of succession plantings
- **Space Optimization**: Maximize growing area utilization
- **Conflict Prevention**: Avoid overlapping plantings
- **Visual Organization**: Clear layout of growing areas

### For Development:
- **Backward Compatibility**: Existing freeform sections continue to work
- **Incremental Adoption**: Users can gradually adopt structured approach
- **Extensible Architecture**: Foundation for advanced features
- **Data-Driven Decisions**: Precise metrics for space and timing

## Migration Strategy

### Phase 1: Parallel Systems
- Keep existing freeform `section` field
- Add optional `structuredSection` field
- Display both in UI with preference for structured data

### Phase 2: Gradual Migration
- Provide migration tools to convert freeform to structured
- Add prompts to encourage structured input
- Maintain full backward compatibility

### Phase 3: Enhanced Features
- Advanced features only available with structured data
- Continue supporting both systems indefinitely
- Most new features built on structured foundation

## Testing Strategy

### Unit Tests:
- Succession planning calculations
- Position conflict detection
- Unit conversion utilities
- Bed management operations

### Integration Tests:
- Form submission with structured data
- Migration from freeform to structured
- Database schema migrations
- Service integration

### User Experience Tests:
- Form usability with both input methods
- Visual feedback for spacing conflicts
- Performance with large numbers of beds/plants

## Future Enhancements

### Advanced Spacing:
- Companion planting spacing rules
- Plant-specific spacing recommendations
- Seasonal spacing adjustments

### Integration Features:
- Calendar integration for succession scheduling
- Weather-based planting recommendations
- Harvest prediction based on spacing

### Visualization:
- 3D bed layout viewer
- Augmented reality plant positioning
- Photo overlay for bed planning

This design provides a comprehensive foundation for structured succession planting while maintaining the simplicity and flexibility that users expect.