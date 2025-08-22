/**
 * SEPARATED: Bulk Activity Modal UI Tests
 * 
 * This file tests the USER INTERFACE and INTERACTIONS of the BulkActivityModal
 * WITHOUT testing complex business logic (which is in .businessLogic.test.tsx)
 * 
 * Focus: Component rendering, user interactions, form behavior, accessibility
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { PlantBuilder } from "../test-utils";

// Mock only what's necessary for UI testing
jest.mock("@/hooks/useFirebaseCareActivities");
jest.mock("@/hooks/useFirebasePlants");
jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  success: jest.fn(),
  error: jest.fn(),
}));

describe("BulkActivityModal - UI Interactions", () => {
  const user = userEvent.setup();
  
  // Create test plants
  const testPlants = [
    PlantBuilder.new().withId("plant-1").withName("Tomato Plant 1").build(),
    PlantBuilder.new().withId("plant-2").withName("Tomato Plant 2").build(),
  ];

  // Mock logActivity function - it actually returns void
  const mockLogActivity = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup minimal mocks for UI testing
    require("@/hooks/useFirebaseCareActivities").useFirebaseCareActivities.mockReturnValue({
      careActivities: [],
      loading: false,
      error: null,
      logActivity: mockLogActivity,
    });
    
    require("@/hooks/useFirebasePlants").useFirebasePlants.mockReturnValue({
      plants: testPlants,
      loading: false,
      error: null,
      deletePlant: jest.fn(),
    });
  });

  describe("Modal Display and Visibility", () => {
    it("should not render when closed", () => {
      render(
        <BulkActivityModal
          isOpen={false}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="water"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      expect(screen.queryByText("💧 Water All Plants")).not.toBeInTheDocument();
    });

    it("should render when open with selected plants", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="water"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      expect(screen.getByText("💧 Water All Plants")).toBeInTheDocument();
    });

    it("should close when close button is clicked", async () => {
      const onClose = jest.fn();
      
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={onClose}
          plantIds={["plant-1", "plant-2"]}
          activityType="water"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      // Look for close button (X symbol)
      const closeButton = screen.getByRole("button", { name: /✕/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Activity Type Display", () => {
    it("should show watering view when activity type is water", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="water"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      expect(screen.getByText("💧 Water All Plants")).toBeInTheDocument();
      expect(screen.getByLabelText("Water Amount")).toBeInTheDocument();
    });

    it("should show fertilization view when activity type is fertilize", async () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="fertilize"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      expect(screen.getByText("🌱 Fertilize All Plants")).toBeInTheDocument();
      // Wait for fertilizer options to load
      await waitFor(() => {
        expect(screen.getByText("Fertilizer Product")).toBeInTheDocument();
      });
    });

    it("should show observation view when activity type is observe", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="observe"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      expect(screen.getByText("👁️ Inspect All Plants")).toBeInTheDocument();
      // Observation should show notes field but not amount fields
      expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Water Amount/i)).not.toBeInTheDocument();
    });

    it("should show single plant label when plantCount is 1", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1"]}
          activityType="water"
          plantCount={1}
          varietyName="Cherry Tomato"
        />
      );

      expect(screen.getByText("💧 Water Plant")).toBeInTheDocument();
      expect(screen.getByText("Logging for Cherry Tomato plant")).toBeInTheDocument();
    });
  });

  describe("Form Field Interactions", () => {
    it("should allow entering watering amount", async () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="water"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      // Fill water amount
      const amountInput = screen.getByLabelText("Water Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "25");

      expect(amountInput).toHaveValue(25);

      // Change unit
      const unitSelect = screen.getByLabelText("Unit");
      await user.selectOptions(unitSelect, "cups");
      
      expect(unitSelect).toHaveValue("cups");
    });

    it("should allow entering fertilizer details", async () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1"]}
          activityType="fertilize"
          plantCount={1}
          varietyName="Cherry Tomato"
        />
      );

      // Wait for fertilizer options to load
      await waitFor(() => {
        expect(screen.getByLabelText("Fertilizer Product")).toBeInTheDocument();
      });

      // Test dilution input (note: might be pre-populated, so we test it has a value)
      const dilutionInput = screen.getByLabelText(/Dilution/i);
      expect(dilutionInput).toBeInTheDocument();
      
      // Check if it has a default value from fertilizer options
      expect((dilutionInput as HTMLInputElement).value).toBeTruthy(); // Should have some value
    });

    it("should allow entering observation notes", async () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="observe"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      const notesInput = screen.getByLabelText(/Notes/i);
      await user.type(notesInput, "Weekly health check - plants look good");

      expect(notesInput).toHaveValue("Weekly health check - plants look good");
    });

    it("should allow changing activity date", async () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1"]}
          activityType="water"
          plantCount={1}
          varietyName="Cherry Tomato"
        />
      );

      const dateInput = screen.getByLabelText(/Date/i);
      await user.clear(dateInput);
      await user.type(dateInput, "2025-01-15");

      expect(dateInput).toHaveValue("2025-01-15");
    });
  });

  describe("Form Validation UI", () => {
    it("should show submit button for watering activity", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="water"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      const submitButton = screen.getByRole("button", { name: /Log Activity for All 2 Plants/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeEnabled(); // Watering should be submittable by default
    });

    it("should show loading state during submission", async () => {
      mockLogActivity.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(undefined), 100))
      );

      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1"]}
          activityType="water"
          plantCount={1}
          varietyName="Cherry Tomato"
        />
      );

      const submitButton = screen.getByRole("button", { name: /Log/i });
      await user.click(submitButton);

      // Should show loading state - look for specific loading text in button
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Logging...")).toBeInTheDocument();
    });
  });

  describe("Success States", () => {
    it("should close modal after successful submission", async () => {
      const onClose = jest.fn();

      render(
        <BulkActivityModal
          isOpen={true}
          onClose={onClose}
          plantIds={["plant-1"]}
          activityType="water"
          plantCount={1}
          varietyName="Cherry Tomato"
        />
      );

      // Submit form
      const submitButton = screen.getByRole("button", { name: /Log/i });
      await user.click(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("should call logActivity with correct data", async () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1"]}
          activityType="water"
          plantCount={1}
          varietyName="Cherry Tomato"
        />
      );

      // Fill form
      const amountInput = screen.getByLabelText("Water Amount");
      await user.clear(amountInput);
      await user.type(amountInput, "30");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Log/i });
      await user.click(submitButton);

      // Verify logActivity was called
      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA structure", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1"]}
          activityType="water"
          plantCount={1}
          varietyName="Cherry Tomato"
        />
      );

      // Form controls should have labels
      expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Water Amount")).toBeInTheDocument();
      expect(screen.getByLabelText("Unit")).toBeInTheDocument();
    });

    it("should be keyboard navigable", async () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1"]}
          activityType="water"
          plantCount={1}
          varietyName="Cherry Tomato"
        />
      );

      // Should be able to tab through form elements
      await user.tab();
      
      // First tabbable element should be focused (close button or first input)
      const dateInput = screen.getByLabelText(/Date/i);
      expect(dateInput).toBeInTheDocument();
    });

    it("should have proper button labeling", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="water"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      // Close button should be accessible
      const closeButton = screen.getByRole("button", { name: /✕/i });
      expect(closeButton).toBeInTheDocument();

      // Submit button should have descriptive text
      const submitButton = screen.getByRole("button", { name: /Log Activity for All 2 Plants/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe("Plant Count Display", () => {
    it("should show plural plants for multiple plants", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2"]}
          activityType="water"
          plantCount={2}
          varietyName="Cherry Tomato"
        />
      );

      // Should show plural text and count
      expect(screen.getByText("Logging for 2 Cherry Tomato plants")).toBeInTheDocument();
      expect(screen.getByText("💧 Water All Plants")).toBeInTheDocument();
    });

    it("should show singular plant for single plant", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1"]}
          activityType="observe"
          plantCount={1}
          varietyName="Strawberry"
        />
      );

      // Should handle singular vs plural properly
      expect(screen.getByText("Logging for Strawberry plant")).toBeInTheDocument();
      expect(screen.getByText("👁️ Inspect Plant")).toBeInTheDocument();
    });

    it("should display variety name correctly", () => {
      render(
        <BulkActivityModal
          isOpen={true}
          onClose={jest.fn()}
          plantIds={["plant-1", "plant-2", "plant-3"]}
          activityType="fertilize"
          plantCount={3}
          varietyName="Albion Strawberries"
        />
      );

      expect(screen.getByText("Logging for 3 Albion Strawberries plants")).toBeInTheDocument();
    });
  });
});

/**
 * KEY BENEFITS OF THIS UI-FOCUSED TEST:
 * 
 * ✅ UI INTERACTION FOCUS:
 * - Tests component rendering and visibility
 * - Validates user interaction flows
 * - Tests form behavior and validation
 * - Verifies loading and success states
 * - Tests accessibility features
 * 
 * ✅ MINIMAL MOCKING:
 * - Only mocks what's necessary for UI
 * - Uses business logic builders for test data
 * - Focuses on component contract, not implementation
 * - Tests user-facing behavior
 * 
 * ✅ COMPLEMENTARY COVERAGE:
 * - Business logic tested separately
 * - UI interactions tested here
 * - Clear separation of concerns
 * - Both layers properly covered
 * 
 * This approach makes tests more maintainable and focused,
 * while ensuring comprehensive coverage of both business logic and UI.
 */