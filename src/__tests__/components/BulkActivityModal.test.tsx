import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import toast from "react-hot-toast";
// Mock the hooks and toast
jest.mock("@/hooks/useFirebaseCareActivities");
jest.mock("@/hooks/useFirebasePlants");
jest.mock("react-hot-toast");

const mockLogActivity = jest.fn();

describe("BulkActivityModal", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFirebaseCareActivities as jest.Mock).mockReturnValue({
      logActivity: mockLogActivity,
    });
    (useFirebasePlants as jest.Mock).mockReturnValue({
      plants: [
        {
          id: "plant-1",
          varietyName: "Cherry Tomato",
          plantedDate: new Date("2025-01-01"),
        },
        {
          id: "plant-2", 
          varietyName: "Cherry Tomato",
          plantedDate: new Date("2025-01-01"),
        }
      ],
    });
    mockLogActivity.mockResolvedValue(undefined);
  });

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    plantIds: ["plant-1", "plant-2"],
    plantCount: 2,
    varietyName: "Cherry Tomato",
  };

  it("does not render when isOpen is false", () => {
    render(
      <BulkActivityModal
        {...defaultProps}
        isOpen={false}
        activityType="water"
      />
    );
    expect(screen.queryByText("💧 Water All Plants")).not.toBeInTheDocument();
  });

  it("renders the correct title for watering multiple plants", () => {
    render(<BulkActivityModal {...defaultProps} activityType="water" />);
    expect(screen.getByText("💧 Water All Plants")).toBeInTheDocument();
    expect(
      screen.getByText("Logging for 2 Cherry Tomato plants")
    ).toBeInTheDocument();
  });

  // Outdated
  it.skip("renders the correct title and inputs for fertilizing a single plant", () => {
    render(
      <BulkActivityModal
        {...defaultProps}
        plantCount={1}
        activityType="fertilize"
      />
    );
    expect(screen.getByText("🌱 Fertilize Plant")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
  });

  it("calls logActivity for each plant ID on submit", async () => {
    const mockOnClose = jest.fn();
    render(
      <BulkActivityModal
        {...defaultProps}
        activityType="water"
        onClose={mockOnClose}
      />
    );

    const amountInput = screen.getByLabelText(/Amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, "50");

    const submitButton = screen.getByRole("button", {
      name: /Log Activity for All 2 Plants/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogActivity).toHaveBeenCalledTimes(2);
      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({ plantId: "plant-1", type: "water" })
      );
      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({ plantId: "plant-2", type: "water" })
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Activity logged for all 2 Cherry Tomato plants! 🌱"
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it("disables submit button while submitting", async () => {
    // Make the mock promise never resolve to test loading state
    mockLogActivity.mockImplementation(() => new Promise(() => {}));
    render(<BulkActivityModal {...defaultProps} activityType="water" />);

    const submitButton = screen.getByRole("button", { name: /Log Activity/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Logging...")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const mockOnClose = jest.fn();
    render(
      <BulkActivityModal
        {...defaultProps}
        activityType="observe"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole("button", { name: "✕" });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  it("renders correctly for observe activity type", () => {
    render(<BulkActivityModal {...defaultProps} activityType="observe" />);
    expect(screen.getByText("👁️ Inspect All Plants")).toBeInTheDocument();
    // Should not show amount input for observe
    expect(screen.queryByLabelText(/Amount/i)).not.toBeInTheDocument();
  });
  describe("form validation", () => {
    it("handles empty amount input gracefully", async () => {
      render(<BulkActivityModal {...defaultProps} activityType="water" />);

      const amountInput = screen.getByLabelText(/Amount \(oz\)/i);
      await user.clear(amountInput);

      const submitButton = screen.getByRole("button", {
        name: /Log Activity for All 2 Plants/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.objectContaining({
              waterAmount: NaN,
              waterUnit: "oz",
            }),
          })
        );
      });
    });

    it("handles negative amount values", async () => {
      render(<BulkActivityModal {...defaultProps} activityType="water" />);

      const amountInput = screen.getByLabelText(/Amount \(oz\)/i);
      await user.clear(amountInput);
      await user.type(amountInput, "-5");

      const submitButton = screen.getByRole("button", {
        name: /Log Activity for All 2 Plants/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.objectContaining({
              waterAmount: -5,
              waterUnit: "oz",
            }),
          })
        );
      });
    });
  });
  it("successfully completes full water logging flow", async () => {
    const mockOnClose = jest.fn();
    render(
      <BulkActivityModal
        {...defaultProps}
        activityType="water"
        onClose={mockOnClose}
      />
    );

    // Fill form
    const amountInput = screen.getByLabelText(/Amount \(oz\)/i);
    await user.clear(amountInput);
    await user.type(amountInput, "30");

    const notesInput = screen.getByLabelText(/Notes/i);
    await user.type(notesInput, "Morning watering");

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /Log Activity for All 2 Plants/i,
    });
    await user.click(submitButton);

    // Verify complete flow
    await waitFor(() => {
      expect(mockLogActivity).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith(
        "Activity logged for all 2 Cherry Tomato plants! 🌱"
      );
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
  // src/__tests__/components/BulkActivityModal.test.tsx

  //... keep your existing imports and mocks

  describe("Fertilizer Logging in Modal", () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    // Base props for the fertilizer modal tests
    const fertilizerProps = {
      isOpen: true,
      onClose: mockOnClose,
      plantIds: ["plant-1"],
      plantCount: 1,
      varietyName: "Cherry Tomato",
      activityType: "fertilize" as const,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (useFirebaseCareActivities as jest.Mock).mockReturnValue({
        logActivity: mockLogActivity,
      });
      (useFirebasePlants as jest.Mock).mockReturnValue({
        plants: [
          {
            id: "plant-1",
            varietyName: "Cherry Tomato",
            plantedDate: new Date("2025-01-01"),
          }
        ],
      });
      mockLogActivity.mockResolvedValue(undefined);
    });

    it("successfully submits with standard fertilizer options", async () => {
      render(<BulkActivityModal {...fertilizerProps} />);

      // 1. Find and select options from the new dropdowns
      await user.selectOptions(
        screen.getByLabelText(/Fertilizer Product/i),
        "fish-emulsion"
      );
      await user.selectOptions(
        screen.getByLabelText(/Dilution\/Application Rate/i),
        "1:5"
      );
      await user.selectOptions(
        screen.getByLabelText(/Application Method/i),
        "soil-drench"
      );

      // 2. Submit the form
      const submitButton = screen.getByRole("button", {
        name: "Log Fertilizing",
      });
      await user.click(submitButton);

      // 3. Assert that logActivity was called with the selected values
      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.objectContaining({
              // FIX: Use the 'value' attributes from your <option> tags
              product: "fish-emulsion",
              dilution: "1:5", // Not "1:5 (Standard feeding)"
              applicationMethod: "soil-drench",
            }),
          })
        );
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it.skip("shows and submits a custom amount when 'Custom' dilution is selected", async () => {
      render(<BulkActivityModal {...fertilizerProps} />);

      // 1. Select the 'Custom amount' option to reveal the new input
      await user.selectOptions(
        screen.getByLabelText(/Dilution\/Application Rate/i),
        "custom"
      );

      // 2. Wait for the custom input to appear
      const customAmountInput = await screen.findByLabelText(
        /Custom Amount\/Dilution/i
      );
      expect(customAmountInput).toBeInTheDocument();

      // 3. FIX: Clear the input before typing the new value
      await user.clear(customAmountInput);
      await user.type(customAmountInput, "One small scoop");

      // 4. Select other options and submit
      await user.selectOptions(
        screen.getByLabelText(/Application Method/i),
        "top-dress"
      );
      await user.click(screen.getByRole("button", { name: "Log Fertilizing" }));

      // 5. Assert that the correct custom amount was submitted
      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.objectContaining({
              applicationMethod: "top-dress",
              amount: "One small scoop", // This will now match
            }),
          })
        );
      });
    });
  });
  describe("error scenarios", () => {
    it("displays error toast when logActivity fails", async () => {
      const mockError = new Error("Network error");
      mockLogActivity.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      render(<BulkActivityModal {...defaultProps} activityType="water" />);

      const submitButton = screen.getByRole("button", {
        name: /Log Activity for All 2 Plants/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to log activity. Please try again.");
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to log bulk activity:",
          mockError
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
