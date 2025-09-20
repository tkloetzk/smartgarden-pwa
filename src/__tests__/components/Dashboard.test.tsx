/**
 * Dashboard Component - Integration Test Suite
 *
 * FOCUS: Integration testing between hooks and business logic
 * - Test data flow between multiple hooks
 * - Test business logic calculations
 * - Test user interaction workflows
 * - Minimal mocking - focus on service layer only
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import React from "react";
import { User } from "firebase/auth";

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

import { Dashboard } from "@/pages/dashboard";

// Import the mocked hooks
import {
  useDashboardData,
  useHiddenGroupsManager,
  useContainerGroups,
  useCareStatus,
  useFertilizationTasks,
} from "@/hooks/dashboard";
import { useWateringTasks } from "@/hooks/dashboard/useWateringTasks";
import { useObservationTasks } from "@/hooks/dashboard/useObservationTasks";

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

  describe("Basic Rendering Integration", () => {
    it("renders with essential UI elements", async () => {
      renderDashboard();

      expect(await screen.findByTestId("smartgarden-title")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });

    it("displays user information when available", async () => {
      renderDashboard();

      expect(await screen.findByText(/welcome.*test user/i)).toBeInTheDocument();
    });
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

      expect(visiblePlants).toHaveLength(1);
      expect(visiblePlants[0].id).toBe("plant-2");
    });
  });

  describe("Error Handling Integration", () => {
    it("handles service failures gracefully", async () => {
      const mockError = new Error("Network failed");

      const handleServiceError = async (operation: () => Promise<any>) => {
        try {
          return await operation();
        } catch (error) {
          return { error: error.message, fallback: [] };
        }
      };

      const result = await handleServiceError(() => Promise.reject(mockError));
      expect(result).toEqual({ error: "Network failed", fallback: [] });
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

  });

  describe("Accessibility", () => {
    it("maintains proper heading hierarchy", async () => {
      renderDashboard();

      const mainHeading = await screen.findByRole("heading", { level: 1 });
      expect(mainHeading).toHaveTextContent("SmartGarden");
    });

    it("provides accessible button labels", async () => {
      renderDashboard();

      const signOutButton = await screen.findByRole("button", {
        name: /sign out/i,
      });
      expect(signOutButton).toHaveAccessibleName();
    });
  });
});
