/**
 * Consolidated Test Utilities
 * 
 * Single import point for all test utilities, builders, and setup functions.
 * Use this instead of scattered utility imports.
 * 
 * Usage:
 *   import { renderComponent, PlantBuilder, createMockUser } from '@/__tests__/test-utils';
 */

// Component rendering and setup
export { renderComponent, createTestQueryClient } from './setup';

// Data factories and builders
export { 
  createMockUser, 
  createMockPlant, 
  createMockVariety,
  createMockCareActivity,
  createMockScheduledTask
} from './factories';

// Fluent builders
export { PlantBuilder, CareActivityBuilder, TaskBuilder } from './builders';

// Test data constants
export { TEST_VARIETIES, TEST_DATES, DateHelpers, TestData } from './constants';