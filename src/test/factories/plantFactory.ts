/**
 * Test Data Factory for Plant Records
 *
 * Provides consistent, realistic test data for plant-related entities.
 * Use these factories to create test data instead of manually creating objects.
 */

import { PlantRecord, VarietyRecord, BedRecord, CareActivityRecord, ScheduledTask } from "@/types/records";
import { PlantCategory, CareActivityType, GrowthStage } from "@/types/core";
import { subDays, addDays } from "date-fns";

/**
 * Base Plant Factory
 * Creates realistic plant records with sensible defaults
 */
export class PlantFactory {
  private static counter = 1;

  /**
   * Create a basic plant record with minimal data
   */
  static create(overrides: Partial<PlantRecord> = {}): PlantRecord {
    const id = `test-plant-${this.counter++}`;
    const now = new Date();

    return {
      id,
      varietyId: "variety-lettuce-001",
      varietyName: "Butterhead Lettuce",
      name: `Test Plant ${this.counter - 1}`,
      plantedDate: subDays(now, 14), // Planted 2 weeks ago
      location: "Main Garden",
      container: "Raised Bed A",
      isActive: true,
      quantity: 1,
      setupType: "seed",
      createdAt: subDays(now, 14),
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * Create a tomato plant - common test case
   */
  static tomato(overrides: Partial<PlantRecord> = {}): PlantRecord {
    return this.create({
      varietyId: "variety-tomato-cherry",
      varietyName: "Cherry Tomato",
      name: "Cherry Tomato Plant",
      container: "Large Container",
      setupType: "transplant",
      quantity: 1,
      ...overrides,
    });
  }

  /**
   * Create a lettuce plant - another common test case
   */
  static lettuce(overrides: Partial<PlantRecord> = {}): PlantRecord {
    return this.create({
      varietyId: "variety-lettuce-butterhead",
      varietyName: "Butterhead Lettuce",
      name: "Butterhead Lettuce",
      container: "Raised Bed A",
      setupType: "seed",
      quantity: 4,
      ...overrides,
    });
  }

  /**
   * Create an herb plant (basil)
   */
  static basil(overrides: Partial<PlantRecord> = {}): PlantRecord {
    return this.create({
      varietyId: "variety-herb-basil",
      varietyName: "Sweet Basil",
      name: "Sweet Basil",
      container: "Herb Garden",
      setupType: "seed",
      quantity: 6,
      ...overrides,
    });
  }

  /**
   * Create a mature plant (older)
   */
  static mature(overrides: Partial<PlantRecord> = {}): PlantRecord {
    const now = new Date();
    return this.create({
      plantedDate: subDays(now, 60), // Planted 2 months ago
      createdAt: subDays(now, 60),
      ...overrides,
    });
  }

  /**
   * Create a newly planted plant
   */
  static newlyPlanted(overrides: Partial<PlantRecord> = {}): PlantRecord {
    const now = new Date();
    return this.create({
      plantedDate: subDays(now, 3), // Planted 3 days ago
      createdAt: subDays(now, 3),
      ...overrides,
    });
  }

  /**
   * Create a plant with a specific section
   */
  static withSection(section: string, overrides: Partial<PlantRecord> = {}): PlantRecord {
    return this.create({
      section,
      ...overrides,
    });
  }

  /**
   * Create multiple plants for testing collections
   */
  static createMany(count: number, baseOverrides: Partial<PlantRecord> = {}): PlantRecord[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        name: `Test Plant ${index + 1}`,
        ...baseOverrides
      })
    );
  }

  /**
   * Create plants for succession planting testing
   */
  static succession(waves: number = 3, interval: number = 14): PlantRecord[] {
    const now = new Date();
    return Array.from({ length: waves }, (_, index) =>
      this.lettuce({
        name: `Lettuce Wave ${index + 1}`,
        section: `Row 1 - 6" section at ${index * 6}"`,
        plantedDate: subDays(now, waves * interval - index * interval),
        createdAt: subDays(now, waves * interval - index * interval),
      })
    );
  }

  /**
   * Reset counter for predictable test data
   */
  static resetCounter(): void {
    this.counter = 1;
  }
}

/**
 * Variety Factory
 * Creates test variety records
 */
export class VarietyFactory {
  private static counter = 1;

