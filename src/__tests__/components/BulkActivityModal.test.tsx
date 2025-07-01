import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BulkActivityModal from "@/components/plant/BulkActivityModal";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import toast from "react-hot-toast";

// Mock the hook and toast
jest.mock("@/hooks/useFirebaseCareActivities");
jest.mock("react-hot-toast");

const mockLogActivity = jest.fn();

describe("BulkActivityModal", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    (useFirebaseCareActivities as jest.Mock).mockReturnValue({
      logActivity: mockLogActivity,
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

  it("renders the correct title and inputs for fertilizing a single plant", () => {
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
              amount: { value: NaN, unit: "oz" },
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
              amount: { value: -5, unit: "oz" },
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
        expect(toast.error).toHaveBeenCalledWith("Failed to log activities");
        expect(consoleSpy).toHaveBeenCalledWith(
          "Activity logging error:",
          mockError
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
