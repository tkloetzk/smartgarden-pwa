// src/__tests__/components/PlantReminderSettings.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlantReminderSettings from "@/components/plant/PlantReminderSettings";
import { plantService } from "@/types/database";
import toast from "react-hot-toast";

// Mock the dependencies
jest.mock("@/types/database", () => ({
  plantService: {
    updatePlant: jest.fn(),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/components/plant/ReminderPreferencesSection", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ preferences, onChange }: any) => (
    <div data-testid="reminder-preferences-section">
      <button
        data-testid="toggle-watering"
        onClick={() =>
          onChange({ ...preferences, watering: !preferences.watering })
        }
      >
        Toggle Watering: {preferences.watering ? "ON" : "OFF"}
      </button>
    </div>
  ),
}));

const mockPlantService = plantService as jest.Mocked<typeof plantService>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("PlantReminderSettings", () => {
  const mockPlant = {
    id: "test-plant-1",
    varietyId: "tomato-1",
    varietyName: "Roma Tomato",
    name: "My Tomato",
    plantedDate: new Date("2024-01-01"),
    currentStage: "vegetative" as const,
    location: "Indoor",
    container: "5 gallon pot",
    isActive: true,
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    reminderPreferences: {
      watering: true,
      fertilizing: true,
      observation: false,
      lighting: true,
      pruning: false,
    },
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlantService.updatePlant.mockResolvedValue(undefined);
  });

  it("renders with current plant preferences", () => {
    render(<PlantReminderSettings plant={mockPlant} onUpdate={mockOnUpdate} />);

    expect(
      screen.getByTestId("reminder-preferences-section")
    ).toBeInTheDocument();
    expect(screen.getByText("Toggle Watering: ON")).toBeInTheDocument();
  });

  it("shows 'No Changes' button when preferences haven't changed", () => {
    render(<PlantReminderSettings plant={mockPlant} onUpdate={mockOnUpdate} />);

    const saveButton = screen.getByRole("button", { name: /no changes/i });
    expect(saveButton).toBeDisabled();
  });

  it("shows 'Save Changes' button when preferences change", async () => {
    const user = userEvent.setup();

    render(<PlantReminderSettings plant={mockPlant} onUpdate={mockOnUpdate} />);

    // Toggle watering preference
    const toggleButton = screen.getByTestId("toggle-watering");
    await user.click(toggleButton);

    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  it("saves preferences successfully", async () => {
    const user = userEvent.setup();

    render(<PlantReminderSettings plant={mockPlant} onUpdate={mockOnUpdate} />);

    // Change a preference
    const toggleButton = screen.getByTestId("toggle-watering");
    await user.click(toggleButton);

    // Click save
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockPlantService.updatePlant).toHaveBeenCalledWith(
        "test-plant-1",
        {
          reminderPreferences: {
            watering: false, // Should be toggled
            fertilizing: true,
            observation: false,
            lighting: true,
            pruning: false,
          },
          updatedAt: expect.any(Date),
        }
      );
    });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockPlant,
      reminderPreferences: {
        watering: false,
        fertilizing: true,
        observation: false,
        lighting: true,
        pruning: false,
      },
    });

    expect(mockToast.success).toHaveBeenCalledWith(
      "Reminder preferences updated!"
    );
  });

  it("handles save errors gracefully", async () => {
    const user = userEvent.setup();
    mockPlantService.updatePlant.mockRejectedValue(new Error("Database error"));

    render(<PlantReminderSettings plant={mockPlant} onUpdate={mockOnUpdate} />);

    // Change a preference
    const toggleButton = screen.getByTestId("toggle-watering");
    await user.click(toggleButton);

    // Click save
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Failed to update preferences"
      );
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it("shows loading state during save", async () => {
    const user = userEvent.setup();

    // Make updatePlant hang
    mockPlantService.updatePlant.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<PlantReminderSettings plant={mockPlant} onUpdate={mockOnUpdate} />);

    // Change a preference
    const toggleButton = screen.getByTestId("toggle-watering");
    await user.click(toggleButton);

    // Click save
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    // Should show loading state
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it("uses default preferences when plant has none", () => {
    const plantWithoutPreferences = {
      ...mockPlant,
      reminderPreferences: undefined,
    };

    render(
      <PlantReminderSettings
        plant={plantWithoutPreferences}
        onUpdate={mockOnUpdate}
      />
    );

    // Should default to all true, so button shows "ON"
    expect(screen.getByText("Toggle Watering: ON")).toBeInTheDocument();
  });
});
