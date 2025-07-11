// src/__tests__/components/PlantRegistrationForm.test.tsx

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlantRegistrationForm } from "@/components/plant/PlantRegistrationForm";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { varietyService } from "@/types/database";
import toast from "react-hot-toast";
import { varieties } from "@/data";

// Mock react-hot-toast
jest.mock("react-hot-toast");

// Mock child components
jest.mock("@/components/plant/SoilMixtureSelector", () => ({
  __esModule: true,
  default: ({
    onMixtureChange,
    selectedMixture,
  }: {
    onMixtureChange: (mixture: string) => void;
    selectedMixture?: string;
  }) => (
    <div data-testid="soil-mixture-selector">
      <button
        onClick={() => onMixtureChange("test-mixture")}
        data-testid="select-soil-mixture"
      >
        Select Soil Mixture
      </button>
      {selectedMixture && (
        <span data-testid="selected-mixture">{selectedMixture}</span>
      )}
    </div>
  ),
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
      <button
        onClick={() => onLocationChange(true)}
        data-testid="location-toggle"
      >
        Toggle Location
      </button>
      <select
        data-testid="bed-selector"
        onChange={(e) => onBedSelect(e.target.value)}
      >
        <option value="">Select bed</option>
        <option value="test-bed-1">Test Bed 1</option>
      </select>
      <div data-testid="container-type-grow-bag">
        <button onClick={() => onBedSelect("grow-bag-1")}>
          Grow Bag
        </button>
      </div>
      <div data-testid="container-type-pot">
        <button onClick={() => onBedSelect("pot-1")}>
          Pot
        </button>
      </div>
      <div data-testid="container-type-cell-tray">
        <button onClick={() => onBedSelect("cell-tray-1")}>
          Cell Tray
        </button>
      </div>
      <div data-testid="container-type-raised-bed">
        <button onClick={() => onBedSelect("raised-bed-1")}>
          Raised Bed
        </button>
      </div>
      <input data-testid="quantity-input" type="number" defaultValue={1} />
      <button aria-label="Increase quantity">+</button>
      <button aria-label="Decrease quantity">-</button>
    </div>
  ),
}));

jest.mock("@/components/plant/ReminderPreferencesSection", () => ({
  __esModule: true,
  default: ({
    onChange,
    preferences,
  }: {
    onChange: (preferences: Record<string, boolean>) => void;
    preferences: Record<string, boolean>;
  }) => (
    <div data-testid="reminder-preferences">
      <button
        onClick={() =>
          onChange({ ...preferences, watering: !preferences.watering })
        }
        data-testid="toggle-watering"
      >
        Toggle Watering
      </button>
    </div>
  ),
}));