  static create(overrides: Partial<VarietyRecord> = {}): VarietyRecord {
    const id = `test-variety-${this.counter++}`;
    const now = new Date();
    const name = overrides.name || `Test Variety ${this.counter - 1}`;

    return {
      id,
      name,
      normalizedName: name.toLowerCase().replace(/\s+/g, '-'),
      category: "leafy-greens" as PlantCategory,
      description: `Test variety description for ${name}`,
      isCustom: false,
      tags: ["test", "variety"],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  static lettuce(overrides: Partial<VarietyRecord> = {}): VarietyRecord {
    return this.create({
      name: "Butterhead Lettuce",
      category: "leafy-greens" as PlantCategory,
      description: "Tender, buttery lettuce variety",
      ...overrides,
    });
  }

  static tomato(overrides: Partial<VarietyRecord> = {}): VarietyRecord {
    return this.create({
      name: "Cherry Tomato",
      category: "fruiting" as PlantCategory,
      description: "Small, sweet cherry tomatoes",
      ...overrides,
    });
  }

  static resetCounter(): void {
    this.counter = 1;
  }
}

/**
 * Bed Factory
 * Creates test bed/container records
 */
export class BedFactory {
  private static counter = 1;

  static create(overrides: Partial<BedRecord> = {}): BedRecord {
    const id = `test-bed-${this.counter++}`;
    const now = new Date();

    return {
      id,
      name: `Test Bed ${this.counter - 1}`,
      type: "raised-bed",
      isActive: true,
      description: "Test bed for unit testing",
      location: "Main Garden Area",
      dimensions: {
        length: 4,
        width: 2,
        height: 1,
        unit: "feet",
      },
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  static raisedBed(overrides: Partial<BedRecord> = {}): BedRecord {
    return this.create({
      name: "Raised Bed A",
      type: "raised-bed",
      material: "Cedar",
      soilType: "Potting mix with compost",
      ...overrides,
    });
  }

  static container(overrides: Partial<BedRecord> = {}): BedRecord {
    return this.create({
      name: "Large Container",
      type: "container",
      dimensions: {
        length: 2,
        width: 2,
        height: 1.5,
        unit: "feet",
      },
      ...overrides,
    });
  }

  static resetCounter(): void {
    this.counter = 1;
  }
}

/**
 * Care Activity Factory
 * Creates test care activity records
 */
export class CareActivityFactory {
  private static counter = 1;

  static create(plantId: string, overrides: Partial<CareActivityRecord> = {}): CareActivityRecord {
    const id = `test-activity-${this.counter++}`;
    const now = new Date();

    return {
      id,
      plantId,
      type: "watering" as CareActivityType,
      date: subDays(now, 1), // Yesterday
      details: {
        amount: "500ml",
        method: "Hand watering",
        notes: "Regular watering",
      },
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  static watering(plantId: string, overrides: Partial<CareActivityRecord> = {}): CareActivityRecord {
    return this.create(plantId, {
      type: "watering",
      details: {
        amount: "500ml",
        unit: "ml",
        method: "Hand watering",
        ...overrides.details,
      },
      ...overrides,
    });
  }

  static fertilization(plantId: string, overrides: Partial<CareActivityRecord> = {}): CareActivityRecord {
    return this.create(plantId, {
      type: "fertilization",
      details: {
        product: "Balanced Fertilizer",
        dilution: "1:10",
        applicationMethod: "foliar-spray",
        ...overrides.details,
      },
      ...overrides,
    });
  }

  static observation(plantId: string, overrides: Partial<CareActivityRecord> = {}): CareActivityRecord {
    return this.create(plantId, {
      type: "observation",
      details: {
        healthAssessment: "good",
        notes: "Plants looking healthy",
        ...overrides.details,
      },
      ...overrides,
    });
  }

  static harvest(plantId: string, overrides: Partial<CareActivityRecord> = {}): CareActivityRecord {
    return this.create(plantId, {
      type: "harvest",
      details: {
        quantity: 1,
        qualityRating: "excellent",
        notes: "First harvest of the season",
        ...overrides.details,
      },
      ...overrides,
    });
  }

  static resetCounter(): void {
    this.counter = 1;
  }
}

/**
 * Scheduled Task Factory
 * Creates test scheduled task records
 */
export class ScheduledTaskFactory {
  private static counter = 1;

  static create(plantId: string, overrides: Partial<ScheduledTask> = {}): ScheduledTask {
    const id = `test-task-${this.counter++}`;
    const now = new Date();

    return {
      id,
      plantId,
      taskType: "watering" as CareActivityType,
      dueDate: addDays(now, 1), // Tomorrow
      status: "pending",
      priority: "medium",
      description: "Scheduled watering task",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  static watering(plantId: string, overrides: Partial<ScheduledTask> = {}): ScheduledTask {
    return this.create(plantId, {
      taskType: "watering",
      priority: "high",
      description: "Water the plants",
      ...overrides,
    });
  }

  static fertilization(plantId: string, overrides: Partial<ScheduledTask> = {}): ScheduledTask {
    return this.create(plantId, {
      taskType: "fertilization",
      dueDate: addDays(new Date(), 7), // Next week
      priority: "medium",
      description: "Apply fertilizer",
      ...overrides,
    });
  }

  static overdue(plantId: string, overrides: Partial<ScheduledTask> = {}): ScheduledTask {
    return this.create(plantId, {
      dueDate: subDays(new Date(), 2), // 2 days ago
      priority: "high",
      description: "Overdue task",
      ...overrides,
    });
  }

  static resetCounter(): void {
    this.counter = 1;
  }
}

/**
 * Test Data Builder
 * Combines factories to create complex test scenarios
 */
export class TestDataBuilder {
  /**
   * Create a complete garden scenario with plants, beds, and activities
   */
  static simpleGarden() {
    const bed = BedFactory.raisedBed();
    const plants = [
      PlantFactory.lettuce({ container: bed.name }),
      PlantFactory.tomato({ container: bed.name }),
      PlantFactory.basil({ container: bed.name }),
    ];

    const activities = plants.flatMap(plant => [
      CareActivityFactory.watering(plant.id),
      CareActivityFactory.observation(plant.id),
    ]);

    const tasks = plants.map(plant =>
      ScheduledTaskFactory.watering(plant.id)
    );

    return { bed, plants, activities, tasks };
  }

  /**
   * Create a succession planting scenario
   */
  static successionGarden() {
    const bed = BedFactory.raisedBed({ name: "Succession Bed" });
    const plants = PlantFactory.succession(3, 14);

    const activities = plants.flatMap(plant => [
      CareActivityFactory.watering(plant.id, {
        date: subDays(new Date(), Math.floor(Math.random() * 7))
      }),
    ]);

    return { bed, plants, activities };
  }

  /**
   * Reset all counters for predictable test data
   */
  static resetAllCounters(): void {
    PlantFactory.resetCounter();
    VarietyFactory.resetCounter();
    BedFactory.resetCounter();
    CareActivityFactory.resetCounter();
    ScheduledTaskFactory.resetCounter();
  }
}