// src/__tests__/utils/testHelpers.tsx

import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { db } from "@/types/database";
import { createMockGarden } from "./testDataFactories";

interface RenderOptions {
  initialEntries?: string[];
  withRouter?: boolean;
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions = {}
) => {
  const {
    withRouter = true,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    }),
  } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const content = (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    if (withRouter) {
      return <BrowserRouter>{content}</BrowserRouter>;
    }

    return content;
  };

  return render(ui, { wrapper: Wrapper });
};

/**
 * Clear all test database tables
 */
export const clearTestDatabase = async () => {
  await db.plants.clear();
  await db.varieties.clear();
  await db.careActivities.clear();
  await db.taskBypasses.clear();
  await db.taskCompletions.clear();
  await db.scheduledTasks.clear();
};

/**
 * Seed the test database with a basic garden setup
 */
export const seedTestDatabase = async () => {
  const garden = createMockGarden();

  // Add varieties first
  await db.varieties.bulkAdd(garden.varieties);

  // Add plants
  await db.plants.bulkAdd(garden.plants);

  // Add care activities
  await db.careActivities.bulkAdd(garden.careActivities);

  // Add tasks
  await db.scheduledTasks.bulkAdd(garden.tasks);

  return garden;
};

/**
 * Set up a clean test environment with fresh data
 */
export const setupTestEnvironment = async () => {
  await clearTestDatabase();
  return await seedTestDatabase();
};

// Re-export factory functions for convenience
export {
  createMockVariety,
  createMockPlant,
  createMockCareActivity,
  createMockGarden,
  createMockUser,
} from "./testDataFactories";
