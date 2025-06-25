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

  it.skip("displays active reminder preferences correctly", async () => {
    // This test can be implemented next
  });
});
