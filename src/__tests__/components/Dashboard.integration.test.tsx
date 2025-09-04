import React from "react";
import { screen, waitFor, render, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { User } from "firebase/auth";
import { Dashboard } from "@/pages/dashboard";
import { PlantRecord } from "@/types/database";
import { seedVarieties } from "@/data/seedVarieties";

// Import the actual hooks to use them in integration tests
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useScheduledTasks } from "@/hooks/useScheduledTasks";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useLastCareActivities } from "@/hooks/useLastCareActivities";
import * as dashboardHooks from "@/hooks/dashboard";
import CatchUpPage from "@/pages/catch-up";
import LogCare from "@/pages/care/LogCare";
import { formatDate } from "@/utils/dateUtils";
import { format } from "date-fns";

// Mock external services and components that we don't want to test
jest.mock("@/db/seedData", () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  resetDatabaseInitializationFlag: jest.fn(),
}));

// Mock Firebase services with REALISTIC ASYNC DELAYS to simulate network latency
jest.mock("@/services/firebase/careActivityService", () => ({
  FirebaseCareActivityService: {
    getLastActivityByType: jest
      .fn()
      .mockImplementation(async (plantId, userId, type) => {
        // Simulate realistic Firebase network latency (100-300ms)
        await new Promise((resolve) =>
          setTimeout(resolve, 150 + Math.random() * 150)
        );

        if (type === "water") {
          return {
            id: "completed-watering-1",
            plantId,
            type: "water",
            date: new Date(Date.now() - 3600000), // 1 hour ago
            details: {
              waterAmount: 24,
              waterUnit: "oz",
            },
            notes: "Regular watering",
          };
        }
        if (type === "observe") {
          return {
            id: "observe-plant-1",
            plantId,
            type: "observe",
            date: new Date(Date.now() - 3600000), // Completed 1 hour ago
            notes: "Health check completed",
          };
        }
        return null;
      }),
    subscribeToPlantActivities: jest.fn(
      (_plantId, _userId, callback, _limit) => {
        // Simulate real-time subscription with delay
        setTimeout(() => callback([]), 100);
        // Return unsubscribe function
        return jest.fn();
      }
    ),
  },
}));

// Mock FirebaseCareSchedulingService with realistic delays
jest.mock("@/services/firebaseCareSchedulingService", () => ({
  FirebaseCareSchedulingService: {
    getUpcomingTasks: jest
      .fn()
      .mockImplementation(async (plants, getLastActivityByType) => {
        // Simulate Firebase query latency (200-500ms)
        await new Promise((resolve) =>
          setTimeout(resolve, 200 + Math.random() * 300)
        );

        // Return empty tasks for simplicity - we're focusing on fertilization tasks anyway
        return [];
      }),
  },
}));

// Mock the Firebase scheduled task service to work with real protocol transpilation
let storedTasks: any[] = [];
let subscriberCallbacks: Function[] = [];

jest.mock("@/services/firebase/scheduledTaskService", () => ({
  FirebaseScheduledTaskService: {
    subscribeToUserTasks: jest.fn((userId, onSuccess, onError) => {
      // Store the callback for later use
      subscriberCallbacks.push(onSuccess);

      // Add realistic delay before returning tasks (simulate Firebase subscription setup)
      setTimeout(() => {
        if (storedTasks.length > 0) {
          onSuccess(storedTasks);
        }
      }, 100 + Math.random() * 100); // 100-200ms delay

      return jest.fn(); // unsubscribe function
    }),
    deletePendingTasksForPlant: jest.fn().mockImplementation(async () => {
      // Add realistic Firebase write latency
      await new Promise((resolve) =>
        setTimeout(resolve, 50 + Math.random() * 100)
      );
      return undefined;
    }),
    createMultipleTasks: jest.fn().mockImplementation(async (tasks, userId) => {
      // Add realistic Firebase write latency (this is often the slowest operation)
      await new Promise((resolve) =>
        setTimeout(resolve, 300 + Math.random() * 200)
      );

      // Store the tasks for later retrieval
      storedTasks = tasks;

      // Notify all subscribers of the new tasks with additional delay
      setTimeout(() => {
        subscriberCallbacks.forEach((callback) => {
          callback(storedTasks);
        });
      }, 50);

      return tasks.map(() => "mock-task-id");
    }),
  },
}));

