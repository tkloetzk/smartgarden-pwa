/**
 * Test Mode Helpers
 *
 * Provides pre-configured test mode settings for different testing scenarios.
 * These helpers ensure consistent test environment setup across test files.
 */

export interface TestModeConfig {
  __TEST_MODE?: boolean;
  __VITE_TEST_MODE?: string;
  __EMPTY_PLANTS_MODE?: boolean;
  __FORCE_DB_INIT?: boolean;
  [key: string]: any;
}

export const TestModes = {
  /**
   * Standard test mode - authenticated user with normal app state
   */
  standard(): TestModeConfig {
    return {
      __TEST_MODE: true,
      __VITE_TEST_MODE: "true",
    };
  },

  /**
   * Empty plants mode - authenticated user with no plants
   * Useful for testing empty state UI and onboarding flows
   */
  emptyPlants(): TestModeConfig {
    return {
      ...TestModes.standard(),
      __EMPTY_PLANTS_MODE: true,
    };
  },

  /**
   * With database initialization - forces database seeding
   * Useful for tests that need plant varieties and other seed data
   */
  withDbInit(): TestModeConfig {
    return {
      ...TestModes.standard(),
      __FORCE_DB_INIT: true,
    };
  },

  /**
   * Mock varieties mode - provides predetermined plant varieties
   * Useful for consistent testing without depending on database state
   */
  withMockVarieties(varieties?: Array<{name: string, category: string}>): TestModeConfig {
    const defaultVarieties = [
      { name: "Test Tomato", category: "vegetables" },
      { name: "Test Basil", category: "herbs" },
      { name: "Test Rose", category: "flowers" }
    ];

    return {
      ...TestModes.standard(),
      __MOCK_VARIETIES_MODE: true,
      __MOCK_VARIETIES_DATA: varieties || defaultVarieties,
    };
  },

  /**
   * Offline mode - simulates network failure scenarios
   * Useful for testing error handling and offline functionality
   */
  offlineMode(): TestModeConfig {
    return {
      ...TestModes.standard(),
      __OFFLINE_MODE: true,
      __NETWORK_ERROR: true,
    };
  },

  /**
   * Slow loading mode - introduces artificial delays
   * Useful for testing loading states and timeouts
   */
  slowLoading(delayMs: number = 3000): TestModeConfig {
    return {
      ...TestModes.standard(),
      __SLOW_LOADING_MODE: true,
      __LOADING_DELAY_MS: delayMs,
    };
  },

  /**
   * Error simulation mode - forces specific errors
   * Useful for testing error handling paths
   */
  withErrors(errorType: 'database' | 'network' | 'validation'): TestModeConfig {
    return {
      ...TestModes.standard(),
      __ERROR_SIMULATION_MODE: true,
      __ERROR_TYPE: errorType,
    };
  },

  /**
   * No authentication mode - disables test auth, shows auth form
   * Useful for testing authentication flows
   */
  noAuth(): TestModeConfig {
    return {
      __TEST_MODE: false,
      __VITE_TEST_MODE: "false",
    };
  },

  /**
   * Custom mode - allows for specific configuration
   * @param config Custom configuration object
   */
  custom(config: TestModeConfig): TestModeConfig {
    return {
      ...TestModes.standard(),
      ...config,
    };
  },
} as const;

/**
 * Helper function to apply test mode configuration to a page
 * @param page Playwright page instance
 * @param modeConfig Test mode configuration
 */
export async function applyTestMode(page: any, modeConfig: TestModeConfig): Promise<void> {
  await page.addInitScript((config: TestModeConfig) => {
    Object.entries(config).forEach(([key, value]) => {
      (window as any)[key] = value;
    });
  }, modeConfig);
}