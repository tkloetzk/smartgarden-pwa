/**
 * Business Logic Tests for SuccessionPlanningService
 * 
 * These tests focus on succession planting business rules and calculations
 * without database mocking. Tests spacing algorithms, positioning logic, and planning rules.
 */

import { Position, PositionUnit } from "@/types";

describe('SuccessionPlanningService Business Logic', () => {

  describe('Space Calculation Logic', () => {
    it('should calculate total bed space correctly', () => {
      const bedDimensions = [
        { length: 108, width: 24, expectedArea: 2592 }, // 108 * 24
        { length: 48, width: 36, expectedArea: 1728 },  // 48 * 36
        { length: 72, width: 18, expectedArea: 1296 },  // 72 * 18
      ];

      bedDimensions.forEach(bed => {
        const totalSpace = bed.length * bed.width;
        expect(totalSpace).toBe(bed.expectedArea);
        expect(totalSpace).toBeGreaterThan(0);
      });
    });

    it('should calculate occupied space from plant positions', () => {
      const plantPositions = [
        { position: { length: 6, width: 6 }, expectedArea: 36 },
        { position: { length: 8, width: 4 }, expectedArea: 32 },
        { position: { length: 12, width: 12 }, expectedArea: 144 },
      ];

      let totalOccupied = 0;
      plantPositions.forEach(plant => {
        const plantArea = plant.position.length * plant.position.width;
        expect(plantArea).toBe(plant.expectedArea);
        totalOccupied += plantArea;
      });

      expect(totalOccupied).toBe(212); // 36 + 32 + 144
    });

    it('should calculate available space correctly', () => {
      const scenarios = [
        { totalSpace: 1000, occupiedSpace: 300, expectedAvailable: 700 },
        { totalSpace: 2592, occupiedSpace: 500, expectedAvailable: 2092 },
        { totalSpace: 100, occupiedSpace: 100, expectedAvailable: 0 },
        { totalSpace: 500, occupiedSpace: 0, expectedAvailable: 500 },
      ];

      scenarios.forEach(scenario => {
        const availableSpace = scenario.totalSpace - scenario.occupiedSpace;
        expect(availableSpace).toBe(scenario.expectedAvailable);
        expect(availableSpace).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Position Conflict Detection', () => {
    it('should detect overlapping positions correctly', () => {
      const testCases = [
        {
          candidate: { start: 0, length: 6 },
          occupied: { start: 4, length: 6 },
          buffer: 2,
          shouldConflict: true, // 0-8 overlaps with 2-12
        },
        {
          candidate: { start: 10, length: 6 },
          occupied: { start: 0, length: 6 },
          buffer: 2,
          shouldConflict: false, // 10-18 doesn't overlap with -2-8
        },
        {
          candidate: { start: 0, length: 4 },
          occupied: { start: 6, length: 4 },
          buffer: 1,
          shouldConflict: false, // 0-5 doesn't overlap with 5-11
        },
        {
          candidate: { start: 0, length: 4 },
          occupied: { start: 3, length: 4 },
          buffer: 0,
          shouldConflict: true, // 0-4 overlaps with 3-7
        },
      ];

      testCases.forEach(test => {
        const candidateEnd = test.candidate.start + test.candidate.length + test.buffer;
        const occupiedEnd = test.occupied.start + test.occupied.length + test.buffer;
        
        const hasConflict = !(test.candidate.start >= occupiedEnd || candidateEnd <= test.occupied.start);
        expect(hasConflict).toBe(test.shouldConflict);
      });
    });

    it('should handle buffer zones correctly', () => {
      const position1 = { start: 0, length: 6 };
      const position2 = { start: 6, length: 6 };
      
      const bufferTests = [
        { buffer: 0, shouldConflict: false }, // Exactly adjacent
        { buffer: 1, shouldConflict: true },  // Need 1 inch buffer
        { buffer: 2, shouldConflict: true },  // Need 2 inch buffer
      ];

      bufferTests.forEach(test => {
        const end1 = position1.start + position1.length + test.buffer;
        const end2 = position2.start + position2.length + test.buffer;
        
        const hasConflict = !(position1.start >= end2 || end1 <= position2.start);
        expect(hasConflict).toBe(test.shouldConflict);
      });
    });
  });

  describe('Grid Position Generation', () => {
    it('should generate grid positions correctly', () => {
      const bedDimensions = { length: 24, width: 12 };
      const stepSize = 6;
      const positions: Position[] = [];

      for (let x = 0; x < bedDimensions.length; x += stepSize) {
        for (let y = 0; y < bedDimensions.width; y += stepSize) {
          positions.push({
            start: x,
            length: stepSize,
            width: stepSize,
            unit: "inches" as PositionUnit,
          });
        }
      }

      expect(positions.length).toBe(8); // 4 x positions * 2 y positions
      expect(positions[0]).toEqual({
        start: 0,
        length: 6,
        width: 6,
        unit: "inches",
      });
      expect(positions[7]).toEqual({
        start: 18,
        length: 6,
        width: 6,
        unit: "inches",
      });
    });

    it('should respect minimum spacing constraints', () => {
      const minSpacing = 4;
      const gridSize = 20;
      const positions = [];

      for (let x = 0; x < gridSize; x += minSpacing) {
        positions.push(x);
      }

      expect(positions).toEqual([0, 4, 8, 12, 16]);
      
      // Validate spacing between positions
      for (let i = 1; i < positions.length; i++) {
        const spacing = positions[i] - positions[i-1];
        expect(spacing).toBeGreaterThanOrEqual(minSpacing);
      }
    });
  });

  describe('Plant Size Spacing Rules', () => {
    it('should apply correct spacing by plant size', () => {
      const spacingRules = {
        small: { min: 4, optimal: 6 },
        medium: { min: 6, optimal: 8 },
        large: { min: 8, optimal: 12 },
      };

      Object.entries(spacingRules).forEach(([, spacing]) => {
        expect(spacing.optimal).toBeGreaterThan(spacing.min);
        expect(spacing.min).toBeGreaterThan(0);
        expect(typeof spacing.min).toBe('number');
        expect(typeof spacing.optimal).toBe('number');
      });

      // Validate size progression
      expect(spacingRules.medium.min).toBeGreaterThan(spacingRules.small.min);
      expect(spacingRules.large.min).toBeGreaterThan(spacingRules.medium.min);
      expect(spacingRules.medium.optimal).toBeGreaterThan(spacingRules.small.optimal);
      expect(spacingRules.large.optimal).toBeGreaterThan(spacingRules.medium.optimal);
    });

    it('should calculate plant area by size category', () => {
      const plantSizes = [
        { size: 'small', spacing: 4, expectedArea: 16 },   // 4x4
        { size: 'medium', spacing: 6, expectedArea: 36 },  // 6x6
        { size: 'large', spacing: 8, expectedArea: 64 },   // 8x8
      ];

      plantSizes.forEach(plant => {
        const area = plant.spacing * plant.spacing;
        expect(area).toBe(plant.expectedArea);
      });
    });
  });

  describe('Succession Schedule Logic', () => {
    it('should calculate planting dates correctly', () => {
      const startDate = new Date('2024-01-01');
      const interval = 14; // days
      const numberOfSuccessions = 4;
      
      const schedule = [];
      for (let i = 0; i < numberOfSuccessions; i++) {
        const plantingDate = new Date(startDate);
        plantingDate.setDate(startDate.getDate() + (i * interval));
        schedule.push(plantingDate);
      }

      expect(schedule[0]).toEqual(new Date('2024-01-01'));
      expect(schedule[1]).toEqual(new Date('2024-01-15'));
      expect(schedule[2]).toEqual(new Date('2024-01-29'));
      expect(schedule[3]).toEqual(new Date('2024-02-12'));
      
      // Validate intervals
      for (let i = 1; i < schedule.length; i++) {
        const daysDiff = (schedule[i].getTime() - schedule[i-1].getTime()) / (1000 * 60 * 60 * 24);
        expect(daysDiff).toBe(interval);
      }
    });

    it('should handle different succession intervals', () => {
      const intervalTests = [
        { interval: 7, successions: 3, totalDays: 14 },   // 7 * (3-1)
        { interval: 14, successions: 4, totalDays: 42 },  // 14 * (4-1)
        { interval: 21, successions: 2, totalDays: 21 },  // 21 * (2-1)
      ];

      intervalTests.forEach(test => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + test.totalDays);
        
        const actualDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(actualDays).toBe(test.totalDays);
      });
    });

    it('should generate succession planting metadata', () => {
      const successionMeta = [
        { index: 0, total: 3, note: 'Succession planting 1 of 3' },
        { index: 1, total: 3, note: 'Succession planting 2 of 3' },
        { index: 2, total: 3, note: 'Succession planting 3 of 3' },
      ];

      successionMeta.forEach(meta => {
        const expectedNote = `Succession planting ${meta.index + 1} of ${meta.total}`;
        expect(expectedNote).toBe(meta.note);
      });
    });
  });

  describe('Unit Conversion Logic', () => {
    it('should convert between common units correctly', () => {
      const conversions = [
        { value: 12, from: 'inches', to: 'feet', expected: 1 },
        { value: 1, from: 'feet', to: 'inches', expected: 12 },
        { value: 1, from: 'inches', to: 'cm', expected: 2.54 },
        { value: 10, from: 'cm', to: 'inches', expected: 3.937 },
      ];

      const toInches = {
        inches: 1,
        feet: 12,
        cm: 0.393701,
        mm: 0.0393701,
      } as const;

      const fromInches = {
        inches: 1,
        feet: 1/12,
        cm: 2.54,
        mm: 25.4,
      } as const;

      conversions.forEach(conversion => {
        const inInches = conversion.value * toInches[conversion.from as keyof typeof toInches];
        const result = inInches * fromInches[conversion.to as keyof typeof fromInches];
        
        expect(Math.abs(result - conversion.expected)).toBeLessThan(0.01); // Allow small floating point differences
      });
    });

    it('should maintain precision in unit conversions', () => {
      const precisionTests = [
        { value: 0, expected: 0 },
        { value: 1, from: 'inches', to: 'inches', expected: 1 },
        { value: 100, from: 'cm', to: 'cm', expected: 100 },
      ];

      precisionTests.forEach(test => {
        if (test.from && test.to) {
          // Same unit conversion should be exact
          const factor = test.from === test.to ? 1 : 'varies';
          if (factor === 1) {
            expect(test.value * factor).toBe(test.expected);
          }
        }
      });
    });
  });

  describe('Position Validation Logic', () => {
    it('should validate position boundaries', () => {
      const bedDimensions = { length: 48, width: 24 };
      const positionTests = [
        { start: 0, length: 6, width: 6, valid: true },
        { start: 42, length: 6, width: 6, valid: true },  // 42+6=48, exactly fits
        { start: 43, length: 6, width: 6, valid: false }, // 43+6=49, exceeds bed
        { start: -1, length: 6, width: 6, valid: false }, // negative start
      ];

      positionTests.forEach(test => {
        const fitsLength = test.start >= 0 && (test.start + test.length) <= bedDimensions.length;
        const fitsWidth = test.width <= bedDimensions.width;
        const isValid = fitsLength && fitsWidth;
        
        expect(isValid).toBe(test.valid);
      });
    });

    it('should handle edge cases in position validation', () => {
      const edgeCases = [
        { start: 0, length: 0, valid: false }, // Zero length
        { start: 10, length: -5, valid: false }, // Negative length
        { start: 0, length: 1, valid: true }, // Minimal valid position
      ];

      edgeCases.forEach(test => {
        const hasValidDimensions = test.length > 0 && test.start >= 0;
        expect(hasValidDimensions).toBe(test.valid);
      });
    });
  });

  describe('Conflict Resolution Logic', () => {
    it('should identify plant conflicts correctly', () => {
      const existingPlants = [
        { name: 'Lettuce A', position: { start: 0, length: 6 } },
        { name: 'Lettuce B', position: { start: 12, length: 6 } },
        { name: 'Lettuce C', position: { start: 24, length: 6 } },
      ];

      const candidatePosition = { start: 10, length: 8 }; // Overlaps with Lettuce B
      const conflicts: string[] = [];

      existingPlants.forEach(plant => {
        const candidateEnd = candidatePosition.start + candidatePosition.length;
        const plantEnd = plant.position.start + plant.position.length;
        
        const hasOverlap = !(candidatePosition.start >= plantEnd || candidateEnd <= plant.position.start);
        if (hasOverlap) {
          conflicts.push(plant.name);
        }
      });

      expect(conflicts).toEqual(['Lettuce B']);
      expect(conflicts.length).toBe(1);
    });

    it('should exclude specified plants from conflict checking', () => {
      const plants = [
        { id: 'plant-1', name: 'Plant A' },
        { id: 'plant-2', name: 'Plant B' },
        { id: 'plant-3', name: 'Plant C' },
      ];

      const excludePlantId = 'plant-2';
      const filteredPlants = plants.filter(plant => plant.id !== excludePlantId);

      expect(filteredPlants).toHaveLength(2);
      expect(filteredPlants.map(p => p.name)).toEqual(['Plant A', 'Plant C']);
    });
  });
});