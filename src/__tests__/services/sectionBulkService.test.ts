import {
  generateSectionKey,
  findPlantsInSameSection,
  getSectionApplyOption,
  groupPlantsBySection,
  validateBulkCareOperation,
  formatSectionDisplayMobile
} from '@/services/sectionBulkService';
import { PlantRecord } from '@/types/consolidated';

const createMockPlant = (overrides: Partial<PlantRecord>): PlantRecord => ({
  id: 'plant-1',
  varietyId: 'tomato-1',
  varietyName: 'Cherry Tomato',
  name: 'Test Plant',
  plantedDate: new Date('2024-01-01'),
  location: 'Indoor',
  container: '🌱 Greenhouse A',
  section: 'Row 1',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('sectionBulkService', () => {
  describe('generateSectionKey', () => {
    it('generates key with location, container, and section', () => {
      const plant = createMockPlant({
        location: 'Indoor',
        container: '🌱 Greenhouse A',
        section: 'Row 1'
      });

      const key = generateSectionKey(plant);
      expect(key).toBe('indoor|🌱 greenhouse a|row 1');
    });

    it('generates key with structured section description when no simple section', () => {
      const plant = createMockPlant({
        location: 'Indoor',
        container: '🌱 Greenhouse A',
        section: undefined,
        structuredSection: {
          bedId: 'bed-1',
          position: { start: 0, length: 12, unit: 'inches' },
          description: 'North End'
        }
      });

      const key = generateSectionKey(plant);
      expect(key).toBe('indoor|🌱 greenhouse a|north end');
    });

    it('generates key without section when neither is provided', () => {
      const plant = createMockPlant({
        location: 'Indoor',
        container: '🌱 Greenhouse A',
        section: undefined,
        structuredSection: undefined
      });

      const key = generateSectionKey(plant);
      expect(key).toBe('indoor|🌱 greenhouse a');
    });
  });

  describe('findPlantsInSameSection', () => {
    it('finds plants with matching location, container, and section', () => {
      const targetPlant = createMockPlant({ id: 'target' });
      const sameSection1 = createMockPlant({ id: 'same-1' });
      const sameSection2 = createMockPlant({ id: 'same-2' });
      const differentSection = createMockPlant({ 
        id: 'different', 
        section: 'Row 2' 
      });
      const differentContainer = createMockPlant({ 
        id: 'different-container', 
        container: '🏠 Kitchen Counter' 
      });

      const allPlants = [targetPlant, sameSection1, sameSection2, differentSection, differentContainer];
      const result = findPlantsInSameSection(targetPlant, allPlants);

      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toEqual(['same-1', 'same-2']);
    });

    it('excludes inactive plants', () => {
      const targetPlant = createMockPlant({ id: 'target' });
      const activePlant = createMockPlant({ id: 'active', isActive: true });
      const inactivePlant = createMockPlant({ id: 'inactive', isActive: false });

      const allPlants = [targetPlant, activePlant, inactivePlant];
      const result = findPlantsInSameSection(targetPlant, allPlants);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('active');
    });

    it('excludes target plant from results', () => {
      const targetPlant = createMockPlant({ id: 'target' });
      const samePlant = createMockPlant({ id: 'target' }); // Same ID as target

      const allPlants = [targetPlant, samePlant];
      const result = findPlantsInSameSection(targetPlant, allPlants);

      expect(result).toHaveLength(0);
    });
  });

  describe('getSectionApplyOption', () => {
    it('returns section option when plants exist in same section', () => {
      const targetPlant = createMockPlant({ id: 'target', varietyName: 'Cherry Tomato' });
      const sectionPlant1 = createMockPlant({ id: 'plant-1', varietyName: 'Cherry Tomato' });
      const sectionPlant2 = createMockPlant({ id: 'plant-2', varietyName: 'Sweet Basil' });

      const allPlants = [targetPlant, sectionPlant1, sectionPlant2];
      const result = getSectionApplyOption(targetPlant, allPlants);

      expect(result).not.toBeNull();
      expect(result!.plantCount).toBe(2);
      expect(result!.varieties).toEqual(['Cherry Tomato', 'Sweet Basil']);
      expect(result!.hasVarietyMix).toBe(true);
      expect(result!.displayText).toBe('🌱 Greenhouse A • Row 1');
    });

    it('returns null when no plants in same section', () => {
      const targetPlant = createMockPlant({ id: 'target' });
      const differentPlant = createMockPlant({ id: 'different', section: 'Row 2' });

      const allPlants = [targetPlant, differentPlant];
      const result = getSectionApplyOption(targetPlant, allPlants);

      expect(result).toBeNull();
    });

    it('detects no variety mix when all plants are same variety', () => {
      const targetPlant = createMockPlant({ id: 'target', varietyName: 'Cherry Tomato' });
      const sectionPlant = createMockPlant({ id: 'plant-1', varietyName: 'Cherry Tomato' });

      const allPlants = [targetPlant, sectionPlant];
      const result = getSectionApplyOption(targetPlant, allPlants);

      expect(result!.hasVarietyMix).toBe(false);
      expect(result!.varieties).toEqual(['Cherry Tomato']);
    });
  });

  describe('groupPlantsBySection', () => {
    it('groups plants by section correctly', () => {
      const plants = [
        createMockPlant({ id: 'p1', section: 'Row 1', varietyName: 'Tomato' }),
        createMockPlant({ id: 'p2', section: 'Row 1', varietyName: 'Basil' }),
        createMockPlant({ id: 'p3', section: 'Row 2', varietyName: 'Lettuce' }),
        createMockPlant({ id: 'p4', section: 'Row 2', varietyName: 'Spinach' }),
        createMockPlant({ id: 'p5', section: 'Row 3', varietyName: 'Kale' }), // Only one plant
      ];

      const result = groupPlantsBySection(plants);

      expect(result).toHaveLength(2); // Row 3 excluded (only 1 plant)
      expect(result[0].plants).toHaveLength(2); // Sorted by plant count desc
      expect(result[0].varietyCount).toBe(2);
      expect(result[1].plants).toHaveLength(2);
    });

    it('excludes inactive plants from grouping', () => {
      const plants = [
        createMockPlant({ id: 'p1', section: 'Row 1', isActive: true }),
        createMockPlant({ id: 'p2', section: 'Row 1', isActive: false }),
        createMockPlant({ id: 'p3', section: 'Row 1', isActive: true }),
      ];

      const result = groupPlantsBySection(plants);

      expect(result).toHaveLength(1);
      expect(result[0].plants).toHaveLength(2); // Only active plants
    });
  });

  describe('validateBulkCareOperation', () => {
    it('warns about mixed varieties', () => {
      const plants = [
        createMockPlant({ varietyName: 'Cherry Tomato' }),
        createMockPlant({ varietyName: 'Sweet Basil' }),
      ];

      const result = validateBulkCareOperation(plants, 'water');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Mixed varieties: Cherry Tomato, Sweet Basil');
    });

    it('provides activity-specific warnings for fertilizing', () => {
      const plants = [
        createMockPlant({ varietyName: 'Cherry Tomato' }),
        createMockPlant({ varietyName: 'Sweet Basil' }),
      ];

      const result = validateBulkCareOperation(plants, 'fertilize');

      expect(result.warnings).toContain('Different plants may need different fertilizer types or dilutions');
    });

    it('warns about multiple plant types for watering', () => {
      const plants = Array.from({ length: 4 }, (_, i) => 
        createMockPlant({ varietyName: `Variety ${i + 1}` })
      );

      const result = validateBulkCareOperation(plants, 'water');

      expect(result.warnings).toContain('Multiple plant types may have different watering needs');
    });

    it('provides harvest warning', () => {
      const plants = [createMockPlant({})];

      const result = validateBulkCareOperation(plants, 'harvest');

      expect(result.warnings).toContain('Verify all plants are ready for harvest');
    });
  });

  describe('formatSectionDisplayMobile', () => {
    it('formats display for mobile with variety mix', () => {
      const option = {
        sectionKey: 'test',
        plantCount: 3,
        varieties: ['Tomato', 'Basil'],
        location: 'Indoor',
        container: '🌱 Greenhouse A',
        section: 'Row 1',
        hasVarietyMix: true,
        displayText: 'Test'
      };

      const result = formatSectionDisplayMobile(option);

      expect(result.primary).toBe('3 plants');
      expect(result.secondary).toBe('🌱 Greenhouse A • Row 1 • Mixed varieties');
      expect(result.emoji).toBe('🏠'); // Indoor
    });

    it('formats display for outdoor location', () => {
      const option = {
        sectionKey: 'test',
        plantCount: 2,
        varieties: ['Tomato'],
        location: 'Outdoor',
        container: '🌱 Garden Bed 1',
        section: undefined,
        hasVarietyMix: false,
        displayText: 'Test'
      };

      const result = formatSectionDisplayMobile(option);

      expect(result.primary).toBe('2 plants');
      expect(result.secondary).toBe('🌱 Garden Bed 1');
      expect(result.emoji).toBe('🌱'); // Outdoor
    });
  });
});