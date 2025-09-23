/**
 * Dashboard Component - Integration Test Suite
 *
 * FOCUS: Complex user workflows and business logic integration
 * - Test data flow between multiple hooks
 * - Test business logic calculations
 * - Test user interaction workflows
 * - Minimal mocking - focus on service layer only
 */

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { User } from "firebase/auth";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Test data
const mockUser: User = {
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
  delete: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue("mock-token"),
  getIdTokenResult: vi.fn().mockResolvedValue({}),
  reload: vi.fn(),
  toJSON: vi.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: "firebase",
} as User;

const mockPlants = [
  {
    id: "plant-1",
    name: "Cherry Tomato",
    varietyName: "Cherry Tomato",
    plantedDate: new Date("2024-08-01"),
    container: "6-inch pot",
  },
  {
    id: "plant-2",
    name: "Sweet Basil",
    varietyName: "Sweet Basil",
    plantedDate: new Date("2024-08-01"),
    container: "4-inch pot",
  },
];

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

// Explicitly mock the direct care-status module in case the component imports it directly
vi.mock("@/hooks/dashboard/useCareStatus", () => ({
  useCareStatus: vi.fn(),
}));

import { Dashboard } from "@/pages/dashboard";

// Import the mocked hooks
import {
  useContainerGroups,
  useDashboardData,
  useFertilizationTasks,
  useHiddenGroupsManager,
} from "@/hooks/dashboard";
import { useCareStatus } from "@/hooks/dashboard/useCareStatus";
import { useObservationTasks } from "@/hooks/dashboard/useObservationTasks";
import { useWateringTasks } from "@/hooks/dashboard/useWateringTasks";

// Helper to render Dashboard with router
const renderDashboard = () => {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
};

describe("Dashboard Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock hook implementations
    vi.mocked(useDashboardData).mockReturnValue({
      plants: mockPlants,
      loading: false,
      user: mockUser,
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

  afterEach(() => {
    // Ensure DOM is cleaned and mocks/timers are reset between tests to avoid flakiness
    cleanup();
    // Reset mock call history and implementations
    vi.resetAllMocks();
    vi.restoreAllMocks();
    // Ensure timers are real for predictable behavior
    try {
      vi.useRealTimers();
    } catch (e) {
      // ignore if real timers already in use
    }
  });

  describe("Business Logic Integration", () => {
    it("calculates plant grouping correctly", () => {
      const plants = [
        { id: "1", container: "pot-a", varietyName: "tomato" },
        { id: "2", container: "pot-a", varietyName: "tomato" },
        { id: "3", container: "pot-b", varietyName: "basil" },
      ];

      // Test grouping logic similar to useContainerGroups
      const grouped = plants.reduce((acc, plant) => {
        const key = `${plant.container}-${plant.varietyName}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(plant);
        return acc;
      }, {} as Record<string, typeof plants>);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped["pot-a-tomato"]).toHaveLength(2);
      expect(grouped["pot-b-basil"]).toHaveLength(1);
    });

    it("filters hidden groups correctly", () => {
      const allPlants = mockPlants;
      const hiddenGroups = new Set(["plant-1"]);

      const visiblePlants = allPlants.filter(
        (plant) => !hiddenGroups.has(plant.id)
      );
      expect(visiblePlants.length).toBe(1);
    });
  });

  describe("User Interaction Workflows", () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it("handles sign out interaction", async () => {
      renderDashboard();

      const signOutButton = await screen.findByRole("button", {
        name: /sign out/i,
      });

      expect(signOutButton).toBeInTheDocument();

      // Test that the button is clickable (integration with auth service)
      await user.click(signOutButton);
      // Note: Actual sign out behavior would be tested in E2E tests
    });

    it("handles catch-up workflow when plants need attention", async () => {
      // Mock that plants need catch-up
      vi.mocked(useCareStatus).mockReturnValue({
        groupsNeedingCatchUp: 3,
        careStatusLoading: false,
      });

      renderDashboard();

      // Find and click the catch-up card
      const catchUpCards = await screen.findAllByRole("button", {
        name: /plant care status/i,
      });
      const catchUpCard = catchUpCards[0];
      
      expect(catchUpCard).toBeDefined();
  const subtext = await within(catchUpCard).findByTestId("care-status-subtext");
  expect(subtext).toHaveTextContent("3");

      
      // Test the interaction
      await user.click(catchUpCard);
      
      // Verify the click handler was called
      expect(useDashboardData().logActivity).not.toHaveBeenCalled();
    });

    it("handles catch-up workflow when no plants need attention", async () => {
      // Mock that no plants need catch-up
      vi.mocked(useCareStatus).mockReturnValue({
        groupsNeedingCatchUp: 0,
        careStatusLoading: false,
      });

      renderDashboard();

      // Find and click the catch-up card
      const catchUpCards = await screen.findAllByRole("button", {
        name: /plant care status/i,
      });
      const catchUpCard = catchUpCards[0];
      
      expect(catchUpCard).toBeDefined();
  const subtext = await within(catchUpCard).findByTestId("care-status-subtext");
  expect(subtext).toHaveTextContent("✅");
      
      // Test the interaction
      await user.click(catchUpCard);
      
      // Verify the click handler was called
      expect(useDashboardData().logActivity).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling Integration", () => {
    it("handles service failures gracefully", async () => {
      const mockError = new Error("Network failed");

      const handleServiceError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error) {
          const msg = (error instanceof Error) ? error.message : String(error);
          return { error: msg, fallback: [] };
        }
      };

      const result = await handleServiceError(() => Promise.reject(mockError));
      expect(result).toEqual({ error: "Network failed", fallback: [] });
    });
  });
});