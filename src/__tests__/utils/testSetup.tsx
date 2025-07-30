// src/__tests__/utils/testSetup.ts - Unified Test Setup and Utilities
// This file provides a single, consistent interface for all test setups

import { render, RenderResult } from "@testing-library/react";
import { MemoryRouter, BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "firebase/auth";
import React from "react";

// Import centralized factories and utilities
import { db } from "@/types/database";
import { createMockGarden, createMockUser } from "./testDataFactories";

// ===========================
// UNIFIED RENDERING UTILITIES
// ===========================

interface TestRenderOptions {
  initialEntries?: string[];
  withRouter?: boolean;
  routerType?: 'memory' | 'browser';
  queryClient?: QueryClient;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Unified rendering function that all tests should use
 * Replaces inconsistent renderWithRouter, renderWithProviders patterns
 */
export const renderComponent = (
  ui: React.ReactElement,
  options: TestRenderOptions = {}
): RenderResult => {
  const {
    withRouter = true,
    routerType = 'memory',
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    wrapper,
  } = options;

  let Wrapper: React.ComponentType<{ children: React.ReactNode }>;

  if (wrapper) {
    Wrapper = wrapper;
  } else {
    Wrapper = ({ children }) => {
      let content = (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      if (withRouter) {
        if (routerType === 'memory') {
          content = (
            <MemoryRouter initialEntries={initialEntries}>
              {content}
            </MemoryRouter>
          );
        } else {
          content = <BrowserRouter>{content}</BrowserRouter>;
        }
      }

      return content;
    };
  }

  return render(ui, { wrapper: Wrapper });
};

/**
 * Create a test-optimized QueryClient
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// ===========================
// DATABASE UTILITIES
// ===========================

/**
 * Clear all test database tables
 */
export const clearTestDatabase = async (): Promise<void> => {
  await Promise.all([
    db.plants.clear(),
    db.varieties.clear(),
    db.careActivities.clear(),
    db.taskBypasses.clear(),
    db.taskCompletions.clear(),
    db.scheduledTasks.clear(),
  ]);
};

/**
 * Seed the test database with consistent data
 */
export const seedTestDatabase = async () => {
  const garden = createMockGarden();

  await db.varieties.bulkAdd(garden.varieties);
  await db.plants.bulkAdd(garden.plants);
  await db.careActivities.bulkAdd(garden.careActivities);
  await db.scheduledTasks.bulkAdd(garden.tasks);

  return garden;
};

/**
 * Complete test environment setup
 */
export const setupTestEnvironment = async () => {
  await clearTestDatabase();
  return await seedTestDatabase();
};

// ===========================
// MOCK UTILITIES
// ===========================

/**
 * Standard Firebase User mock
 */
export const createMockFirebaseUser = (overrides?: Partial<User>): User => {
  return createMockUser(overrides);
};

/**
 * Hook mock configurations
 */
export interface MockHookConfig {
  useFirebaseAuth?: {
    user?: User | null;
    loading?: boolean;
    error?: string | null;
  };
  useFirebasePlants?: {
    plants?: any[];
    loading?: boolean;
    error?: string | null;
  };
  useScheduledTasks?: {
    tasks?: any[];
    loading?: boolean;
    error?: string | null;
  };
}

/**
 * Configure standard hook mocks with consistent patterns
 */
export const configureMockHooks = (config: MockHookConfig = {}): void => {
  // Configure useFirebaseAuth
  if (config.useFirebaseAuth !== undefined) {
    const mockUseFirebaseAuth = require("@/hooks/useFirebaseAuth").useFirebaseAuth as jest.Mock;
    mockUseFirebaseAuth.mockReturnValue({
      user: config.useFirebaseAuth.user || null,
      loading: config.useFirebaseAuth.loading || false,
      error: config.useFirebaseAuth.error || null,
    });
  }

  // Configure useFirebasePlants
  if (config.useFirebasePlants !== undefined) {
    const mockUseFirebasePlants = require("@/hooks/useFirebasePlants").useFirebasePlants as jest.Mock;
    mockUseFirebasePlants.mockReturnValue({
      plants: config.useFirebasePlants.plants || [],
      loading: config.useFirebasePlants.loading || false,
      error: config.useFirebasePlants.error || null,
    });
  }

  // Configure useScheduledTasks
  if (config.useScheduledTasks !== undefined) {
    const mockUseScheduledTasks = require("@/hooks/useScheduledTasks").useScheduledTasks as jest.Mock;
    mockUseScheduledTasks.mockReturnValue({
      tasks: config.useScheduledTasks.tasks || [],
      loading: config.useScheduledTasks.loading || false,
      error: config.useScheduledTasks.error || null,
    });
  }
};

// ===========================
// TEST SCENARIOS
// ===========================

/**
 * Pre-configured test scenarios for common testing situations
 */
export class TestScenarios {
  /**
   * Set up authenticated user with plants
   */
  static async authenticatedUserWithPlants() {
    const user = createMockFirebaseUser();
    const garden = await setupTestEnvironment();
    
    configureMockHooks({
      useFirebaseAuth: { user, loading: false },
      useFirebasePlants: { plants: garden.plants, loading: false },
      useScheduledTasks: { tasks: garden.tasks, loading: false },
    });

    return { user, garden };
  }

  /**
   * Set up unauthenticated user
   */
  static unauthenticatedUser() {
    configureMockHooks({
      useFirebaseAuth: { user: null, loading: false },
      useFirebasePlants: { plants: [], loading: false },
      useScheduledTasks: { tasks: [], loading: false },
    });
  }

  /**
   * Set up loading states
   */
  static loadingStates() {
    configureMockHooks({
      useFirebaseAuth: { user: null, loading: true },
      useFirebasePlants: { plants: [], loading: true },
      useScheduledTasks: { tasks: [], loading: true },
    });
  }

  /**
   * Set up error states
   */
  static errorStates(errorMessage = "Test error") {
    configureMockHooks({
      useFirebaseAuth: { user: null, loading: false, error: errorMessage },
      useFirebasePlants: { plants: [], loading: false, error: errorMessage },
      useScheduledTasks: { tasks: [], loading: false, error: errorMessage },
    });
  }

  /**
   * Set up empty states (authenticated but no data)
   */
  static emptyStates() {
    const user = createMockFirebaseUser();
    configureMockHooks({
      useFirebaseAuth: { user, loading: false },
      useFirebasePlants: { plants: [], loading: false },
      useScheduledTasks: { tasks: [], loading: false },
    });
    return user;
  }
}

// ===========================
// CLEANUP UTILITIES
// ===========================

/**
 * Standard test cleanup
 */
export const cleanupTests = async (): Promise<void> => {
  jest.clearAllMocks();
  await clearTestDatabase();
};

/**
 * Setup for each test
 */
export const setupTest = async (): Promise<void> => {
  await clearTestDatabase();
};

/**
 * Helper for beforeEach/afterEach patterns
 */
export const useTestLifecycle = () => {
  beforeEach(async () => {
    await setupTest();
  });

  afterEach(async () => {
    await cleanupTests();
  });
};

// ===========================
// EXPORTS
// ===========================

// Re-export factories for convenience
export {
  createMockVariety,
  createMockPlant,
  createMockCareActivity,
  createMockGarden,
  createMockUser,
  createMockPlantWithVariety,
  getRealVariety,
  getRealVarietiesByCategory,
  varieties,
} from "./testDataFactories";