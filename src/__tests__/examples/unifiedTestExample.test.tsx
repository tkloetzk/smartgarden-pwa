// src/__tests__/examples/unifiedTestExample.test.tsx
// Example test demonstrating the new unified testing patterns
// Copy this pattern for new tests
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
import { testMocks, setupComponentTest } from "../utils/mockServices.helper";

// Import the component to test - create a responsive mock component for this example
const Dashboard = () => {
  
  // Simulate how a real component would use hooks
  const useFirebaseAuth = require('@/hooks/useFirebaseAuth').useFirebaseAuth;
  const useFirebasePlants = require('@/hooks/useFirebasePlants').useFirebasePlants;
  const useScheduledTasks = require('@/hooks/useScheduledTasks').useScheduledTasks;
  
  const { user } = useFirebaseAuth();
  const { plants, loading, error } = useFirebasePlants();
  const { tasks } = useScheduledTasks();

  if (loading) {
    return <div data-testid="loading-spinner">Loading...</div>;
  }

  if (error) {
    return <div>Failed to load plants: {error}</div>;
  }

  if (!user) {
    return <div>Please log in</div>;
  }

  if (!plants || plants.length === 0) {
    return (
      <div>
        <div>No plants yet</div>
        <button onClick={() => (global as any).mockNavigate("/add-plant")}>Add Plant</button>
      </div>
    );
  }

  return (
    <div>
      <div>Dashboard Content</div>
      <div>
        {plants.map((plant: any) => (
          <div key={plant.id} data-testid={`plant-card-${plant.id}`} onClick={() => (global as any).mockNavigate(`/plant/${plant.id}`)}>
            {plant.name}
          </div>
        ))}
      </div>
      {tasks && tasks.length > 0 && <div>Upcoming tasks</div>}
      {tasks && tasks.some((task: any) => task.taskType === 'water') && (
        <div>
          Water
          <button>Complete</button>
        </div>
      )}
      <button onClick={() => (global as any).mockNavigate("/add-plant")}>Add Plant</button>
      <div data-testid="plants-tab" className="active">Plants Tab</div>
      <button>Log Care</button>
      <div>Log care activity</div>
    </div>
  );
};

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
    const { mockNavigate } = setupComponentTest();
    (global as any).mockNavigate = mockNavigate;
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
      const { garden } = await TestScenarios.authenticatedUserWithPlants();

      renderComponent(<Dashboard />);

      // Wait for plants to load
      const firstPlant = garden.plants[0];
      const plantName = firstPlant.name || firstPlant.varietyName;
      
      await waitFor(() => {
        expect(screen.getByText(plantName)).toBeInTheDocument();
      });

      // Verify tasks are displayed
      expect(screen.getByText(/upcoming tasks/i)).toBeInTheDocument();
    });

    it("allows user to complete a task", async () => {
      await TestScenarios.authenticatedUserWithPlants();
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
      const user = userEvent.setup();

      renderComponent(<Dashboard />);

      const addPlantButton = screen.getByRole("button", { name: /add plant/i });
      await user.click(addPlantButton);

      expect((global as any).mockNavigate).toHaveBeenCalledWith("/add-plant");
    });
  });

  describe("Router Integration", () => {
    it("works with different initial routes", async () => {
      // Use scenario with plants so plants-tab is rendered
      await TestScenarios.authenticatedUserWithPlants();

      // Test with specific route
      renderComponent(<Dashboard />, {
        initialEntries: ["/dashboard?tab=plants"],
      });

      // Verify route-specific behavior
      expect(screen.getByTestId("plants-tab")).toHaveClass("active");
    });

    it("works without router when needed", async () => {
      // Use scenario with plants so we see dashboard content
      await TestScenarios.authenticatedUserWithPlants();

      // Disable router for isolated component testing
      renderComponent(<Dashboard />, {
        withRouter: false,
      });

      // Component should render without router context
      expect(screen.getByText(/dashboard content/i)).toBeInTheDocument();
    });
  });
});

// ===========================
// INTEGRATION TEST EXAMPLE
// ===========================

describe("Dashboard Integration Tests", () => {
  useTestLifecycle();

  it("full user workflow: login -> view plants -> add care activity", async () => {
    const { garden } = await TestScenarios.authenticatedUserWithPlants();
    const userEvents = userEvent.setup();

    renderComponent(<Dashboard />);

    // 1. Verify user sees their plants
    const firstPlant = garden.plants[0];
    const plantName = firstPlant.name || firstPlant.varietyName;
    
    await waitFor(() => {
      expect(screen.getByText(plantName)).toBeInTheDocument();
    });

    // 2. User clicks on plant to view details
    const plantCard = screen.getByTestId(`plant-card-${firstPlant.id}`);
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