import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextActivityCard from "@/components/plant/NextActivityCard";
import { UpcomingTask } from "@/types";
import * as useNextPlantTaskModule from "@/hooks/useNextPlantTask";
import * as quickActionButtonsModule from "@/components/shared/QuickActionButtons";

// Mock dependencies
jest.mock("@/hooks/useNextPlantTask");
jest.mock("@/components/shared/QuickActionButtons", () => ({
  getActivityIcon: jest.fn(),
}));

describe("NextActivityCard", () => {
  const mockOnTaskClick = jest.fn();
  
  const mockTask: UpcomingTask = {
    id: "task-1",
    plantId: "plant-1",
    plantName: "Test Plant",
    task: "Water plant",
    type: "water",
    dueDate: new Date("2024-01-15"),
    dueIn: "in 2 days",
    priority: "medium",
    category: "watering",
    plantStage: "vegetative",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (quickActionButtonsModule.getActivityIcon as jest.Mock).mockReturnValue("💧");
  });

  describe("Loading State", () => {
    it("renders loading skeleton when isLoading is true", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: true,
      });

      render(<NextActivityCard plantId="plant-1" />);

      expect(screen.getByText("Next Activity")).toBeInTheDocument();
      expect(screen.getByText("Next Activity").closest("h3")).toBeInTheDocument();
      
      // Check for loading skeleton elements
      const skeletonElements = document.querySelectorAll(".animate-pulse");
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it("applies custom className during loading", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: true,
      });

      const { container } = render(
        <NextActivityCard plantId="plant-1" className="custom-loading-class" />
      );

      const card = container.querySelector(".custom-loading-class");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Empty State (No Tasks)", () => {
    it("renders 'All caught up' message when no task is available", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" />);

      expect(screen.getByText("Next Activity")).toBeInTheDocument();
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
      expect(screen.getByText("No tasks scheduled")).toBeInTheDocument();
    });

    it("displays check circle icon in empty state", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" />);

      // The CheckCircle2 icon should be present
      const iconContainer = document.querySelector(".bg-green-100");
      expect(iconContainer).toBeInTheDocument();
    });

    it("applies custom className in empty state", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: false,
      });

      const { container } = render(
        <NextActivityCard plantId="plant-1" className="custom-empty-class" />
      );

      const card = container.querySelector(".custom-empty-class");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Task Display", () => {
    it("renders task information correctly", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" />);

      expect(screen.getByText("Next Activity")).toBeInTheDocument();
      expect(screen.getByText("Water plant")).toBeInTheDocument();
      expect(screen.getByText("in 2 days")).toBeInTheDocument();
      expect(screen.getByText("medium")).toBeInTheDocument();
    });

    it("displays activity icon for the task", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" />);

      expect(quickActionButtonsModule.getActivityIcon).toHaveBeenCalledWith("Water plant");
      expect(screen.getByText("💧")).toBeInTheDocument();
    });

    it("applies custom className when task is present", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      const { container } = render(
        <NextActivityCard plantId="plant-1" className="custom-task-class" />
      );

      const card = container.querySelector(".custom-task-class");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Priority Configuration", () => {
    it("displays high priority styling correctly", () => {
      const highPriorityTask = { ...mockTask, priority: "high" as const };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: highPriorityTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      expect(screen.getByText("high")).toBeInTheDocument();
      
      // Check for high priority badge styling
      const badge = screen.getByText("high").closest("div");
      expect(badge).toHaveClass("bg-red-100", "text-red-800", "border-red-200");
    });

    it("displays overdue priority styling correctly", () => {
      const overdueTask = { ...mockTask, priority: "overdue" as const };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: overdueTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      expect(screen.getByText("overdue")).toBeInTheDocument();
      
      // Check for overdue priority badge styling
      const badge = screen.getByText("overdue").closest("div");
      expect(badge).toHaveClass("bg-red-200", "text-red-900", "border-red-300");
    });

    it("displays medium priority styling correctly", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      expect(screen.getByText("medium")).toBeInTheDocument();
      
      // Check for medium priority badge styling
      const badge = screen.getByText("medium").closest("div");
      expect(badge).toHaveClass("bg-orange-100", "text-orange-800", "border-orange-200");
    });

    it("displays low priority styling correctly", () => {
      const lowPriorityTask = { ...mockTask, priority: "low" as const };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: lowPriorityTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      expect(screen.getByText("low")).toBeInTheDocument();
      
      // Check for low priority badge styling
      const badge = screen.getByText("low").closest("div");
      expect(badge).toHaveClass("bg-green-100", "text-green-800", "border-green-200");
    });

    it("handles unknown priority with default styling", () => {
      const unknownPriorityTask = { ...mockTask, priority: "unknown" as any };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: unknownPriorityTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      expect(screen.getByText("unknown")).toBeInTheDocument();
      
      // Check for default priority badge styling
      const badge = screen.getByText("unknown").closest("div");
      expect(badge).toHaveClass("bg-gray-100", "text-gray-800", "border-gray-200");
    });
  });

  describe("Button Behavior", () => {
    it("renders action button when onTaskClick is provided", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button", { name: /log water plant/i });
      expect(button).toBeInTheDocument();
    });

    it("does not render action button when onTaskClick is not provided", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" />);

      const button = screen.queryByRole("button", { name: /log water plant/i });
      expect(button).not.toBeInTheDocument();
    });

    it("calls onTaskClick with correct activity type when button is clicked", async () => {
      const user = userEvent.setup();
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button", { name: /log water plant/i });
      await user.click(button);

      expect(mockOnTaskClick).toHaveBeenCalledWith("water");
    });

    it("applies priority-based button styling", () => {
      const highPriorityTask = { ...mockTask, priority: "high" as const };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: highPriorityTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button", { name: /log water plant/i });
      expect(button).toHaveClass("bg-red-500", "hover:bg-red-600", "text-white");
    });
  });

  describe("Activity Type Detection", () => {
    it("detects water activity type correctly", async () => {
      const user = userEvent.setup();
      const wateringTask = { ...mockTask, task: "Water the plants" };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: wateringTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnTaskClick).toHaveBeenCalledWith("water");
    });

    it("detects fertilize activity type correctly", async () => {
      const user = userEvent.setup();
      const fertilizeTask = { ...mockTask, task: "Fertilize with nutrients" };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: fertilizeTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnTaskClick).toHaveBeenCalledWith("fertilize");
    });

    it("detects observe activity type correctly", async () => {
      const user = userEvent.setup();
      const observeTask = { ...mockTask, task: "Health check required" };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: observeTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnTaskClick).toHaveBeenCalledWith("observe");
    });

    it("detects harvest activity type correctly", async () => {
      const user = userEvent.setup();
      const harvestTask = { ...mockTask, task: "Harvest ready fruits" };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: harvestTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnTaskClick).toHaveBeenCalledWith("harvest");
    });

    it("detects transplant activity type correctly", async () => {
      const user = userEvent.setup();
      const transplantTask = { ...mockTask, task: "Transplant to larger pot" };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: transplantTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnTaskClick).toHaveBeenCalledWith("transplant");
    });

    it("defaults to water for unknown activity types", async () => {
      const user = userEvent.setup();
      const unknownTask = { ...mockTask, task: "Unknown activity type" };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: unknownTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockOnTaskClick).toHaveBeenCalledWith("water");
    });
  });

  describe("Hook Integration", () => {
    it("calls useNextPlantTask with correct plantId", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: false,
      });

      render(<NextActivityCard plantId="test-plant-123" />);

      expect(useNextPlantTaskModule.useNextPlantTask).toHaveBeenCalledWith("test-plant-123");
    });

    it("handles hook returning null task gracefully", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      expect(screen.getByText("All caught up!")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("handles button click gracefully when no task is available", async () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      // No button should be present, so no click should be possible
      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
      expect(mockOnTaskClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility and ARIA", () => {
    it("has proper heading structure", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" />);

      const heading = screen.getByRole("heading", { name: /next activity/i });
      expect(heading).toBeInTheDocument();
    });

    it("has accessible button when task is present", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      const button = screen.getByRole("button", { name: /log water plant/i });
      expect(button).toBeInTheDocument();
      // Button doesn't need explicit type="button" as it's the default
      expect(button.tagName).toBe("BUTTON");
    });

    it("has proper semantic structure in loading state", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: true,
      });

      render(<NextActivityCard plantId="plant-1" />);

      const heading = screen.getByRole("heading", { name: /next activity/i });
      expect(heading).toBeInTheDocument();
    });

    it("has proper semantic structure in empty state", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: null,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" />);

      const heading = screen.getByRole("heading", { name: /next activity/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles task with empty string gracefully", () => {
      const emptyTask = { ...mockTask, task: "" };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: emptyTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      // Check that other task fields still render correctly
      expect(screen.getByText("in 2 days")).toBeInTheDocument();
      expect(screen.getByText("medium")).toBeInTheDocument();
      
      // The empty task name should not cause errors
      const taskSpan = document.querySelector('.text-sm.font-medium.text-foreground');
      expect(taskSpan).toBeInTheDocument();
      expect(taskSpan?.textContent).toBe("");
    });

    it("handles task with special characters in description", async () => {
      const user = userEvent.setup();
      const specialTask = { ...mockTask, task: "Water & fertilize 50% dilution" };
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: specialTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={mockOnTaskClick} />);

      expect(screen.getByText("Water & fertilize 50% dilution")).toBeInTheDocument();
      
      const button = screen.getByRole("button");
      await user.click(button);
      
      // Should detect "water" activity type
      expect(mockOnTaskClick).toHaveBeenCalledWith("water");
    });

    it("handles undefined onTaskClick gracefully", () => {
      (useNextPlantTaskModule.useNextPlantTask as jest.Mock).mockReturnValue({
        nextTask: mockTask,
        isLoading: false,
      });

      render(<NextActivityCard plantId="plant-1" onTaskClick={undefined} />);

      // Should not render button when onTaskClick is undefined
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});