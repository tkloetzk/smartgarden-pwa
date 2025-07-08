// src/__tests__/components/CareLogForm.test.tsx
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CareLogForm } from "@/pages/care/CareLogForm";
import {
  initializeDatabase,
  resetDatabaseInitializationFlag,
} from "@/db/seedData";
import { PlantRecord } from "@/types/database";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import {
  createMockPlant,
  createPlantWithVariety,
} from "../utils/testDataFactories";

// Mocks
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/hooks/useFirebaseCareActivities");

const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
const mockUseFirebaseCareActivities = useFirebaseCareActivities as jest.Mock;
const mockLogActivity = jest.fn();

// Helper to render components with Router context
const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ["/log-care"]
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

// Helper function to set up the plants mock
const setupMockPlants = (plants: PlantRecord[]): void => {
  mockUseFirebasePlants.mockReturnValue({
    plants,
    loading: false,
    error: null,
  });
};

describe("CareLogForm", () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(async () => {
    // Reset database initialization flag
    resetDatabaseInitializationFlag();

    // Clear the database and reinitialize
    const { db } = await import("@/types/database");
    await db.delete();
    await db.open();
    await initializeDatabase();

    // Clear mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockUseFirebasePlants.mockReturnValue({
      plants: [],
      loading: false,
      error: null,
    });

    mockUseFirebaseCareActivities.mockReturnValue({
      logActivity: mockLogActivity,
    });

    mockLogActivity.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Clean up database after each test
    const { db } = await import("@/types/database");
    await db.delete();
  });

  describe("form validation", () => {
    it("shows validation error when no plant is selected", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // First touch the plant field to trigger validation mode
      const plantSelect = screen.getByLabelText(/Plant \*/i);
      await user.click(plantSelect);
      await user.tab(); // Move away to trigger onTouched

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Please select a plant")).toBeInTheDocument();
      });
    });

    it.skip("prevents submission when water amount is missing", async () => {
      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = screen.getByLabelText(/Plant/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      const activitySelect = screen.getByLabelText(/Activity Type/i);
      await user.selectOptions(activitySelect, "water");

      await waitFor(() => {
        expect(screen.getByLabelText(/Water Amount/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      // Verify submission was prevented
      await waitFor(() => {
        expect(mockLogActivity).not.toHaveBeenCalled();
      });

      // Verify error message appears (give it more time)
      await waitFor(
        () => {
          expect(
            screen.getByText(
              "Water amount is required for watering activities."
            )
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("accessibility", () => {
    it("has proper form labels and ARIA attributes", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/Plant \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Activity Type \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Date \*/i)).toBeInTheDocument();

      // Touch the plant field first to trigger validation, then submit
      const plantSelect = screen.getByLabelText(/Plant \*/i);
      await user.click(plantSelect);
      await user.tab(); // Move away to trigger onTouched

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText("Please select a plant");
        expect(errorMessage).toHaveAttribute("role", "alert");
      });
    });

    it("supports keyboard navigation through form fields", async () => {
      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await user.tab();
      expect(screen.getByLabelText(/Plant \*/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/Activity Type \*/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/Date \*/i)).toHaveFocus();
    });
  });

  describe("Validation Edge Cases", () => {
    it("should prevent future dates for care activities", async () => {
      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = screen.getByLabelText(/Plant/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      const activitySelect = screen.getByLabelText(/Activity Type/i);
      await user.selectOptions(activitySelect, "water");

      // Set date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split("T")[0];

      const dateInput = screen.getByLabelText(/Date \*/i);
      await user.clear(dateInput);
      await user.type(dateInput, futureDate);
      await user.tab(); // Trigger onTouched validation

      // Add required water amount
      await waitFor(() => {
        expect(screen.getByLabelText(/Water Amount/i)).toBeInTheDocument();
      });
      const waterAmountInput = screen.getByLabelText(/Water Amount/i);
      await user.type(waterAmountInput, "20");

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      // The form should NOT submit due to future date validation
      await waitFor(() => {
        // Check that the future date error appears
        expect(
          screen.getByText("Date cannot be in the future.")
        ).toBeInTheDocument();
      });

      // Verify the mock was NOT called due to validation failure
      expect(mockLogActivity).not.toHaveBeenCalled();
    });

    it("should validate moisture readings are 1-10", async () => {
      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = screen.getByLabelText(/Plant/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      const activitySelect = screen.getByLabelText(/Activity Type/i);
      await user.selectOptions(activitySelect, "water");

      const waterAmountInput = screen.getByLabelText(/Water Amount/i);
      await user.type(waterAmountInput, "20");

      // Enable detailed tracking to show moisture fields
      const detailedTrackingCheckbox = screen.getByLabelText(
        /Track moisture levels/i
      );
      await user.click(detailedTrackingCheckbox);

      await waitFor(() => {
        expect(
          screen.getByText(/Moisture Before \(1-10\)/i)
        ).toBeInTheDocument();
      });

      // Get all moisture inputs and select the first one specifically
      const moistureInputs = screen.getAllByPlaceholderText("1-10");
      const moistureBeforeField = moistureInputs[0]; // First is "before"

      await user.type(moistureBeforeField, "11"); // Above max

      // Verify HTML validation attributes exist
      expect(moistureBeforeField).toHaveAttribute("max", "10");
      expect(moistureBeforeField).toHaveAttribute("min", "1");

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      // HTML validation should prevent submission, but since we can't test browser validation,
      // we verify the constraints are in place
      expect((moistureBeforeField as HTMLInputElement).max).toBe("10");
      expect((moistureBeforeField as HTMLInputElement).min).toBe("1");
    });

    it.skip("should handle very large water amounts gracefully", async () => {
      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = screen.getByLabelText(/Plant/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      const activitySelect = screen.getByLabelText(/Activity Type/i);
      await user.selectOptions(activitySelect, "water");

      // Wait for the watering details section to appear
      await waitFor(() => {
        expect(screen.getByText("Watering Details")).toBeInTheDocument();
        expect(screen.getByLabelText(/Water Amount/i)).toBeInTheDocument();
      });

      const waterAmountInput = screen.getByLabelText(/Water Amount/i);
      await user.clear(waterAmountInput); // Clear any existing value
      await user.type(waterAmountInput, "999999");

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      // Should accept large amounts since no validation is implemented
      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            plantId: mockPlant.id,
            type: "water",
            details: expect.objectContaining({
              amount: { value: 999999, unit: "oz" },
            }),
          })
        );
      });
    });
  });

  describe("rendering", () => {
    it("renders form with basic fields", () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/Plant \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Activity Type \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Date \*/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Log Activity/i })
      ).toBeInTheDocument();
    });

    it("does not render when plants are loading", () => {
      mockUseFirebasePlants.mockReturnValue({
        plants: [],
        loading: true,
        error: null,
      });

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("plant selection", () => {
    it("pre-selects plant when preselectedPlantId is provided", async () => {
      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);

      renderWithRouter(
        <CareLogForm
          onSuccess={mockOnSuccess}
          preselectedPlantId={mockPlant.id}
        />
      );

      await waitFor(() => {
        const plantSelect = screen.getByLabelText(
          /Plant/i
        ) as HTMLSelectElement;
        expect(plantSelect.value).toBe(mockPlant.id);
      });
    });

    it("shows normal plant selection when no preselectedPlantId is provided", async () => {
      const mockPlant = await createMockPlant({
        name: "My Tomato",
        varietyName: "Cherry Tomato",
        location: "Greenhouse",
      });
      setupMockPlants([mockPlant]);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        const plantSelect = screen.getByLabelText(
          /Plant/i
        ) as HTMLSelectElement;
        expect(plantSelect.value).toBe("");
      });

      expect(
        screen.getByText("My Tomato (Cherry Tomato) - Greenhouse")
      ).toBeInTheDocument();
    });

    it("handles plants without custom name correctly", async () => {
      const mockPlant = await createMockPlant({
        name: undefined, // No custom name
        varietyName: "Cherry Tomato",
        location: "Greenhouse",
      });
      setupMockPlants([mockPlant]);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(
          screen.getByText("Cherry Tomato - Greenhouse")
        ).toBeInTheDocument();
      });
    });
  });

  describe("activity types", () => {
    let mockPlant: PlantRecord;

    beforeEach(async () => {
      mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);
    });

    it("shows watering fields when water activity is selected", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = screen.getByLabelText(/Plant/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      const activitySelect = screen.getByLabelText(/Activity Type/i);
      await user.selectOptions(activitySelect, "water");

      await waitFor(() => {
        expect(screen.getByText("Watering Details")).toBeInTheDocument();
        expect(screen.getByLabelText(/Water Amount/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue("oz")).toBeInTheDocument();
      });
    });

    it("shows fertilize activity fields correctly", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = screen.getByLabelText(/Plant/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      const activitySelect = screen.getByLabelText(/Activity Type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText("Fertilizer Details")).toBeInTheDocument();
        expect(
          screen.getByLabelText(/Fertilizer Product/i)
        ).toBeInTheDocument();
      });
    });

    it("shows observe activity with minimal fields", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = screen.getByLabelText(/Plant/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      const activitySelect = screen.getByLabelText(/Activity Type/i);
      await user.selectOptions(activitySelect, "observe");

      // For observe, no special fields should appear - only the basic form
      await waitFor(() => {
        // Should NOT show watering or fertilizer specific fields
        expect(screen.queryByText("Watering Details")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Fertilizer Details")
        ).not.toBeInTheDocument();
        // Should still have the notes field
        expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
      });
    });
  });

  describe.skip("form submission", () => {
    it("successfully submits water activity with correct data structure", async () => {
      const mockOnSuccess = jest.fn();
      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);
      const user = userEvent.setup();

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = await screen.findByLabelText(/Plant \*/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      // Wait for the dependent UI to update after selecting a plant
      const waterAmountInput = await screen.findByLabelText(/Water Amount/i);

      // Explicitly clear the input before typing
      await user.clear(waterAmountInput);
      await user.type(waterAmountInput, "25");

      const waterUnitSelect = await screen.findByDisplayValue("oz");
      await user.selectOptions(waterUnitSelect, "ml");

      const notesInput = screen.getByLabelText(/Notes/i);
      await user.type(notesInput, "Morning watering session");

      // Tab away to ensure blur events fire and state updates are processed
      await user.tab();

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        // The assertion should now pass
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            plantId: mockPlant.id,
            type: "water",
            details: expect.objectContaining({
              amount: { value: 25, unit: "ml" },
            }),
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it.skip("handles submission errors gracefully", async () => {
      const mockError = new Error("Network error");
      mockLogActivity.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const plantSelect = screen.getByLabelText(/Plant/i);
      await user.selectOptions(plantSelect, mockPlant.id);

      const waterAmountInput = screen.getByLabelText(/Water Amount/i);
      await user.type(waterAmountInput, "20");

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to log care activity/i)
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it.skip("disables form and shows loading state during submission", async () => {
      // Mock the activity log to be a pending promise
      mockLogActivity.mockImplementation(() => new Promise(() => {}));

      const mockPlant = await createMockPlant();
      setupMockPlants([mockPlant]);
      const user = userEvent.setup();

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // 1. Fill out the form
      const plantSelect = await screen.findByLabelText(/Plant \*/i);
      await user.selectOptions(plantSelect, mockPlant.id);
      const waterAmountInput = screen.getByLabelText(/Water Amount/i);
      await user.type(waterAmountInput, "20");

      // 2. Click the submit button
      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      await user.click(submitButton);

      // 3. Find the button by its visible text content,
      //    which is more reliable than its accessible name in this case.
      const loggingButton = await screen.findByText(/Logging.../i);

      // 4. Assert that the button's parent element is disabled
      expect(loggingButton.closest("button")).toBeDisabled();

      // 5. You can also assert the spinner is visible to be thorough
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("URL parameter handling", () => {
    it("pre-selects activity type from URL parameters", () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />, [
        "/log-care?type=fertilize",
      ]);

      const activitySelect = screen.getByLabelText(
        /Activity Type/i
      ) as HTMLSelectElement;
      expect(activitySelect.value).toBe("fertilize");
    });

    it("handles both preselectedPlantId prop and URL param, with prop taking precedence", async () => {
      const plant1 = await createPlantWithVariety("Sugar Snap Peas");
      const plant2 = await createPlantWithVariety("Astro Arugula");
      setupMockPlants([plant1, plant2]);

      renderWithRouter(
        <CareLogForm
          onSuccess={mockOnSuccess}
          preselectedPlantId={plant1.id}
        />,
        [`/log-care?plantId=${plant2.id}`]
      );

      // Component should use the prop value (plant1), not the URL param (plant2)
      await waitFor(() => {
        const plantSelect = screen.getByLabelText(
          /Plant/i
        ) as HTMLSelectElement;
        expect(plantSelect.value).toBe(plant1.id);
      });
    });
  });
});
