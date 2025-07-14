// src/__tests__/examples/unifiedTestExample.test.tsx
// Example test demonstrating the new unified testing patterns
// Copy this pattern for new tests

import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Use the unified test setup
import {
  renderComponent,
  TestScenarios,
  useTestLifecycle,
  createMockFirebaseUser,
  createMockPlant,
} from "../utils/testSetup";

// Use unified service mocking
import { testMocks, setupComponentTest } from "../utils/mockServices";

// Import the component to test - create a simple mock component for this example
const Dashboard = () => (
  <div>
    <div data-testid="loading-spinner" style={{ display: 'none' }}>Loading...</div>
    <div>Dashboard Content</div>
    <button>Add Plant</button>
    <div data-testid="plants-tab">Plants Tab</div>
  </div>
);

// ===========================
// MOCK SETUP
// ===========================

// Mock hooks at module level
jest.mock("@/hooks/useFirebaseAuth");
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/hooks/useScheduledTasks");

// ===========================
// TEST SETUP
// ===========================

describe("Dashboard Component - Unified Test Example", () => {
  // Use standardized lifecycle management
  useTestLifecycle();

  beforeEach(() => {
    // Set up component-specific mocks
    setupComponentTest();
  });

  afterEach(() => {
    // Clean up mocks
    testMocks.reset();
  });

  // ===========================
  // TEST SCENARIOS
  // ===========================

  describe("Loading States", () => {
    it("shows loading spinner when data is loading", () => {
      // Use pre-configured scenario
      TestScenarios.loadingStates();

      // Use unified rendering
      renderComponent(<Dashboard />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("Error States", () => {
    it("shows error message when data fails to load", () => {
      // Use pre-configured error scenario
      TestScenarios.errorStates("Failed to load plants");

      renderComponent(<Dashboard />);

      expect(screen.getByText(/Failed to load plants/i)).toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("shows empty state when user has no plants", () => {
      // Use pre-configured empty scenario
      TestScenarios.emptyStates();

      renderComponent(<Dashboard />);

      expect(screen.getByText(/No plants yet/i)).toBeInTheDocument();
    });
  });

  describe("Authenticated User with Data", () => {
    it("displays plants and tasks for authenticated user", async () => {
      // Use pre-configured scenario with data
      const { user, garden } = await TestScenarios.authenticatedUserWithPlants();

      renderComponent(<Dashboard />);

      // Wait for plants to load
      await waitFor(() => {
        expect(screen.getByText(garden.plants[0].name)).toBeInTheDocument();
      });

      // Verify tasks are displayed
      expect(screen.getByText(/upcoming tasks/i)).toBeInTheDocument();
    });

    it("allows user to complete a task", async () => {
      const { garden } = await TestScenarios.authenticatedUserWithPlants();
      const user = userEvent.setup();

      renderComponent(<Dashboard />);

      // Wait for the task to appear
      await waitFor(() => {
        expect(screen.getByText(/water/i)).toBeInTheDocument();
      });

      // Click the complete task button
      const completeButton = screen.getByRole("button", { name: /complete/i });
      await user.click(completeButton);

      // Verify task completion logic was triggered
      // (This would depend on your actual implementation)
    });
  });

  describe("Custom Scenarios", () => {
    it("handles specific plant variety scenarios", async () => {
      const user = createMockFirebaseUser();
      const basil = createMockPlant({
        varietyName: "Greek Dwarf Basil",
        name: "Kitchen Basil",
      });

      // Configure custom scenario
      testMocks.configureScenario({
        user,
        plants: [basil],
        loading: false,
        error: null,
      });

      renderComponent(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("Kitchen Basil")).toBeInTheDocument();
      });
    });

    it("handles network error scenarios", () => {
      // Configure specific error type
      testMocks.configureErrorScenario('network', 'Connection timeout');

      renderComponent(<Dashboard />);

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigates to add plant page when button is clicked", async () => {
      TestScenarios.emptyStates();
      const { mockNavigate } = setupComponentTest();
      const user = userEvent.setup();

      renderComponent(<Dashboard />);

      const addPlantButton = screen.getByRole("button", { name: /add plant/i });
      await user.click(addPlantButton);

      expect(mockNavigate).toHaveBeenCalledWith("/add-plant");
    });
  });

  describe("Router Integration", () => {
    it("works with different initial routes", () => {
      TestScenarios.emptyStates();

      // Test with specific route
      renderComponent(<Dashboard />, {
        initialEntries: ["/dashboard?tab=plants"],
      });

      // Verify route-specific behavior
      expect(screen.getByTestId("plants-tab")).toHaveClass("active");
    });

    it("works without router when needed", () => {
      TestScenarios.emptyStates();

      // Disable router for isolated component testing
      renderComponent(<Dashboard />, {
        withRouter: false,
      });

      // Component should render without router context
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});

// ===========================
// INTEGRATION TEST EXAMPLE
// ===========================

describe("Dashboard Integration Tests", () => {
  useTestLifecycle();

  it("full user workflow: login -> view plants -> add care activity", async () => {
    const { user, garden } = await TestScenarios.authenticatedUserWithPlants();
    const userEvents = userEvent.setup();

    renderComponent(<Dashboard />);

    // 1. Verify user sees their plants
    await waitFor(() => {
      expect(screen.getByText(garden.plants[0].name)).toBeInTheDocument();
    });

    // 2. User clicks on plant to view details
    const plantCard = screen.getByTestId(`plant-card-${garden.plants[0].id}`);
    await userEvents.click(plantCard);

    // 3. User logs care activity
    const logCareButton = screen.getByRole("button", { name: /log care/i });
    await userEvents.click(logCareButton);

    // 4. Verify care logging modal opens
    expect(screen.getByText(/log care activity/i)).toBeInTheDocument();

    // This demonstrates how to test complex user workflows
    // with the unified testing system
  });
});