/**
 * Dashboard Component - Unit Test Suite
 *
 * FOCUS: Basic component rendering and accessibility
 * - Test essential UI element rendering
 * - Test accessibility features
 * - Test basic component behavior
 * - Complex workflows moved to integration tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
import {
  useDashboardData,
  useHiddenGroupsManager,
  useContainerGroups,
  useCareStatus,
  useFertilizationTasks,
} from "@/hooks/dashboard";
import { useWateringTasks } from "@/hooks/dashboard/useWateringTasks";
import { useObservationTasks } from "@/hooks/dashboard/useObservationTasks";
import { useFirebasePlants } from "@/hooks/plants/useFirebasePlants";
import { useFirebaseAuth } from "@/hooks/auth/useFirebaseAuth";
import { useCareActivities } from "@/hooks/care/useCareActivities";
import { useScheduledTasks } from "@/hooks/tasks/useScheduledTasks";

// Helper to render Dashboard with router
const renderDashboard = () => {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
};

describe("Dashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Firebase-related hooks first
    vi.mocked(useFirebasePlants).mockReturnValue({
      plants: mockPlants,
      loading: false,
      error: null,
      createPlant: vi.fn(),
      updatePlant: vi.fn(),
      deletePlant: vi.fn(),
    });

    vi.mocked(useFirebaseAuth).mockReturnValue({
      user: mockUser,
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

  describe("Basic Rendering", () => {
    it("renders with essential UI elements", async () => {
      renderDashboard();

      expect(
        await screen.findByTestId("smartgarden-title")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign out/i })
      ).toBeInTheDocument();
    });

    it("displays user information when available", async () => {
      renderDashboard();

      expect(
        await screen.findByText(/welcome.*test user/i)
      ).toBeInTheDocument();
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
