/**
 * Test Data Builders
 * 
 * Fluent interface builders for complex test scenarios.
 * Use factories for simple cases, builders for complex ones.
 */

import { addDays, subDays } from 'date-fns';
import { 
  PlantRecord, 
  CareActivityRecord,
  GrowthStage 
} from '@/types';
import { ScheduledTask } from '@/services/ProtocolTranspilerService';
import { createMockPlant, createMockCareActivity, createMockScheduledTask } from './factories';
import { TEST_VARIETIES } from './constants';

/**
 * Plant Builder
 * 
 * @example
 * const plant = PlantBuilder
 *   .strawberry()
 *   .withAge(155)
 *   .planted("2024-01-01")
 *   .inContainer("Greenhouse A")
 *   .build();
 */
export class PlantBuilder {
  private plant: Partial<PlantRecord>;

  constructor(baseData?: Partial<PlantRecord>) {
    this.plant = createMockPlant(baseData);
  }

  static new(baseData?: Partial<PlantRecord>): PlantBuilder {
    return new PlantBuilder(baseData);
  }

  static strawberry(): PlantBuilder {
    return new PlantBuilder({
      varietyId: TEST_VARIETIES.STRAWBERRY.id,
      varietyName: TEST_VARIETIES.STRAWBERRY.name,
    });
  }

  static tomato(): PlantBuilder {
    return new PlantBuilder({
      varietyId: TEST_VARIETIES.TOMATO.id,
      varietyName: TEST_VARIETIES.TOMATO.name,
    });
  }

  static lettuce(): PlantBuilder {
    return new PlantBuilder({
      varietyId: TEST_VARIETIES.LETTUCE.id,
      varietyName: TEST_VARIETIES.LETTUCE.name,
    });
  }

  static raspberry(): PlantBuilder {
    return new PlantBuilder({
      varietyId: 'heritage-raspberry',
      varietyName: 'Heritage Raspberry',
    });
  }

  withId(id: string): PlantBuilder {
    this.plant.id = id;
    return this;
  }

  withName(name: string): PlantBuilder {
    this.plant.name = name;
    return this;
  }

  planted(date: string | Date): PlantBuilder {
    this.plant.plantedDate = typeof date === 'string' ? new Date(date) : date;
    return this;
  }

  withAge(days: number): PlantBuilder {
    this.plant.plantedDate = subDays(new Date(), days);
    return this;
  }

  inContainer(container: string): PlantBuilder {
    this.plant.container = container;
    return this;
  }

  // Alias for inContainer
  withContainer(container: string): PlantBuilder {
    return this.inContainer(container);
  }

  atLocation(location: string): PlantBuilder {
    this.plant.location = location;
    return this;
  }

  // Alias for atLocation
  withLocation(location: string): PlantBuilder {
    return this.atLocation(location);
  }

  withSection(section: string): PlantBuilder {
    this.plant.section = section;
    return this;
  }

  withQuantity(quantity: number): PlantBuilder {
    this.plant.quantity = quantity;
    return this;
  }

  inactive(): PlantBuilder {
    this.plant.isActive = false;
    return this;
  }

  withNotes(notes: string[]): PlantBuilder {
    this.plant.notes = notes;
    return this;
  }

  withReminders(preferences: Partial<PlantRecord['reminderPreferences']>): PlantBuilder {
    this.plant.reminderPreferences = {
      ...this.plant.reminderPreferences,
      ...preferences,
    };
    return this;
  }

  build(): PlantRecord {
    return this.plant as PlantRecord;
  }
}

/**
 * Care Activity Builder
 * 
 * @example
 * const activity = CareActivityBuilder
 *   .watering()
 *   .forPlant("plant-123")
 *   .on("2024-01-15")
 *   .withAmount(250, "ml")
 *   .build();
 */
export class CareActivityBuilder {
  private activity: Partial<CareActivityRecord>;

  constructor(baseData?: Partial<CareActivityRecord>) {
    this.activity = createMockCareActivity(baseData);
  }

  static new(baseData?: Partial<CareActivityRecord>): CareActivityBuilder {
    return new CareActivityBuilder(baseData);
  }

  // Alias for new()
  static create(baseData?: Partial<CareActivityRecord>): CareActivityBuilder {
    return new CareActivityBuilder(baseData);
  }

  static watering(): CareActivityBuilder {
    return new CareActivityBuilder({
      type: 'water',
      activityType: 'water', // Set both for compatibility
      details: {
        type: 'water',
        waterAmount: 250,
        waterUnit: 'ml',
      },
    });
  }

  static fertilizing(): CareActivityBuilder {
    return new CareActivityBuilder({
      type: 'fertilize',
      activityType: 'fertilize', // Set both for compatibility
      details: {
        type: 'fertilize',
        product: 'All-Purpose Fertilizer',
        dilution: '1:10',
        amount: '1 cup',
        method: 'soil-drench' as any,
      },
    });
  }

  // Alias for fertilizing
  static fertilization(): CareActivityBuilder {
    return CareActivityBuilder.fertilizing();
  }

  static observation(): CareActivityBuilder {
    return new CareActivityBuilder({
      type: 'observe',
      activityType: 'observe', // Set both for compatibility
      details: {
        type: 'observe',
        healthAssessment: 'good',
        observations: 'Plant looking healthy',
      },
    });
  }

