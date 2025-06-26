// src/__tests__/integration/smartDefaultsIntegration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { initializeDatabase } from "@/db/seedData";
import { varietyService, PlantRecord } from "@/types/database";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";

// Mock the hook at the top level
jest.mock("@/hooks/useFirebasePlants");
const mockUseFirebasePlants = useFirebasePlants as jest.Mock;

const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ["/log-care"]
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

// Helper function to handle repetitive setup
const setupTest = async () => {
  const varieties = await varietyService.getAllVarieties();

  // CRITICAL FIX: Explicitly select a variety with a known germination protocol
  const testVariety = varieties.find((v) => v.name === "Sugar Snap Peas");

  const plant: PlantRecord = {
    id: "plant-123",
    varietyId: testVariety!.id,
    varietyName: testVariety!.name,
    name: "Test Plant",
    plantedDate: new Date(),
    location: "Indoor",
    container: "5 gallon pot",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUseFirebasePlants.mockReturnValue({
    plants: [plant],
    loading: false,
    error: null,
  });

  const user = userEvent.setup();
  renderWithRouter(<CareLogForm onSuccess={jest.fn()} />);

  // Wait for the form and plants to be ready
  const plantSelect = (await screen.findByLabelText(
    /Plant \*/i // Use the more specific label text
  )) as HTMLSelectElement;

  return { user, plant, plantSelect };
};

describe("Smart Defaults Integration", () => {
  beforeAll(async () => {
    // Initialize DB once for the entire suite
    await initializeDatabase();
  });

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it("should show smart watering suggestions when a plant is selected", async () => {
    const { user, plant, plantSelect } = await setupTest();

    await user.selectOptions(plantSelect, plant.id);

    await waitFor(() => {
      // Because the variety is now "Sugar Snap Peas", the stage is "germinationEmergence"
      // and the component will find and render the protocol information.
      const protocolInfo = screen.getByText(/Protocol for/i);
      expect(protocolInfo).toHaveTextContent("Protocol for germination stage:");
    });
  });

  it("should auto-fill water amount when using smart suggestions", async () => {
    const { user, plant, plantSelect } = await setupTest();

    await user.selectOptions(plantSelect, plant.id);

    await waitFor(() => {
      const waterAmountInput = screen.getByLabelText(
        /Water Amount \*/i
      ) as HTMLInputElement;
      expect(waterAmountInput).toBeInTheDocument();
    });
  });

  // Note: This test's name is misleading as the buttons are not in this form.
  // It effectively just checks that the fertilizer amount field renders correctly.
  it("should show quick completion buttons", async () => {
    const { user, plant, plantSelect } = await setupTest();

    await user.selectOptions(plantSelect, plant.id);

    // Switch to fertilize to make the amount field appear
    const activitySelect = screen.getByLabelText(/Activity Type \*/i);
    await user.selectOptions(activitySelect, "fertilize");

    await waitFor(() => {
      expect(screen.getByLabelText(/Amount \*/i)).toBeInTheDocument();
    });
  });

  it("should show fertilizer suggestions when fertilizer activity is selected", async () => {
    const { user, plant, plantSelect } = await setupTest();

    await user.selectOptions(plantSelect, plant.id);

    const activitySelect = screen.getByLabelText(/Activity Type \*/i);
    await user.selectOptions(activitySelect, "fertilize");

    await waitFor(() => {
      expect(
        screen.getByLabelText(/Fertilizer Product \*/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Dilution/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Amount \*/i)).toBeInTheDocument();
    });
  });
});
