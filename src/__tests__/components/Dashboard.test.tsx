import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../../pages/dashboard";
import { plantService } from "../../types/database";
import { CareSchedulingService } from "@/services/careSchedulingService";
import { SmartDefaultsService } from "@/services/smartDefaultsService";
import { TaskGroupingService } from "@/services/taskGroupingService";
import { renderWithProviders, mockPlantData } from "../utils/testHelpers";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

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

const mockUseFirstTimeUser = jest.fn();
jest.mock("../../hooks/useFirstTimeUser", () => ({
  useFirstTimeUser: () => mockUseFirstTimeUser(),
}));

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

    // Reset first time user to non-first-time by default
    mockUseFirstTimeUser.mockReturnValue({
      isFirstTime: false,
      isLoading: false,
      markOnboardingComplete: jest.fn(),
    });

    // Fixed: Provide correct QuickCompletionValues structure
    mockSmartDefaultsService.getQuickCompletionOptions.mockResolvedValue([
      {
        label: "Quick: 28oz",
        values: {
          waterValue: 28,
          waterUnit: "oz",
        },
      },
    ]);

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

    // Provide default successful data
    mockPlantService.getActivePlants.mockResolvedValue([]);
    mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([]);
  });

  describe("Loading States", () => {
    it("shows loading state initially", () => {
      mockPlantService.getActivePlants.mockImplementation(
        () => new Promise(() => {}) // Never resolving promise
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
      // Mock first time user
      mockUseFirstTimeUser.mockReturnValue({
        isFirstTime: true,
        isLoading: false,
        markOnboardingComplete: jest.fn(),
      });

      // Provide empty data
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
        priority: "high" as const,
        canBypass: true,
      };

      mockPlantService.getActivePlants.mockResolvedValue([testPlant]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([testTask]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("My Arugula")).toBeInTheDocument();
        expect(screen.getByText(/Check water level/)).toBeInTheDocument();
        expect(screen.getByText("Watering")).toBeInTheDocument();
        expect(screen.getByText("1 task")).toBeInTheDocument();
      });
    });

    it("displays dashboard with no pending tasks", async () => {
      mockPlantService.getActivePlants.mockResolvedValue([mockPlantData[0]]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([]);

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
        expect(screen.getByText("1 active plant growing")).toBeInTheDocument();
        expect(screen.queryByText(/tasks pending/)).not.toBeInTheDocument();
      });
    });

    it("displays multiple plants and tasks correctly", async () => {
      const twoPlantsData = [
        { ...mockPlantData[0], id: "plant-1", name: "My Arugula" },
        {
          id: "plant-2",
          varietyId: "variety-2",
          varietyName: "Spinach",
          name: "Spinach Plant",
          plantedDate: new Date("2024-01-15"),
          currentStage: "seedling" as const,
          location: "Balcony",
          container: "6 inch pot",
          isActive: true,
          notes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const twoTasksData = [
        {
          id: "task-1",
          plantId: "plant-1",
          name: "My Arugula",
          task: "Check water level",
          dueIn: "overdue by 1 day",
          priority: "high" as const,
          canBypass: true,
        },
        {
          id: "task-2",
          plantId: "plant-2",
          name: "Spinach Plant",
          task: "Check water level",
          dueIn: "1 day",
          priority: "medium" as const,
          canBypass: true,
        },
      ];

      mockPlantService.getActivePlants.mockResolvedValue(twoPlantsData);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue(
        twoTasksData
      );

      mockTaskGroupingService.groupTasksByActivity.mockImplementation(
        (tasks) => [
          {
            type: "watering" as const,
            title: "Watering",
            emoji: "💧",
            tasks: tasks,
            isExpanded: true,
          },
        ]
      );

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("My Arugula")).toBeInTheDocument();
        expect(screen.getByText("Spinach Plant")).toBeInTheDocument();
      });

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
        id: "task-1",
        plantId: "test-plant-1",
        name: "My Arugula",
        task: "Check water level",
        dueIn: "overdue by 1 day",
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
        priority: "high" as const,
        canBypass: true,
      };

      mockPlantService.getActivePlants.mockResolvedValue([testPlant]);
      mockCareSchedulingService.getUpcomingTasks.mockResolvedValue([testTask]);

      // Mock SmartDefaultsService to throw an error
      mockSmartDefaultsService.getQuickCompletionOptions.mockRejectedValue(
        new Error("Smart defaults error")
      );

      renderWithProviders(<Dashboard />);

      // Even with the error, the dashboard should still load
      await waitFor(() => {
        expect(screen.getByText("Your Garden Dashboard")).toBeInTheDocument();
      });
    });
  });
});
