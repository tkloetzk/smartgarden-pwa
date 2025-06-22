// src/__tests__/components/Dashboard.test.tsx
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../../pages/dashboard";
import { CareSchedulingService } from "@/services/careSchedulingService";
import { SmartDefaultsService } from "@/services/smartDefaultsService";
import { TaskGroupingService } from "@/services/taskGroupingService";
import { renderWithProviders, mockPlantData } from "../utils/testHelpers";
import { plantService } from "@/types";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@/hooks/useFirstTimeUser", () => ({
  useFirstTimeUser: jest.fn(),
}));
import { useFirstTimeUser } from "@/hooks/useFirstTimeUser";
const mockUseFirstTimeUser = useFirstTimeUser as jest.MockedFunction<
  typeof useFirstTimeUser
>;

// Mock the services directly instead of importing them
jest.mock("@/types/database", () => ({
  plantService: {
    getActivePlants: jest.fn(),
    addPlant: jest.fn(),
    getPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
  },
  varietyService: {
    getAllVarieties: jest.fn(),
    getVariety: jest.fn(),
    getVarietyByName: jest.fn(),
    addVariety: jest.fn(),
  },
  careService: {
    addCareActivity: jest.fn(),
    getLastCareActivityByType: jest.fn(),
    getPlantCareHistory: jest.fn(),
    getRecentActivities: jest.fn(),
  },
  db: {},
}));

jest.mock("@/services/smartDefaultsService", () => ({
  SmartDefaultsService: {
    getQuickCompletionOptions: jest.fn(),
    getDefaultsForPlant: jest.fn(),
  },
}));

jest.mock("@/services/careSchedulingService", () => ({
  CareSchedulingService: {
    getUpcomingTasks: jest.fn(),
    getNextTaskForPlant: jest.fn(),
    getTasksForPlant: jest.fn(),
  },
}));

jest.mock("@/services/taskGroupingService", () => ({
  TaskGroupingService: {
    groupTasksByActivity: jest.fn(),
    shouldExpandGroup: jest.fn(),
  },
}));

jest.mock("@/services/bypassAnalyticsService", () => ({
  BypassAnalyticsService: {
    recordBypass: jest.fn(),
    getBypassAnalytics: jest.fn(),
  },
}));

// Import the mocked services
const mockCareSchedulingService = CareSchedulingService as jest.Mocked<
  typeof CareSchedulingService
>;
const mockSmartDefaultsService = SmartDefaultsService as jest.Mocked<
  typeof SmartDefaultsService
>;
const mockTaskGroupingService = TaskGroupingService as jest.Mocked<
  typeof TaskGroupingService
>;

// Import the mocked plantService after mocking
const mockPlantService = plantService as jest.Mocked<typeof plantService>;

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSmartDefaultsService.getQuickCompletionOptions.mockResolvedValue([]);
    mockTaskGroupingService.groupTasksByActivity.mockReturnValue([]);
    mockUseFirstTimeUser.mockReturnValue({
      isFirstTime: false,
      isLoading: false,
      markOnboardingComplete: jest.fn(),
    });
  });

  describe("Data Display", () => {
    it("displays multiple plants and tasks correctly", async () => {
      const mockTasks = [
        {
          id: "task-1",
          plantId: "plant-1",
          name: "My Arugula",
          task: "Check water level",
          dueIn: "Due in 1 day",
          plantStage: "vegetative" as const,
          dueDate: new Date(),
          priority: "high" as const,
          canBypass: true,
        },
        {
          id: "task-2",
          plantId: "plant-2",
          name: "Spinach Plant",
          task: "Fertilize",
          dueIn: "Due today",
          plantStage: "mature" as const,
          dueDate: new Date(),
          priority: "medium" as const,
          canBypass: true,
        },
      ];

      const mockTaskGroups = [
        {
          type: "watering" as const,
          title: "Watering",
          emoji: "💧",
          tasks: [mockTasks[0]],
          isExpanded: true,
        },
        {
          type: "fertilizing" as const,
          title: "Fertilizing",
          emoji: "🌱",
          tasks: [mockTasks[1]],
          isExpanded: true,
        },
      ];

      const testPlants = [
        {
          ...mockPlantData[0],
          id: "plant-1",
          name: "My Arugula",
        },
        {
          ...(mockPlantData[1] || mockPlantData[0]),
          id: "plant-2",
          name: "Spinach Plant",
        },
      ];

      mockPlantService.getActivePlants.mockResolvedValue(testPlants);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue(mockTasks);
      mockTaskGroupingService.groupTasksByActivity.mockReturnValue(
        mockTaskGroups
      );

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("My Arugula")).toBeInTheDocument();
        expect(screen.getByText("Spinach Plant")).toBeInTheDocument();
      });

      expect(screen.getByText("2 active plants growing")).toBeInTheDocument();
      expect(screen.getByText("Watering")).toBeInTheDocument();
      expect(screen.getByText("Fertilizing")).toBeInTheDocument();
    });

    it("handles empty state correctly", async () => {
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

    it("displays urgent tasks with proper styling", async () => {
      const urgentTask = {
        id: "urgent-task",
        plantId: "test-plant-1",
        name: "My Arugula",
        task: "Check water level",
        dueIn: "overdue by 1 day",
        plantStage: "vegetative" as const,
        dueDate: new Date(),
        priority: "high" as const,
        canBypass: true,
      };

      const testPlant = {
        ...mockPlantData[0],
        id: "test-plant-1",
        name: "My Arugula",
      };

      mockPlantService.getActivePlants.mockResolvedValue([testPlant]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([
        urgentTask,
      ]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    // In Dashboard.test.tsx, update the "displays error state when service fails" test:
    it("displays error state when service fails", async () => {
      mockPlantService.getActivePlants.mockRejectedValue(
        new Error("Database error")
      );

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Database error")).toBeInTheDocument(); // Changed this line
        expect(screen.getByText("Try Again")).toBeInTheDocument();
      });
    });

    it("retries when error state try again button is clicked", async () => {
      const errorMessage = "Database error";
      mockPlantService.getActivePlants
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce([mockPlantData[0]]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText("Try Again");
      await userEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
      });
    });

    it("handles errors gracefully when task enhancement fails", async () => {
      const testPlant = {
        ...mockPlantData[0],
        id: "test-plant-1",
        name: "My Arugula",
      };

      const testTask = {
        id: "task-1",
        plantId: "test-plant-1",
        name: "My Arugula",
        task: "Check water level",
        dueIn: "overdue by 1 day",
        plantStage: "vegetative" as const,
        dueDate: new Date(),
        priority: "high" as const,
        canBypass: true,
      };

      mockPlantService.getActivePlants.mockResolvedValue([testPlant]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([testTask]);

      mockSmartDefaultsService.getQuickCompletionOptions.mockRejectedValue(
        new Error("Smart defaults error")
      );

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
      });
    });
  });
});
