// src/__tests__/utils/testDataFactories.ts

import {
  CareActivityRecord,
  CareActivityDetails,
  ScheduledTask,
  PlantRecord,
  VarietyRecord,
  varietyService,
} from "@/types/database";
import { CareActivityType, PlantCategory } from "@/types/core";
import { GrowthTimeline } from "@/types/protocols";
import { generateUUID } from "@/utils/cn";
import { subDays, addDays } from "date-fns";
import { User } from "firebase/auth";
import { varieties } from "@/data"; // Import real varieties

// Define the factory function type
type FactoryFunction<T> = (overrides?: Partial<T>) => T;

/**
 * Create a mock Firebase User
 */
export const createMockUser: FactoryFunction<User> = (overrides = {}) =>
  ({
    uid: "test-user-id",
    email: "test@example.com",
    emailVerified: true,
    displayName: "Test User",
    isAnonymous: false,
    metadata: {
      creationTime: "2024-01-01T00:00:00.000Z",
      lastSignInTime: "2024-01-01T00:00:00.000Z",
    },
    providerData: [],
    refreshToken: "mock-refresh-token",
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    phoneNumber: null,
    photoURL: null,
    providerId: "firebase",
    ...overrides,
  } as User);

/**
 * Create a mock plant record using real varieties
 */
