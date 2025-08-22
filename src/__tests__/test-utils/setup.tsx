/**
 * Test Setup Utilities
 * 
 * Unified component rendering and test environment setup.
 * Consolidates all rendering patterns into consistent interface.
 */

import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { MemoryRouter, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface TestRenderOptions {
  initialEntries?: string[];
  withRouter?: boolean;
  routerType?: 'memory' | 'browser';
  queryClient?: QueryClient;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Unified component rendering function
 * 
 * Replaces all renderWithRouter, renderWithProviders patterns
 * Provides consistent setup for routing and React Query
 * 
 * @example
 * renderComponent(<MyComponent />, { 
 *   initialEntries: ['/plants'],
 *   withRouter: true 
 * });
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
 * Create optimized QueryClient for tests
 * 
 * Disables retries, caching, and background refetching
 * for faster, more predictable tests
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
};