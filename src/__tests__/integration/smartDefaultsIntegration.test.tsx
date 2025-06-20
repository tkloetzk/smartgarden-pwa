// src/__tests__/integration/smartDefaultsIntegration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { initializeDatabase } from "@/db/seedData";
import { plantService, varietyService } from "@/types/database";

describe("Smart Defaults Integration", () => {
  beforeEach(async () => {
    await initializeDatabase();
    const { db } = await import("@/types/database");
    await db.plants.clear();
  });

  it("should show smart watering suggestions when plant is selected", async () => {
    const varieties = await varietyService.getAllVarieties();
    const testVariety = varieties[0];

    const plant = await plantService.addPlant({
      varietyId: testVariety.id,
      varietyName: testVariety.name,
      name: "Smart Defaults Test Plant",
      plantedDate: new Date(),
      currentStage: "vegetative",
      location: "Indoor",
      container: "5 gallon pot",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for plants to load
    await waitFor(() => {
      expect(
        screen.getByText("Smart Defaults Test Plant - Indoor")
      ).toBeInTheDocument();
    });

    // Select the plant
    const plantSelect = screen.getByLabelText(/Plant/i);
    await user.selectOptions(plantSelect, plant);

    // Should show smart suggestion section
    await waitFor(() => {
      expect(screen.getByText("💡 Smart Suggestion")).toBeInTheDocument();
    });

    // Should show some reasoning text
    expect(screen.getByText(/based on/i)).toBeInTheDocument();

    // Should show confidence indicator
    expect(screen.getByText(/confidence/i)).toBeInTheDocument();

    // Should show suggested amount
    const suggestionSection = screen
      .getByText("💡 Smart Suggestion")
      .closest("div");
    expect(suggestionSection).toBeInTheDocument();
  });

  it("should auto-fill water amount when using smart suggestions", async () => {
    const varieties = await varietyService.getAllVarieties();
    const testVariety = varieties[0];

    const plant = await plantService.addPlant({
      varietyId: testVariety.id,
      varietyName: testVariety.name,
      name: "Auto-fill Test Plant",
      plantedDate: new Date(),
      currentStage: "vegetative",
      location: "Indoor",
      container: "4 inch pot",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for plants to load and select the plant
    await waitFor(() => {
      expect(
        screen.getByText("Auto-fill Test Plant - Indoor")
      ).toBeInTheDocument();
    });

    const plantSelect = screen.getByLabelText(/Plant/i);
    await user.selectOptions(plantSelect, plant);

    // Wait for smart suggestions to load
    await waitFor(() => {
      expect(screen.getByText("💡 Smart Suggestion")).toBeInTheDocument();
    });

    // Find and click the "Use this amount" button
    const useAmountButton = screen.getByText("Use this amount");
    await user.click(useAmountButton);

    // Check that the water amount field was filled
    const waterAmountInput = screen.getByPlaceholderText(
      "Amount"
    ) as HTMLInputElement;
    expect(parseFloat(waterAmountInput.value)).toBeGreaterThan(0);
  });

  it("should show quick completion buttons", async () => {
    const varieties = await varietyService.getAllVarieties();
    const testVariety = varieties[0];

    const plant = await plantService.addPlant({
      varietyId: testVariety.id,
      varietyName: testVariety.name,
      name: "Quick Complete Test Plant",
      plantedDate: new Date(),
      currentStage: "vegetative",
      location: "Indoor",
      container: "5 gallon pot",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for plants to load and select the plant
    await waitFor(() => {
      expect(
        screen.getByText("Quick Complete Test Plant - Indoor")
      ).toBeInTheDocument();
    });

    const plantSelect = screen.getByLabelText(/Plant/i);
    await user.selectOptions(plantSelect, plant);

    // Should show quick action buttons
    await waitFor(() => {
      expect(screen.getByText("Quick actions:")).toBeInTheDocument();
    });

    // Should have at least one quick button
    const quickButtons = screen.getAllByText(/Quick:/i);
    expect(quickButtons.length).toBeGreaterThan(0);

    // Click first quick button and verify it fills the form
    await user.click(quickButtons[0]);

    const waterAmountInput = screen.getByPlaceholderText(
      "Amount"
    ) as HTMLInputElement;
    expect(parseFloat(waterAmountInput.value)).toBeGreaterThan(0);
  });

  it("should show fertilizer suggestions when fertilizer activity is selected", async () => {
    const varieties = await varietyService.getAllVarieties();
    const varietyWithFertilizer = varieties.find(
      (v) =>
        v.protocols?.fertilization &&
        Object.keys(v.protocols.fertilization).length > 0
    );

    if (!varietyWithFertilizer) {
      // Skip if no varieties have fertilization protocols
      return;
    }

    const plant = await plantService.addPlant({
      varietyId: varietyWithFertilizer.id,
      varietyName: varietyWithFertilizer.name,
      name: "Fertilizer Test Plant",
      plantedDate: new Date(),
      currentStage: "vegetative",
      location: "Indoor",
      container: "5 gallon pot",
      isActive: true,
    });

    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();

    render(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for plants to load and select the plant
    await waitFor(() => {
      expect(
        screen.getByText("Fertilizer Test Plant - Indoor")
      ).toBeInTheDocument();
    });

    const plantSelect = screen.getByLabelText(/Plant/i);
    await user.selectOptions(plantSelect, plant);

    // Switch to fertilizer activity
    const activitySelect = screen.getByLabelText(/Activity Type/i);
    await user.selectOptions(activitySelect, "fertilize");

    // Should show fertilizer suggestions
    await waitFor(() => {
      expect(screen.getByText("💡 Smart Suggestion")).toBeInTheDocument();
    });
  });
});
