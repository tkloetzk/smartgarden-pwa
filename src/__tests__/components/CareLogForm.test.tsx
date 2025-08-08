// src/__tests__/components/CareLogForm.updated.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { format } from "date-fns";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";

// Mock dependencies
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/hooks/useFirebaseCareActivities");
jest.mock("react-hot-toast");
jest.mock("@/utils/plantGrouping");

const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
const mockUseFirebaseCareActivities = useFirebaseCareActivities as jest.Mock;
const mockLogActivity = jest.fn();

// Mock plant grouping utility
import { groupPlantsByConditions } from "@/utils/plantGrouping";
const mockGroupPlantsByConditions = groupPlantsByConditions as jest.Mock;

const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ["/log-care"]
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

describe("CareLogForm", () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseFirebasePlants.mockReturnValue({
      plants: [],
      loading: false,
      error: null,
    });

    mockUseFirebaseCareActivities.mockReturnValue({
      logActivity: mockLogActivity,
    });

    mockLogActivity.mockResolvedValue(undefined);

    mockGroupPlantsByConditions.mockReturnValue([]);
  });

  describe("Loading States", () => {
    it("shows loading spinner when plants are loading", () => {
      mockUseFirebasePlants.mockReturnValue({
        plants: [],
        loading: true,
        error: null,
      });

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("renders form when plants finish loading", () => {
      mockUseFirebasePlants.mockReturnValue({
        plants: [],
        loading: false,
        error: null,
      });

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // The form should be rendered (not showing loading spinner)
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
      // Should show form elements
      expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    beforeEach(() => {
      const mockPlantGroups = [
        {
          id: "group-test-tomato",
          varietyName: "Tomato",
          plants: [
            { id: "plant1", varietyName: "Tomato", container: "Container 1" },
            { id: "plant2", varietyName: "Tomato", container: "Container 1" },
          ],
        },
      ];

      mockUseFirebasePlants.mockReturnValue({
        plants: mockPlantGroups[0].plants,
        loading: false,
        error: null,
      });

      mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);
    });

    it("submit button starts enabled but form validates on submit", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // The component may not disable the button, but should prevent invalid submission
      const submitButton = screen.getByRole("button", {
        name: /log activity/i,
      });
      expect(submitButton).toBeInTheDocument();

      // Try to submit without selecting anything - should not call mockLogActivity
      await user.click(submitButton);
      expect(mockLogActivity).not.toHaveBeenCalled();
    });

    it("validates required fields before submission", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Select a plant group
      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      // Component may not disable the button, but should prevent invalid submission
      const submitButton = screen.getByRole("button", {
        name: /log activity/i,
      });
      await user.click(submitButton);

      // Should not call mockLogActivity without activity type selection
      expect(mockLogActivity).not.toHaveBeenCalled();
    });

    it("enables submit button when required fields are filled", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Select plant group
      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      // Select activity type
      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      // Submit button should now be enabled
      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /log activity/i,
        });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("prevents future dates", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // The date input should have a max attribute that prevents future dates
      const dateInput = screen.getByLabelText(/date/i);
      const maxDate = dateInput.getAttribute("max");
      expect(maxDate).toBe(format(new Date(), "yyyy-MM-dd"));
    }, 10000);
  });

  describe("Activity Types", () => {
    beforeEach(() => {
      const mockPlantGroups = [
        {
          id: "group-test-tomato",
          varietyName: "Tomato",
          plants: [{ id: "plant1", varietyName: "Tomato" }],
        },
      ];

      mockUseFirebasePlants.mockReturnValue({
        plants: mockPlantGroups[0].plants,
        loading: false,
        error: null,
      });

      mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);
    });

    it("shows water-specific fields when water activity is selected", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "water");

      await waitFor(() => {
        expect(screen.getByLabelText(/water amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/moisture level/i)).toBeInTheDocument();
      });
    });

    it("shows fertilize-specific fields when fertilize activity is selected", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(
        () => {
          // Look for the fertilizer card header
          expect(screen.getByText(/fertilizer details/i)).toBeInTheDocument();
          expect(screen.getByText(/fertilizer product/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    }, 10000);

    it("does not show activity-specific fields for observe activity", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      // Observe activity doesn't show specific fields, just has the general form
      expect(screen.getByLabelText(/notes.*optional/i)).toBeInTheDocument();
      // Should not show water or fertilizer specific fields
      expect(screen.queryByText(/water amount/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/fertilizer details/i)).not.toBeInTheDocument();
    });

    it("does not show activity-specific fields for photo activity", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "photo");

      // Photo activity doesn't show specific fields, just has the general form
      expect(screen.getByLabelText(/notes.*optional/i)).toBeInTheDocument();
      // Should not show water or fertilizer specific fields
      expect(screen.queryByText(/water amount/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/fertilizer details/i)).not.toBeInTheDocument();
    });

    it("shows note-specific fields when note activity is selected", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "note");

      await waitFor(() => {
        expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      });
    });

    it("does not show activity-specific fields for pruning activity", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "pruning");

      // Pruning activity doesn't show specific fields, just has the general form
      expect(screen.getByLabelText(/notes.*optional/i)).toBeInTheDocument();
      // Should not show water or fertilizer specific fields
      expect(screen.queryByText(/water amount/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/fertilizer details/i)).not.toBeInTheDocument();
    });
  });

  describe("Group-Based Plant Selection", () => {
    it("displays plant groups correctly", async () => {
      const mockPlantGroups = [
        {
          id: "group-tomato-large",
          varietyName: "Tomato",
          plants: [
            { id: "plant1", varietyName: "Tomato" },
            { id: "plant2", varietyName: "Tomato" },
            { id: "plant3", varietyName: "Tomato" },
          ],
        },
        {
          id: "group-basil-small",
          varietyName: "Basil",
          plants: [{ id: "plant4", varietyName: "Basil" }],
        },
      ];

      mockUseFirebasePlants.mockReturnValue({
        plants: [...mockPlantGroups[0].plants, ...mockPlantGroups[1].plants],
        loading: false,
        error: null,
      });

      mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Should show both plant groups
      expect(screen.getByText(/tomato.*3 plants/i)).toBeInTheDocument();
      expect(screen.getByText(/basil.*1 plant/i)).toBeInTheDocument();
    });

    it("handles single plant groups appropriately", async () => {
      const mockPlantGroups = [
        {
          id: "group-single-plant",
          varietyName: "Lettuce",
          plants: [{ id: "plant1", varietyName: "Lettuce" }],
        },
      ];

      mockUseFirebasePlants.mockReturnValue({
        plants: mockPlantGroups[0].plants,
        loading: false,
        error: null,
      });

      mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/lettuce.*1 plant/i)).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    beforeEach(() => {
      const mockPlantGroups = [
        {
          id: "group-test-tomato",
          varietyName: "Tomato",
          plants: [{ id: "plant1", varietyName: "Tomato" }],
        },
      ];

      mockUseFirebasePlants.mockReturnValue({
        plants: mockPlantGroups[0].plants,
        loading: false,
        error: null,
      });

      mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);
    });

    it("successfully submits observe activity", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Fill required fields
      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      // Submit form without requiring additional fields for observe
      const submitButton = screen.getByRole("button", {
        name: /log activity/i,
      });

      // Wait for submit button to be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalled();
      });
    }, 10000);

    it("shows success message after successful submission", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Fill and submit form
      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      const submitButton = screen.getByRole("button", {
        name: /log activity/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("handles submission errors gracefully", async () => {
      mockLogActivity.mockRejectedValueOnce(new Error("Submission failed"));

      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Fill and submit form
      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-test-tomato");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      const submitButton = screen.getByRole("button", {
        name: /log activity/i,
      });

      // Wait for button to be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      // Verify that mockLogActivity was called but failed
      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalled();
      });

      // onSuccess should not be called when there's an error
      expect(mockOnSuccess).not.toHaveBeenCalled();
    }, 10000);
  });

  describe("URL Parameter Handling", () => {
    it("pre-selects activity type from URL parameters", () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />, [
        "/log-care?activityType=water",
      ]);

      const activitySelect = screen.getByLabelText(
        /activity type/i
      ) as HTMLSelectElement;
      expect(activitySelect.value).toBe("water");
    });

    it("pre-selects plant group when preselectedPlantId is provided", async () => {
      const mockPlantGroups = [
        {
          id: "group-test-plant",
          varietyName: "Tomato",
          plants: [{ id: "specific-plant-id", varietyName: "Tomato" }],
        },
      ];

      mockUseFirebasePlants.mockReturnValue({
        plants: mockPlantGroups[0].plants,
        loading: false,
        error: null,
      });

      mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);

      renderWithRouter(
        <CareLogForm
          onSuccess={mockOnSuccess}
          preselectedPlantId="specific-plant-id"
        />
      );

      await waitFor(() => {
        const groupSelect = screen.getByLabelText(
          /plant section/i
        ) as HTMLSelectElement;
        expect(groupSelect.value).toBe("group-test-plant");
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      const mockPlantGroups = [
        {
          id: "group-test-tomato",
          varietyName: "Tomato",
          plants: [{ id: "plant1", varietyName: "Tomato" }],
        },
      ];

      mockUseFirebasePlants.mockReturnValue({
        plants: mockPlantGroups[0].plants,
        loading: false,
        error: null,
      });

      mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);
    });

    it("has proper form labels and ARIA attributes", () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/plant section.*\*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/activity type.*\*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date.*\*/i)).toBeInTheDocument();

      const submitButton = screen.getByRole("button", {
        name: /log activity/i,
      });
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("supports keyboard navigation through form fields", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      const groupSelect = screen.getByLabelText(/plant section/i);
      const activitySelect = screen.getByLabelText(/activity type/i);
      const dateInput = screen.getByLabelText(/date/i);

      // Tab through form fields
      await user.tab();
      expect(groupSelect).toHaveFocus();

      await user.tab();
      expect(activitySelect).toHaveFocus();

      await user.tab();
      expect(dateInput).toHaveFocus();
    });
  });
});
