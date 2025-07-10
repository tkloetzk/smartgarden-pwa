/**
 * Spacing and positioning types for succession planting and bed management
 */

export type PositionUnit = "inches" | "cm" | "feet" | "mm";
export type OrientationDirection = "north-south" | "east-west" | "diagonal";

/**
 * Represents a physical position within a bed or container
 */
export interface Position {
  /** Starting position from reference point */
  start: number;
  /** Length/width occupied by the planting */
  length: number;
  /** Unit of measurement */
  unit: PositionUnit;
  /** Optional width for rectangular areas */
  width?: number;
}

/**
 * Represents a bed or container for organizing plants
 */
export interface BedReference {
  /** Unique identifier for the bed */
  id: string;
  /** Human-readable name */
  name: string;
  /** Total dimensions */
  dimensions: {
    length: number;
    width: number;
    unit: PositionUnit;
  };
  /** Type of growing area */
  type: "raised-bed" | "container" | "ground-bed" | "greenhouse-bench" | "other";
  /** Optional orientation for directional planning */
  orientation?: OrientationDirection;
  /** Reference point description (e.g., "northwest corner", "drainage end") */
  referencePoint?: string;
}

/**
 * Structured section information for a plant
 */
export interface PlantSection {
  /** Reference to the bed/container */
  bedId: string;
  /** Position within the bed */
  position: Position;
  /** Optional row identifier for grid-based beds */
  row?: string | number;
  /** Optional column identifier for grid-based beds */
  column?: string | number;
  /** Human-readable description */
  description?: string;
  /** Whether this section is reserved for succession planting */
  isSuccessionSlot?: boolean;
  /** Planned succession interval in days */
  successionInterval?: number;
}

/**
 * Calculated spacing information for succession planning
 */
export interface SuccessionSpacing {
  /** Total available space in the bed */
  totalSpace: number;
  /** Space currently occupied by active plants */
  occupiedSpace: number;
  /** Available space for new plantings */
  availableSpace: number;
  /** Optimal spacing for the plant variety */
  optimalSpacing?: number;
  /** Maximum plants that can fit in available space */
  maxAdditionalPlants?: number;
  /** Suggested positions for next succession planting */
  suggestedPositions?: Position[];
}

/**
 * Extended plant record with structured spacing support
 */
export interface PlantSpacingData {
  /** Backward compatibility: freeform section text */
  section?: string;
  /** New structured section data */
  structuredSection?: PlantSection;
  /** Spacing requirements for this plant variety */
  spacingRequirements?: {
    /** Minimum spacing between plants */
    minSpacing: number;
    /** Optimal spacing for best growth */
    optimalSpacing: number;
    /** Maximum spacing (waste of space beyond this) */
    maxSpacing?: number;
    /** Unit for spacing measurements */
    unit: PositionUnit;
  };
}

/**
 * Bed management utilities for succession planning
 */
export interface BedPlanningData {
  /** All beds/containers in the system */
  beds: BedReference[];
  /** Current plantings by bed */
  plantingsByBed: Map<string, PlantSpacingData[]>;
  /** Succession schedule for each bed */
  successionSchedule?: Map<string, SuccessionPlanting[]>;
}

/**
 * Succession planting schedule entry
 */
export interface SuccessionPlanting {
  /** Planned planting date */
  plantingDate: Date;
  /** Variety to plant */
  varietyId: string;
  /** Position within the bed */
  position: Position;
  /** Status of this succession planting */
  status: "planned" | "planted" | "skipped" | "completed";
  /** Optional notes */
  notes?: string;
}

/**
 * Form data for creating/editing bed references
 */
export interface BedFormData {
  name: string;
  type: BedReference["type"];
  length: number;
  width: number;
  unit: PositionUnit;
  orientation?: OrientationDirection;
  referencePoint?: string;
  description?: string;
}

/**
 * Form data for structured section input
 */
export interface SectionFormData {
  bedId: string;
  startPosition: number;
  length: number;
  width?: number;
  unit: PositionUnit;
  row?: string;
  column?: string;
  description?: string;
  isSuccessionSlot?: boolean;
  successionInterval?: number;
}