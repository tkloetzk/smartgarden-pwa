// src/__tests__/components/CareLogForm.test.tsx
import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { initializeDatabase } from "@/db/seedData";
import { plantService } from "@/types/database";

describe("CareLogForm Pre-Selection", () => {
  beforeEach(async () => {
    await initializeDatabase();
    // Clear any existing plants to ensure clean test state
    const { db } = await import("@/types/database");
    await db.plants.clear();
  });

  it("pre-selects plant when preselectedPlantId is provided", async () => {
    // Create a test plant with all required properties
    const testPlantId = await plantService.addPlant({
      varietyId: "test-variety-1",
      varietyName: "Test Plant",
      name: "My Test Plant",
      plantedDate: new Date(),
      location: "Test Location",
      container: "Container 1",
      currentStage: "vegetative",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();

    render(
      <CareLogForm onSuccess={mockOnSuccess} preselectedPlantId={testPlantId} />
    );

    // Wait for plants to load and form to render
    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i);
      expect(plantSelect).toBeInTheDocument();
    });

    // Verify the plant appears in the options
    await waitFor(() => {
      const option = screen.getByText("My Test Plant - Test Location");
      expect(option).toBeInTheDocument();
    });

    // Check if the plant is actually pre-selected in the dropdown
    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
      expect(plantSelect.value).toBe(testPlantId);
    });
  });

  it("shows normal plant selection when no preselectedPlantId is provided", async () => {
    const mockOnSuccess = jest.fn();

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for component to render
    await waitFor(() => {
      const defaultOption = screen.getByText("Select a plant...");
      expect(defaultOption).toBeInTheDocument();
    });

    // Verify no plant is pre-selected
    const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
    expect(plantSelect.value).toBe("");
  });

  it("allows user to change pre-selected plant", async () => {
    // Create two test plants
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

    render(
      <CareLogForm onSuccess={mockOnSuccess} preselectedPlantId={plant1Id} />
    );

    // Wait for plants to load and components to render
    await waitFor(() => {
      expect(screen.getByText("Plant One - Location 1")).toBeInTheDocument();
      expect(screen.getByText("Plant Two - Location 2")).toBeInTheDocument();
    });

    // Get the current value of the plant select after it loads and check for pre-selection
    await waitFor(() => {
      const plantSelect = screen.getByLabelText(/Plant/i) as HTMLSelectElement;
      expect(plantSelect.value).toBe(plant1Id);
    });

    // Change to different plant
    const plantSelect = screen.getByLabelText(/Plant/i);
    await user.selectOptions(plantSelect, plant2Id);

    // Verify the selection changed
    expect((plantSelect as HTMLSelectElement).value).toBe(plant2Id);
  });

  it("renders form with basic activity fields", async () => {
    const mockOnSuccess = jest.fn();

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for component to render and check basic form structure
    await waitFor(() => {
      expect(screen.getByText("Log Care Activity")).toBeInTheDocument();
      expect(screen.getByLabelText(/Plant/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Activity Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    });

    // Check default activity type options
    expect(screen.getByText("💧 Watering")).toBeInTheDocument();
    expect(screen.getByText("🌱 Fertilizing")).toBeInTheDocument();
    expect(screen.getByText("👁️ Observation")).toBeInTheDocument();
  });

  it("shows watering fields when water activity is selected", async () => {
    const mockOnSuccess = jest.fn();

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for component to render and check for water amount field by text content
    await waitFor(() => {
      expect(screen.getByText("Water Amount *")).toBeInTheDocument();
    });

    // Check for water amount input field by placeholder
    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();

    // Check for water unit options
    expect(screen.getByText("oz")).toBeInTheDocument();
    expect(screen.getByText("ml")).toBeInTheDocument();
    expect(screen.getByText("cups")).toBeInTheDocument();
  });

  it("displays proper plant formatting in dropdown options", async () => {
    // Create a plant with both name and varietyName to test the formatting
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

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for plants to load
    await waitFor(() => {
      // Should display: name (if present) or varietyName - location
      const expectedText = "My Cherry Plant - Window Sill";
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  it("handles plant without custom name correctly", async () => {
    // Create a plant without a custom name
    await plantService.addPlant({
      varietyId: "test-variety",
      varietyName: "Roma Tomato",
      // No custom name provided
      plantedDate: new Date(),
      location: "Greenhouse",
      container: "3 gallon pot",
      currentStage: "fruiting",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for plants to load
    await waitFor(() => {
      // Should display: varietyName - location (since no custom name)
      const expectedText = "Roma Tomato - Greenhouse";
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });
});
