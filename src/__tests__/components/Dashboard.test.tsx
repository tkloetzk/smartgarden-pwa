// src/__tests__/components/Dashboard.test.tsx
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../../pages/dashboard";
import { plantService } from "../../types/database";
import { CareSchedulingService } from "@/services/careSchedulingService";
import { SmartDefaultsService } from "@/services/smartDefaultsService";
import { TaskGroupingService } from "@/services/taskGroupingService";
import {
  renderWithProviders,
  mockPlantData,
  mockTaskData,
} from "../utils/testUtils";

// Mock react-router-dom at the top level
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock services
jest.mock("@/services/smartDefaultsService", () => ({
  SmartDefaultsService: {
    getQuickCompletionOptions: jest.fn(),
  },
}));

jest.mock("@/services/taskGroupingService", () => ({
  TaskGroupingService: {
    groupTasksByActivity: jest.fn(),
  },
}));

jest.mock("../../types/database", () => ({
  plantService: {
    getActivePlants: jest.fn(),
    addPlant: jest.fn(),
    getPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
  },
}));

jest.mock("@/services/careSchedulingService", () => ({
  CareSchedulingService: {
    getUpcomingTasks: jest.fn(),
  },
}));

// Mock useFirstTimeUser - we'll override this per test when needed
const mockUseFirstTimeUser = jest.fn();
jest.mock("../../hooks/useFirstTimeUser", () => ({
  useFirstTimeUser: () => mockUseFirstTimeUser(),
}));

// Type the mocked services
const mockSmartDefaultsService = SmartDefaultsService as jest.Mocked<
  typeof SmartDefaultsService
>;
const mockTaskGroupingService = TaskGroupingService as jest.Mocked<
  typeof TaskGroupingService
>;
const mockPlantService = plantService as jest.Mocked<typeof plantService>;
const mockCareSchedulingService = CareSchedulingService as jest.Mocked<
  typeof CareSchedulingService
