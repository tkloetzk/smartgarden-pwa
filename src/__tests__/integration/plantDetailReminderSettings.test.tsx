import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import PlantDetail from "@/pages/plants/PlantDetail";
import { FirebasePlantService } from "@/services/firebase/plantService";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// Mock the entire FirebasePlantService
jest.mock("@/services/firebase/plantService");

// Mock the Firebase auth hook
jest.mock("@/hooks/useFirebaseAuth");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ plantId: "test-plant-1" }),
  useNavigate: () => jest.fn(),
}));

describe("PlantDetail Reminder Settings Integration", () => {
  beforeEach(() => {
    // Mock the return value for the useFirebaseAuth hook
    (useFirebaseAuth as jest.Mock).mockReturnValue({
      user: { uid: "test-user-id", displayName: "Test User" },
      loading: false,
    });
  });

  it("shows and hides reminder settings when settings button is clicked", async () => {
    const user = userEvent.setup();

    (
      FirebasePlantService.subscribeToPlantsChanges as jest.Mock
    ).mockImplementation((_, callback) => {
      const mockPlant = {
        id: "test-plant-1",
        varietyId: "tomato-1",
        varietyName: "Roma Tomato",
        name: "My Tomato",
        plantedDate: new Date(),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        reminderPreferences: {
          watering: true,
          fertilizing: false,
          observation: true,
          lighting: false,
          pruning: true,
        },
      };
      callback([mockPlant]);
      return jest.fn();
    });

    render(
      <BrowserRouter>
        <PlantDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /my tomato/i, level: 1 })
      ).toBeInTheDocument();
    });

    // Check for the correct text "Reminder Preferences"
    expect(screen.queryByText("Reminder Preferences")).not.toBeInTheDocument();

    const settingsButton = screen.getByRole("button", { name: /settings/i });
    await user.click(settingsButton);

    // Wait for the correct text "Reminder Preferences" to appear
    await waitFor(() => {
      expect(screen.getByText("Reminder Preferences")).toBeInTheDocument();
    });

    await user.click(settingsButton);

    // Wait for the correct text "Reminder Preferences" to disappear
    await waitFor(() => {
      expect(
        screen.queryByText("Reminder Preferences")
      ).not.toBeInTheDocument();
    });
  });

  it("displays active reminder preferences correctly", async () => {
    const user = userEvent.setup();

    // Set up a plant with specific reminder preferences for testing
    (
      FirebasePlantService.subscribeToPlantsChanges as jest.Mock
    ).mockImplementation((_, callback) => {
      const mockPlant = {
        id: "test-plant-1",
        varietyId: "tomato-1",
        varietyName: "Roma Tomato",
        name: "My Tomato",
        plantedDate: new Date(),
        currentStage: "vegetative",
        location: "Indoor",
        container: "5 gallon pot",
        isActive: true,
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        reminderPreferences: {
          watering: true,        // Should be enabled
          fertilizing: false,    // Should be disabled
          observation: true,     // Should be enabled
          lighting: false,       // Should be disabled
          pruning: true,         // Should be enabled
        },
      };
      callback([mockPlant]);
      return jest.fn();
    });

    render(
      <BrowserRouter>
        <PlantDetail />
      </BrowserRouter>
    );

    // Wait for plant to load
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /my tomato/i, level: 1 })
      ).toBeInTheDocument();
    });

    // Open the settings panel
    const settingsButton = screen.getByRole("button", { name: /settings/i });
    await user.click(settingsButton);

    // Wait for reminder preferences section to appear
    await waitFor(() => {
      expect(screen.getByText("Reminder Preferences")).toBeInTheDocument();
    });

    // Check that the preference labels are displayed
    expect(screen.getByText("Watering")).toBeInTheDocument();
    expect(screen.getByText("Fertilizing")).toBeInTheDocument();
    expect(screen.getByText("Health Checks")).toBeInTheDocument();
    expect(screen.getByText("Lighting")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();

    // Check that the correct switches are enabled/disabled
    // Note: We'll use the switch role and check their state
    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(5);

    // Get switches in order (watering, fertilizing, observation, lighting, pruning)
    // Since switches don't have proper aria-labels, we'll get them by position
    const [wateringSwitch, fertilizingSwitch, observationSwitch, lightingSwitch, pruningSwitch] = switches;

    // Verify the switch states match the plant's preferences
    expect(wateringSwitch).toBeChecked();      // true
    expect(fertilizingSwitch).not.toBeChecked(); // false
    expect(observationSwitch).toBeChecked();   // true
    expect(lightingSwitch).not.toBeChecked();  // false
    expect(pruningSwitch).toBeChecked();       // true

    // Verify descriptive text is present
    expect(screen.getByText("Get notified when watering is due")).toBeInTheDocument();
    expect(screen.getByText("Reminders for feeding schedule")).toBeInTheDocument();
    expect(screen.getByText("Regular observation reminders")).toBeInTheDocument();
    expect(screen.getByText("Light schedule adjustments")).toBeInTheDocument();
    expect(screen.getByText("Pruning and maintenance tasks")).toBeInTheDocument();
  });
});