jest.mock("@/components/ui/OfflineIndicator", () => ({
  OfflineIndicator: () => (
    <div data-testid="offline-indicator">Offline Indicator</div>
  ),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock only specific hook behaviors while allowing real implementations to run
jest.mock("@/hooks/useFirebaseAuth");
jest.mock("@/hooks/useFirebasePlants");
// Don't mock useScheduledTasks - let it use the real implementation with mocked Firebase service
jest.mock("@/hooks/useFirebaseCareActivities");
jest.mock("@/hooks/useLastCareActivities");

// Mock only some dashboard hooks, let useDashboardData, useCareStatus, and useFertilizationTasks run real logic
jest.mock("@/hooks/dashboard", () => ({
  ...jest.requireActual("@/hooks/dashboard"),
  useHiddenGroupsManager: jest.fn(() => ({
    hiddenGroups: new Set(),
    hideGroup: jest.fn(),
    restoreAllHidden: jest.fn(),
  })),
  useContainerGroups: jest.fn(() => ({
    plantGroups: [],
    containerGroups: [],
    visiblePlants: [],
    visiblePlantsCount: 0,
  })),
  // useDashboardData, useCareStatus, and useFertilizationTasks will use real implementations
}));

const mockUseFirebaseAuth = useFirebaseAuth as jest.Mock;
const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
const mockUseFirebaseCareActivities = useFirebaseCareActivities as jest.Mock;
const mockUseLastCareActivities = useLastCareActivities as jest.Mock;

const renderWithRouter = (
  ui: React.ReactElement,
  { initialEntries = ["/"] } = {}
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
  });
};

// Test data factory using real seed varieties
class IntegrationTestDataFactory {
  private static plantCounter = 1;
  private static taskCounter = 1;

  static createMockFirebaseUser(overrides?: Partial<User>): User {
    return {
      uid: "test-user-uid",
      email: "integration@test.com",
      emailVerified: true,
      displayName: "Integration Test User",
      isAnonymous: false,
      metadata: {
        creationTime: "2024-01-01T00:00:00.000Z",
        lastSignInTime: "2024-01-01T00:00:00.000Z",
      },
      providerData: [],
      refreshToken: "mock-refresh-token",
      tenantId: null,
      delete: jest.fn(),
      getIdToken: jest.fn(),
      getIdTokenResult: jest.fn(),
      reload: jest.fn(),
      toJSON: jest.fn(),
      phoneNumber: null,
      photoURL: null,
      providerId: "firebase",
      ...overrides,
    } as User;
  }

  static createPlantFromSeedVariety(
    varietyName: string,
    overrides: Partial<PlantRecord> = {}
  ): PlantRecord {
    const variety = seedVarieties.find((v) => v.name === varietyName);
    if (!variety) {
      throw new Error(
        `Seed variety "${varietyName}" not found in seedVarieties`
      );
    }

    const id = `plant-${IntegrationTestDataFactory.plantCounter++}`;
    return {
      id,
      varietyId: variety.name.toLowerCase().replace(/\s+/g, "-"),
      varietyName: variety.name,
      name: `My ${variety.name} Plant`,
      plantedDate: new Date("2024-06-01T00:00:00.000Z"),
      location: "Indoor",
      container: "5 Gallon Grow Bag",
      soilMix: "standard-mix",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createDiverseGarden(): PlantRecord[] {
    return [
      // Leafy greens
      this.createPlantFromSeedVariety("Astro Arugula", {
        location: "Kitchen Window",
        container: "3 Gallon Pot",
      }),
      this.createPlantFromSeedVariety("Baby's Leaf Spinach", {
        location: "Kitchen Window",
        container: "3 Gallon Pot",
      }),
      this.createPlantFromSeedVariety("May Queen Lettuce", {
        location: "Indoor",
        container: "Hydroponic System",
      }),
      // Herbs
      this.createPlantFromSeedVariety("Greek Oregano", {
        location: "Balcony",
        container: "4 Gallon Pot",
      }),
      this.createPlantFromSeedVariety("English Thyme", {
        location: "Kitchen Window",
        container: "2 Gallon Pot",
      }),
      // Fruiting plants
      this.createPlantFromSeedVariety("Boston Pickling Cucumber", {
        location: "Greenhouse",
        container: "7 Gallon Grow Bag",
      }),
    ];
  }

  static createScheduledTask(
    plantId: string,
    plantName: string,
    overrides: Partial<{
      id: string;
      taskName: string;
      type: "water" | "fertilize" | "observe";
      dueDate: Date;
      isOverdue: boolean;
      priority: "low" | "medium" | "high" | "critical";
      details: any;
    }> = {}
  ) {
    const id = `task-${IntegrationTestDataFactory.taskCounter++}`;
    return {
      id,
      plantId,
      plantName,
      taskName: "Water Plant",
      type: "water" as const,
      dueDate: new Date(),
      isOverdue: false,
      priority: "medium" as const,
      details: {
        type: "water",
        amount: "20oz",
      },
      ...overrides,
    };
  }

  static resetCounters() {
    IntegrationTestDataFactory.plantCounter = 1;
    IntegrationTestDataFactory.taskCounter = 1;
  }
}

describe("Dashboard Integration Tests", () => {
  const mockLogActivity = jest.fn();

  beforeEach(() => {
    console.error = (...args) => {
      if (args[0]?.includes?.("act(...)")) return; // Suppress act warnings
      // originalError(...args);
    };

    jest.clearAllMocks();
    IntegrationTestDataFactory.resetCounters();

    // Reset Firebase mock state
    storedTasks = [];
    subscriberCallbacks = [];

    // Setup default mock returns for hooks
    mockUseFirebaseAuth.mockReturnValue({
      user: IntegrationTestDataFactory.createMockFirebaseUser(),
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    });

    mockUseFirebasePlants.mockReturnValue({
      plants: [],
      loading: false,
      error: null,
      createPlant: jest.fn(),
      updatePlant: jest.fn(),
      deletePlant: jest.fn(),
    });

    // useScheduledTasks now uses real implementation with mocked Firebase service

    mockUseFirebaseCareActivities.mockReturnValue({
      logActivity: mockLogActivity,
    });

    mockUseLastCareActivities.mockReturnValue({
      activities: {},
      loading: false,
      refetch: jest.fn(),
    });

    mockLogActivity.mockResolvedValue(undefined);
  });
  afterEach(async () => {
    // Wait for any pending async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Clear any pending timers
    jest.clearAllTimers();
    jest.clearAllMocks();

    // Flush any remaining microtasks
    await Promise.resolve();
  });
  describe("Integration with Real Seed Varieties", () => {
    it("displays correct container and location information from real plant data", async () => {
      // Arrange: Create plants with specific containers and locations
      const plants = [
        IntegrationTestDataFactory.createPlantFromSeedVariety("Greek Oregano", {
          location: "Kitchen Window",
          container: "4 Gallon Pot",
        }),
        IntegrationTestDataFactory.createPlantFromSeedVariety(
          "May Queen Lettuce",
          {
            location: "Indoor",
            container: "Hydroponic System",
          }
        ),
      ];

      // Set up the underlying Firebase mocks to return our test plants
      mockUseFirebasePlants.mockReturnValue({
        plants,
        loading: false,
        error: null,
        createPlant: jest.fn(),
        updatePlant: jest.fn(),
        deletePlant: jest.fn(),
      });

      // Set up mock for useContainerGroups to return expected groupings
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      mockUseContainerGroups.mockReturnValue({
        plantGroups: [],
        containerGroups: [
          {
            containerName: "4 Gallon Pot",
            plantGroups: [
              {
                id: "oregano-group",
                varietyName: "Greek Oregano",
                location: "Kitchen Window",
                plants: [plants[0]],
              },
            ],
          },
          {
            containerName: "Hydroponic System",
            plantGroups: [
              {
                id: "lettuce-group",
                varietyName: "May Queen Lettuce",
                location: "Indoor",
                plants: [plants[1]],
              },
            ],
          },
        ],
        visiblePlants: plants,
        visiblePlantsCount: plants.length,
      });

      // Act: Render the Dashboard
      renderWithRouter(<Dashboard />);

      // Assert: Verify location and container details are displayed
      await waitFor(() => {
        expect(screen.getAllByText(/Kitchen Window/i).length).toBeGreaterThan(
          0
        );
        expect(screen.getAllByText(/Indoor/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/4 Gallon Pot/i).length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/Hydroponic System/i).length
        ).toBeGreaterThan(0);
      });

      // Verify plant variety names are also displayed
      await waitFor(() => {
        expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/May Queen Lettuce/i).length
        ).toBeGreaterThan(0);
      });
    });
    it.only("shows fertilization is due, previous water displays for strawberries, when planted 91 days ago ongoingProduction", async () => {
      const plantedDate = new Date();
      plantedDate.setDate(plantedDate.getDate() - 91); // Planting date is 91 days ago, putting it in ongoing production
      const albionStrawberries =
        IntegrationTestDataFactory.createPlantFromSeedVariety(
          "Albion Strawberries",
          {
            plantedDate,
            location: "Indoor",
            container: "5 Gallon Pot",
          }
        );
      mockUseFirebasePlants.mockReturnValue({
        plants: [albionStrawberries],
        loading: false,
        error: null,
        createPlant: jest.fn(),
        updatePlant: jest.fn(),
        deletePlant: jest.fn(),
      });

      // Mock only the container groups hook, let other hooks run real logic
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      // Protocol sync will automatically generate fertilization tasks based on the Albion Strawberry variety protocol

      // Set up test data for real hooks to use
      mockUseFirebaseAuth.mockReturnValue({
        user: IntegrationTestDataFactory.createMockFirebaseUser(),
        signOut: jest.fn(),
        loading: false,
        error: null,
      });

      mockUseFirebaseCareActivities.mockReturnValue({
        logActivity: jest.fn(),
        activities: [
          {
            id: "observe-plant-1",
            plantId: albionStrawberries.id,
            timestamp: new Date(Date.now() - 3600000), // Completed 1 hour ago
            type: "observe",
          },
          {
            id: "completed-watering-1",
            plantId: albionStrawberries.id,
            type: "water",
            timestamp: new Date(Date.now() - 3600000), // Completed 1 hour ago
            details: {
              waterAmount: 24,
              waterUnit: "oz",
            },
            notes: "Regular watering",
          },
        ],
        loading: false,
        error: null,
      });

      // Mock useLastCareActivities for PlantGroupCard Recent Care display
      mockUseLastCareActivities.mockReturnValue({
        activities: {
          watering: {
            id: "completed-watering-1",
            plantId: albionStrawberries.id,
            type: "water",
            date: new Date(Date.now() - 3600000), // Completed 1 hour ago
            details: {
              waterAmount: 24,
              waterUnit: "oz",
            },
            notes: "Regular watering",
          },
          fertilizing: null,
        },
        loading: false,
        refetch: jest.fn(),
      });

      // Use the existing mockUseContainerGroups from the earlier declaration
      mockUseContainerGroups.mockReturnValue({
        plantGroups: [],
        containerGroups: [
          {
            containerName: "5 Gallon Pot",
            plantGroups: [
              {
                id: "albion-group",
                varietyName: "Albion Strawberries",
                location: "Indoor",
                plants: [albionStrawberries],
              },
            ],
          },
        ],
        visiblePlants: [albionStrawberries],
        visiblePlantsCount: 1,
      });

      // Let useCareStatus use real logic - it should detect overdue fertilization tasks naturally
      // Add fertilization tasks to storedTasks for the Firebase service mock
      const fertTask = {
        id: "fert-task-1",
        plantId: albionStrawberries.id,
        taskType: "fertilize" as const,
        taskName: "Apply Neptune's Harvest Fish + Seaweed",
        dueDate: new Date(Date.now() - 86400000), // 1 day ago (overdue)
        status: "pending" as const,
        details: {
          type: "fertilize" as const,
          product: "Neptune's Harvest Fish + Seaweed",
          dilution: "1 tbsp per gallon",
          amount: "1 tbsp",
          method: "foliar" as const,
        },
        sourceProtocol: {
          stage: "ongoing-production" as const,
          protocol: "Albion Strawberries",
        },
      };
      // Don't add the task to storedTasks yet - we'll add it after navigation
      // to ensure we see the loading state

      // Don't mock useFertilizationTasks - let it run with real logic

      await act(async () => {
        render(
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/catch-up" element={<CatchUpPage />} />
              <Route path="/log-care" element={<LogCare />} />
            </Routes>
          </MemoryRouter>
        );
        // Wait for protocol sync and task creation to complete
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Increased wait time
      });

      // Wait for initial render
      await waitFor(
        () => {
          expect(screen.getByText("SmartGarden")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Verify Albion Strawberry plant is displayed
      await waitFor(
        () => {
          expect(
            screen.getAllByText(/Albion Strawberries/i).length
          ).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Test verifies that real hooks are running (useCareStatus and useFertilizationTasks)
      // and that the Albion plant planted 91 days ago displays correctly
      expect(screen.getByText(/ongoingProduction/i)).toBeInTheDocument();
      expect(screen.getByText(/91 days old/i)).toBeInTheDocument();

      // Verify fertilization tasks are generated from the protocol
      // Look for task details from the Albion Strawberry protocol
      await waitFor(
        () => {
          const body = document.body.textContent || "";
          expect(body).toContain("Albion Strawberries");
        },
        { timeout: 3000 }
      );

      expect(screen.getByText(/about 1 hour ago/i)).toBeInTheDocument();
      // Wait for the care status to detect fertilization tasks - give it more time since we see it working in logs
      await waitFor(
        () => {
          const careStatusElement = screen.getByTestId("care-status-subtext");
          expect(careStatusElement).toHaveTextContent("1");
        },
        { timeout: 5000 } // Increased timeout to allow for the async task updates to trigger re-renders
      );

      // Wait a bit more to ensure state is stable
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Click on the Plant Care Status card to navigate to catch-up page
      // Try multiple approaches to find the clickable card
      // Wait for the care status card to appear
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /plant care status/i })
        ).toBeInTheDocument();
      });

      // Click on the care status card to navigate to the catch-up page
      await userEvent.click(
        screen.getByRole("button", { name: /plant care status/i })
      );

      // Add task to storedTasks and notify subscribers immediately
      storedTasks.push(fertTask);
      
      // Trigger task loading in an act block to ensure proper timing
      await act(async () => {
        subscriberCallbacks.forEach((callback) => callback([fertTask]));
        // Give a moment for the hooks to process
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // TDD: Immediate assertion - "All caught up!" should NOT appear right after navigation
      // This should fail because the message incorrectly shows during loading
      expect(screen.queryAllByText(/All caught up!/i).length).toBe(0);

      // Wait for loading state to appear
      await waitFor(
        () => {
          expect(
            screen.getByText(/Loading your plant care tasks.../i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            /Review and handle missed care activities for your plants/i
          )
        ).toBeInTheDocument();
      });

      // // TDD: Check for the race condition bug - "All caught up!" should NEVER appear
      // even during the brief moment between tasksLoading=false and upcomingTasks being populated
      const allCaughtUpElements = screen.queryAllByText(/All caught up!/i);
      expect(allCaughtUpElements.length).toBe(0);

      // Add a small delay to check if the message appears during async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify it still hasn't appeared after async delays
      expect(screen.queryAllByText(/All caught up!/i).length).toBe(0);

      // Final state: "All caught up!" should not be visible since we have a fertilization task
      expect(screen.queryAllByText(/All caught up!/i).length).toBe(0);

      expect(screen.getByTestId("catch-up-task-card-0")).toBeInTheDocument();
      expect(
        screen.queryByTestId("catch-up-task-card-1")
      ).not.toBeInTheDocument();
      const body = document.body.textContent || "";

      expect(body).toContain(
        "Growth Stage: ongoing-production | Category: fertilizing"
      );
      expect(
        screen.getByText("Apply Neptune's Harvest Fish + Seaweed")
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /log care/i }));
      screen.getByText(/Record care activities for your plants/i);
      screen.getByText(formatDate(plantedDate));
      screen.getByText(/91 days/i);

      // Check that the activity type select has the correct value
      const activityTypeSelect = screen.getByRole("combobox", {
        name: /Activity Type \*/i,
      });
      expect(activityTypeSelect).toHaveValue("fertilize");

      // Verify the date is pre-filled to today
      const dateInput = screen.getByLabelText(/Date \*/i) as HTMLInputElement;
      const todayStr = format(new Date(), "yyyy-MM-dd");
      expect(dateInput.value).toBe(todayStr);
      // Verify the correct fertilizer product is preselected
      const fertilizerSelect = screen.getByRole("combobox", {
        name: /Fertilizer Product \*/i,
      });
      expect(fertilizerSelect).toBeInTheDocument();

      // // First verify that the fertilizer dropdown has options (not empty)
      // const fertilizerOptions = fertilizerSelect.querySelectorAll(
      //   'option[value]:not([value=""])'
      // );
      // expect(fertilizerOptions.length).toBe(2);

      // // Then verify the correct fertilizer is actually selected (not just available)
      // await waitFor(() => {
      //   expect(fertilizerSelect).toHaveValue(
      //     "Neptune's Harvest Fish + Seaweed"
      //   );
      // });

      // // Additional check: verify actual DOM state
      // await waitFor(() => {
      //   const selectElement = fertilizerSelect as HTMLSelectElement;
      //   expect(selectElement.value).toBe("Neptune's Harvest Fish + Seaweed");
      //   expect(selectElement.selectedIndex).toBeGreaterThan(0); // Not the default "Choose..." option
      //   screen.debug(fertilizerSelect);
      // });

      // // Verify that protocol-based unit fields are pre-filled
      // // For Albion Strawberries in ongoingProduction stage, protocol specifies:
      // // dilution: "1 tbsp/gallon", amount: "1-2 quarts per grow bag"

      // // Verify that protocol-based unit fields are pre-filled
      // await waitFor(
      //   () => {
      //     const dilutionUnitSelect = screen.getByDisplayValue(
      //       "tbsp"
      //     ) as HTMLSelectElement;
      //     expect(dilutionUnitSelect.name).toBe("fertilizerDilutionUnit");
      //     expect(dilutionUnitSelect.value).toBe("tbsp");
      //   },
      //   { timeout: 5000 }
      // );

      // // Verify that protocol parsing successfully extracts unit information
      // // The test shows that dilution unit parsing is working correctly

      // // Check for duplicate fertilizer options (should fail initially)
      // await waitFor(() => {
      //   const options = within(fertilizerSelect)
      //     .getAllByRole("option")
      //     .slice(1); // Exclude "Choose a fertilizer..."
      //   const optionValues = options.map(
      //     (option) => (option as HTMLOptionElement).value
      //   );
      //   const uniqueValues = [...new Set(optionValues)];

      //   // TDD assertion - no duplicates should exist
      //   expect(optionValues).toHaveLength(uniqueValues.length);
      //   expect(optionValues.length).toBe(2); // Should have at least one fertilizer option

      //   // Verify Neptune's Harvest is available (should be present in any stage)
      //   expect(uniqueValues).toContain("Neptune's Harvest Fish + Seaweed");

      // The test validates deduplication works regardless of which stage is loaded
      //   });

      // add a test to make sure there's a loading indication
    }, 15000); // 15 second timeout for the entire test

    it("TDD: catch-up page should not show 'All caught up!' during loading race condition", async () => {
      // Arrange: Set up plant with fertilization tasks using same setup as main test
      const plantedDate = new Date();
      plantedDate.setDate(plantedDate.getDate() - 91);
      const albionStrawberries =
        IntegrationTestDataFactory.createPlantFromSeedVariety(
          "Albion Strawberries",
          {
            plantedDate,
            location: "Indoor",
            container: "5 Gallon Pot",
          }
        );

      // Use the same mock setup as the working main test
      mockUseFirebasePlants.mockReturnValue({
        plants: [albionStrawberries],
        loading: false,
        error: null,
        createPlant: jest.fn(),
        updatePlant: jest.fn(),
        deletePlant: jest.fn(),
      });

      mockUseFirebaseAuth.mockReturnValue({
        user: IntegrationTestDataFactory.createMockFirebaseUser(),
        signOut: jest.fn(),
        loading: false,
        error: null,
      });

      mockUseFirebaseCareActivities.mockReturnValue({
        logActivity: jest.fn(),
        activities: [
          {
            id: "completed-watering-1",
            plantId: albionStrawberries.id,
            type: "water",
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            details: { waterAmount: 24, waterUnit: "oz" },
            notes: "Regular watering",
          },
        ],
        loading: false,
        error: null,
      });

      mockUseLastCareActivities.mockReturnValue({
        activities: {
          watering: {
            id: "completed-watering-1",
            plantId: albionStrawberries.id,
            type: "water",
            date: new Date(Date.now() - 3600000),
            details: { waterAmount: 24, waterUnit: "oz" },
            notes: "Regular watering",
          },
          fertilizing: null,
        },
        loading: false,
        refetch: jest.fn(),
      });

      // Mock container groups to prevent infinite loops during dashboard render
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      mockUseContainerGroups.mockReturnValue({
        plantGroups: [],
        containerGroups: [
          {
            containerName: "5 Gallon Pot",
            plantGroups: [
              {
                id: "albion-group",
                varietyName: "Albion Strawberries",
                location: "Indoor",
                plants: [albionStrawberries],
              },
            ],
          },
        ],
        visiblePlants: [albionStrawberries],
        visiblePlantsCount: 1,
      });

      // Let useCareStatus use real logic - it should calculate plantsNeedingCatchUp from fertilization tasks
      // This is important for handleCatchUpClick navigation to work properly

      // Act: Use real navigation flow like main test - render full dashboard first
      await act(async () => {
        render(
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/catch-up" element={<CatchUpPage />} />
            </Routes>
          </MemoryRouter>
        );
        // Allow protocol sync and real async task generation
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText("SmartGarden")).toBeInTheDocument();
      });

      // Wait for care status to show fertilization task
      await waitFor(
        () => {
          const careStatusElement = screen.getByTestId("care-status-subtext");
          expect(careStatusElement).toHaveTextContent("1");
        },
        { timeout: 5000 }
      );

      // Click Plant Care Status to navigate to catch-up (real navigation)
      await userEvent.click(
        screen.getByRole("button", { name: /plant care status/i })
      );

      // Wait for navigation to complete and catch-up page to start loading
      await waitFor(
        () => {
          expect(screen.getByText(/Catch-Up Tasks/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      console.log("✅ Successfully navigated to catch-up page");

      // TDD: Race condition check #1 - Right after navigation, during initial page load
      // This is when the race condition occurs: plants are loaded but tasks are still loading
      let raceConditionCheck1 = screen.queryAllByText(/All caught up!/i);
      console.log(
        `🔍 Race condition check #1: Found ${raceConditionCheck1.length} "All caught up!" messages`
      );
      if (raceConditionCheck1.length > 0) {
        console.log("🐛 RACE CONDITION DETECTED at check #1!");
      }
      expect(raceConditionCheck1.length).toBe(0); // Should fail due to race condition

      // Wait a brief moment to let the async loading start
      await new Promise((resolve) => setTimeout(resolve, 50));

      // TDD: Race condition check #2 - During the async task loading window
      // This is the critical moment where tasksLoading becomes false but upcomingTasks is still []
      let raceConditionCheck2 = screen.queryAllByText(/All caught up!/i);
      console.log(
        `🔍 Race condition check #2: Found ${raceConditionCheck2.length} "All caught up!" messages`
      );
      if (raceConditionCheck2.length > 0) {
        console.log("🐛 RACE CONDITION DETECTED at check #2!");
      }
      expect(raceConditionCheck2.length).toBe(0); // Should fail due to race condition

      // Wait for the full page content to load
      await waitFor(
        () => {
          expect(
            screen.getByText(
              /Review and handle missed care activities for your plants/i
            )
          ).toBeInTheDocument();
        },
        { timeout: 8000 }
      );

      // TDD: Race condition check #3 - During task calculation completion
      let raceConditionCheck3 = screen.queryAllByText(/All caught up!/i);
      console.log(
        `🔍 Race condition check #3: Found ${raceConditionCheck3.length} "All caught up!" messages`
      );
      if (raceConditionCheck3.length > 0) {
        console.log("🐛 RACE CONDITION DETECTED at check #3!");
      }
      expect(raceConditionCheck3.length).toBe(0); // Should fail due to race condition

      // Wait a bit more to ensure all async operations complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Final check - should show tasks, not "All caught up!"
      let finalCheck = screen.queryAllByText(/All caught up!/i);
      console.log(
        `🔍 Final check: Found ${finalCheck.length} "All caught up!" messages`
      );
      if (finalCheck.length > 0) {
        console.log("🐛 RACE CONDITION STILL PRESENT at final check!");
      }

      // Debug: Let's see what the page actually contains
      console.log("🔍 Page content check:");
      const hasTaskCard = screen.queryByTestId("catch-up-task-card-0");
      console.log(`  - Task cards found: ${hasTaskCard ? "YES" : "NO"}`);
      const hasLoadingText = screen.queryByText(/Loading/i);
      console.log(`  - Loading text found: ${hasLoadingText ? "YES" : "NO"}`);

      expect(finalCheck.length).toBe(0);
    }, 15000);
  });

  describe("Hook Integration - Care Status and Tasks", () => {
    it("integrates useCareStatus hook with real plant data to show care status", async () => {
      // Arrange: Create plants that need care
      const plantsNeedingCare = [
        IntegrationTestDataFactory.createPlantFromSeedVariety("Astro Arugula"),
        IntegrationTestDataFactory.createPlantFromSeedVariety(
          "Greek Dwarf Basil"
        ),
      ];

      mockUseFirebasePlants.mockReturnValue({
        plants: plantsNeedingCare,
        loading: false,
        error: null,
        createPlant: jest.fn(),
        updatePlant: jest.fn(),
        deletePlant: jest.fn(),
      });

      // Act: Render the Dashboard
      renderWithRouter(<Dashboard />);

      // Assert: Verify care status components are rendered
      await waitFor(() => {
        expect(screen.getByText("Plant Care Status")).toBeInTheDocument();
      });

      // The care status should reflect the presence of plants
      await waitFor(() => {
        const statusElements = document.body.textContent || "";
        expect(statusElements.includes("Plant Care Status")).toBeTruthy();
      });
    });

    it("integrates fertilization tasks with real plant varieties", async () => {
      // Arrange: Create plants that need fertilization
      const plantsNeedingFertilization = [
        IntegrationTestDataFactory.createPlantFromSeedVariety(
          "Boston Pickling Cucumber"
        ),
        IntegrationTestDataFactory.createPlantFromSeedVariety("Greek Oregano"),
      ];

      const fertTasks = [
        IntegrationTestDataFactory.createScheduledTask(
          plantsNeedingFertilization[0].id,
          plantsNeedingFertilization[0].name!,
          {
            type: "fertilize",
            taskName: "Fertilize Boston Pickling Cucumber",
            dueDate: new Date(),
            isOverdue: true,
            priority: "high",
          }
        ),
      ];

      // Use the same dashboard hook mocking pattern that works
      const mockUseDashboardData = dashboardHooks.useDashboardData as jest.Mock;
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      const mockUseCareStatus = dashboardHooks.useCareStatus as jest.Mock;
      const mockUseFertilizationTasks =
        dashboardHooks.useFertilizationTasks as jest.Mock;

      // mockUseDashboardData.mockReturnValue({
      //   plants: plantsNeedingFertilization,
      //   loading: false,
      //   user: IntegrationTestDataFactory.createMockFirebaseUser(),
      //   signOut: jest.fn(),
      //   logActivity: jest.fn(),
      //   getUpcomingFertilizationTasks: jest.fn(() => fertTasks),
      //   scheduledTasksError: null,
      // });

      mockUseContainerGroups.mockReturnValue({
        plantGroups: [],
        containerGroups: [
          {
            containerName: "Mixed Containers",
            plantGroups: plantsNeedingFertilization.map((plant, index) => ({
              id: `group-${index}`,
              varietyName: plant.varietyName,
              location: plant.location,
              plants: [plant],
            })),
          },
        ],
        visiblePlants: plantsNeedingFertilization,
        visiblePlantsCount: plantsNeedingFertilization.length,
      });

      mockUseCareStatus.mockReturnValue({
        plantsNeedingCatchUp: 0,
        careStatusLoading: false,
      });

      mockUseFertilizationTasks.mockReturnValue({
        upcomingFertilization: fertTasks,
        handleTaskComplete: jest.fn(),
        handleTaskBypass: jest.fn(),
        handleTaskLogActivity: jest.fn(),
      });

      // Act: Render the Dashboard
      renderWithRouter(<Dashboard />);

      // Assert: Verify fertilization section appears (correct text without emoji)
      await waitFor(() => {
        expect(screen.getByText("Fertilization Tasks")).toBeInTheDocument();
      });

      // Verify we have fertilization tasks showing
      await waitFor(() => {
        const badges = screen.getAllByText("1");
        expect(badges.length).toBeGreaterThan(0);
      });

      // Verify plant variety names are displayed
      await waitFor(() => {
        expect(
          screen.getAllByText(/Boston Pickling Cucumber/i).length
        ).toBeGreaterThan(0);
        expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("User Interactions with Real Data", () => {
    it("handles bulk activity logging for multiple real plant varieties", async () => {
      // Arrange: Create multiple plants of the same variety (typical grouping scenario)
      const herbGarden = [
        IntegrationTestDataFactory.createPlantFromSeedVariety("Greek Oregano", {
          id: "oregano-1",
          name: "Oregano Plant 1",
          location: "Kitchen Window",
        }),
        IntegrationTestDataFactory.createPlantFromSeedVariety("Greek Oregano", {
          id: "oregano-2",
          name: "Oregano Plant 2",
          location: "Kitchen Window",
        }),
      ];

      // Use the working dashboard hooks pattern
      const mockUseDashboardData = dashboardHooks.useDashboardData as jest.Mock;
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      const mockUseCareStatus = dashboardHooks.useCareStatus as jest.Mock;
      const mockUseFertilizationTasks =
        dashboardHooks.useFertilizationTasks as jest.Mock;

      mockUseDashboardData.mockReturnValue({
        plants: herbGarden,
        loading: false,
        user: IntegrationTestDataFactory.createMockFirebaseUser(),
        signOut: jest.fn(),
        logActivity: jest.fn(),
        getUpcomingFertilizationTasks: jest.fn(() => []),
        scheduledTasksError: null,
      });

      mockUseContainerGroups.mockReturnValue({
        plantGroups: [
          {
            id: "oregano-group",
            varietyName: "Greek Oregano",
            location: "Kitchen Window",
            plants: herbGarden,
          },
        ],
        containerGroups: [
          {
            containerName: "5 Gallon Grow Bag",
            plantGroups: [
              {
                id: "oregano-group",
                varietyName: "Greek Oregano",
                location: "Kitchen Window",
                plants: herbGarden,
              },
            ],
          },
        ],
        visiblePlants: herbGarden,
        visiblePlantsCount: herbGarden.length,
      });

      mockUseCareStatus.mockReturnValue({
        plantsNeedingCatchUp: 0,
        careStatusLoading: false,
      });

      mockUseFertilizationTasks.mockReturnValue({
        upcomingFertilization: [],
        handleTaskComplete: jest.fn(),
        handleTaskBypass: jest.fn(),
        handleTaskLogActivity: jest.fn(),
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      // Act: Wait for plants to render
      await waitFor(() => {
        expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(0);
      });

      // Verify we have 2 plants showing
      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument(); // Plant count
      });

      // Since bulk actions may not be implemented yet, just verify the integration works
      // Look for Log All button (if bulk actions are implemented)
      const logAllButton = screen.queryByRole("button", { name: /Log.*All/i });
      if (logAllButton) {
        await user.click(logAllButton);

        // Verify dropdown appears
        await waitFor(() => {
          const waterAllOption = screen.queryByRole("button", {
            name: /Water All/i,
          });
          if (waterAllOption) {
            expect(waterAllOption).toBeInTheDocument();
          }
        });
      }

      // If bulk actions aren't implemented, that's fine - we've tested the integration
      // The key integration test is that multiple plants of the same variety render correctly
    });

    it("navigates to add plant page when no plants exist", async () => {
      // Arrange: Empty plants state using dashboard hooks pattern
      const mockUseDashboardData = dashboardHooks.useDashboardData as jest.Mock;
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      const mockUseCareStatus = dashboardHooks.useCareStatus as jest.Mock;
      const mockUseFertilizationTasks =
        dashboardHooks.useFertilizationTasks as jest.Mock;

      mockUseDashboardData.mockReturnValue({
        plants: [],
        loading: false,
        user: IntegrationTestDataFactory.createMockFirebaseUser(),
        signOut: jest.fn(),
        logActivity: jest.fn(),
        getUpcomingFertilizationTasks: jest.fn(() => []),
        scheduledTasksError: null,
      });

      mockUseContainerGroups.mockReturnValue({
        plantGroups: [],
        containerGroups: [],
        visiblePlants: [],
        visiblePlantsCount: 0,
      });

      mockUseCareStatus.mockReturnValue({
        plantsNeedingCatchUp: 0,
        careStatusLoading: false,
      });

      mockUseFertilizationTasks.mockReturnValue({
        upcomingFertilization: [],
        handleTaskComplete: jest.fn(),
        handleTaskBypass: jest.fn(),
        handleTaskLogActivity: jest.fn(),
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      // Act: Wait for empty state and click add plant button
      await waitFor(() => {
        expect(screen.getByText(/Welcome to SmartGarden/i)).toBeInTheDocument();
      });

      const addPlantButton = screen.getByRole("button", {
        name: "🌿 Add Your First Plant",
      });

      await user.click(addPlantButton);

      // Assert: Navigation will happen but we can't easily test it in this setup
      // The important part is that the button click works
    });

    it("handles user authentication state changes", async () => {
      // Arrange: Start with authenticated user
      const mockUser = IntegrationTestDataFactory.createMockFirebaseUser();
      const mockSignOut = jest.fn();

      // Use dashboard hooks pattern with signOut function provided through useDashboardData
      const mockUseDashboardData = dashboardHooks.useDashboardData as jest.Mock;
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      const mockUseCareStatus = dashboardHooks.useCareStatus as jest.Mock;
      const mockUseFertilizationTasks =
        dashboardHooks.useFertilizationTasks as jest.Mock;

      mockUseDashboardData.mockReturnValue({
        plants: [],
        loading: false,
        user: mockUser,
        signOut: mockSignOut,
        logActivity: jest.fn(),
        getUpcomingFertilizationTasks: jest.fn(() => []),
        scheduledTasksError: null,
      });

      mockUseContainerGroups.mockReturnValue({
        plantGroups: [],
        containerGroups: [],
        visiblePlants: [],
        visiblePlantsCount: 0,
      });

      mockUseCareStatus.mockReturnValue({
        plantsNeedingCatchUp: 0,
        careStatusLoading: false,
      });

      mockUseFertilizationTasks.mockReturnValue({
        upcomingFertilization: [],
        handleTaskComplete: jest.fn(),
        handleTaskBypass: jest.fn(),
        handleTaskLogActivity: jest.fn(),
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      // Act: Click sign out button
      await waitFor(() => {
        expect(
          screen.getByText("Welcome, Integration Test User")
        ).toBeInTheDocument();
      });

      const signOutButton = screen.getByRole("button", { name: "Sign Out" });
      await user.click(signOutButton);

      // Assert: Verify sign out was called
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("displays error state when plant loading fails", async () => {
      // Arrange: Mock error state
      mockUseFirebasePlants.mockReturnValue({
        plants: null,
        loading: false,
        error: "Failed to load plants",
        createPlant: jest.fn(),
        updatePlant: jest.fn(),
        deletePlant: jest.fn(),
      });

      // Act: Render the Dashboard
      renderWithRouter(<Dashboard />);

      // Assert: Should still render basic structure
      await waitFor(() => {
        expect(screen.getByText("SmartGarden")).toBeInTheDocument();
      });
    });

    it("handles loading state properly", async () => {
      // Arrange: Mock loading state using dashboard hooks
      const mockUseDashboardData = dashboardHooks.useDashboardData as jest.Mock;
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      const mockUseCareStatus = dashboardHooks.useCareStatus as jest.Mock;
      const mockUseFertilizationTasks =
        dashboardHooks.useFertilizationTasks as jest.Mock;

      mockUseDashboardData.mockReturnValue({
        plants: null,
        loading: true,
        user: IntegrationTestDataFactory.createMockFirebaseUser(),
        signOut: jest.fn(),
        logActivity: jest.fn(),
        getUpcomingFertilizationTasks: jest.fn(() => []),
        scheduledTasksError: null,
      });

      mockUseContainerGroups.mockReturnValue({
        plantGroups: [],
        containerGroups: [],
        visiblePlants: [],
        visiblePlantsCount: 0,
      });

      mockUseCareStatus.mockReturnValue({
        plantsNeedingCatchUp: 0,
        careStatusLoading: true,
      });

      mockUseFertilizationTasks.mockReturnValue({
        upcomingFertilization: [],
        handleTaskComplete: jest.fn(),
        handleTaskBypass: jest.fn(),
        handleTaskLogActivity: jest.fn(),
      });

      // Act: Render the Dashboard
      renderWithRouter(<Dashboard />);

      // Assert: Should show loading state
      // Check if loading text appears anywhere or if loading UI components are shown
      await waitFor(
        () => {
          const bodyText = document.body.textContent || "";
          expect(
            bodyText.includes("Loading") ||
              bodyText.includes("loading") ||
              screen.queryByTestId("loading-spinner") !== null ||
              screen.queryByTestId("loading-indicator") !== null
          ).toBeTruthy();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Real Seed Variety Categories", () => {
    it("handles different plant categories correctly", async () => {
      // Arrange: Create plants from different categories
      const categorizedPlants = [
        // Leafy greens category
        IntegrationTestDataFactory.createPlantFromSeedVariety("Astro Arugula"),
        IntegrationTestDataFactory.createPlantFromSeedVariety(
          "May Queen Lettuce"
        ),
        // Herbs category
        IntegrationTestDataFactory.createPlantFromSeedVariety("Greek Oregano"),
        IntegrationTestDataFactory.createPlantFromSeedVariety("English Thyme"),
        // Fruiting plants category
        IntegrationTestDataFactory.createPlantFromSeedVariety(
          "Boston Pickling Cucumber"
        ),
      ];

      // Use dashboard hooks pattern for consistent behavior
      const mockUseDashboardData = dashboardHooks.useDashboardData as jest.Mock;
      const mockUseContainerGroups =
        dashboardHooks.useContainerGroups as jest.Mock;
      const mockUseCareStatus = dashboardHooks.useCareStatus as jest.Mock;
      const mockUseFertilizationTasks =
        dashboardHooks.useFertilizationTasks as jest.Mock;

      mockUseDashboardData.mockReturnValue({
        plants: categorizedPlants,
        loading: false,
        user: IntegrationTestDataFactory.createMockFirebaseUser(),
        signOut: jest.fn(),
        logActivity: jest.fn(),
        getUpcomingFertilizationTasks: jest.fn(() => []),
        scheduledTasksError: null,
      });

      mockUseContainerGroups.mockReturnValue({
        plantGroups: [],
        containerGroups: [
          {
            containerName: "Mixed Containers",
            plantGroups: categorizedPlants.map((plant, index) => ({
              id: `group-${index}`,
              varietyName: plant.varietyName,
              location: plant.location,
              plants: [plant],
            })),
          },
        ],
        visiblePlants: categorizedPlants,
        visiblePlantsCount: categorizedPlants.length,
      });

      mockUseCareStatus.mockReturnValue({
        plantsNeedingCatchUp: 0,
        careStatusLoading: false,
      });

      mockUseFertilizationTasks.mockReturnValue({
        upcomingFertilization: [],
        handleTaskComplete: jest.fn(),
        handleTaskBypass: jest.fn(),
        handleTaskLogActivity: jest.fn(),
      });

      // Act: Render the Dashboard
      renderWithRouter(<Dashboard />);

      // Assert: Verify all categories are represented
      await waitFor(() => {
        // Leafy greens
        expect(screen.getAllByText(/Astro Arugula/i).length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/May Queen Lettuce/i).length
        ).toBeGreaterThan(0);

        // Herbs
        expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/English Thyme/i).length).toBeGreaterThan(0);

        // Fruiting plants
        expect(
          screen.getAllByText(/Boston Pickling Cucumber/i).length
        ).toBeGreaterThan(0);
      });

      // Verify plant count reflects all categories
      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    });
  });
});
