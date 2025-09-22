/**
 * Standardized Test Setup Helpers
 *
 * Provides consistent test environment setup and teardown
 * with proper isolation between tests.
 */

import { Page } from '@playwright/test';
import { TestModes, applyTestMode, TestModeConfig } from './test-modes';

export interface TestSetupOptions {
  /** Test mode configuration to apply */
  mode?: TestModeConfig;
  /** Whether to clear local storage before test */
  clearStorage?: boolean;
  /** Whether to clear cookies before test */
  clearCookies?: boolean;
  /** Custom initialization script to run */
  initScript?: string;
}

/**
 * Standard test setup with isolation
 * Call this in beforeEach hooks for consistent test environment
 */
export async function setupTest(page: Page, options: TestSetupOptions = {}): Promise<void> {
  const {
    mode = TestModes.standard(),
    clearStorage = true,
    clearCookies = true,
    initScript
  } = options;

  // Clear cookies immediately (safe to do before navigation)
  if (clearCookies) {
    await page.context().clearCookies();
  }

  // Apply test mode configuration (uses addInitScript, safe before navigation)
  await applyTestMode(page, mode);

  // Add storage clearing script to run after navigation
  if (clearStorage) {
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // localStorage might not be available in some contexts, ignore errors
        console.debug('Could not clear storage:', e);
      }
    });
  }

  // Run custom initialization if provided
  if (initScript) {
    await page.addInitScript(initScript);
  }
}

/**
 * Post-navigation cleanup function
 * Call this after page.goto() if you need to ensure clean state during test execution
 */
export async function cleanupAfterNavigation(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      try {
        // Clear any existing storage that might interfere with test
        localStorage.clear();
        sessionStorage.clear();

        // Clear any non-test flags that might have been set
        const nonTestKeys = Object.keys(window).filter(key =>
          !key.startsWith('__TEST') &&
          !key.startsWith('__VITE_TEST') &&
          (key.startsWith('__') || key.includes('_MODE'))
        );
        nonTestKeys.forEach(key => {
          delete (window as any)[key];
        });
      } catch (e) {
        console.debug('Could not clean up after navigation:', e);
      }
    });
  } catch (e) {
    console.debug('Post-navigation cleanup failed:', e);
  }
}

/**
 * Standard test teardown
 * Call this in afterEach hooks for cleanup
 */
export async function teardownTest(page: Page): Promise<void> {
  try {
    // Reset any test-specific state
    await page.evaluate(() => {
      try {
        // Clear any test flags
        const testKeys = Object.keys(window).filter(key => key.startsWith('__TEST') || key.startsWith('__VITE_TEST'));
        testKeys.forEach(key => {
          delete (window as any)[key];
        });

        // Clear storage to prevent state leakage
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // localStorage might not be available in some contexts, ignore errors
        console.debug('Could not clear state in teardown:', e);
      }
    });
  } catch (e) {
    // Page might be closed or in an invalid state, ignore errors during teardown
    console.debug('Teardown failed:', e);
  }
}

/**
 * Preset configurations for common test scenarios
 */
export const TestSetups = {
  /** Standard authenticated user test */
  authenticated: (): TestSetupOptions => ({
    mode: TestModes.standard(),
    clearStorage: true,
    clearCookies: true,
  }),

  /** Unauthenticated user test (shows auth form) */
  unauthenticated: (): TestSetupOptions => ({
    mode: TestModes.noAuth(),
    clearStorage: true,
    clearCookies: true,
  }),

  /** Empty garden state (no plants) */
  emptyGarden: (): TestSetupOptions => ({
    mode: TestModes.emptyPlants(),
    clearStorage: true,
    clearCookies: true,
  }),

  /** Form testing with database initialization */
  formTesting: (): TestSetupOptions => ({
    mode: TestModes.withDbInit(),
    clearStorage: true,
    clearCookies: true,
  }),

  /** Testing with mock data */
  withMockData: (varieties?: Array<{name: string, category: string}>): TestSetupOptions => ({
    mode: TestModes.withMockVarieties(varieties),
    clearStorage: true,
    clearCookies: true,
  }),

  /** Performance testing (no cleanup) */
  performance: (): TestSetupOptions => ({
    mode: TestModes.standard(),
    clearStorage: false,
    clearCookies: false,
  }),
} as const;

/**
 * Helper to create a consistent beforeEach hook
 */
export function createStandardBeforeEach(setupOptions: TestSetupOptions = {}) {
  return async ({ page }: { page: Page }) => {
    await setupTest(page, setupOptions);
  };
}

/**
 * Helper to create a consistent afterEach hook
 */
export function createStandardAfterEach() {
  return async ({ page }: { page: Page }) => {
    await teardownTest(page);
  };
}