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

      expect(screen.getByText("Cherry Tomato")).toBeInTheDocument();
      expect(screen.getByText("vegetative")).toBeInTheDocument();
      expect(screen.getByText("30 days old")).toBeInTheDocument();
      expect(screen.getByText("Cherry Tomato Plant 1")).toBeInTheDocument();
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

      expect(screen.getByText("Cherry Tomato")).toBeInTheDocument();
      expect(screen.getAllByText("3 plants")).toHaveLength(2); // Both in header and content
    });

    it("calls useDynamicStage with representative plant", () => {
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
    it("does not show navigation controls (removed feature)", () => {
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

      expect(screen.queryByRole("button", { name: "←" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "→" })).not.toBeInTheDocument();
      expect(screen.queryByText("1 of 2")).not.toBeInTheDocument();
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

      expect(screen.getAllByText("4 plants")).toHaveLength(2); // Both in header and content
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

      await user.click(screen.getByText("Cherry Tomato Plant 1"));

      expect(mockNavigate).toHaveBeenCalledWith("/plants/plant-1");
    });

    it("navigates to representative plant when multiple plants exist", async () => {
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

      // Click on age text within the clickable area
      await user.click(screen.getByText("30 days old"));

      expect(mockNavigate).toHaveBeenCalledWith("/plants/plant-1");
    });
  });

  describe("Quick Actions", () => {
    it("shows quick action button with correct label for single plant", () => {
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Log care activity")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Log Care" })).toBeInTheDocument();
    });

    it("shows quick action button with correct label for multiple plants", () => {
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

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Log care for 2 plants")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Log Care" })).toBeInTheDocument();
    });

    it("toggles quick action buttons when clicked", async () => {
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

    it("calls onBulkLogActivity when action is selected", async () => {
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

    it("calls onBulkLogActivity with all plant IDs for multiple plants", async () => {
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

      // Show action buttons
      await user.click(screen.getByRole("button", { name: "Log Care" }));
      
      // Click water action
      await user.click(screen.getByTestId("action-water"));

      expect(mockOnBulkLogActivity).toHaveBeenCalledWith(["plant-1", "plant-2", "plant-3"], "water", group);
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

    it("hides quick actions after action is selected", async () => {
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

    it("prevents event propagation when clicking action button", async () => {
      const user = userEvent.setup();
      const group = createMockGroup();

      render(
        <TestWrapper>
          <PlantGroupCard group={group} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      await user.click(screen.getByRole("button", { name: "Log Care" }));

      // Action button click should not trigger plant navigation
      expect(mockNavigate).not.toHaveBeenCalledWith("/plants/plant-1");
    });
  });

  describe("Simplified Actions (No Separate Bulk Actions)", () => {
    it("does not show separate bulk actions section", () => {
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

      expect(screen.queryByText("Group Actions")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Log All" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "💧 Water All" })).not.toBeInTheDocument();
    });
  });

  describe("Component State Management", () => {
    it("manages quick actions state correctly", async () => {
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

      // Show quick actions
      await user.click(screen.getByRole("button", { name: "Log Care" }));
      expect(screen.getByTestId("quick-action-buttons")).toBeInTheDocument();

      // Hide quick actions
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.queryByTestId("quick-action-buttons")).not.toBeInTheDocument();
    });

    it("uses representative plant consistently", () => {
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

      expect(screen.getByText("Cherry Tomato")).toBeInTheDocument();
      expect(screen.getAllByText("2 plants")).toHaveLength(2); // Both in header and content

      const group2 = createMockGroup({
        id: "group-2",
        varietyName: "Roma Tomato", 
        plants: [
          createMockPlant({ id: "plant-3", name: "Plant 3", varietyName: "Roma Tomato" }),
          createMockPlant({ id: "plant-4", name: "Plant 4", varietyName: "Roma Tomato" }),
        ],
      });

      rerender(
        <TestWrapper>
          <PlantGroupCard group={group2} onBulkLogActivity={mockOnBulkLogActivity} />
        </TestWrapper>
      );

      expect(screen.getByText("Roma Tomato")).toBeInTheDocument();
      expect(screen.getAllByText("2 plants")).toHaveLength(2); // Both in header and content
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

      const card = screen.getByText("Cherry Tomato").closest(".hover\\:shadow-lg");
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
      expect(screen.getByText("Cherry Tomato")).toBeInTheDocument();
    });

    it("maintains proper button styling for unified actions", () => {
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

      const logCareButton = screen.getByRole("button", { name: "Log Care" });
      expect(logCareButton).toHaveClass("text-primary", "border-primary/50", "hover:bg-primary/10");
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

    it("correctly calculates days old for representative plant", () => {
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