/**
 * Test Constants
 * 
 * Centralized constants for test data consistency.
 */

import { PlantCategory } from '@/types';

/**
 * Standard test dates
 */
export const TEST_DATES = {
  // Fixed reference dates for consistent testing
  PLANT_DEFAULT: new Date('2024-01-15T10:00:00Z'),
  VARIETY_DEFAULT: new Date('2023-12-01T00:00:00Z'),
  ACTIVITY_DEFAULT: new Date('2024-01-20T14:30:00Z'),
  TASK_CREATED: new Date('2024-01-15T10:00:00Z'),
  TASK_DUE: new Date('2024-01-25T00:00:00Z'),
  USER_CREATED: '2023-11-01T00:00:00Z',
  USER_LAST_SIGNIN: '2024-01-20T09:00:00Z',
  
  // Relative date helpers (use current date as reference)
  now: () => new Date(),
  daysAgo: (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000),
  daysFromNow: (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  
  // Common planting scenarios
  STRAWBERRY_155_DAYS: new Date(Date.now() - 155 * 24 * 60 * 60 * 1000),
  YOUNG_SEEDLING: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  MATURE_PLANT: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
} as const;

/**
 * Standard test varieties
 */
export const TEST_VARIETIES = {
  STRAWBERRY: {
    id: 'albion-strawberry',
    name: 'Albion Strawberry',
    normalizedName: 'albion strawberry',
    category: 'fruiting-plants' as PlantCategory,
    growthTimeline: {
      germination: 14,
      seedling: 21,
      vegetative: 35,
      flowering: 70,
      fruiting: 91,
      maturation: 105,
      'ongoing-production': 120,
    },
  },
  
  TOMATO: {
    id: 'cherry-tomato',
    name: 'Cherry Tomato',
    normalizedName: 'cherry tomato',
    category: 'fruiting-plants' as PlantCategory,
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 30,
      flowering: 45,
      fruiting: 60,
      maturation: 80,
    },
  },
  
  LETTUCE: {
    id: 'butter-lettuce',
    name: 'Butter Lettuce',
    normalizedName: 'butter lettuce',
    category: 'leafy-greens' as PlantCategory,
    growthTimeline: {
      germination: 5,
      seedling: 10,
      vegetative: 21,
      maturation: 45,
    },
  },
  
  BASIL: {
    id: 'sweet-basil',
    name: 'Sweet Basil',
    normalizedName: 'sweet basil',
    category: 'herbs' as PlantCategory,
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 28,
      maturation: 60,
    },
  },
} as const;

/**
 * Standard test user data
 */
export const TEST_USERS = {
  DEFAULT: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  },
  
  ADMIN: {
    uid: 'admin-user-id',
    email: 'admin@example.com',
    displayName: 'Admin User',
  },
} as const;

/**
 * Standard test containers and locations
 */
export const TEST_LOCATIONS = {
  CONTAINERS: [
    'Greenhouse A',
    'Window Shelf', 
    'Grow Tent',
    'Outdoor Bed 1',
    'Balcony Planter',
  ],
  
  SECTIONS: [
    'Row 1',
    'Row 2', 
    'North Side',
    'South Side',
    'Center',
  ],
} as const;

/**
 * Test care activity amounts and units
 */
export const TEST_CARE = {
  WATERING: {
    amounts: [100, 250, 500, 1000],
    units: ['ml', 'oz', 'cups', 'liters'],
  },
  
  FERTILIZATION: {
    products: [
      'All-Purpose Fertilizer',
      'Fish Emulsion', 
      'Compost Tea',
      'Liquid Kelp',
    ],
    dilutions: ['1:10', '1:20', 'half strength', 'full strength'],
  },
  
  HEALTH_ASSESSMENTS: [
    'excellent',
    'good', 
    'fair',
    'concerning',
    'critical',
  ],
} as const;

/**
 * Date Helpers for test scenarios
 */
export const DateHelpers = {
  now: () => new Date(),
  daysAgo: (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000),
  daysFromNow: (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  weeksAgo: (weeks: number) => new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000),
  weeksFromNow: (weeks: number) => new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000),
} as const;

/**
 * Test Data utilities for complex scenarios
 */
export const TestData = {
  strawberryPlantsAtAges: (ages: number[]) => {
    return ages.map((age, index) => ({
      id: `strawberry-${age}-days-${index}`,
      varietyId: TEST_VARIETIES.STRAWBERRY.id,
      varietyName: TEST_VARIETIES.STRAWBERRY.name,
      name: `${age}-Day Strawberry Plant`,
      plantedDate: DateHelpers.daysAgo(age),
      location: 'Indoor',
      container: 'Grow Bag',
      soilMix: 'Potting Mix',
      isActive: true,
      quantity: 1,
      reminderPreferences: {
        watering: true,
        fertilizing: true,
        observation: true,
        lighting: true,
        pruning: true,
      },
      createdAt: DateHelpers.daysAgo(age),
      updatedAt: new Date(),
    }));
  },
  
  fertilizationHistory: (plantId: string, daysAgo: number[]) => {
    return daysAgo.map((days, index) => ({
      id: `fertilization-${plantId}-${index}`,
      plantId,
      activityType: 'fertilize' as const,
      activityDate: DateHelpers.daysAgo(days),
      details: {
        type: 'fertilize' as const,
        product: 'Neptune\'s Harvest',
        dilution: '1 tbsp/gallon',
        amount: '2 quarts',
        method: 'soil-drench',
      },
      notes: `Fertilization ${index + 1}`,
      createdAt: DateHelpers.daysAgo(days),
      updatedAt: DateHelpers.daysAgo(days),
    }));
  },
} as const;