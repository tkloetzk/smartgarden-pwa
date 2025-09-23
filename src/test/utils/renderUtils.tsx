/**
 * Custom Render Utilities for Testing
 *
 * Provides custom render functions that reduce boilerplate and ensure
 * consistent test setup across all component tests.
 */

import React from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { User } from "firebase/auth";

// ============================================================================
// MOCK DATA AND TYPES
// ============================================================================

/**
 * Mock user for authentication testing
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  uid: "test-user-id",
  email: "test@example.com",
  displayName: "Test User",
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: "2024-08-01T00:00:00Z",
    lastSignInTime: "2024-08-01T00:00:00Z",
  },
  providerData: [],
  refreshToken: "mock-token",
  tenantId: null,
  phoneNumber: null,
  photoURL: null,
  providerId: "firebase",
  delete: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue("mock-token"),
  getIdTokenResult: vi.fn().mockResolvedValue({}),
  reload: vi.fn(),
  toJSON: vi.fn(),
  ...overrides,
} as User);

/**
 * Default mock user instance
 */
export const mockUser = createMockUser();

// ============================================================================
// PROVIDER WRAPPERS
// ============================================================================

/**
 * Router wrapper with configurable initial entries
 */
interface RouterWrapperProps extends Partial<MemoryRouterProps> {
  children: React.ReactNode;
}

const RouterWrapper: React.FC<RouterWrapperProps> = ({
  children,
  initialEntries = ["/"],
  ...routerProps
}) => (
  <MemoryRouter initialEntries={initialEntries} {...routerProps}>
    {children}
  </MemoryRouter>
);

/**
 * Query client wrapper with test-optimized configuration
 */
interface QueryWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

const QueryWrapper: React.FC<QueryWrapperProps> = ({ children, queryClient }) => {
  // Create a fresh query client for each test to avoid state pollution
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: Infinity, // Never consider data stale in tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Combined wrapper with all common providers
 */
interface AllProvidersWrapperProps extends RouterWrapperProps {
  queryClient?: QueryClient;
}

const AllProvidersWrapper: React.FC<AllProvidersWrapperProps> = ({
  children,
  queryClient,
  ...routerProps
}) => (
  <QueryWrapper queryClient={queryClient}>
    <RouterWrapper {...routerProps}>
      {children}
    </RouterWrapper>
  </QueryWrapper>
);

// ============================================================================
// CUSTOM RENDER OPTIONS
// ============================================================================

/**
 * Options for custom render functions
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Router options
  initialEntries?: string[];
  routerProps?: Partial<MemoryRouterProps>;

  // Query client options
  queryClient?: QueryClient;

  // Authentication state
  user?: User | null;

  // Whether to include router wrapper
  withRouter?: boolean;

  // Whether to include query client wrapper
  withQueryClient?: boolean;

  // Custom wrapper component
  customWrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

/**
 * Render component with router only
 */
export const renderWithRouter = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const {
    initialEntries = ["/"],
    routerProps = {},
    customWrapper,
    ...renderOptions
  } = options;

  const Wrapper = customWrapper || RouterWrapper;

  return render(ui, {
    wrapper: ({ children }) => (
      <Wrapper initialEntries={initialEntries} {...routerProps}>
        {children}
      </Wrapper>
    ),
    ...renderOptions,
  });
};

/**
 * Render component with query client only
 */
export const renderWithQueryClient = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { queryClient, customWrapper, ...renderOptions } = options;

  const Wrapper = customWrapper || QueryWrapper;

  return render(ui, {
    wrapper: ({ children }) => (
      <Wrapper queryClient={queryClient}>
        {children}
      </Wrapper>
    ),
    ...renderOptions,
  });
};

/**
 * Render component with all common providers (router + query client)
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const {
    initialEntries = ["/"],
    routerProps = {},
    queryClient,
    customWrapper,
    ...renderOptions
  } = options;

  const Wrapper = customWrapper || AllProvidersWrapper;

  return render(ui, {
    wrapper: ({ children }) => (
      <Wrapper
        initialEntries={initialEntries}
        queryClient={queryClient}
        {...routerProps}
      >
        {children}
      </Wrapper>
    ),
    ...renderOptions,
  });
};

/**
 * Smart render function that automatically chooses the right wrapper
 * based on the component's needs
 */
export const renderSmart = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { withRouter = true, withQueryClient = true, ...restOptions } = options;

  if (withRouter && withQueryClient) {
    return renderWithProviders(ui, restOptions);
  } else if (withRouter) {
    return renderWithRouter(ui, restOptions);
  } else if (withQueryClient) {
    return renderWithQueryClient(ui, restOptions);
  } else {
    return render(ui, restOptions);
  }
};

// ============================================================================
// SPECIALIZED RENDER FUNCTIONS
// ============================================================================

/**
 * Render a dashboard component with typical setup
 */
export const renderDashboard = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  return renderWithProviders(ui, {
    initialEntries: ["/"],
    ...options,
  });
};

/**
 * Render a form component with form-specific setup
 */
export const renderForm = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  return renderWithProviders(ui, {
    initialEntries: ["/add-plant"],
    ...options,
  });
};

/**
 * Render a plant detail page with plant ID in route
 */
export const renderPlantDetail = (
  ui: React.ReactElement,
  plantId: string = "test-plant-1",
  options: CustomRenderOptions = {}
): RenderResult => {
  return renderWithProviders(ui, {
    initialEntries: [`/plants/${plantId}`],
    ...options,
  });
};

/**
 * Render component in specific page context
 */
export const renderInPage = (
  ui: React.ReactElement,
  path: string,
  options: CustomRenderOptions = {}
): RenderResult => {
  return renderWithProviders(ui, {
    initialEntries: [path],
    ...options,
  });
};

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Wait for all async operations to complete
 */
export const waitForAsyncOperations = async (): Promise<void> => {
  // Wait for any pending promises
  await new Promise(resolve => setTimeout(resolve, 0));

  // Wait for any pending timers
  await vi.runAllTimersAsync?.();
};

/**
 * Get fresh query client for isolated testing
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Setup function to call before each test
 */
export const setupTest = (): void => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset any global state if needed
  // This can be extended as the app grows
};

/**
 * Cleanup function to call after each test
 */
export const cleanupTest = (): void => {
  // Cleanup any subscriptions, timers, etc.
  // This can be extended as needed
};

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export commonly used testing utilities
export {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";

export { userEvent } from "@testing-library/user-event";

// Default export for convenience
export default renderWithProviders;