export const createMockPlant: FactoryFunction<PlantRecord> = (
  overrides = {}
) => {
  // Use a real variety as default - Greek Dwarf Basil is the first herb
  const defaultVariety =
    varieties.find((v) => v.name === "Greek Dwarf Basil") || varieties[0];

  return {
    id: generateUUID(),
    varietyId: overrides.varietyId || defaultVariety.id,
    varietyName: overrides.varietyName || defaultVariety.name,
    name: overrides.name || "Test Plant",
    plantedDate: subDays(new Date(), 30),
    location: "Indoor",
    container: "5 Gallon Grow Bag",
    soilMix: "standard-mix",
    isActive: true,
    notes: ["Created for testing"],
    quantity: 1,
    setupType: "multiple-containers",
    reminderPreferences: {
      watering: true,
      fertilizing: true,
      observation: true,
      lighting: false,
      pruning: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

/**
 * Create a mock care activity record
 */
export const createMockCareActivity: FactoryFunction<CareActivityRecord> = (
  overrides = {}
) => {
  const baseDetails: CareActivityDetails = {
    type: "water",
    waterAmount: 16,
    waterUnit: "oz",
    notes: "Test care activity",
  };

  return {
    id: generateUUID(),
    plantId: "test-plant-id",
    type: "water" as CareActivityType,
    date: subDays(new Date(), 1),
    details: baseDetails,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

/**
 * Create a mock scheduled task
 */
export const createMockScheduledTask: FactoryFunction<ScheduledTask> = (
  overrides = {}
) => ({
  id: generateUUID(),
  plantId: "test-plant-id",
  taskType: "water" as CareActivityType,
  dueDate: addDays(new Date(), 1),
  status: "pending",
  priority: "medium",
  description: "Water the test plant",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Get a real variety by name (helper for tests)
 */
export const getRealVariety = (name: string) => {
  return varieties.find((v) => v.name === name);
};

/**
 * Get real varieties by category (helper for tests)
 */
export const getRealVarietiesByCategory = (category: string) => {
  return varieties.filter((v) => v.category === category);
};

/**
 * Create a plant using a specific real variety
 */
export const createMockPlantWithVariety = (
  varietyName: string,
  overrides: Partial<PlantRecord> = {}
): PlantRecord => {
  const variety = getRealVariety(varietyName);
  if (!variety) {
    throw new Error(
      `Real variety "${varietyName}" not found. Available varieties: ${varieties
        .map((v) => v.name)
        .join(", ")}`
    );
  }

  return createMockPlant({
    varietyId: variety.id,
    varietyName: variety.name,
    ...overrides,
  });
};

/**
 * Mock garden interface using real varieties
 */
interface MockGarden {
  varieties: typeof varieties;
  plants: PlantRecord[];
  careActivities: CareActivityRecord[];
  tasks: ScheduledTask[];
}

/**
 * Create a complete mock garden with real varieties and mock plants/activities
 */
export const createMockGarden = (): MockGarden => {
  // Use actual real varieties
  const greekBasil = getRealVariety("Greek Dwarf Basil");
  const astroArugula = getRealVariety("Astro Arugula");
  const babysLeafSpinach = getRealVariety("Baby's Leaf Spinach");

  const plants = [
    createMockPlant({
      id: "plant-1",
      varietyId: greekBasil?.id || "fallback-1",
      varietyName: greekBasil?.name || "Greek Dwarf Basil",
      name: "Kitchen Basil",
      plantedDate: subDays(new Date(), 45),
    }),
    createMockPlant({
      id: "plant-2",
      varietyId: astroArugula?.id || "fallback-2",
      varietyName: astroArugula?.name || "Astro Arugula",
      name: "Fresh Arugula",
      plantedDate: subDays(new Date(), 20),
    }),
    createMockPlant({
      id: "plant-3",
      varietyId: babysLeafSpinach?.id || "fallback-3",
      varietyName: babysLeafSpinach?.name || "Baby's Leaf Spinach",
      name: "Fresh Spinach",
      plantedDate: subDays(new Date(), 15),
    }),
  ];

  const careActivities = [
    createMockCareActivity({
      id: "care-1",
      plantId: "plant-1",
      type: "water",
      date: subDays(new Date(), 2),
    }),
    createMockCareActivity({
      id: "care-2",
      plantId: "plant-2",
      type: "fertilize",
      date: subDays(new Date(), 3),
      details: {
        type: "fertilize",
        product: "Fish Emulsion",
        dilution: "1:10",
        applicationMethod: "soil-drench",
        notes: "Weekly feeding",
      },
    }),
  ];

  const tasks = [
    createMockScheduledTask({
      id: "task-1",
      plantId: "plant-1",
      taskType: "water",
      dueDate: new Date(),
      status: "pending",
    }),
    createMockScheduledTask({
      id: "task-2",
      plantId: "plant-2",
      taskType: "observe",
      dueDate: addDays(new Date(), 1),
      status: "pending",
    }),
  ];

  return { varieties, plants, careActivities, tasks };
};

// Enhanced mock plant factory with more realistic defaults
export const createMockPlantWithDefaults = (
  overrides: Partial<PlantRecord> = {}
): PlantRecord => {
  return createMockPlant({
    name: `Test Plant ${Math.random().toString(36).substr(2, 5)}`,
    plantedDate: subDays(new Date(), 30), // 30 days old by default
    location: "Indoor Grow Tent",
    container: "5 Gallon Fabric Pot",
    soilMix: "coco-perlite-vermiculite",
    isActive: true,
    quantity: 1,
    notes: [],
    ...overrides,
  });
};

// Mock care activity with realistic data
export const createMockWateringActivity = (
  plantId: string,
  daysAgo = 1,
  amount = 16,
  unit: "oz" | "ml" = "oz"
): CareActivityRecord => {
  return createMockCareActivity({
    plantId,
    type: "water",
    date: subDays(new Date(), daysAgo),
    details: {
      type: "water",
      waterAmount: amount,
      waterUnit: unit,
      notes: `Watered with ${amount}${unit}`,
    },
  });
};

export const createPlantWithVariety = async (
  varietyName: string
): Promise<PlantRecord> => {
  const variety = await varietyService.getVarietyByName(varietyName);
  if (!variety) {
    throw new Error(`Test setup failed: Variety "${varietyName}" not found.`);
  }

  return createMockPlant({
    varietyId: variety.id,
    varietyName: variety.name,
  });
};

// Export real varieties for convenience
export { varieties };

/**
 * Create a mock variety record
 */
export const createMockVariety: FactoryFunction<VarietyRecord> = (
  overrides = {}
) => {
  const baseTimeline: GrowthTimeline = {
    germination: 7,
    seedling: 14,
    vegetative: 30,
    maturation: 60,
  };

  return {
    id: generateUUID(),
    name: "Test Variety",
    normalizedName: "test-variety",
    category: "herbs" as PlantCategory,
    description: "A test variety for unit testing",
    growthTimeline: baseTimeline,
    protocols: undefined,
    isEverbearing: false,
    productiveLifespan: 120,
    isCustom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

/**
 * Create a complete watering protocol
 */
export const createCompleteWateringProtocol = (
  stageOverrides: Record<string, unknown> = {}
) => {
  const baseProtocol = {
    germination: {
      trigger: { moistureLevel: 6 },
      target: { moistureLevel: 8 },
      volume: { amount: 8, unit: "oz" },
    },
    seedling: {
      trigger: { moistureLevel: 5 },
      target: { moistureLevel: 7 },
      volume: { amount: 12, unit: "oz" },
    },
    vegetative: {
      trigger: { moistureLevel: 4 },
      target: { moistureLevel: 7 },
      volume: { amount: 16, unit: "oz" },
    },
    flowering: {
      trigger: { moistureLevel: 3 },
      target: { moistureLevel: 6 },
      volume: { amount: 20, unit: "oz" },
    },
    fruiting: {
      trigger: { moistureLevel: 3 },
      target: { moistureLevel: 6 },
      volume: { amount: 24, unit: "oz" },
    },
    maturation: {
      trigger: { moistureLevel: 4 },
      target: { moistureLevel: 6 },
      volume: { amount: 20, unit: "oz" },
    },
    rootDevelopment: {
      trigger: { moistureLevel: 4 },
      target: { moistureLevel: 7 },
      volume: { amount: 18, unit: "oz" },
    },
    harvest: {
      trigger: { moistureLevel: 4 },
      target: { moistureLevel: 6 },
      volume: { amount: 16, unit: "oz" },
    },
    "ongoing-production": {
      trigger: { moistureLevel: 3 },
      target: { moistureLevel: 6 },
      volume: { amount: 20, unit: "oz" },
    },
  };

  return {
    ...baseProtocol,
    ...stageOverrides,
  };
};

/**
 * Create a complete fertilization protocol
 */
export const createCompleteFertilizationProtocol = (
  stageOverrides: Record<string, unknown> = {}
) => {
  const baseProtocol = {
    germination: {
      schedule: [],
      notes: ["No fertilization during germination"],
    },
    seedling: {
      schedule: [
        {
          taskName: "Gentle starter feeding",
          details: {
            product: "Gentle starter fertilizer",
            dilution: "Quarter strength",
            amount: "Light application",
            method: "soil-drench",
          },
          startDays: 14,
          frequencyDays: 14,
          repeatCount: 2,
        },
      ],
      notes: ["Light feeding only"],
    },
    vegetative: {
      schedule: [
        {
          taskName: "Balanced feeding",
          details: {
            product: "Balanced liquid fertilizer",
            dilution: "Half strength",
            amount: "Apply to runoff",
            method: "soil-drench",
          },
          startDays: 28,
          frequencyDays: 7,
          repeatCount: 4,
        },
      ],
      notes: ["Regular feeding schedule"],
    },
    flowering: {
      schedule: [
        {
          taskName: "Bloom boost feeding",
          details: {
            product: "Bloom booster fertilizer",
            dilution: "Full strength",
            amount: "Apply weekly",
            method: "soil-drench",
          },
          startDays: 56,
          frequencyDays: 7,
          repeatCount: 6,
        },
      ],
      notes: ["High phosphorus for flowering"],
    },
    fruiting: {
      schedule: [
        {
          taskName: "Fruiting support feeding",
          details: {
            product: "Potassium-rich fertilizer",
            dilution: "Full strength",
            amount: "Apply bi-weekly",
            method: "soil-drench",
          },
          startDays: 91,
          frequencyDays: 14,
          repeatCount: 4,
        },
      ],
      notes: ["Support fruit development"],
    },
    maturation: {
      schedule: [
        {
          taskName: "Maturation feeding",
          details: {
            product: "Low nitrogen fertilizer",
            dilution: "Half strength",
            amount: "Apply bi-weekly",
            method: "soil-drench",
          },
          startDays: 120,
          frequencyDays: 14,
          repeatCount: 3,
        },
      ],
      notes: ["Reduce nitrogen for maturation"],
    },
    rootDevelopment: {
      schedule: [
        {
          taskName: "Root development feeding",
          details: {
            product: "Root development fertilizer",
            dilution: "Half strength",
            amount: "Apply weekly",
            method: "soil-drench",
          },
          startDays: 45,
          frequencyDays: 7,
          repeatCount: 6,
        },
      ],
      notes: ["Focus on root growth"],
    },
    harvest: {
      schedule: [],
      notes: ["Minimal fertilization during harvest"],
    },
    "ongoing-production": {
      schedule: [
        {
          taskName: "Production maintenance feeding",
          details: {
            product: "Continuous production fertilizer",
            dilution: "Half strength",
            amount: "Apply weekly",
            method: "soil-drench",
          },
          startDays: 180,
          frequencyDays: 7,
          repeatCount: 20,
        },
      ],
      notes: ["Maintain production levels"],
    },
  };

  return {
    ...baseProtocol,
    ...stageOverrides,
  };
};

// Export a list of real variety names for easy reference in tests
export const REAL_VARIETY_NAMES = [
  "Astro Arugula",
  "Baby's Leaf Spinach",
  "Rosemary",
  "Greek Oregano",
  "Italian Flat Leaf Parsley",
  "Greek Dwarf Basil",
  "English Thyme",
  "Boston Pickling Cucumber",
  "Little Finger Carrots",
  "Stuttgarter Onions",
  "White Sweet Spanish Onions",
  "Sugar Snap Peas",
  "Rasmus Broccoli",
  "Detroit Dark Red Beets",
  "Beauregard Sweet Potatoes",
  "Garlic",
] as const;