jest.mock("@/components/plant/CustomVarietyForm", () => ({
  CustomVarietyForm: ({
    onSuccess,
    onCancel,
  }: {
    onSuccess: (varietyId: string) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="custom-variety-form">
      <button
        onClick={() => onSuccess("new-variety-id")}
        data-testid="save-custom-variety"
      >
        Save Custom Variety
      </button>
      <button onClick={onCancel} data-testid="cancel-custom-variety">
        Cancel
      </button>
    </div>
  ),
}));

jest.mock("@/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

const mockCreatePlant = jest.fn();
const mockVarieties = varieties;

// Mock bedService
jest.mock("@/types/database", () => ({
  varietyService: {
    getAllVarieties: jest.fn(),
  },
  bedService: {
    getActiveBeds: jest.fn().mockResolvedValue([
      {
        id: "test-bed-1",
        name: "Test Bed 1",
        type: "raised-bed",
        dimensions: { length: 48, width: 24, unit: "inches" },
        isActive: true,
      },
    ]),
    addBed: jest.fn().mockResolvedValue("new-bed-id"),
  },
}));

// Mock useFirebasePlants
jest.mock("@/hooks/useFirebasePlants", () => ({
  useFirebasePlants: jest.fn(),
}));

describe("PlantRegistrationForm", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    (useFirebasePlants as jest.Mock).mockReturnValue({
      createPlant: mockCreatePlant,
      plants: [],
    });

    const { varietyService } = require("@/types/database");
    varietyService.getAllVarieties.mockResolvedValue(mockVarieties);
    mockCreatePlant.mockResolvedValue("new-plant-id");

    (toast.success as jest.Mock).mockImplementation(() => {});
    (toast.error as jest.Mock).mockImplementation(() => {});
  });

  const renderForm = (props = {}) => {
    return render(<PlantRegistrationForm {...props} />);
  };

  describe("Initial Rendering", () => {
    it("renders loading state initially", () => {
      renderForm();
      expect(
        screen.getByText("Loading plant varieties...")
      ).toBeInTheDocument();
    });

    it("renders form after varieties load", async () => {
      renderForm();

      await waitFor(() => {
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/plant variety/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/planting date/i)).toBeInTheDocument();
      expect(screen.getByTestId("simplified-location-selector")).toBeInTheDocument();
    });
  });

  describe("Quantity Management", () => {
    beforeEach(async () => {
      renderForm();
      await waitFor(() => {
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
      });
    });

    it("allows increasing and decreasing quantity", async () => {
      // Use the actual form's quantity input by aria-label
      const quantityInput = screen.getByLabelText("Plant quantity");
      const buttons = screen.getAllByLabelText("Increase quantity");
      // Find the actual form button (not the mock one) - it should have a type attribute
      const incrementButton = buttons.find(btn => btn.getAttribute("type") === "button");
      const decrementButtons = screen.getAllByLabelText("Decrease quantity");
      const decrementButton = decrementButtons.find(btn => btn.getAttribute("type") === "button");

      expect(quantityInput).toHaveValue(1);
      expect(decrementButton).toBeDisabled();

      await user.click(incrementButton!);
      expect(quantityInput).toHaveValue(2);
      expect(decrementButton).not.toBeDisabled();

      await user.click(decrementButton!);
      expect(quantityInput).toHaveValue(1);
      expect(decrementButton).toBeDisabled();
    });
  });

  describe("Location Selection", () => {
    beforeEach(async () => {
      renderForm();
      await waitFor(() => {
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
      });
    });

    it("shows simplified location selector", () => {
      expect(screen.getByTestId("simplified-location-selector")).toBeInTheDocument();
      expect(screen.getByTestId("bed-selector")).toBeInTheDocument();
      expect(screen.getByTestId("location-toggle")).toBeInTheDocument();
    });

    it("shows container type options within location selector", () => {
      expect(screen.getByTestId("container-type-grow-bag")).toBeInTheDocument();
      expect(screen.getByTestId("container-type-pot")).toBeInTheDocument();
      expect(
        screen.getByTestId("container-type-cell-tray")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("container-type-raised-bed")
      ).toBeInTheDocument();
    });

    it("allows bed selection", async () => {
      const bedSelector = screen.getByTestId("bed-selector");
      await user.selectOptions(bedSelector, "test-bed-1");
      
      expect(bedSelector).toHaveValue("test-bed-1");
    });
  });

  describe("Form Validation", () => {
    beforeEach(async () => {
      renderForm();
      await waitFor(() => {
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
      });
    });

    it("should prevent future planting dates", async () => {
      const dateInput = screen.getByLabelText(/planting date/i);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split("T")[0];

      await user.clear(dateInput);
      await user.type(dateInput, futureDate);

      // Trigger validation by interacting with another field
      await user.click(screen.getByLabelText(/plant variety/i));

      await waitFor(() => {
        expect(
          screen.getByText(
            "Planting date must be within the past year and not in the future"
          )
        ).toBeInTheDocument();
      });
    });
    it("enables form submission when all required fields are filled", async () => {
      // Select variety
      const varietySelect = screen.getByLabelText(/plant variety/i);
      await user.selectOptions(varietySelect, varieties[0].name);

      // Select bed/container
      const bedSelector = screen.getByTestId("bed-selector");
      await user.selectOptions(bedSelector, "test-bed-1");

      // Select soil mixture
      const selectSoilButton = screen.getByTestId("select-soil-mixture");
      await user.click(selectSoilButton);

      // Check if submit button is enabled
      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /register plant/i,
        });
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe("Form Submission", () => {
    // This helper function fills the form to make the submit button enabled
    const fillForm = async () => {
      await user.selectOptions(
        screen.getByLabelText(/plant variety/i),
        varieties[1].name
      );
      await user.selectOptions(
        screen.getByTestId("bed-selector"),
        "test-bed-1"
      );
      await user.click(screen.getByTestId("select-soil-mixture"));
    };

    // This single beforeEach renders the component ONCE for all tests in this block
    beforeEach(async () => {
      renderForm(); // Using the helper from your test file
      await waitFor(() => {
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
      });
    });

    it.skip("handles submission errors gracefully", async () => {});

    it.skip("shows loading state during submission", async () => {
      // Set up a promise we can control for this test
      let resolveCreatePlant: (value: string) => void;
      const createPlantPromise = new Promise<string>((resolve) => {
        resolveCreatePlant = resolve;
      });
      mockCreatePlant.mockReturnValueOnce(createPlantPromise);

      await fillForm();
      const submitButton = screen.getByRole("button", {
        name: /Register Plant/i,
      });
      await user.click(submitButton);

      // Assert the loading state is active
      expect(screen.getByText("Registering...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // "Complete" the async operation
      resolveCreatePlant!("plant-id");

      // Assert the loading state is gone
      await waitFor(() => {
        expect(screen.queryByText("Registering...")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(async () => {
      renderForm();
      await waitFor(() => {
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
      });
    });

    it("has proper form labels", () => {
      expect(screen.getByLabelText(/plant variety/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/planting date/i)).toBeInTheDocument();
    });

    it.skip("has proper ARIA attributes for buttons", () => {
      const locationToggle = screen.getByTestId("location-toggle");
      expect(locationToggle).toHaveAttribute("type", "button");
    });
  });
});
