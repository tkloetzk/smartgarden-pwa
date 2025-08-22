/**
 * Test Data Factories
 * 
 * Simple factory functions for creating test data.
 * Use builders for more complex test scenarios.
 */

import { User } from 'firebase/auth';
import { 
  PlantRecord, 
  VarietyRecord, 
  CareActivityRecord,
  CareActivityType,
  GrowthStage 
} from '@/types';
import { ScheduledTask } from '@/services/ProtocolTranspilerService';
import { TEST_VARIETIES, TEST_DATES } from './constants';

type FactoryFunction<T> = (overrides?: Partial<T>) => T;

/**
 * Create mock Firebase User
 */
export const createMockUser: FactoryFunction<User> = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User',
  isAnonymous: false,
  metadata: {
    creationTime: TEST_DATES.USER_CREATED,
    lastSignInTime: TEST_DATES.USER_LAST_SIGNIN,
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
  ...overrides,
} as User);

/**
 * Create mock plant record
 */
export const createMockPlant: FactoryFunction<PlantRecord> = (overrides = {}) => ({
  id: 'test-plant-id',
  varietyId: 'test-variety-id',
  varietyName: 'Test Variety',
  name: 'Test Plant',
  plantedDate: TEST_DATES.PLANT_DEFAULT,
  location: 'Indoor',
  container: 'Test Container',
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
  notes: [],
  createdAt: new Date(), // Use current time for better test behavior
  updatedAt: new Date(), // Use current time for better test behavior
  ...overrides,
});

/**
 * Create mock variety record
 */
export const createMockVariety: FactoryFunction<VarietyRecord> = (overrides = {}) => ({
  id: 'test-variety-id',
  name: 'Test Variety',
  normalizedName: 'test variety',
  category: 'leafy-greens',
  growthTimeline: {
    germination: 7,
    seedling: 14,
    vegetative: 21,
    maturation: 60,
  },
  createdAt: TEST_DATES.VARIETY_DEFAULT,
  updatedAt: TEST_DATES.VARIETY_DEFAULT,
  ...overrides,
});

/**
 * Create mock care activity record
 */
export const createMockCareActivity: FactoryFunction<CareActivityRecord> = (overrides = {}) => ({
  id: 'test-activity-id',
  plantId: 'test-plant-id',
  type: 'water' as CareActivityType,
  activityType: 'water' as CareActivityType, // Alias for backward compatibility
  date: new Date(), // Use current date for better timestamp behavior
  activityDate: new Date(), // Alias for backward compatibility
  details: {
    type: 'water' as const,
    waterAmount: 250,
    waterUnit: 'ml',
  },
  userId: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Create mock scheduled task
 */
export const createMockScheduledTask: FactoryFunction<ScheduledTask> = (overrides = {}) => ({
  id: 'test-task-id',
  plantId: 'test-plant-id',
  taskName: 'Test Task',
  taskType: 'water' as CareActivityType,
  details: {
    type: 'fertilize' as const,
    product: 'Test Fertilizer',
    dilution: '1:10',
    amount: '1 cup',
    method: 'soil-drench' as const,
  },
  dueDate: TEST_DATES.TASK_DUE,
  status: 'pending' as const,
  sourceProtocol: {
    stage: 'vegetative' as GrowthStage,
    originalStartDays: 14,
    isDynamic: false,
  },
  createdAt: TEST_DATES.TASK_CREATED,
  updatedAt: TEST_DATES.TASK_CREATED,
  ...overrides,
});

/**
 * Quick factory helpers for common scenarios
 */
export const createStrawberryPlant = (overrides?: Partial<PlantRecord>) => 
  createMockPlant({
    varietyId: TEST_VARIETIES.STRAWBERRY.id,
    varietyName: TEST_VARIETIES.STRAWBERRY.name,
    ...overrides,
  });

export const createTomatoPlant = (overrides?: Partial<PlantRecord>) => 
  createMockPlant({
    varietyId: TEST_VARIETIES.TOMATO.id,
    varietyName: TEST_VARIETIES.TOMATO.name,
    ...overrides,
  });

export const createLettuceVariety = (overrides?: Partial<VarietyRecord>) => 
  createMockVariety({
    ...TEST_VARIETIES.LETTUCE,
    ...overrides,
  });