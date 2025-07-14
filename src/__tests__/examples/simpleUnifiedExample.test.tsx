// src/__tests__/examples/simpleUnifiedExample.test.tsx
// Working example of the unified testing patterns

import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Use the unified test setup
import { renderComponent, useTestLifecycle } from "../utils/testSetup";

// Simple test component
const TestComponent = ({ message = "Hello World", showButton = true }) => (
  <div>
    <h1>{message}</h1>
    {showButton && <button>Click me</button>}
    <div data-testid="test-content">Test content</div>
  </div>
);

describe("Unified Test Utilities - Working Example", () => {
  // Use standardized lifecycle management
  useTestLifecycle();

  describe("Basic Rendering", () => {
    it("renders component without router", () => {
      renderComponent(<TestComponent />, {
        withRouter: false,
      });

      expect(screen.getByText("Hello World")).toBeInTheDocument();
      expect(screen.getByTestId("test-content")).toBeInTheDocument();
    });

    it("renders component with router", () => {
      renderComponent(<TestComponent message="Hello Router" />);

      expect(screen.getByText("Hello Router")).toBeInTheDocument();
    });

    it("handles custom props", () => {
      renderComponent(<TestComponent message="Custom Message" showButton={false} />, {
        withRouter: false,
      });

      expect(screen.getByText("Custom Message")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("handles button clicks", async () => {
      const user = userEvent.setup();
      
      renderComponent(<TestComponent />, {
        withRouter: false,
      });

      const button = screen.getByRole("button", { name: /click me/i });
      
      // Button exists and is clickable
      expect(button).toBeInTheDocument();
      await user.click(button);
      
      // Test passed - button was clickable
    });
  });

  describe("Router Configuration", () => {
    it("works with custom routes", () => {
      renderComponent(<TestComponent />, {
        initialEntries: ["/custom-route"],
        routerType: 'memory',
      });

      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("works with browser router", () => {
      renderComponent(<TestComponent />, {
        routerType: 'browser',
      });

      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });
  });

  describe("Lifecycle Management", () => {
    it("cleans up between tests automatically", () => {
      renderComponent(<TestComponent message="Test 1" />, {
        withRouter: false,
      });

      expect(screen.getByText("Test 1")).toBeInTheDocument();
    });

    it("starts fresh for each test", () => {
      renderComponent(<TestComponent message="Test 2" />, {
        withRouter: false,
      });

      expect(screen.getByText("Test 2")).toBeInTheDocument();
      // Previous test's content should not be present
      expect(screen.queryByText("Test 1")).not.toBeInTheDocument();
    });
  });
});

// Example showing factory usage
describe("Data Factory Integration", () => {
  useTestLifecycle();

  it("demonstrates factory imports work", () => {
    // Import factories
    const { createMockPlant } = require("../utils/testSetup");
    
    const plant = createMockPlant({ name: "Test Plant from Factory" });
    
    expect(plant.name).toBe("Test Plant from Factory");
    expect(plant.id).toBeDefined();
    expect(plant.varietyId).toBeDefined();
  });
});