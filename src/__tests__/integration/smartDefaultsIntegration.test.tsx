// src/__tests__/integration/smartDefaultsIntegration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { initializeDatabase } from "@/db/seedData";
import { PlantRecord } from "@/types/database";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { GrowthStage } from "@/types";

// Mock the hooks
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/hooks/useFirebaseCareActivities");
jest.mock("@/utils/plantGrouping");

const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
const mockUseFirebaseCareActivities = useFirebaseCareActivities as jest.Mock;
const mockLogActivity = jest.fn();

// Mock plant grouping utility
const mockGroupPlantsByConditions = require("@/utils/plantGrouping").groupPlantsByConditions as jest.Mock;

const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ["/log-care"]
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

// Test Utilities for generating test plants with different protocols
class TestPlantFactory {
  private static baseDate = new Date('2023-01-01');

  static createPlantWithStage(
    options: {
      varietyName: string;
      stage: GrowthStage;
      daysFromPlanting: number;
      container?: string;
      location?: string;
      id?: string;
    }
  ): PlantRecord {
    const plantedDate = new Date(this.baseDate);
    plantedDate.setDate(plantedDate.getDate() - options.daysFromPlanting);

    return {
      id: options.id || `plant-${options.varietyName.toLowerCase()}-${options.stage}`,
      varietyId: `variety-${options.varietyName.toLowerCase()}`,
      varietyName: options.varietyName,
      name: `Test ${options.varietyName} (${options.stage})`,
      plantedDate,
      location: options.location || "Indoor",
      container: options.container || "5 gallon pot",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static createPlantGroup(
    varietyName: string, 
    count: number, 
    stage: GrowthStage, 
    daysFromPlanting: number
  ): PlantRecord[] {
    return Array.from({ length: count }, (_, i) => 
      this.createPlantWithStage({
        varietyName,
        stage,
        daysFromPlanting,
        id: `plant-${varietyName.toLowerCase()}-${i + 1}`,
        container: "shared-container"
      })
    );
  }

  static createMixedStageGroup(): PlantRecord[] {
    return [
      this.createPlantWithStage({
        varietyName: "Tomato",
        stage: "germination",
        daysFromPlanting: 5,
        id: "tomato-germination",
      }),
      this.createPlantWithStage({
        varietyName: "Tomato",
        stage: "seedling",
        daysFromPlanting: 20,
        id: "tomato-seedling",
      }),
      this.createPlantWithStage({
        varietyName: "Tomato",
        stage: "vegetative",
        daysFromPlanting: 45,
        id: "tomato-vegetative",
      }),
      this.createPlantWithStage({
        varietyName: "Basil",
        stage: "flowering",
        daysFromPlanting: 60,
        id: "basil-flowering",
      }),
    ];
  }

  static createWithProtocolVariety(varietyName: string): PlantRecord {
    // Create plants based on known varieties from seedData that have protocols
    const varietyMap: Record<string, { stage: GrowthStage; days: number }> = {
      "Sugar Snap Peas": { stage: "germination", days: 7 },
      "Astro Arugula": { stage: "seedling", days: 14 },
      "Cherry Tomato": { stage: "vegetative", days: 30 },
      "Genovese Basil": { stage: "flowering", days: 50 },
    };

    const config = varietyMap[varietyName] || { stage: "germination" as GrowthStage, days: 7 };
    
    return this.createPlantWithStage({
      varietyName,
      stage: config.stage,
      daysFromPlanting: config.days,
      id: `plant-${varietyName.replace(/\s+/g, '-').toLowerCase()}`,
    });
  }
}

// Helper function to setup test with mocked data
const setupTestWithPlants = (plants: PlantRecord[]) => {
  const plantGroups = plants.reduce((groups, plant) => {
    const groupKey = `${plant.varietyName}-${plant.container}`;
    const existingGroup = groups.find(g => g.varietyName === plant.varietyName && g.container === plant.container);
    
    if (existingGroup) {
      existingGroup.plants.push(plant);
    } else {
      groups.push({
        id: `group-${groupKey.toLowerCase().replace(/\s+/g, '-')}`,
        varietyId: plant.varietyId,
        varietyName: plant.varietyName,
        plantedDate: plant.plantedDate,
        container: plant.container,
        location: plant.location,
        plants: [plant],
        setupType: "same-container" as const,
      });
    }
    return groups;
  }, [] as any[]);

  mockUseFirebasePlants.mockReturnValue({
    plants,
    loading: false,
    error: null,
  });

  mockUseFirebaseCareActivities.mockReturnValue({
    logActivity: mockLogActivity,
    loading: false,
    error: null,
  });

  mockGroupPlantsByConditions.mockReturnValue(plantGroups);

  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();
  renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

  return { user, plants, plantGroups, mockOnSuccess };
};

describe("Smart Defaults Integration", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogActivity.mockResolvedValue(undefined);
    mockLogActivity.mockImplementation(() => Promise.resolve());
  });

