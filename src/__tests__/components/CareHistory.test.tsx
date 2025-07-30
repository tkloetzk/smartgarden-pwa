import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderComponent, useTestLifecycle } from "../utils/testSetup";
import CareHistory from "@/components/plant/CareHistory";
import { CareRecord } from "@/types/database";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("CareHistory", () => {
  useTestLifecycle();

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
});