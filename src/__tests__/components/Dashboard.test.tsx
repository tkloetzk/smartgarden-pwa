/**
 * Dashboard Component - Unit Test Suite
 *
 * FOCUS: Basic component rendering and accessibility
 * - Test essential UI element rendering
 * - Test accessibility features
 * - Test basic component behavior
 * - Complex workflows moved to integration tests
 */

import { logTestingPlaygroundURL } from "@testing-library/dom";
import { beforeEach, describe, it, vi } from "vitest";

// Import test utilities
import {
  assertions,
  PlantFactory,
  screen,
  setupDashboardTest
} from "@/test/utils";

// Mock Firebase-related hooks that useDashboardData depends on
vi.mock("@/hooks/plants/useFirebasePlants", () => ({
  useFirebasePlants: vi.fn(),
}));

vi.mock("@/hooks/auth/useFirebaseAuth", () => ({
  useFirebaseAuth: vi.fn(),
}));

vi.mock("@/hooks/care/useCareActivities", () => ({
  useCareActivities: vi.fn(),
}));

vi.mock("@/hooks/tasks/useScheduledTasks", () => ({
  useScheduledTasks: vi.fn(),
}));

// Mock the dashboard hooks using the index export
vi.mock("@/hooks/dashboard", () => ({
  useDashboardData: vi.fn(),
  useHiddenGroupsManager: vi.fn(),
  useContainerGroups: vi.fn(),
  useCareStatus: vi.fn(),
  useFertilizationTasks: vi.fn(),
}));

vi.mock("@/hooks/dashboard/useWateringTasks", () => ({
  useWateringTasks: vi.fn(),
}));

vi.mock("@/hooks/dashboard/useObservationTasks", () => ({
  useObservationTasks: vi.fn(),
}));

import { Dashboard } from "@/pages/dashboard";

// Import the mocked hooks
import { useFirebaseAuth } from "@/hooks/auth/useFirebaseAuth";
import { useCareActivities } from "@/hooks/care/useCareActivities";
import {
  useCareStatus,
  useContainerGroups,
  useDashboardData,
  useFertilizationTasks,
  useHiddenGroupsManager,
} from "@/hooks/dashboard";
import { useObservationTasks } from "@/hooks/dashboard/useObservationTasks";
import { useWateringTasks } from "@/hooks/dashboard/useWateringTasks";
import { useFirebasePlants } from "@/hooks/plants/useFirebasePlants";
import { useScheduledTasks } from "@/hooks/tasks/useScheduledTasks";

describe("Dashboard Component", () => {
  let testData: ReturnType<typeof setupDashboardTest>;

  beforeEach(() => {
    // Use the comprehensive test setup
    testData = setupDashboardTest();

    // Create test plants using factory
    const mockPlants = [
      PlantFactory.tomato({ name: "Cherry Tomato" }),
      PlantFactory.basil({ name: "Sweet Basil" }),
    ];

    // Mock Firebase-related hooks with factory data
    vi.mocked(useFirebasePlants).mockReturnValue({
      plants: mockPlants,
      loading: false,
      error: null,
      createPlant: vi.fn(),
      updatePlant: vi.fn(),
      deletePlant: vi.fn(),
    });

    vi.mocked(useFirebaseAuth).mockReturnValue({
      user: testData.mockUser,
      signOut: vi.fn(),
      loading: false,
      error: null,
    });

    vi.mocked(useCareActivities).mockReturnValue({
      logActivity: vi.fn(),
      activities: [],
      loading: false,
      error: null,
    });

    vi.mocked(useScheduledTasks).mockReturnValue({
      getUpcomingFertilizationTasks: vi.fn(),
      error: null,
    });

    // Mock hook implementations with cleaner data
    vi.mocked(useDashboardData).mockReturnValue({
      plants: mockPlants,
      loading: false,
      user: testData.mockUser,
      signOut: vi.fn(),
      logActivity: vi.fn(),
      getUpcomingFertilizationTasks: vi.fn(),
      scheduledTasksError: null,
    });

    vi.mocked(useHiddenGroupsManager).mockReturnValue({
      hiddenGroups: new Set(),
      hideGroup: vi.fn(),
      restoreAllHidden: vi.fn(),
      isGroupHidden: vi.fn(),
    });

    vi.mocked(useContainerGroups).mockReturnValue({
      plantGroups: [],
      containerGroups: [],
      visiblePlants: mockPlants,
      visiblePlantsCount: mockPlants.length,
    });

    vi.mocked(useCareStatus).mockReturnValue({
      groupsNeedingCatchUp: 0,
      careStatusLoading: false,
    });

    vi.mocked(useFertilizationTasks).mockReturnValue({
      upcomingFertilization: [],
      handleTaskComplete: vi.fn(),
      handleTaskBypass: vi.fn(),
      handleTaskLogActivity: vi.fn(),
    });

    vi.mocked(useWateringTasks).mockReturnValue({
      upcomingWatering: [],
      handleTaskComplete: vi.fn(),
      handleTaskBypass: vi.fn(),
      handleTaskLogActivity: vi.fn(),
    });

    vi.mocked(useObservationTasks).mockReturnValue({
      upcomingObservation: [],
      handleTaskComplete: vi.fn(),
      handleTaskBypass: vi.fn(),
      handleTaskLogActivity: vi.fn(),
    });
  });

  describe("Basic Rendering", () => {
    it("renders with essential UI elements", async () => {
      testData.render(<Dashboard />);

      // Use assertion helpers for cleaner test code
      const title = await screen.findByTestId("smartgarden-title");
      assertions.isVisible(title);
        logTestingPlaygroundURL(title);

      screen.debug(); // visible in Vitest UI console

      const signOutButton = assertions.clickableButton(/sign out/i);
      assertions.isVisible(signOutButton);
    });

    it("displays user information when available", async () => {
      testData.render(<Dashboard />);

      // Use assertion helper for text content
      assertions.hasVisibleText(/welcome.*test user/i);
    });
  });
});
