// src/__tests__/utils/mockServices.tsx - Unified Service Mocking
// This file provides consistent service mocking patterns across all tests

import { jest } from '@jest/globals';
import { User } from 'firebase/auth';
import { PlantRecord, VarietyRecord, CareActivityRecord } from '@/types';
import { createMockPlant, createMockVariety } from './testDataFactories';

// ===========================
// FIREBASE HOOKS MOCKING
// ===========================

/**
 * Standard mock setup for Firebase hooks
 */
export const setupFirebaseHookMocks = () => {
  // Mock useFirebaseAuth
  jest.mock("@/hooks/useFirebaseAuth", () => ({
    useFirebaseAuth: jest.fn(() => ({
      user: null,
      loading: false,
      error: null,
    })),
  }));

  // Mock useFirebasePlants
  jest.mock("@/hooks/useFirebasePlants", () => ({
    useFirebasePlants: jest.fn(() => ({
      plants: [],
      loading: false,
      error: null,
    })),
  }));

  // Mock useFirebaseCareActivities
  jest.mock("@/hooks/useFirebaseCareActivities", () => ({
    useFirebaseCareActivities: jest.fn(() => ({
      activities: [],
      loading: false,
      error: null,
      logActivity: jest.fn(),
    })),
  }));

  // Mock useScheduledTasks
  jest.mock("@/hooks/useScheduledTasks", () => ({
    useScheduledTasks: jest.fn(() => ({
      tasks: [],
      loading: false,
      error: null,
    })),
  }));
};

// ===========================
// COMPONENT MOCKING
// ===========================

/**
 * Mock common components with consistent interfaces
 */
export const setupCommonComponentMocks = () => {
  // Mock Navigation
  jest.mock("@/components/Navigation", () => ({
    __esModule: true,
    default: () => <div data-testid="navigation">Navigation</div>,
  }));

  // Mock OfflineIndicator
  jest.mock("@/components/ui/OfflineIndicator", () => ({
    OfflineIndicator: () => (
      <div data-testid="offline-indicator">Offline Indicator</div>
    ),
  }));

  // Mock toast notifications
  jest.mock("react-hot-toast", () => ({
    __esModule: true,
    default: {
      success: jest.fn(),
      error: jest.fn(),
      loading: jest.fn(),
    },
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      loading: jest.fn(),
    },
  }));

  // Mock router navigation
  const mockNavigate = jest.fn();
  jest.mock("react-router-dom", () => ({
    ...(jest.requireActual("react-router-dom") as any),
    useNavigate: () => mockNavigate,
  }));

  return { mockNavigate };
};

// ===========================
// SERVICE MOCKING MANAGER
// ===========================

export class ServiceMockManager {
  private mockRestore = new Map<string, () => void>();

  /**
   * Set up comprehensive service mocks for a test
   */
  setup() {
    this.setupDatabaseServiceMocks();
    this.setupFirebaseServiceMocks();
    this.setupHookMocks();
  }

  /**
   * Mock database services (Dexie-based)
   */
  private setupDatabaseServiceMocks() {
    // Mock database operations that are commonly used
    const mockDb = {
      plants: {
        add: (jest.fn() as any).mockResolvedValue('test-plant-id'),
        get: (jest.fn() as any).mockResolvedValue(createMockPlant()),
        update: (jest.fn() as any).mockResolvedValue(undefined),
        delete: (jest.fn() as any).mockResolvedValue(undefined),
        where: (jest.fn() as any).mockReturnValue({
          toArray: (jest.fn() as any).mockResolvedValue([]),
        }),
        toArray: (jest.fn() as any).mockResolvedValue([]),
        clear: (jest.fn() as any).mockResolvedValue(undefined),
        bulkAdd: (jest.fn() as any).mockResolvedValue(undefined),
      },
      varieties: {
        toArray: (jest.fn() as any).mockResolvedValue([]),
        where: (jest.fn() as any).mockReturnValue({
          first: (jest.fn() as any).mockResolvedValue(createMockVariety()),
        }),
        clear: (jest.fn() as any).mockResolvedValue(undefined),
        bulkAdd: (jest.fn() as any).mockResolvedValue(undefined),
      },
      careActivities: {
        add: (jest.fn() as any).mockResolvedValue('test-activity-id'),
        where: (jest.fn() as any).mockReturnValue({
          toArray: (jest.fn() as any).mockResolvedValue([]),
          reverse: (jest.fn() as any).mockReturnValue({
            limit: (jest.fn() as any).mockReturnValue({
              toArray: (jest.fn() as any).mockResolvedValue([]),
            }),
          }),
        }),
        clear: (jest.fn() as any).mockResolvedValue(undefined),
        bulkAdd: (jest.fn() as any).mockResolvedValue(undefined),
      },
      scheduledTasks: {
        add: (jest.fn() as any).mockResolvedValue('test-task-id'),
        toArray: (jest.fn() as any).mockResolvedValue([]),
        clear: (jest.fn() as any).mockResolvedValue(undefined),
        bulkAdd: (jest.fn() as any).mockResolvedValue(undefined),
      },
      taskBypasses: {
        clear: (jest.fn() as any).mockResolvedValue(undefined),
      },
      taskCompletions: {
        clear: (jest.fn() as any).mockResolvedValue(undefined),
      },
    };

    // Mock the database import
    jest.doMock("@/types/database", () => ({
      ...(jest.requireActual("@/types/database") as any),
      db: mockDb,
    }));
  }