  withId(id: string): CareActivityBuilder {
    this.activity.id = id;
    return this;
  }

  forPlant(plantId: string): CareActivityBuilder {
    this.activity.plantId = plantId;
    return this;
  }

  on(date: string | Date): CareActivityBuilder {
    const dateValue = typeof date === 'string' ? new Date(date) : date;
    this.activity.date = dateValue;
    this.activity.activityDate = dateValue; // Set both for compatibility
    return this;
  }

  // Alias for on()
  onDate(date: string | Date): CareActivityBuilder {
    return this.on(date);
  }

  atStage(stage: GrowthStage, plantAge?: number): CareActivityBuilder {
    this.activity.stage = stage;
    if (plantAge !== undefined) {
      this.activity.plantAge = plantAge;
    }
    return this;
  }

  daysAgo(days: number): CareActivityBuilder {
    const dateValue = subDays(new Date(), days);
    this.activity.date = dateValue;
    this.activity.activityDate = dateValue; // Set both for compatibility
    return this;
  }

  withAmount(amount: number, unit: string): CareActivityBuilder {
    if (this.activity.type === 'water') {
      this.activity.details = {
        ...this.activity.details,
        type: 'water' as const,
        waterAmount: amount,
        waterUnit: unit as any,
      };
    }
    return this;
  }

  withProduct(product: string, dilution?: string, amount?: string): CareActivityBuilder {
    if (this.activity.type === 'fertilize') {
      this.activity.details = {
        ...this.activity.details,
        type: 'fertilize' as const,
        product,
        dilution: dilution || '1:10',
        amount: amount || this.activity.details?.amount || '1 cup',
      };
    }
    return this;
  }

  withObservation(observation: string, health?: string): CareActivityBuilder {
    if (this.activity.type === 'observe') {
      this.activity.details = {
        ...this.activity.details,
        type: 'observe' as const,
        observations: observation,
        healthAssessment: (health || 'good') as any,
      };
    }
    return this;
  }

  withNotes(notes: string): CareActivityBuilder {
    this.activity.notes = notes;
    return this;
  }

  build(): CareActivityRecord {
    return this.activity as CareActivityRecord;
  }
}

/**
 * Task Builder
 * 
 * @example
 * const task = TaskBuilder
 *   .fertilization()
 *   .forPlant("plant-123")
 *   .dueIn(3)
 *   .fromStage("vegetative")
 *   .build();
 */
export class TaskBuilder {
  private task: Partial<ScheduledTask>;

  constructor(baseData?: Partial<ScheduledTask>) {
    this.task = createMockScheduledTask(baseData);
  }

  static new(baseData?: Partial<ScheduledTask>): TaskBuilder {
    return new TaskBuilder(baseData);
  }

  static fertilization(): TaskBuilder {
    return new TaskBuilder({
      taskType: 'fertilize',
      taskName: 'Fertilization Task',
      details: {
        type: 'fertilize',
        product: 'General Fertilizer',
        dilution: '1:10',
        amount: '1 cup',
        method: 'soil-drench' as any,
      },
    });
  }

  static watering(): TaskBuilder {
    return new TaskBuilder({
      taskType: 'water',
      taskName: 'Watering Task',
      details: {
        type: 'fertilize', // Note: tasks use fertilize details structure
        product: 'Water',
        dilution: 'none',
        amount: '250ml',
        method: 'soil-drench' as any,
      },
    });
  }

  static neptunes(): TaskBuilder {
    return new TaskBuilder({
      taskType: 'fertilize',
      taskName: 'Apply Neptune\'s Harvest',
      details: {
        type: 'fertilize',
        product: 'Neptune\'s Harvest',
        dilution: '1 tbsp/gallon',
        amount: '2 quarts',
        method: 'soil-drench' as any,
      },
    });
  }

  withId(id: string): TaskBuilder {
    this.task.id = id;
    return this;
  }

  forPlant(plantId: string): TaskBuilder {
    this.task.plantId = plantId;
    return this;
  }

  withName(taskName: string): TaskBuilder {
    this.task.taskName = taskName;
    return this;
  }

  dueOn(date: string | Date): TaskBuilder {
    this.task.dueDate = typeof date === 'string' ? new Date(date) : date;
    return this;
  }

  dueIn(days: number): TaskBuilder {
    this.task.dueDate = addDays(new Date(), days);
    return this;
  }

  overdue(days: number): TaskBuilder {
    this.task.dueDate = subDays(new Date(), days);
    return this;
  }

  fromStage(stage: GrowthStage, startDays: number = 14): TaskBuilder {
    this.task.sourceProtocol = {
      stage,
      originalStartDays: startDays,
      isDynamic: false,
    };
    return this;
  }

  withStatus(status: ScheduledTask['status']): TaskBuilder {
    this.task.status = status;
    return this;
  }

  completed(): TaskBuilder {
    this.task.status = 'completed';
    return this;
  }

  pending(): TaskBuilder {
    this.task.status = 'pending';
    return this;
  }

  withPriority(priority: 'low' | 'normal' | 'high'): TaskBuilder {
    this.task.priority = priority;
    return this;
  }

  build(): ScheduledTask {
    return this.task as ScheduledTask;
  }
}