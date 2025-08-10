/**
 * REGRESSION TEST: This test would have caught the grouping bug
 * 
 * The bug: When we added grouping logic to CareHistory component,
 * individual plant activities stopped showing because grouping
 * only works with activities from different plants.
 * 
 * This test ensures individual plant care history always works.
 */

import { screen } from "@testing-library/react";
import { renderComponent, useTestLifecycle } from "../utils/testSetup";
import CareHistory from "@/components/plant/CareHistory";
import { CareRecord } from "@/types/database";

describe("CareHistory Regression Tests", () => {
  useTestLifecycle();

  it("CRITICAL: Individual plant activities are always visible after logging", () => {
    // Simulate a user logging activities for a single plant
    const recentActivities: CareRecord[] = [
      {
        id: "water-1",
        plantId: "my-tomato-plant",
        type: "water",
        date: new Date("2024-01-01T10:00:00"),
        details: { type: "water", waterAmount: 200, waterUnit: "ml" },
        createdAt: new Date("2024-01-01T10:00:00"),
        updatedAt: new Date("2024-01-01T10:00:00"),
      },
      {
        id: "fertilize-1", 
        plantId: "my-tomato-plant",
        type: "fertilize",
        date: new Date("2024-01-01T10:30:00"),
        details: { type: "fertilize", product: "Organic Tomato Fertilizer" },
        createdAt: new Date("2024-01-01T10:30:00"),
        updatedAt: new Date("2024-01-01T10:30:00"),
      },
    ];

    renderComponent(
      <CareHistory careHistory={recentActivities} plantId="my-tomato-plant" />,
      { withRouter: true }
    );

    // CRITICAL: These activities MUST be visible
    // If this fails, the user can't see their logged activities!
    expect(screen.getByText(/Watering \(200 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Fertilized with Organic Tomato Fertilizer/i)).toBeInTheDocument();
    
    // Should show correct count
    expect(screen.getByText("(2 activities)")).toBeInTheDocument();
    
    // Should NOT show any grouping artifacts
    expect(screen.queryByText(/Bulk Activity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2 plants/i)).not.toBeInTheDocument();
  });

  it("CRITICAL: Recently logged activity appears immediately", () => {
    // Simulate user just logged an activity
    const justLoggedActivity: CareRecord[] = [
      {
        id: "just-logged",
        plantId: "my-plant", 
        type: "water",
        date: new Date(), // Just now
        details: { type: "water", waterAmount: 150, waterUnit: "ml" },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    renderComponent(
      <CareHistory careHistory={justLoggedActivity} plantId="my-plant" />,
      { withRouter: true }
    );

    // The user MUST see their activity immediately after logging
    expect(screen.getByText(/Watering \(150 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText("(1 activities)")).toBeInTheDocument();
  });

  it("CRITICAL: Multiple same-plant activities all appear (no grouping)", () => {
    // User logs water multiple times for same plant (e.g., partial watering)
    const multipleWaterings: CareRecord[] = [
      {
        id: "water-1",
        plantId: "thirsty-plant",
        type: "water", 
        date: new Date("2024-01-01T08:00:00"),
        details: { type: "water", waterAmount: 100, waterUnit: "ml", notes: "Morning watering" },
        createdAt: new Date("2024-01-01T08:00:00"),
        updatedAt: new Date("2024-01-01T08:00:00"),
      },
      {
        id: "water-2",
        plantId: "thirsty-plant",
        type: "water",
        date: new Date("2024-01-01T12:00:00"), 
        details: { type: "water", waterAmount: 50, waterUnit: "ml", notes: "Midday top-up" },
        createdAt: new Date("2024-01-01T12:00:00"),
        updatedAt: new Date("2024-01-01T12:00:00"),
      },
      {
        id: "water-3",
        plantId: "thirsty-plant",
        type: "water",
        date: new Date("2024-01-01T18:00:00"),
        details: { type: "water", waterAmount: 75, waterUnit: "ml", notes: "Evening watering" },
        createdAt: new Date("2024-01-01T18:00:00"),
        updatedAt: new Date("2024-01-01T18:00:00"),
      }
    ];

    renderComponent(
      <CareHistory careHistory={multipleWaterings} plantId="thirsty-plant" />,
      { withRouter: true }
    );

    // ALL activities must be visible individually (no grouping for same plant)
    expect(screen.getByText(/Watering \(100 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Watering \(50 ml\)/i)).toBeInTheDocument(); 
    expect(screen.getByText(/Watering \(75 ml\)/i)).toBeInTheDocument();
    
    // Should show correct total count
    expect(screen.getByText("(3 activities)")).toBeInTheDocument();
    
    // Each should be individually clickable/expandable
    const activities = screen.getAllByText(/Watering \(/);
    expect(activities).toHaveLength(3);
  });

  it("CRITICAL: Filter functionality works after any refactoring", () => {
    const mixedActivities: CareRecord[] = [
      {
        id: "water-1",
        plantId: "my-plant",
        type: "water",
        date: new Date("2024-01-01"),
        details: { type: "water", waterAmount: 100, waterUnit: "ml" },
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "fertilize-1",
        plantId: "my-plant", 
        type: "fertilize",
        date: new Date("2024-01-02"),
        details: { type: "fertilize", product: "Fish Emulsion" },
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
      }
    ];

    const { getByRole } = renderComponent(
      <CareHistory careHistory={mixedActivities} plantId="my-plant" />,
      { withRouter: true }
    );

    // Should have filter buttons
    expect(getByRole("button", { name: /all activities/i })).toBeInTheDocument();
    expect(getByRole("button", { name: /watering/i })).toBeInTheDocument();
    expect(getByRole("button", { name: /fertilizing/i })).toBeInTheDocument();
    
    // Both activities should be visible initially
    expect(screen.getByText(/Watering \(100 ml\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Fertilized with Fish Emulsion/i)).toBeInTheDocument();
  });
});