import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { initializeDatabase } from "@/db/seedData";
import { plantService } from "@/types/database";

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
  beforeEach(async () => {
    await initializeDatabase();
    const { db } = await import("@/types/database");
    await db.plants.clear();
  });

  it("pre-selects plant when preselectedPlantId is provided", async () => {
    const plantId = await plantService.addPlant({
      varietyId: "test-variety",
      varietyName: "Test Variety",
      name: "Test Plant",
      plantedDate: new Date(),
      location: "Location 1",
      container: "Container 1",
      currentStage: "vegetative",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();

    renderWithRouter(
      <CareLogForm onSuccess={mockOnSuccess} preselectedPlantId={plantId} />
    );

    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
      expect(plantSelect.value).toBe(plantId);
    });
  });

  it("shows normal plant selection when no preselectedPlantId is provided", async () => {
    await plantService.addPlant({
      varietyId: "test-variety",
      varietyName: "Test Variety",
      name: "Test Plant",
      plantedDate: new Date(),
      location: "Location 1",
      container: "Container 1",
      currentStage: "vegetative",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();

    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for plants to load first
    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
      expect(plantSelect.value).toBe("");
    });

    // Then check that the plant option appears
    await waitFor(() => {
      expect(screen.getByText("Test Plant - Location 1")).toBeInTheDocument();
    });
  });

  it("allows user to change pre-selected plant", async () => {
    const plant1Id = await plantService.addPlant({
      varietyId: "test-variety-1",
      varietyName: "Plant One",
      name: "Plant One",
      plantedDate: new Date(),
      location: "Location 1",
      container: "Container 1",
      currentStage: "vegetative",
      isActive: true,
    });

    const plant2Id = await plantService.addPlant({
      varietyId: "test-variety-2",
      varietyName: "Plant Two",
      name: "Plant Two",
      plantedDate: new Date(),
      location: "Location 2",
      container: "Container 2",
      currentStage: "vegetative",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();

    renderWithRouter(
      <CareLogForm onSuccess={mockOnSuccess} preselectedPlantId={plant1Id} />
    );

    // Wait for plants to load
    await waitFor(() => {
      expect(screen.getByText("Plant One - Location 1")).toBeInTheDocument();
      expect(screen.getByText("Plant Two - Location 2")).toBeInTheDocument();
    });

    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
      expect(plantSelect.value).toBe(plant1Id);
    });

    const plantSelect = screen.getByLabelText(/Plant/i);
    await user.selectOptions(plantSelect, plant2Id);

    expect((plantSelect as HTMLSelectElement).value).toBe(plant2Id);
  });

  it("renders form with basic activity fields", async () => {
    const mockOnSuccess = jest.fn();

    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText("Log Care Activity")).toBeInTheDocument();
      expect(screen.getByLabelText(/Plant/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Activity Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    });

    expect(screen.getByText("💧 Watering")).toBeInTheDocument();
    expect(screen.getByText("🌱 Fertilizing")).toBeInTheDocument();
    expect(screen.getByText("👁️ Observation")).toBeInTheDocument();
  });

  it("shows watering fields when water activity is selected", async () => {
    const mockOnSuccess = jest.fn();

    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByText("Water Amount *")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();

    expect(screen.getByText("oz")).toBeInTheDocument();
    expect(screen.getByText("ml")).toBeInTheDocument();
    expect(screen.getByText("cups")).toBeInTheDocument();
  });

  it("displays proper plant formatting in dropdown options", async () => {
    await plantService.addPlant({
      varietyId: "test-variety",
      varietyName: "Cherry Tomato",
      name: "My Cherry Plant",
      plantedDate: new Date(),
      location: "Window Sill",
      container: "5 gallon pot",
      currentStage: "flowering",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();

    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      const expectedText = "My Cherry Plant - Window Sill";
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  it("handles plant without custom name correctly", async () => {
    await plantService.addPlant({
      varietyId: "test-variety",
      varietyName: "Roma Tomato",
      plantedDate: new Date(),
      location: "Greenhouse",
      container: "3 gallon pot",
      currentStage: "fruiting",
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
