import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderComponent } from "../test-utils";
import CareHistory from "@/components/plant/CareHistory";
import { CareRecord } from "@/types/database";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("CareHistory", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCareHistory: CareRecord[] = [
    {
      id: "1",
      plantId: "plant-1",
      type: "water",
      date: new Date("2024-01-01"),
      details: { type: "water", waterAmount: 100, waterUnit: "ml" },
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      id: "2", 
      plantId: "plant-1",
      type: "fertilize",
      date: new Date("2024-01-02"),
      details: { type: "fertilize", product: "Test Fertilizer" },
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    },
    {
      id: "3",
      plantId: "plant-1", 
      type: "water",
      date: new Date("2024-01-03"),
      details: { type: "water", waterAmount: 150, waterUnit: "ml" },
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03"),
    },
  ];

  it("shows only activity types that have data", () => {
    renderComponent(
      <CareHistory careHistory={mockCareHistory} plantId="plant-1" />,
      { withRouter: false }
    );

    // Should show "All Activities" (always shown)
    expect(screen.getByRole("button", { name: /all activities/i })).toBeInTheDocument();
    
    // Should show "Watering" (has 2 activities)
    expect(screen.getByRole("button", { name: /watering/i })).toBeInTheDocument();
    
    // Should show "Fertilizing" (has 1 activity)
    expect(screen.getByRole("button", { name: /fertilizing/i })).toBeInTheDocument();
    
    // Should NOT show "Observations" (no observation activities in mock data)
    expect(screen.queryByRole("button", { name: /observations/i })).not.toBeInTheDocument();
    
    // Should NOT show "Harvest" (no harvest activities in mock data)
    expect(screen.queryByRole("button", { name: /harvest/i })).not.toBeInTheDocument();
  });

  it("shows only All Activities when no care history exists", () => {
    renderComponent(
      <CareHistory careHistory={[]} plantId="plant-1" />,
      { withRouter: false }
    );

    // Should show empty state message
    expect(screen.getByText(/no care activities yet/i)).toBeInTheDocument();
    
    // Should not show any filter buttons when no history
    expect(screen.queryByRole("button", { name: /all activities/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /watering/i })).not.toBeInTheDocument();
  });

  it("filters activities correctly when filter button is clicked", async () => {
    const user = userEvent.setup();
    
    renderComponent(
      <CareHistory careHistory={mockCareHistory} plantId="plant-1" />,
      { withRouter: false }
    );

    // Initially shows all activities (3 total)
    expect(screen.getByText("(3 activities)")).toBeInTheDocument();

    // Click on "Watering" filter
    await user.click(screen.getByRole("button", { name: /watering/i }));

    // Should still show all activities in the list, but now filtered
    // The watering button should be in selected state (has gradient background)
    const wateringButton = screen.getByRole("button", { name: /watering/i });
    expect(wateringButton).toHaveClass("from-emerald-500", "to-green-600");
  });

  it("shows correct activity count in header", () => {
    renderComponent(
      <CareHistory careHistory={mockCareHistory} plantId="plant-1" />,
      { withRouter: false }
    );

    expect(screen.getByText("(3 activities)")).toBeInTheDocument();
  });

  it("handles single activity type correctly", () => {
    const singleTypeHistory: CareRecord[] = [
      {
        id: "1",
        plantId: "plant-1",
        type: "water",
        date: new Date("2024-01-01"),
        details: { type: "water", waterAmount: 100, waterUnit: "ml" },
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    renderComponent(
      <CareHistory careHistory={singleTypeHistory} plantId="plant-1" />,
      { withRouter: false }
    );

    // Should show "All Activities" and "Watering" only
    expect(screen.getByRole("button", { name: /all activities/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /watering/i })).toBeInTheDocument();
    
    // Should not show other activity types
    expect(screen.queryByRole("button", { name: /fertilizing/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /observations/i })).not.toBeInTheDocument();
  });

  // REGRESSION TEST: This would have caught the grouping issue
  it("displays all individual plant activities without grouping", () => {
    renderComponent(
      <CareHistory careHistory={mockCareHistory} plantId="plant-1" />,
      { withRouter: false }
    );

    // Should display all 3 activities as individual items (looking for specific activity titles)
    expect(screen.getByText(/Watering \(100 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Watering \(150 ml\)/i)).toBeInTheDocument(); 
    expect(screen.getByText(/Fertilized with Test Fertilizer/i)).toBeInTheDocument();
    
    // Should NOT show any grouped activity indicators
    expect(screen.queryByText(/Bulk Activity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/plants\)/i)).not.toBeInTheDocument(); // Like "Watered 6 plants"
    
    // All activities should be visible (not hidden by broken grouping)
    expect(screen.getByText(/Watering \(100 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Watering \(150 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Fertilized with Test Fertilizer/i)).toBeInTheDocument();
  });

  it("maintains activity order and count after any processing", () => {
    renderComponent(
      <CareHistory careHistory={mockCareHistory} plantId="plant-1" />,
      { withRouter: false }
    );

    // Verify that all 3 activities are present
    expect(screen.getByText("(3 activities)")).toBeInTheDocument();
    
    // Verify activities are displayed as clickable items
    expect(screen.getByText(/Watering \(100 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Watering \(150 ml\)/i)).toBeInTheDocument(); 
    expect(screen.getByText(/Fertilized with Test Fertilizer/i)).toBeInTheDocument();
  });

  it("shows individual activity details when expanded", async () => {
    const user = userEvent.setup();
    
    renderComponent(
      <CareHistory careHistory={mockCareHistory} plantId="plant-1" />,
      { withRouter: false }
    );

    // Find and click the first activity to expand it (clicking on the container div)
    const firstActivityTitle = screen.getByText(/Watering \(150 ml\)/i); // Most recent first
    const activityContainer = firstActivityTitle.closest('div[class*="cursor-pointer"]');
    expect(activityContainer).toBeInTheDocument();
    
    await user.click(activityContainer!);
    
    // Should show expanded details (this would fail if activities weren't rendering)
    expect(screen.getByText(/Amount:/i)).toBeInTheDocument();
  });

  it("filters work correctly and show expected number of results", async () => {
    const user = userEvent.setup();
    
    renderComponent(
      <CareHistory careHistory={mockCareHistory} plantId="plant-1" />,
      { withRouter: false }
    );

    // Filter by watering - should show 2 activities
    await user.click(screen.getByRole("button", { name: /watering/i }));
    
    // Should still show 2 watering activities (not 0 due to broken grouping)
    const wateringActivities = screen.getAllByText(/Watering \(/);
    expect(wateringActivities).toHaveLength(2);
    
    // Filter by fertilizing - should show 1 activity
    await user.click(screen.getByRole("button", { name: /fertilizing/i }));
    
    const fertilizeActivities = screen.getAllByText(/Fertilized/);
    expect(fertilizeActivities).toHaveLength(1);
    
    // Back to all - should show all 3
    await user.click(screen.getByRole("button", { name: /all activities/i }));
    
    // Verify all activities are back
    expect(screen.getByText(/Watering \(100 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Watering \(150 ml\)/i)).toBeInTheDocument(); 
    expect(screen.getByText(/Fertilized with Test Fertilizer/i)).toBeInTheDocument();
  });

  describe("Delete Care Entry", () => {
    it("shows delete button when care activity is expanded", async () => {
      const mockOnDeleteActivity = jest.fn();
      const user = userEvent.setup();
      
      renderComponent(
        <CareHistory 
          careHistory={mockCareHistory} 
          plantId="plant-1" 
          onDeleteActivity={mockOnDeleteActivity}
        />,
        { withRouter: false }
      );

      // Expand the first activity to show details
      const firstActivity = screen.getByText(/Watering \(150 ml\)/i);
      const activityContainer = firstActivity.closest('div[class*="cursor-pointer"]');
      await user.click(activityContainer!);

      // Should show delete button in expanded view
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("calls onDeleteActivity when delete button is clicked and confirmed", async () => {
      const mockOnDeleteActivity = jest.fn();
      const user = userEvent.setup();
      
      renderComponent(
        <CareHistory 
          careHistory={mockCareHistory} 
          plantId="plant-1" 
          onDeleteActivity={mockOnDeleteActivity}
        />,
        { withRouter: false }
      );

      // Expand the first activity
      const firstActivity = screen.getByText(/Watering \(150 ml\)/i);
      const activityContainer = firstActivity.closest('div[class*="cursor-pointer"]');
      await user.click(activityContainer!);

      // Click delete button
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Click confirm delete
      const confirmButton = screen.getByRole("button", { name: /confirm delete/i });
      await user.click(confirmButton);

      // Should call the callback with the activity ID
      expect(mockOnDeleteActivity).toHaveBeenCalledWith("3");
    });

    it("shows confirmation dialog before deleting", async () => {
      const mockOnDeleteActivity = jest.fn();
      const user = userEvent.setup();
      
      renderComponent(
        <CareHistory 
          careHistory={mockCareHistory} 
          plantId="plant-1" 
          onDeleteActivity={mockOnDeleteActivity}
        />,
        { withRouter: false }
      );

      // Expand and try to delete
      const firstActivity = screen.getByText(/Watering \(150 ml\)/i);
      const activityContainer = firstActivity.closest('div[class*="cursor-pointer"]');
      await user.click(activityContainer!);
      
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Should show confirmation dialog
      expect(screen.getByText(/are you sure you want to delete this care activity/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("does not delete when cancel is clicked in confirmation", async () => {
      const mockOnDeleteActivity = jest.fn();
      const user = userEvent.setup();
      
      renderComponent(
        <CareHistory 
          careHistory={mockCareHistory} 
          plantId="plant-1" 
          onDeleteActivity={mockOnDeleteActivity}
        />,
        { withRouter: false }
      );

      // Expand, delete, and cancel
      const firstActivity = screen.getByText(/Watering \(150 ml\)/i);
      const activityContainer = firstActivity.closest('div[class*="cursor-pointer"]');
      await user.click(activityContainer!);
      
      await user.click(screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Should not call delete callback
      expect(mockOnDeleteActivity).not.toHaveBeenCalled();
      
      // Confirmation dialog should be closed
      expect(screen.queryByText(/are you sure you want to delete this care activity/i)).not.toBeInTheDocument();
    });

    it("deletes when confirm is clicked in confirmation dialog", async () => {
      const mockOnDeleteActivity = jest.fn();
      const user = userEvent.setup();
      
      renderComponent(
        <CareHistory 
          careHistory={mockCareHistory} 
          plantId="plant-1" 
          onDeleteActivity={mockOnDeleteActivity}
        />,
        { withRouter: false }
      );

      // Expand, delete, and confirm
      const firstActivity = screen.getByText(/Watering \(150 ml\)/i);
      const activityContainer = firstActivity.closest('div[class*="cursor-pointer"]');
      await user.click(activityContainer!);
      
      await user.click(screen.getByRole("button", { name: /delete/i }));
      await user.click(screen.getByRole("button", { name: /confirm delete/i }));

      // Should call delete callback with correct ID
      expect(mockOnDeleteActivity).toHaveBeenCalledWith("3");
    });
  });
});