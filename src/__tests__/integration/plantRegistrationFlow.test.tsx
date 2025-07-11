// src/__tests__/integration/plantRegistrationFlow.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { PlantRegistrationForm } from "@/components/plant/PlantRegistrationForm";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { FirebasePlantService } from "@/services/firebase/plantService";
import { varietyService } from "@/types/database";
import { varieties } from "@/data";

// ADD THIS MOCK BLOCK
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => new Date()),
    fromDate: jest.fn((date) => date),
  },
  writeBatch: jest.fn(),
}));

// Mock SimplifiedLocationSelector
jest.mock("@/components/plant/SimplifiedLocationSelector", () => ({
  SimplifiedLocationSelector: ({
    onBedSelect,
    onLocationChange,
  }: {
    onBedSelect: (bedId: string) => void;
    onLocationChange: (isOutdoor: boolean) => void;
  }) => (
    <div data-testid="simplified-location-selector">
      <select
        data-testid="bed-selector"
        onChange={(e) => onBedSelect(e.target.value)}
      >
        <option value="">Select bed</option>
        <option value="test-bed-1">Test Bed 1</option>
      </select>
    </div>
  ),
}));

// Mocks for your own modules
jest.mock("@/hooks/useFirebaseAuth");
jest.mock("@/services/firebase/plantService");
jest.mock("@/types/database");

// Mock the new Firebase hook factory and Logger
jest.mock("@/hooks/useFirebaseResource");
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    service: jest.fn(),
    database: jest.fn(),
    growthStage: jest.fn(),
  },
}));

const mockUser = {
  uid: "test-user-id",
  email: "test@example.com",
  displayName: "Test User",
};

const mockVarieties = varieties;

describe("Plant Registration Integration Flow", () => {
  const user = userEvent.setup();

  const mockCreatePlant = jest.fn().mockResolvedValue("new-plant-id");

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePlant.mockClear();

    (useFirebaseAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    (useFirebasePlants as jest.Mock).mockReturnValue({
      plants: [],
      loading: false,
      error: null,
      createPlant: mockCreatePlant,
      updatePlant: jest.fn(),
      deletePlant: jest.fn(),
    });

    (varietyService.getAllVarieties as jest.Mock).mockResolvedValue(
      mockVarieties
    );
    (FirebasePlantService.createPlant as jest.Mock).mockResolvedValue(
      "new-plant-id"
    );

    // Mock bedService
    const { bedService } = require("@/types/database");
    bedService.getBed = jest.fn().mockResolvedValue({
      id: "test-bed-1",
      name: "Test Bed 1",
      type: "raised-bed",
      dimensions: { length: 48, width: 24, unit: "inches" },
      isActive: true,
    });
    bedService.getActiveBeds = jest.fn().mockResolvedValue([
      {
        id: "test-bed-1",
        name: "Test Bed 1",
        type: "raised-bed",
        dimensions: { length: 48, width: 24, unit: "inches" },
        isActive: true,
      },
    ]);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("completes full plant registration workflow", async () => {
    renderWithRouter(<PlantRegistrationForm />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
    });

    // Fill in variety
    const varietySelect = screen.getByLabelText(/plant variety/i);
    await user.selectOptions(varietySelect, varieties[0].name);

    // Fill in planting date
    const dateInput = screen.getByLabelText(/planting date/i);
    const today = new Date().toISOString().split("T")[0];
    await user.clear(dateInput);
    await user.type(dateInput, today);

    // Select bed/container using the new simplified selector
    const bedSelector = screen.getByTestId("bed-selector");
    await user.selectOptions(bedSelector, "test-bed-1");

    // Select soil mixture (mocked component)
    const selectSoilButton = screen.getByTestId(
      "mixture-card-leafy-greens-standard"
    );
    await user.click(selectSoilButton);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /register plant/i,
    });
    await user.click(submitButton);

    // Verify hook's createPlant method was called
    await waitFor(() => {
      expect(mockCreatePlant).toHaveBeenCalledWith(
        expect.objectContaining({
          container: "🏗️ Test Bed 1",
          isActive: true,
          location: "Indoor",
          name: "Astro Arugula",
          notes: [""],
          plantedDate: expect.any(Date),
          quantity: 1,
          reminderPreferences: {
            fertilizing: true,
            lighting: false,
            observation: true,
            pruning: false,
            watering: true,
          },
          section: undefined,
          setupType: "multiple-containers",
          soilMix:
            "Leafy Greens Mix: 40% Coco Coir, 25% Perlite, 25% Vermiculite, 10% Worm Castings",
          structuredSection: undefined,
          varietyId: "astro-arugula",
          varietyName: "Astro Arugula",
        })
      );
    });
  });

  it.skip("handles offline scenario gracefully", async () => {
    // Mock network failure for hook
    const networkError = new Error("Network error");
    mockCreatePlant.mockRejectedValue(networkError);

    renderWithRouter(<PlantRegistrationForm />);

    await waitFor(() => {
      expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
    });

    // Fill form with minimal required data
    const varietySelect = screen.getByLabelText(/plant variety/i);
    await user.selectOptions(varietySelect, varieties[0].name);

    // Select bed/container using the new simplified selector
    const bedSelector = screen.getByTestId("bed-selector");
    await user.selectOptions(bedSelector, "test-bed-1");

    const selectSoilButton = screen.getByTestId(
      "mixture-card-leafy-greens-standard"
    );
    await user.click(selectSoilButton);

    const submitButton = screen.getByRole("button", {
      name: /register plant/i,
    });
    await user.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    // Form should remain intact for retry
    expect(screen.getByDisplayValue(varieties[0].name)).toBeInTheDocument();
  });
});
