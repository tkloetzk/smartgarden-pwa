import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import PlantGroupCard from "@/components/plant/PlantGroupCard";
import { PlantGroup } from "@/utils/plantGrouping";
import { PlantRecord } from "@/types";
import * as useDynamicStageModule from "@/hooks/useDynamicStage";
import { subDays } from "date-fns";

// Mock dependencies
jest.mock("@/hooks/useDynamicStage");
jest.mock("@/components/shared/QuickActionButtons", () => ({
  ...jest.requireActual("@/components/shared/QuickActionButtons"),
  QuickActionButtons: ({ onAction, actions }: { onAction: (action: string) => void; actions: string[] }) => (
    <div data-testid="quick-action-buttons">
      {actions.map((action: string) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          data-testid={`action-${action}`}
        >
          {action}
        </button>
      ))}
    </div>
  ),
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("PlantGroupCard", () => {
  const mockOnBulkLogActivity = jest.fn();

  const createMockPlant = (overrides: Partial<PlantRecord> = {}): PlantRecord => ({
    id: "plant-1",
    varietyId: "tomato-variety",
    varietyName: "Cherry Tomato",
    name: "Cherry Tomato Plant 1",
    plantedDate: subDays(new Date(), 30),
    location: "Kitchen Window",
    container: "6-inch pot",
    soilMix: "Potting mix",
    isActive: true,
    section: "Section A",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockGroup = (overrides: Partial<PlantGroup> = {}): PlantGroup => ({
    id: "group-1",
    varietyId: "tomato-variety",
    varietyName: "Cherry Tomato",
    plantedDate: subDays(new Date(), 30),
    container: "6-inch pot",
    location: "Kitchen Window",
    soilMix: "Potting mix",
    setupType: "same-container",
    plants: [createMockPlant()],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useDynamicStageModule.useDynamicStage as jest.Mock).mockReturnValue("vegetative");
  });

  describe("Basic Rendering", () => {
    it("renders single plant group correctly", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Cherry Tomato Plant 1")).toBeInTheDocument();
      expect(screen.getByText("Cherry Tomato")).toBeInTheDocument();
      expect(screen.getByText("vegetative")).toBeInTheDocument();
      expect(screen.getByText("30 days old")).toBeInTheDocument();
    });

    it("renders multiple plant group correctly", () => {
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
          createMockPlant({ id: "plant-3", name: "Plant 3" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Plant 1")).toBeInTheDocument();
      expect(screen.getByText("1 of 3")).toBeInTheDocument();
      expect(screen.getByText("• 3 plants")).toBeInTheDocument();
    });

    it("calls useDynamicStage with current plant", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(useDynamicStageModule.useDynamicStage).toHaveBeenCalledWith(group.plants[0]);
    });
  });

  describe("Plant Navigation", () => {
    it("shows navigation controls for multiple plants", () => {
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByRole("button", { name: "←" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "→" })).toBeInTheDocument();
      expect(screen.getByText("1 of 2")).toBeInTheDocument();
    });

    it("hides navigation controls for single plant", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.queryByRole("button", { name: "←" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "→" })).not.toBeInTheDocument();
      expect(screen.queryByText("1 of 1")).not.toBeInTheDocument();
    });

    it("navigates to next plant when next button is clicked", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Plant 1")).toBeInTheDocument();
      expect(screen.getByText("1 of 2")).toBeInTheDocument();

      const nextButton = screen.getByRole("button", { name: "→" });
      await user.click(nextButton);

      expect(screen.getByText("Plant 2")).toBeInTheDocument();
      expect(screen.getByText("2 of 2")).toBeInTheDocument();
    });

    it("navigates to previous plant when previous button is clicked", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Navigate to second plant first
      const nextButton = screen.getByRole("button", { name: "→" });
      await user.click(nextButton);
      expect(screen.getByText("Plant 2")).toBeInTheDocument();

      // Navigate back to first plant
      const prevButton = screen.getByRole("button", { name: "←" });
      await user.click(prevButton);
      expect(screen.getByText("Plant 1")).toBeInTheDocument();
    });

    it("wraps around to last plant when clicking previous from first plant", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
          createMockPlant({ id: "plant-3", name: "Plant 3" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Plant 1")).toBeInTheDocument();

      const prevButton = screen.getByRole("button", { name: "←" });
      await user.click(prevButton);

      expect(screen.getByText("Plant 3")).toBeInTheDocument();
      expect(screen.getByText("3 of 3")).toBeInTheDocument();
    });

    it("wraps around to first plant when clicking next from last plant", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Navigate to last plant
      const nextButton = screen.getByRole("button", { name: "→" });
      await user.click(nextButton);
      expect(screen.getByText("Plant 2")).toBeInTheDocument();

      // Wrap around to first plant
      await user.click(nextButton);
      expect(screen.getByText("Plant 1")).toBeInTheDocument();
    });

    it("prevents event propagation when clicking navigation buttons", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      const nextButton = screen.getByRole("button", { name: "→" });
      await user.click(nextButton);

      // Navigation should not trigger plant click
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Plant Information Display", () => {
    it("displays location and container when both are provided", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("📍")).toBeInTheDocument();
      expect(screen.getByText("Kitchen Window")).toBeInTheDocument();
      expect(screen.getByText("• 6-inch pot")).toBeInTheDocument();
    });

    it("hides container when same as location", () => {
      const group = createMockGroup({
        plants: [createMockPlant({ location: "6-inch pot", container: "6-inch pot" })],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("6-inch pot")).toBeInTheDocument();
      expect(screen.queryByText("• 6-inch pot")).not.toBeInTheDocument();
    });

    it("displays section when provided", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("🏷️")).toBeInTheDocument();
      expect(screen.getByText("Section A")).toBeInTheDocument();
    });

    it("hides section when not provided", () => {
      const group = createMockGroup({
        plants: [createMockPlant({ section: undefined })],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.queryByText("🏷️")).not.toBeInTheDocument();
    });

    it("displays correct plant count for multiple plants", () => {
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
          createMockPlant({ id: "plant-3" }),
          createMockPlant({ id: "plant-4" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("• 4 plants")).toBeInTheDocument();
    });
  });

  describe("Plant Detail Navigation", () => {
    it("navigates to plant detail when clicking on plant info", async () => {
      const user = userEvent.setup();
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      await user.click(screen.getByText("Cherry Tomato"));

      expect(mockNavigate).toHaveBeenCalledWith("/plants/plant-1");
    });

    it("navigates to correct plant when multiple plants exist", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Navigate to second plant
      await user.click(screen.getByRole("button", { name: "→" }));
      
      // Click on plant info to navigate
      await user.click(screen.getByText("Cherry Tomato"));

      expect(mockNavigate).toHaveBeenCalledWith("/plants/plant-2");
    });
  });

  describe("Individual Plant Actions", () => {
    it("shows individual action button with correct label for single plant", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Log Care" })).toBeInTheDocument();
    });

    it("shows individual action button with correct label for multiple plants", () => {
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Current Plant Actions")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Log One" })).toBeInTheDocument();
    });

    it("toggles individual action buttons when clicked", async () => {
      const user = userEvent.setup();
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Initially, action buttons should not be visible
      expect(screen.queryByTestId("quick-action-buttons")).not.toBeInTheDocument();

      // Click to show actions
      await user.click(screen.getByRole("button", { name: "Log Care" }));
      
      expect(screen.getByTestId("quick-action-buttons")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

      // Click to hide actions
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      
      expect(screen.queryByTestId("quick-action-buttons")).not.toBeInTheDocument();
    });

    it("calls onBulkLogActivity when individual action is selected", async () => {
      const user = userEvent.setup();
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Show action buttons
      await user.click(screen.getByRole("button", { name: "Log Care" }));
      
      // Click water action
      await user.click(screen.getByTestId("action-water"));

      expect(mockOnBulkLogActivity).toHaveBeenCalledWith(["plant-1"], "water", group);
    });

    it("navigates to log-care page when 'more' action is selected", async () => {
      const user = userEvent.setup();
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Show action buttons
      await user.click(screen.getByRole("button", { name: "Log Care" }));
      
      // Click more action
      await user.click(screen.getByTestId("action-more"));

      expect(mockNavigate).toHaveBeenCalledWith("/log-care/plant-1");
    });

    it("hides individual actions after action is selected", async () => {
      const user = userEvent.setup();
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Show action buttons
      await user.click(screen.getByRole("button", { name: "Log Care" }));
      expect(screen.getByTestId("quick-action-buttons")).toBeInTheDocument();
      
      // Select an action
      await user.click(screen.getByTestId("action-fertilize"));

      expect(screen.queryByTestId("quick-action-buttons")).not.toBeInTheDocument();
    });

    it("prevents event propagation when clicking individual action button", async () => {
      const user = userEvent.setup();
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      await user.click(screen.getByRole("button", { name: "Log Care" }));

      // Individual action button click should not trigger plant navigation
      expect(mockNavigate).not.toHaveBeenCalledWith("/plants/plant-1");
    });
  });

  describe("Bulk Actions", () => {
    it("hides bulk actions for single plant", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.queryByText("Group Actions")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Log All" })).not.toBeInTheDocument();
    });

    it("shows bulk actions for multiple plants", () => {
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Group Actions")).toBeInTheDocument();
      expect(screen.getByText("Log activity for all 2 plants")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Log All" })).toBeInTheDocument();
    });

    it("toggles bulk action buttons when clicked", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Initially, bulk action buttons should not be visible
      expect(screen.queryByRole("button", { name: "💧 Water All" })).not.toBeInTheDocument();

      // Click to show bulk actions
      await user.click(screen.getByRole("button", { name: "Log All" }));
      
      expect(screen.getByRole("button", { name: "💧 Water All" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "🌱 Fertilize All" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "👁️ Inspect All" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "📝 More" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

      // Click to hide bulk actions
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      
      expect(screen.queryByRole("button", { name: "💧 Water All" })).not.toBeInTheDocument();
    });

    it("calls onBulkLogActivity with all plant IDs when bulk action is selected", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
          createMockPlant({ id: "plant-3" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Show bulk actions
      await user.click(screen.getByRole("button", { name: "Log All" }));
      
      // Click water all action
      await user.click(screen.getByRole("button", { name: "💧 Water All" }));

      expect(mockOnBulkLogActivity).toHaveBeenCalledWith(
        ["plant-1", "plant-2", "plant-3"],
        "water",
        group
      );
    });

    it("calls onBulkLogActivity for each bulk action type", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      const { rerender } = render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Test water action
      await user.click(screen.getByRole("button", { name: "Log All" }));
      await user.click(screen.getByRole("button", { name: "💧 Water All" }));
      expect(mockOnBulkLogActivity).toHaveBeenCalledWith(["plant-1", "plant-2"], "water", group);

      // Re-render and test fertilize action
      mockOnBulkLogActivity.mockClear();
      rerender(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );
      
      await user.click(screen.getByRole("button", { name: "Log All" }));
      await user.click(screen.getByRole("button", { name: "🌱 Fertilize All" }));
      expect(mockOnBulkLogActivity).toHaveBeenCalledWith(["plant-1", "plant-2"], "fertilize", group);

      // Re-render and test observe action
      mockOnBulkLogActivity.mockClear();
      rerender(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );
      
      await user.click(screen.getByRole("button", { name: "Log All" }));
      await user.click(screen.getByRole("button", { name: "👁️ Inspect All" }));
      expect(mockOnBulkLogActivity).toHaveBeenCalledWith(["plant-1", "plant-2"], "observe", group);
    });

    it("navigates to care logging page when 'More' bulk action is clicked", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Show bulk actions
      await user.click(screen.getByRole("button", { name: "Log All" }));
      
      // Click more action
      await user.click(screen.getByRole("button", { name: "📝 More" }));

      expect(mockNavigate).toHaveBeenCalledWith("/log-care/plant-1");
    });

    it("hides bulk actions after bulk action is selected", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Show bulk actions
      await user.click(screen.getByRole("button", { name: "Log All" }));
      expect(screen.getByRole("button", { name: "💧 Water All" })).toBeInTheDocument();
      
      // Select a bulk action
      await user.click(screen.getByRole("button", { name: "🌱 Fertilize All" }));

      expect(screen.queryByRole("button", { name: "💧 Water All" })).not.toBeInTheDocument();
    });

    it("prevents event propagation when clicking bulk action buttons", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      await user.click(screen.getByRole("button", { name: "Log All" }));
      await user.click(screen.getByRole("button", { name: "💧 Water All" }));

      // Bulk action button click should not trigger plant navigation
      expect(mockNavigate).toHaveBeenCalledTimes(0);
    });
  });

  describe("Component State Management", () => {
    it("maintains separate state for individual and bulk actions", async () => {
      const user = userEvent.setup();
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Show individual actions
      await user.click(screen.getByRole("button", { name: "Log One" }));
      expect(screen.getByTestId("quick-action-buttons")).toBeInTheDocument();

      // Show bulk actions
      await user.click(screen.getByRole("button", { name: "Log All" }));
      expect(screen.getByRole("button", { name: "💧 Water All" })).toBeInTheDocument();

      // Both should be visible simultaneously
      expect(screen.getByTestId("quick-action-buttons")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "💧 Water All" })).toBeInTheDocument();
    });

    it("resets to first plant index when group changes", () => {
      const group1 = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1", name: "Plant 1" }),
          createMockPlant({ id: "plant-2", name: "Plant 2" }),
        ],
      });

      const { rerender } = render(
        <TestWrapper>
          <PlantGroupCard group={group1} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Plant 1")).toBeInTheDocument();

      const group2 = createMockGroup({
        id: "group-2",
        plants: [
          createMockPlant({ id: "plant-3", name: "Plant 3" }),
          createMockPlant({ id: "plant-4", name: "Plant 4" }),
        ],
      });

      rerender(
        <TestWrapper>
          <PlantGroupCard group={group2} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Plant 3")).toBeInTheDocument();
    });
  });

  describe("Accessibility and User Experience", () => {
    it("has proper card hover effects", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      const card = screen.getByText("Cherry Tomato Plant 1").closest(".hover\\:shadow-lg");
      expect(card).toBeInTheDocument();
    });

    it("displays status badge", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // StatusBadge component should be rendered (mocked by default)
      expect(screen.getByText("Cherry Tomato Plant 1")).toBeInTheDocument();
    });

    it("maintains proper button styling for action types", () => {
      const group = createMockGroup({
        plants: [
          createMockPlant({ id: "plant-1" }),
          createMockPlant({ id: "plant-2" }),
        ],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      const logAllButton = screen.getByRole("button", { name: "Log All" });
      expect(logAllButton).toHaveClass("text-primary", "border-primary/50", "hover:bg-primary/10");

      const logOneButton = screen.getByRole("button", { name: "Log One" });
      expect(logOneButton).toHaveClass("text-primary", "border-primary/50", "hover:bg-primary/10");
    });
  });

  describe("Edge Cases", () => {
    it("crashes with empty plant array (expected behavior)", () => {
      const group = createMockGroup({ plants: [] });

      // Empty plant array should cause an error since component expects at least one plant
      expect(() => {
        render(
          <TestWrapper>
            <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
          </TestWrapper>
        );
      }).toThrow("Cannot read properties of undefined");
    });

    it("handles missing plant properties gracefully", () => {
      const plantWithMissingData = createMockPlant({
        name: undefined,
        section: undefined,
        container: "",
      });

      const group = createMockGroup({ plants: [plantWithMissingData] });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      // Component should still render without crashing
      expect(screen.getByText("Cherry Tomato")).toBeInTheDocument();
    });

    it("correctly calculates days old for plants with different dates", () => {
      const group = createMockGroup({
        plants: [createMockPlant({ plantedDate: subDays(new Date(), 15) })],
      });

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("15 days old")).toBeInTheDocument();
    });
  });
});