>;

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseFirstTimeUser.mockReturnValue({
      isFirstTime: false,
      isLoading: false,
      markOnboardingComplete: jest.fn(),
    });

    mockSmartDefaultsService.getQuickCompletionOptions.mockResolvedValue([]);
    mockTaskGroupingService.groupTasksByActivity.mockImplementation((tasks) => [
      {
        type: "watering",
        title: "Watering",
        emoji: "💧",
        tasks: tasks.filter((task) =>
          task.task.toLowerCase().includes("water")
        ),
        isExpanded: true,
      },
    ]);
  });

  describe("Loading States", () => {
    it("shows loading state initially", () => {
      mockPlantService.getActivePlants.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<Dashboard />);

      expect(screen.getByText("Loading your garden...")).toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("displays empty state when no plants exist", async () => {
      mockPlantService.getActivePlants.mockResolvedValue([]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Welcome to SmartGarden!")).toBeInTheDocument();
        expect(
          screen.getByText("You don't have any plants yet. Let's get started!")
        ).toBeInTheDocument();
        expect(screen.getByText("Add Your First Plant")).toBeInTheDocument();
      });
    });

    it("shows welcome component for first-time users", async () => {
      // Override the hook for this test
      mockUseFirstTimeUser.mockReturnValue({
        isFirstTime: true,
        isLoading: false,
        markOnboardingComplete: jest.fn(),
      });

      // Still need to mock services to prevent errors during useEffect
      mockPlantService.getActivePlants.mockResolvedValue([]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome to SmartGarden/)).toBeInTheDocument();
      });
    });
  });

  describe("Data Display", () => {
    it("displays plants and tasks when data exists", async () => {
      mockPlantService.getActivePlants.mockResolvedValue([mockPlantData[0]]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([
        mockTaskData[0],
      ]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
        expect(screen.getByText("My Arugula")).toBeInTheDocument();
        expect(screen.getByText(/Check water level/)).toBeInTheDocument();
        expect(screen.getByText("Watering")).toBeInTheDocument();
        expect(screen.getByText("1 task")).toBeInTheDocument();
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
        expect(screen.getByText("Bypass")).toBeInTheDocument();
        expect(screen.getByText("Log Manually")).toBeInTheDocument();
      });
    });

    it("displays dashboard with no pending tasks", async () => {
      mockPlantService.getActivePlants.mockResolvedValue([mockPlantData[0]]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
        expect(screen.getByText("1 active plant growing")).toBeInTheDocument();
        expect(screen.queryByText(/tasks? pending/)).not.toBeInTheDocument();
        expect(screen.getByText("Watering")).toBeInTheDocument();
        expect(screen.getByText("0 tasks")).toBeInTheDocument();
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      });
    });

    it("shows multiple plants", async () => {
      const twoPlantsData = [
        {
          id: "1",
          varietyId: "astro-arugula",
          varietyName: "Astro Arugula",
          name: "My Arugula",
          plantedDate: new Date("2024-01-01"),
          currentStage: "vegetative" as const,
          location: "Kitchen Window",
          container: "4 inch pot",
          isActive: true,
          notes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          varietyId: "baby-spinach",
          varietyName: "Baby Spinach",
          name: "Spinach Plant",
          plantedDate: new Date("2024-01-05"),
          currentStage: "seedling" as const,
          location: "Main Bed",
          container: "5 gallon bag",
          isActive: true,
          notes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const twoTasksData = [
        {
          id: "water-1",
          plantId: "1",
          name: "My Arugula",
          task: "Check water level",
          dueIn: "2 days",
          priority: "medium" as const,
          plantStage: "vegetative",
          dueDate: new Date(),
          canBypass: true,
        },
        {
          id: "water-2",
          plantId: "2",
          name: "Spinach Plant",
          task: "Check water level",
          dueIn: "1 day",
          priority: "medium" as const,
          plantStage: "seedling",
          dueDate: new Date(),
          canBypass: true,
        },
      ];

      // Keep the mockImplementation approach that worked
      mockPlantService.getActivePlants.mockImplementation(() => {
        return Promise.resolve(twoPlantsData);
      });

      mockCareSchedulingService.getUpcomingTasks.mockImplementation(() => {
        return Promise.resolve(twoTasksData);
      });

      mockTaskGroupingService.groupTasksByActivity.mockImplementation(
        (tasks) => {
          const result = [
            {
              type: "watering" as const,
              title: "Watering",
              emoji: "💧",
              tasks: tasks,
              isExpanded: true,
            },
          ];
          return result;
        }
      );

      renderWithProviders(<Dashboard />);

      // Wait for the dashboard to load first
      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
      });

      // Then check for the content
      await waitFor(() => {
        expect(screen.getByText("My Arugula")).toBeInTheDocument();
        expect(screen.getByText("Spinach Plant")).toBeInTheDocument();
      });

      // Check the counts with a more robust approach
      await waitFor(() => {
        const description = screen.getByTestId("active-plants-count");
        expect(description.textContent).toContain("2 active plants growing");
        expect(description.textContent).toContain("2 tasks pending");
      });
    });
  });

  describe("User Interactions", () => {
    it("navigates to log care when quick action is clicked", async () => {
      mockPlantService.getActivePlants.mockResolvedValue([mockPlantData[0]]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Log Care")).toBeInTheDocument();
      });

      const logCareButton = screen.getByText("Log Care");
      await userEvent.click(logCareButton);

      expect(mockNavigate).toHaveBeenCalledWith("/log-care");
    });

    it("renders contextual quick actions for urgent tasks", async () => {
      const urgentTask = {
        ...mockTaskData[0],
        dueIn: "overdue by 1 day",
        priority: "high" as const,
      };

      mockPlantService.getActivePlants.mockResolvedValue([mockPlantData[0]]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([
        urgentTask,
      ]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
        expect(screen.getByText("Water My Arugula")).toBeInTheDocument();
        expect(
          screen.getByText(/Green actions are suggested/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error state when service fails", async () => {
      mockPlantService.getActivePlants.mockRejectedValue(
        new Error("Database error")
      );

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load dashboard data")
        ).toBeInTheDocument();
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });
    });

    it("retries when error state try again button is clicked", async () => {
      mockPlantService.getActivePlants
        .mockRejectedValueOnce(new Error("Database error"))
        .mockResolvedValueOnce([mockPlantData[0]]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load dashboard data")
        ).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText("Try Again");
      await userEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
        expect(screen.getByText("1 active plant growing")).toBeInTheDocument();
      });

      expect(mockPlantService.getActivePlants).toHaveBeenCalledTimes(2);
    });

    it("handles errors gracefully when task enhancement fails", async () => {
      mockPlantService.getActivePlants.mockResolvedValue([mockPlantData[0]]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([
        mockTaskData[0],
      ]);
      mockSmartDefaultsService.getQuickCompletionOptions.mockRejectedValue(
        new Error("Service unavailable")
      );

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
        expect(screen.getByText("My Arugula")).toBeInTheDocument();
      });
    });
  });
});
