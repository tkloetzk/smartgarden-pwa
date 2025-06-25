// Fix the SoilMixtureSelector test file
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SoilMixtureSelector from "@/components/plant/SoilMixtureSelector";

describe("SoilMixtureSelector", () => {
  const user = userEvent.setup();
  const mockOnMixtureChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSelector = (props = {}) => {
    return render(
      <SoilMixtureSelector onMixtureChange={mockOnMixtureChange} {...props} />
    );
  };

  describe("Initial Rendering", () => {
    it("renders with default state", () => {
      renderSelector();

      expect(screen.getByText("Soil Mixture *")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Choose a preset mixture or create your own custom blend"
        )
      ).toBeInTheDocument();
      expect(screen.getByText("🧪 Create Custom Mixture")).toBeInTheDocument();
    });

    it("displays all preset mixtures", () => {
      renderSelector();

      expect(screen.getByText("Leafy Greens Mix")).toBeInTheDocument();
      expect(screen.getByText("Root Vegetables Mix")).toBeInTheDocument();
      expect(screen.getByText("Mediterranean Herbs Mix")).toBeInTheDocument();
      expect(screen.getByText("Berry & Fruit Mix")).toBeInTheDocument();
      expect(screen.getByText("Fruiting Plants Mix")).toBeInTheDocument();
      expect(screen.getByText("Universal Garden Mix")).toBeInTheDocument();
    });

    it("shows mixture descriptions and components", () => {
      renderSelector();

      expect(
        screen.getByText(
          "Nutrient-rich blend perfect for arugula, spinach, and lettuce"
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /40% Coco Coir, 25% Perlite, 25% Vermiculite, 10% Worm Castings/
        )
      ).toBeInTheDocument();
    });
  });

  describe("Preset Selection", () => {
    it("calls onMixtureChange when preset is clicked", async () => {
      renderSelector();

      const leafyGreensCard = screen.getByTestId(
        "mixture-card-leafy-greens-standard"
      );
      await user.click(leafyGreensCard);

      expect(mockOnMixtureChange).toHaveBeenCalledWith(
        "Leafy Greens Mix: 40% Coco Coir, 25% Perlite, 25% Vermiculite, 10% Worm Castings"
      );
    });

    it("shows selected state when mixture is selected", () => {
      renderSelector({
        selectedMixture:
          "Leafy Greens Mix: 40% Coco Coir, 25% Perlite, 25% Vermiculite, 10% Worm Castings",
      });

      const leafyGreensCard = screen.getByTestId(
        "mixture-card-leafy-greens-standard"
      );

      expect(leafyGreensCard).toHaveClass("cursor-pointer");
      expect(leafyGreensCard).toHaveClass(
        "ring-4",
        "ring-ring",
        "bg-muted",
        "border-ring",
        "shadow-lg"
      );
    });

    it("displays selected mixture information", () => {
      const selectedMixture =
        "Root Vegetables Mix: 40% Coco Coir, 30% Perlite, 25% Vermiculite, 5% Worm Castings";
      renderSelector({ selectedMixture });

      expect(screen.getByText("Selected Mixture:")).toBeInTheDocument();
      expect(screen.getByText(selectedMixture)).toBeInTheDocument();
    });
  });

  describe("Custom Mixture Functionality", () => {
    it("switches to custom mode when button clicked", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      expect(screen.getByText("Custom Soil Mixture")).toBeInTheDocument();
      expect(screen.getByText("Mixture Description")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/40% coco coir/)).toBeInTheDocument();
    });

    it("allows typing in custom mixture textarea", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const textarea = screen.getByPlaceholderText(/40% coco coir/);
      await user.type(textarea, "50% peat moss, 30% perlite, 20% sand");

      expect(textarea).toHaveValue("50% peat moss, 30% perlite, 20% sand");
    });

    it("calls onMixtureChange when custom mixture is submitted", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const textarea = screen.getByPlaceholderText(/40% coco coir/);
      await user.type(textarea, "Custom mix");

      const saveButton = screen.getByRole("button", {
        name: /save custom mixture/i,
      });
      await user.click(saveButton);

      expect(mockOnMixtureChange).toHaveBeenCalledWith("Custom mix");
    });

    it("disables submit button when textarea is empty", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const saveButton = screen.getByRole("button", {
        name: /save custom mixture/i,
      });
      expect(saveButton).toBeDisabled();
    });

    it("returns to presets when cancel button clicked", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const cancelButton = screen.getByRole("button", {
        name: /cancel/i,
      });
      await user.click(cancelButton);

      expect(screen.getByText("Leafy Greens Mix")).toBeInTheDocument();
      expect(screen.queryByText("Custom Soil Mixture")).not.toBeInTheDocument();
    });

    it("closes custom mode after successful submission", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const textarea = screen.getByPlaceholderText(/40% coco coir/);
      await user.type(textarea, "Custom mix");

      const saveButton = screen.getByRole("button", {
        name: /save custom mixture/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Leafy Greens Mix")).toBeInTheDocument();
        expect(
          screen.queryByText("Custom Soil Mixture")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Mixture Information Display", () => {
    it("shows components for different mixtures", () => {
      renderSelector();

      const leafyGreensComponents = screen.getAllByText(
        /40% Coco Coir, 25% Perlite, 25% Vermiculite, 10% Worm Castings/
      );
      expect(leafyGreensComponents.length).toBeGreaterThan(0);

      const rootVegComponents = screen.getAllByText(
        /40% Coco Coir, 30% Perlite, 25% Vermiculite, 5% Worm Castings/
      );
      expect(rootVegComponents.length).toBeGreaterThan(0);
    });

    it("shows amendments when available", () => {
      renderSelector();

      expect(
        screen.getByText(/Compost \(½–1 cup per cubic foot\)/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Bone Meal \(1 tsp per gallon\)/)
      ).toBeInTheDocument();
    });

    it("shows suitable plants information", () => {
      renderSelector();

      expect(
        screen.getByText(/Arugula, Spinach, Lettuce, Kale/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Carrots, Beets, Onions, Radishes/)
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined selectedMixture gracefully", () => {
      renderSelector({ selectedMixture: undefined });

      expect(screen.getByText("Soil Mixture *")).toBeInTheDocument();
      expect(screen.queryByText("Selected Mixture:")).not.toBeInTheDocument();
    });

    it("handles empty selectedMixture gracefully", () => {
      renderSelector({ selectedMixture: "" });

      expect(screen.getByText("Soil Mixture *")).toBeInTheDocument();
      expect(screen.queryByText("Selected Mixture:")).not.toBeInTheDocument();
    });

    it("handles undefined plantCategory gracefully", () => {
      renderSelector({ plantCategory: undefined });

      expect(screen.getByText("Soil Mixture *")).toBeInTheDocument();
      expect(screen.getByText("Universal Garden Mix")).toBeInTheDocument();
    });

    it("handles custom mixture with only whitespace", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const textarea = screen.getByPlaceholderText(/40% coco coir/);
      await user.type(textarea, "   ");

      const saveButton = screen.getByRole("button", {
        name: /save custom mixture/i,
      });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("has proper labels and structure", () => {
      renderSelector();

      expect(screen.getByText("Soil Mixture *")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Choose a preset mixture or create your own custom blend"
        )
      ).toBeInTheDocument();
    });

    it("has accessible buttons", () => {
      renderSelector();

      const customButton = screen.getByRole("button", {
        name: /create custom mixture/i,
      });
      expect(customButton).toBeInTheDocument();
    });

    it("maintains accessibility in custom mode", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      expect(screen.getByLabelText("Mixture Description")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save custom mixture/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });
  });
});
