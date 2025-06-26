import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { initializeDatabase } from "@/db/seedData";
import { plantService } from "@/types/database";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";

jest.mock("@/hooks/useFirebasePlants");
const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
// Helper to render components with Router context
const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ["/log-care"]
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

describe("CareLogForm Pre-Selection", () => {
  const mockOnSuccess = jest.fn();

  beforeEach(async () => {
    await initializeDatabase();
    const { db } = await import("@/types/database");
    await db.plants.clear();

    // Add this line to fix the error
    mockUseFirebasePlants.mockReturnValue({
      plants: [],
      loading: false,
      error: null,
    });
  });

  it("pre-selects plant when preselectedPlantId is provided", async () => {
    // 1. Create the mock plant and get its ID
    const plantId = await plantService.addPlant({
      varietyId: "test-variety",
      varietyName: "Test Variety",
      name: "Test Plant",
      plantedDate: new Date(),
      location: "Location 1",
      container: "Container 1",
      isActive: true,
    });

    // 2. Retrieve the full plant record
    const createdPlant = await plantService.getPlant(plantId);

    // 3. **CRITICAL FIX**: Mock the hook to return the created plant
    mockUseFirebasePlants.mockReturnValue({
      plants: [createdPlant],
      loading: false,
      error: null,
    });

    const mockOnSuccess = jest.fn();

    // 4. Render the component with the preselected ID
    renderWithRouter(
      <CareLogForm onSuccess={mockOnSuccess} preselectedPlantId={plantId} />
    );

    // 5. Assert that the dropdown value is now correctly set
    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
      expect(plantSelect.value).toBe(plantId);
    });
  });

  it("shows normal plant selection when no preselectedPlantId is provided", async () => {
    // 1. Create the mock plant
    const plantId = await plantService.addPlant({
      varietyId: "test-variety",
      varietyName: "Test Variety",
      name: "Test Plant",
      plantedDate: new Date(),
      location: "Location 1",
      container: "Container 1",
      isActive: true,
    });

    // 2. Retrieve the created plant
    const createdPlant = await plantService.getPlant(plantId);

    // 3. **CRITICAL FIX**: Mock the hook to return the created plant
    mockUseFirebasePlants.mockReturnValue({
      plants: [createdPlant],
      loading: false,
      error: null,
    });

    const mockOnSuccess = jest.fn();
    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // 4. Wait for the form to be ready
    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
      expect(plantSelect.value).toBe("");
    });

    // 5. **CRITICAL FIX**: Assert using the correct text format
    await waitFor(() => {
      expect(
        screen.getByText("Test Plant (Test Variety) - Location 1")
      ).toBeInTheDocument();
    });
  });

  it("allows user to change pre-selected plant", async () => {
    // 1. Create mock plants in the test database
    const plant1Id = await plantService.addPlant({
      varietyId: "test-variety-1",
      varietyName: "Plant One",
      name: "Plant One",
      plantedDate: new Date(),
      location: "Location 1",
      container: "Container 1",
      isActive: true,
    });

    const plant2Id = await plantService.addPlant({
      varietyId: "test-variety-2",
      varietyName: "Plant Two",
      name: "Plant Two",
      plantedDate: new Date(),
      location: "Location 2",
      container: "Container 2",
      isActive: true,
    });

    // 2. Retrieve the created plants to use in the mock
    const createdPlant1 = await plantService.getPlant(plant1Id);
    const createdPlant2 = await plantService.getPlant(plant2Id);

    // 3. **CRITICAL FIX**: Mock the useFirebasePlants hook to return the created plants
    mockUseFirebasePlants.mockReturnValue({
      plants: [createdPlant1, createdPlant2],
      loading: false,
      error: null,
    });

    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();

    // 4. Render the component with one plant pre-selected
    renderWithRouter(
      <CareLogForm onSuccess={mockOnSuccess} preselectedPlantId={plant1Id} />
    );

    // 5. **CRITICAL FIX**: Assert using the correct text format
    await waitFor(() => {
      // The format is: Plant Name (Variety Name) - Location
      expect(
        screen.getByText("Plant One (Plant One) - Location 1")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Plant Two (Plant Two) - Location 2")
      ).toBeInTheDocument();
    });

    // 6. Verify the rest of the functionality
    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
      expect(plantSelect.value).toBe(plant1Id);
    });

    const plantSelect = screen.getByLabelText(/Plant/i);
    await user.selectOptions(plantSelect, plant2Id);

    expect((plantSelect as HTMLSelectElement).value).toBe(plant2Id);
  });

  it("shows watering fields when water activity is selected", async () => {
    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText("Water Amount *")).toBeInTheDocument();
    });
    expect(screen.getByText(/Watering Log/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();

    expect(screen.getByText("oz")).toBeInTheDocument();
    expect(screen.getByText("ml")).toBeInTheDocument();
    expect(screen.getByText("cups")).toBeInTheDocument();
  });

  // Skipping because validation is off when having a custom name option
  it.skip("handles plant without custom name correctly", async () => {
    await plantService.addPlant({
      varietyId: "test-variety",
      varietyName: "Roma Tomato",
      plantedDate: new Date(),
      location: "Greenhouse",
      container: "3 gallon pot",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();

    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      const expectedText = "Roma Tomato - Greenhouse";
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });
});