  /**
   * Mock Firebase services
   */
  private setupFirebaseServiceMocks() {
    // These are already mocked in setupTests.ts for Firebase SDK
    // Here we can add specific service-level mocks if needed
  }

  /**
   * Mock custom hooks consistently
   */
  private setupHookMocks() {
    setupFirebaseHookMocks();
  }

  /**
   * Configure specific mock behaviors for a test scenario
   */
  configureScenario(scenario: {
    plants?: PlantRecord[];
    varieties?: VarietyRecord[];
    activities?: CareActivityRecord[];
    user?: User | null;
    loading?: boolean;
    error?: string | null;
  }) {
    const {
      plants = [],
      activities = [],
      user = null,
      loading = false,
      error = null,
    } = scenario;

    // Configure hook mocks
    const mockUseFirebaseAuth = require("@/hooks/useFirebaseAuth").useFirebaseAuth as jest.Mock;
    mockUseFirebaseAuth.mockReturnValue({ user, loading, error });

    const mockUseFirebasePlants = require("@/hooks/useFirebasePlants").useFirebasePlants as jest.Mock;
    mockUseFirebasePlants.mockReturnValue({ plants, loading, error });

    const mockUseFirebaseCareActivities = require("@/hooks/useFirebaseCareActivities").useFirebaseCareActivities as jest.Mock;
    mockUseFirebaseCareActivities.mockReturnValue({
      activities,
      loading,
      error,
      logActivity: jest.fn(),
    });
  }

  /**
   * Configure error scenarios
   */
  configureErrorScenario(errorType: 'network' | 'database' | 'auth', message = 'Test error') {
    switch (errorType) {
      case 'network':
        this.configureScenario({ error: `Network error: ${message}` });
        break;
      case 'database':
        this.configureScenario({ error: `Database error: ${message}` });
        break;
      case 'auth':
        this.configureScenario({ error: `Authentication error: ${message}` });
        break;
    }
  }

  /**
   * Reset all mocks to clean state
   */
  reset() {
    jest.clearAllMocks();
  }

  /**
   * Restore original implementations
   */
  restore() {
    this.mockRestore.forEach(restore => restore());
    this.mockRestore.clear();
    jest.restoreAllMocks();
  }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Quick setup for component tests
 */
export const setupComponentTest = () => {
  const mockManager = new ServiceMockManager();
  mockManager.setup();
  const { mockNavigate } = setupCommonComponentMocks();
  
  return { mockManager, mockNavigate };
};

/**
 * Quick setup for integration tests
 */
export const setupIntegrationTest = () => {
  const mockManager = new ServiceMockManager();
  mockManager.setup();
  
  return { mockManager };
};

// ===========================
// MOCK ASSERTIONS
// ===========================

/**
 * Helper functions for common mock assertions
 */
export const assertMockCalls = {
  /**
   * Assert that a service method was called with specific parameters
   */
  serviceCall: (mockFn: jest.Mock, expectedCalls: any[]) => {
    expect(mockFn).toHaveBeenCalledTimes(expectedCalls.length);
    expectedCalls.forEach((expectedCall, index) => {
      expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedCall);
    });
  },

  /**
   * Assert that navigation was called with specific route
   */
  navigation: (mockNavigate: jest.Mock, expectedRoute: string) => {
    expect(mockNavigate).toHaveBeenCalledWith(expectedRoute);
  },

  /**
   * Assert that toast was called with specific message
   */
  toast: (mockToast: jest.Mock, expectedMessage: string) => {
    expect(mockToast).toHaveBeenCalledWith(expectedMessage);
  },
};

// ===========================
// EXPORTS
// ===========================

// Create singleton instance for convenience
export const testMocks = new ServiceMockManager();