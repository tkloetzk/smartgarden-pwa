// Add to src/__tests__/integration/plantDetailReminderSettings.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import PlantDetail from "@/pages/plants/PlantDetail";
import { plantService } from "@/types/database";

// Mock the route params
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ plantId: "test-plant-1" }),
  useNavigate: () => jest.fn(),
}));

describe("PlantDetail Reminder Settings Integration", () => {
  it("shows and hides reminder settings when settings button is clicked", async () => {
    const user = userEvent.setup();

    // Mock plant data
    jest.spyOn(plantService, "getPlant").mockResolvedValue({
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
    });

    render(
      <BrowserRouter>
        <PlantDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("My Tomato")).toBeInTheDocument();
    });

    // Settings section should not be visible initially
    expect(screen.queryByText("Notification Settings")).not.toBeInTheDocument();

    // Click settings button
    const settingsButton = screen.getByRole("button", { name: /settings/i });
    await user.click(settingsButton);

    // Settings section should now be visible
    await waitFor(() => {
      expect(screen.getByText("Notification Settings")).toBeInTheDocument();
    });

    // Click settings button again to hide
    await user.click(settingsButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Notification Settings")
      ).not.toBeInTheDocument();
    });
  });

  it.skip("displays active reminder preferences correctly", async () => {
    // Test that the active reminders summary shows correct badges
    // ... (implementation would test the badge display)
  });
});
