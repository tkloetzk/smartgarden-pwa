import { PlantRecord, bedService, plantService } from "@/types/database";
import { 
  Position, 
  SuccessionSpacing, 
  SuccessionPlanting, 
  PositionUnit 
} from "@/types";

/**
 * Service for calculating succession planting spacing and scheduling
 */
export class SuccessionPlanningService {
  /**
   * Calculate available space in a bed for succession planting
   */
  async calculateAvailableSpace(bedId: string): Promise<SuccessionSpacing> {
    const bed = await bedService.getBed(bedId);
    if (!bed) {
      throw new Error(`Bed not found: ${bedId}`);
    }

    // Get all active plants in this bed
    const allPlants = await plantService.getActivePlants();
    const plantsInBed = allPlants.filter(plant => 
      plant.structuredSection?.bedId === bedId
    );

    // Calculate total available space
    const totalSpace = bed.dimensions.length * bed.dimensions.width;
    
    // Calculate occupied space
    let occupiedSpace = 0;
    const occupiedPositions: Position[] = [];

    for (const plant of plantsInBed) {
      const section = plant.structuredSection;
      if (section && section.position) {
        const plantArea = section.position.length * (section.position.width || section.position.length);
        occupiedSpace += plantArea;
        occupiedPositions.push(section.position);
      }
    }

    // Calculate available space
    const availableSpace = totalSpace - occupiedSpace;

    // Find gaps between existing plantings
    const suggestedPositions = this.findAvailablePositions(
      bed.dimensions,
      occupiedPositions,
      6 // Default minimum spacing in inches
    );

    return {
      totalSpace,
      occupiedSpace,
      availableSpace,
      suggestedPositions,
    };
  }

  /**
   * Find available positions for new plantings in a bed
   */
  private findAvailablePositions(
    bedDimensions: { length: number; width: number; unit: PositionUnit },
    occupiedPositions: Position[],
    minSpacing: number
  ): Position[] {
    const suggestions: Position[] = [];
    const stepSize = minSpacing; // Step through in minimum spacing increments

    // Simple algorithm: scan through the bed in a grid pattern
    for (let x = 0; x < bedDimensions.length; x += stepSize) {
      for (let y = 0; y < bedDimensions.width; y += stepSize) {
        const candidatePosition: Position = {
          start: x,
          length: minSpacing,
          width: minSpacing,
          unit: bedDimensions.unit,
        };

        // Check if this position conflicts with any existing plantings
        if (!this.positionConflicts(candidatePosition, occupiedPositions, minSpacing)) {
          suggestions.push(candidatePosition);
        }
      }
    }

    return suggestions.slice(0, 10); // Return top 10 suggestions
  }

  /**
   * Check if a position conflicts with existing plantings
   */
  private positionConflicts(
    candidate: Position,
    occupiedPositions: Position[],
    buffer: number
  ): boolean {
    for (const occupied of occupiedPositions) {
      // Simple rectangular overlap check with buffer
      const candidateEnd = candidate.start + candidate.length + buffer;
      const occupiedEnd = occupied.start + occupied.length + buffer;
      
      if (!(candidate.start >= occupiedEnd || candidateEnd <= occupied.start)) {
        return true; // Conflict detected
      }
    }
    return false;
  }

  /**
   * Generate succession planting schedule
   */
  async generateSuccessionSchedule(
    bedId: string,
    varietyId: string,
    startDate: Date,
    interval: number, // days between plantings
    numberOfSuccessions: number
  ): Promise<SuccessionPlanting[]> {
    const spacing = await this.calculateAvailableSpace(bedId);
    const schedule: SuccessionPlanting[] = [];

    for (let i = 0; i < numberOfSuccessions; i++) {
      const plantingDate = new Date(startDate);
      plantingDate.setDate(startDate.getDate() + (i * interval));

      // Find next available position
      const availablePosition = spacing.suggestedPositions?.[i];
      if (!availablePosition) {
        break; // No more space available
      }

      schedule.push({
        plantingDate,
        varietyId,
        position: availablePosition,
        status: "planned",
        notes: `Succession planting ${i + 1} of ${numberOfSuccessions}`,
      });
    }

    return schedule;
  }

  /**
   * Calculate optimal spacing for a variety
   */
  calculateOptimalSpacing(
    plantSize: "small" | "medium" | "large" = "medium"
  ): { minSpacing: number; optimalSpacing: number; unit: PositionUnit } {
    // Default spacing recommendations by plant size
    const spacingMap = {
      small: { min: 4, optimal: 6 },
      medium: { min: 6, optimal: 8 },
      large: { min: 8, optimal: 12 },
    };

    const spacing = spacingMap[plantSize];
    
    return {
      minSpacing: spacing.min,
      optimalSpacing: spacing.optimal,
      unit: "inches",
    };
  }

  /**
   * Convert position units (helper function)
   */
  convertUnits(
    value: number,
    fromUnit: PositionUnit,
    toUnit: PositionUnit
  ): number {
    const toInches = {
      inches: 1,
      feet: 12,
      cm: 0.393701,
      mm: 0.0393701,
    };

    const fromInches = {
      inches: 1,
      feet: 1/12,
      cm: 2.54,
      mm: 25.4,
    };

    // Convert to inches first, then to target unit
    const inInches = value * toInches[fromUnit];
    return inInches * fromInches[toUnit];
  }

  /**
   * Get plants in a specific bed
   */
  async getPlantsInBed(bedId: string): Promise<PlantRecord[]> {
    const allPlants = await plantService.getActivePlants();
    return allPlants.filter(plant => 
      plant.structuredSection?.bedId === bedId
    );
  }

  /**
   * Validate that a position doesn't conflict with existing plantings
   */
  async validatePosition(
    bedId: string,
    position: Position,
    excludePlantId?: string
  ): Promise<{ isValid: boolean; conflicts: string[] }> {
    const plantsInBed = await this.getPlantsInBed(bedId);
    const conflicts: string[] = [];

    for (const plant of plantsInBed) {
      if (excludePlantId && plant.id === excludePlantId) continue;

      const existingPosition = plant.structuredSection?.position;
      if (existingPosition && this.positionConflicts(position, [existingPosition], 2)) {
        conflicts.push(plant.name || plant.varietyName);
      }
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
    };
  }
}

export const successionPlanningService = new SuccessionPlanningService();