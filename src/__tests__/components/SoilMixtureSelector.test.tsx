// src/components/plant/__tests__/SoilMixtureSelector.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlantCategory } from "@/types";
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

      expect(screen.getByText("Soil Mixture")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Choose a preset mixture or create your own custom blend"
        )
      ).toBeInTheDocument();
      expect(screen.getByText("🧪 Create Custom Mixture")).toBeInTheDocument();
    });

    it("displays all preset mixtures", () => {
      renderSelector();

      // Check that all preset mixtures are displayed
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

  describe("Category-based Recommendations", () => {
    it("shows recommended badge for matching category", () => {
      renderSelector({ plantCategory: "leafy-greens" as PlantCategory });

      // Should show recommended badge for leafy greens mix
      const leafyGreensCard =
        screen.getByText("Leafy Greens Mix").closest("[data-testid]") ||
        screen.getByText("Leafy Greens Mix").closest("div")?.closest("div");
      expect(leafyGreensCard).toHaveTextContent("Recommended");
    });

    it("prioritizes category-specific mixtures first", () => {
      renderSelector({ plantCategory: "herbs" as PlantCategory });

      const cards = screen.getAllByText(/Mix$/);
      // Mediterranean Herbs Mix should appear first due to category matching
      expect(cards[0]).toHaveTextContent("Mediterranean Herbs Mix");
    });

    it("still shows all mixtures when category provided", () => {
      renderSelector({ plantCategory: "herbs" as PlantCategory });

      // All mixtures should still be visible
      expect(screen.getByText("Leafy Greens Mix")).toBeInTheDocument();
      expect(screen.getByText("Universal Garden Mix")).toBeInTheDocument();
    });
  });

  describe("Preset Selection", () => {
    it("calls onMixtureChange when preset is selected", async () => {
      renderSelector();

      // Find all elements with cursor-pointer class (these should be the clickable cards)
      const clickableCards = document.querySelectorAll(".cursor-pointer");

      // Find the card that contains "Leafy Greens Mix" text
      let leafyGreensCard: Element | null = null;
      clickableCards.forEach((card) => {
        if (card.textContent?.includes("Leafy Greens Mix")) {
          leafyGreensCard = card;
        }
      });

      // Fallback: if we can't find by cursor-pointer, try a more direct approach
      if (!leafyGreensCard) {
        const leafyGreensText = screen.getByText("Leafy Greens Mix");
        // Go up until we find an element with onClick handler or cursor-pointer
        let current = leafyGreensText.parentElement;
        while (current && !current.classList.contains("cursor-pointer")) {
          current = current.parentElement;
        }
        leafyGreensCard = current;
      }

      expect(leafyGreensCard).toBeTruthy();
      await user.click(leafyGreensCard!);

      expect(mockOnMixtureChange).toHaveBeenCalledWith(
        "Leafy Greens Mix: 40% Coco Coir, 25% Perlite, 25% Vermiculite, 10% Worm Castings"
      );
    });

    it("shows selected state when mixture is selected", () => {
      renderSelector({
        selectedMixture:
          "Leafy Greens Mix: 40% Coco Coir, 25% Perlite, 25% Vermiculite, 10% Worm Castings",
      });

      const leafyGreensText = screen.getByText("Leafy Greens Mix");
      const leafyGreensCard =
        leafyGreensText.closest(".cursor-pointer") ||
        leafyGreensText.closest("div")?.closest("div")?.closest("div");

      // Update to match the actual CSS classes used in the component
      expect(leafyGreensCard).toHaveClass("cursor-pointer");
      // Check for the specific selected styling
      expect(leafyGreensCard).toHaveClass(
        "ring-4",
        "ring-green-500",
        "bg-green-100"
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

      const useButton = screen.getByRole("button", {
        name: /use this mixture/i,
      });
      await user.click(useButton);

      expect(mockOnMixtureChange).toHaveBeenCalledWith("Custom mix");
    });

    it("disables submit button when textarea is empty", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const useButton = screen.getByRole("button", {
        name: /use this mixture/i,
      });
      expect(useButton).toBeDisabled();
    });

    it("returns to presets when back button clicked", async () => {
      renderSelector();

      // Go to custom mode
      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      // Click back
      const backButton = screen.getByRole("button", {
        name: /back to presets/i,
      });
      await user.click(backButton);

      // Should be back to presets
      expect(screen.getByText("Leafy Greens Mix")).toBeInTheDocument();
      expect(screen.queryByText("Custom Soil Mixture")).not.toBeInTheDocument();
    });

    it("closes custom mode after successful submission", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const textarea = screen.getByPlaceholderText(/40% coco coir/);
      await user.type(textarea, "Custom mix");

      const useButton = screen.getByRole("button", {
        name: /use this mixture/i,
      });
      await user.click(useButton);

      // Should return to preset view
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

      // Use getAllByText for multiple elements and be more specific
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

      expect(screen.getByText("Soil Mixture")).toBeInTheDocument();
      expect(screen.queryByText("Selected Mixture:")).not.toBeInTheDocument();
    });

    it("handles empty selectedMixture gracefully", () => {
      renderSelector({ selectedMixture: "" });

      expect(screen.getByText("Soil Mixture")).toBeInTheDocument();
      expect(screen.queryByText("Selected Mixture:")).not.toBeInTheDocument();
    });

    it("handles undefined plantCategory gracefully", () => {
      renderSelector({ plantCategory: undefined });

      expect(screen.getByText("Soil Mixture")).toBeInTheDocument();

      // When plantCategory is undefined, Universal Garden Mix should still appear
      // but without duplicates. The Recommended badge may or may not appear
      // depending on the implementation, so we'll check that the component renders correctly
      expect(screen.getByText("Universal Garden Mix")).toBeInTheDocument();
    });

    it("handles custom mixture with only whitespace", async () => {
      renderSelector();

      const customButton = screen.getByText("🧪 Create Custom Mixture");
      await user.click(customButton);

      const textarea = screen.getByPlaceholderText(/40% coco coir/);
      await user.type(textarea, "   ");

      const useButton = screen.getByRole("button", {
        name: /use this mixture/i,
      });
      expect(useButton).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("has proper labels and structure", () => {
      renderSelector();

      expect(screen.getByText("Soil Mixture")).toBeInTheDocument();
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

      // Use the id instead of label text since we fixed the htmlFor association
      expect(screen.getByLabelText("Mixture Description")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /use this mixture/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /back to presets/i })
      ).toBeInTheDocument();
    });
  });
});