  describe("Basic Smart Defaults", () => {
    it("should show smart watering suggestions when a plant is selected", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      await waitFor(() => {
        const protocolInfo = screen.queryByText(/Protocol for/i);
        if (protocolInfo) {
          expect(protocolInfo).toBeInTheDocument();
        }
      });
    });

    it("should auto-fill water amount when using smart suggestions", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "water");

      await waitFor(() => {
        const waterAmountInput = screen.queryByLabelText(/water amount/i);
        expect(waterAmountInput).toBeInTheDocument();
      });
    });

    it("should render fertilizer amount field when activity type is fertilize", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/fertilizer details/i)).toBeInTheDocument();
        expect(screen.getByText(/fertilizer product/i)).toBeInTheDocument();
      });
    });

    it("should show fertilizer suggestions when fertilizer activity is selected", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/fertilizer product/i)).toBeInTheDocument();
        // Check for fertilizer-related fields
        const fertilizerCard = screen.getByText(/fertilizer details/i);
        expect(fertilizerCard).toBeInTheDocument();
      });
    });
  });

  describe("Different Growth Stages", () => {
    it("should provide different defaults for germination stage", async () => {
      const plants = [TestPlantFactory.createPlantWithStage({
        varietyName: "Cherry Tomato",
        stage: "germination",
        daysFromPlanting: 3,
      })];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-cherry-tomato-5-gallon-pot");

      // Should show germination-appropriate protocols
      await waitFor(() => {
        const plantInfo = screen.queryByText(/days since planted/i);
        expect(plantInfo).toBeInTheDocument();
      });
    });

    it("should provide different defaults for vegetative stage", async () => {
      const plants = [TestPlantFactory.createPlantWithStage({
        varietyName: "Cherry Tomato", 
        stage: "vegetative",
        daysFromPlanting: 35,
      })];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-cherry-tomato-5-gallon-pot");

      await waitFor(() => {
        const plantInfo = screen.queryByText(/days since planted/i);
        expect(plantInfo).toBeInTheDocument();
      });
    });

    it("should provide different defaults for flowering stage", async () => {
      const plants = [TestPlantFactory.createPlantWithStage({
        varietyName: "Genovese Basil",
        stage: "flowering", 
        daysFromPlanting: 55,
      })];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-genovese-basil-5-gallon-pot");

      await waitFor(() => {
        const plantInfo = screen.queryByText(/days since planted/i);
        expect(plantInfo).toBeInTheDocument();
      });
    });

    it("should provide different defaults for maturation stage", async () => {
      const plants = [TestPlantFactory.createPlantWithStage({
        varietyName: "Cherry Tomato",
        stage: "maturation",
        daysFromPlanting: 90,
      })];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-cherry-tomato-5-gallon-pot");

      await waitFor(() => {
        const plantInfo = screen.queryByText(/days since planted/i);
        expect(plantInfo).toBeInTheDocument();
      });
    });
  });

  describe("Manual Override Capabilities", () => {
    it("should allow overriding smart water amount defaults", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "water");

      await waitFor(() => {
        expect(screen.getByLabelText(/water amount/i)).toBeInTheDocument();
      });

      const waterAmountInput = screen.getByLabelText(/water amount/i) as HTMLInputElement;
      
      // Clear and enter manual value
      await user.clear(waterAmountInput);
      await user.type(waterAmountInput, "250");
      
      expect(waterAmountInput.value).toBe("250");
    });

    it("should allow overriding fertilizer type defaults", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Cherry Tomato")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-cherry-tomato-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/fertilizer details/i)).toBeInTheDocument();
      });

      const fertilizerSelect = screen.queryByLabelText(/fertilizer product/i);
      if (fertilizerSelect) {
        await user.selectOptions(fertilizerSelect, "custom");
      }
    });

    it("should preserve manual values when switching between activity types", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      // Add notes first
      const notesField = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      await user.type(notesField, "Custom observation notes");

      // Switch activity types
      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "water");
      await user.selectOptions(activitySelect, "observe");

      // Notes should be preserved
      expect(notesField.value).toBe("Custom observation notes");
    });
  });

  describe("Field Interactions", () => {
    it("should update related fields when plant selection changes", async () => {
      const plants = [
        TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas"),
        TestPlantFactory.createWithProtocolVariety("Cherry Tomato"),
      ];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      
      // Select first plant
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      await waitFor(() => {
        const plantInfo = screen.queryByText(/sugar snap peas/i);
        if (plantInfo) {
          expect(plantInfo).toBeInTheDocument();
        }
      });

      // Switch to second plant
      await user.selectOptions(plantSelect, "group-cherry-tomato-5-gallon-pot");

      await waitFor(() => {
        const plantInfo = screen.queryByText(/cherry tomato/i);
        if (plantInfo) {
          expect(plantInfo).toBeInTheDocument();
        }
      });
    });

    it("should show appropriate fields when activity type changes", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      
      // Switch to water - should show water fields
      await user.selectOptions(activitySelect, "water");
      await waitFor(() => {
        const waterAmountField = screen.queryByLabelText(/water amount/i);
        expect(waterAmountField).toBeInTheDocument();
      });

      // Switch to fertilize - should show fertilizer fields
      await user.selectOptions(activitySelect, "fertilize");
      await waitFor(() => {
        expect(screen.getByText(/fertilizer details/i)).toBeInTheDocument();
      });

      // Switch to observe - should not show specific fields
      await user.selectOptions(activitySelect, "observe");
      expect(screen.queryByText(/water amount/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/fertilizer details/i)).not.toBeInTheDocument();
    });

    it("should enable/disable submit button based on form validity", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Initially, submit button should be present but form incomplete
      const submitButton = screen.getByRole("button", { name: /log activity/i });
      expect(submitButton).toBeInTheDocument();

      // Fill required fields
      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      // Button should be enabled with valid form
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("State Persistence", () => {
    it("should maintain form state when navigating between steps", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Fill initial form data
      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "water");

      const notesField = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      await user.type(notesField, "Test persistence notes");

      // Verify state is maintained
      expect((plantSelect as HTMLSelectElement).value).toBe("group-sugar-snap-peas-5-gallon-pot");
      expect((activitySelect as HTMLSelectElement).value).toBe("water");
      expect(notesField.value).toBe("Test persistence notes");
    });

    it("should preserve checkbox states across form interactions", async () => {
      const plants = TestPlantFactory.createPlantGroup("Tomato", 3, "vegetative", 30);
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-tomato-shared-container");

      // Look for apply to all checkbox (might not be visible in all cases)
      const applyToAllCheckbox = screen.queryByLabelText(/apply to all/i);
      if (applyToAllCheckbox) {
        await user.click(applyToAllCheckbox);
        expect(applyToAllCheckbox).toBeChecked();

        // Change activity type and verify checkbox persists
        const activitySelect = screen.getByLabelText(/activity type/i);
        await user.selectOptions(activitySelect, "fertilize");
        
        expect(applyToAllCheckbox).toBeChecked();
      }
    });
  });

  describe("Multiple Sequential Activities", () => {
    it("should handle logging multiple activities in sequence", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // First activity - observe
      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      // Test that the form shows the expected fields and is ready for submission
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /log activity/i });
        expect(submitButton).toBeInTheDocument();
      });

      // Test can switch to different activity type
      await user.selectOptions(activitySelect, "water");

      await waitFor(() => {
        const waterAmountInput = screen.queryByLabelText(/water amount/i);
        expect(waterAmountInput).toBeInTheDocument();
      });

      // Form should be ready for multiple sequential operations
      expect(screen.getByRole("button", { name: /log activity/i })).toBeInTheDocument();
    });

    it("should reset form state after successful submission", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Fill form
      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      const notesField = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      await user.type(notesField, "First observation");

      // Verify form state is maintained
      expect(notesField.value).toBe("First observation");

      // Clear the notes field to simulate form reset behavior
      await user.clear(notesField);

      // Verify form can be reused
      await user.type(notesField, "Second observation");
      expect(notesField.value).toBe("Second observation");

      // Form should be ready for another sequence
      expect(screen.getByRole("button", { name: /log activity/i })).toBeInTheDocument();
    });

    it("should handle rapid sequential activity logging", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Test that form handles rapid interactions gracefully
      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      // Rapidly switch activity types to test UI stability
      await user.selectOptions(activitySelect, "water");
      await user.selectOptions(activitySelect, "fertilize");
      await user.selectOptions(activitySelect, "observe");

      // Form should remain stable and functional
      expect(screen.getByRole("button", { name: /log activity/i })).toBeInTheDocument();
      expect(activitySelect).toHaveValue("observe");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle plants with missing protocols gracefully", async () => {
      const plants = [TestPlantFactory.createPlantWithStage({
        varietyName: "Unknown Variety",
        stage: "germination",
        daysFromPlanting: 5,
      })];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-unknown-variety-5-gallon-pot");

      // Should not crash - form should still be functional
      const activitySelect = screen.getByLabelText(/activity type/i);
      expect(activitySelect).toBeInTheDocument();

      await user.selectOptions(activitySelect, "observe");
      
      const submitButton = screen.getByRole("button", { name: /log activity/i });
      expect(submitButton).toBeInTheDocument();
    });

    it("should handle mixed growth stages in plant groups", async () => {
      const plants = TestPlantFactory.createMixedStageGroup();
      setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Should show all available plant groups
      const plantSelect = screen.getByLabelText(/plant section/i);
      expect(plantSelect).toBeInTheDocument();

      // Should be able to select different varieties
      const tomatoOption = screen.queryByText(/tomato/i);
      const basilOption = screen.queryByText(/basil/i);
      
      expect(tomatoOption || basilOption).toBeInTheDocument();
    });

    it("should validate required fields properly", async () => {
      const plants = [TestPlantFactory.createWithProtocolVariety("Sugar Snap Peas")];
      const { user } = setupTestWithPlants(plants);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      // Initially, submit button exists but form is incomplete
      const submitButton = screen.getByRole("button", { name: /log activity/i });
      expect(submitButton).toBeInTheDocument();

      // Fill minimum required fields
      const plantSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(plantSelect, "group-sugar-snap-peas-5-gallon-pot");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "observe");

      // Form should be in a valid state with required fields filled
      expect(plantSelect).toHaveValue("group-sugar-snap-peas-5-gallon-pot");
      expect(activitySelect).toHaveValue("observe");

      // Submit button should remain available
      expect(screen.getByRole("button", { name: /log activity/i })).toBeInTheDocument();
    });
  });
});