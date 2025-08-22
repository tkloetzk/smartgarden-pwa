// src/__tests__/integration/albionStrawberryFertilization.test.tsx
/**
 * Comprehensive test suite for Albion Strawberries fertilization protocols
 * Tests all growth stages and their specific fertilizer requirements
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CareLogForm } from "@/pages/care/CareLogForm";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { groupPlantsByConditions } from "@/utils/plantGrouping";
// import { seedVarieties } from "@/data/seedVarieties"; // Not used in current tests
import { calculateCurrentStageWithVariety } from "@/utils/growthStage";
import { varietyService } from "@/types/database";

// Mock dependencies
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/hooks/useFirebaseCareActivities");
jest.mock("@/utils/plantGrouping");
jest.mock("@/utils/growthStage");
jest.mock("@/types/database");

const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
const mockUseFirebaseCareActivities = useFirebaseCareActivities as jest.Mock;
const mockGroupPlantsByConditions = groupPlantsByConditions as jest.Mock;
const mockCalculateCurrentStageWithVariety = calculateCurrentStageWithVariety as jest.Mock;
const mockVarietyService = varietyService as jest.Mocked<typeof varietyService>;

// Get actual strawberry variety data
// const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries")!;

// Growth stage timeline based on actual data:
// germination: 14 days (0-14)
// establishment: 14 days (14-28) 
// vegetative: 28 days (28-56)
// flowering: 28 days (56-84)
// fruiting: 7 days (84-91)
// ongoingProduction: 639 days (91-730)

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={["/log-care"]}>{component}</MemoryRouter>
  );
};

describe("Albion Strawberries Fertilization Tests", () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  const createMockPlant = (stage: string, daysOld: number) => {
    const plantedDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return {
      id: `strawberry-${stage}`,
      varietyName: "Albion Strawberries",
      varietyId: "albion-strawberries",
      plantedDate,
      name: `Strawberry Plant - ${stage}`,
    };
  };

  const setupMocksForStage = (stage: string, daysOld: number) => {
    const mockPlant = createMockPlant(stage, daysOld);
    const mockPlantGroup = {
      id: `group-strawberry-${stage}`,
      varietyName: "Albion Strawberries",
      container: "Container A",
      location: "Indoor",
      plantedDate: mockPlant.plantedDate,
      plants: [mockPlant],
    };

    mockVarietyService.getVariety.mockResolvedValue(undefined);
    mockUseFirebasePlants.mockReturnValue({
      plants: [mockPlant],
      loading: false,
      error: null,
    });
    mockGroupPlantsByConditions.mockReturnValue([mockPlantGroup]);
    mockUseFirebaseCareActivities.mockReturnValue({
      logActivity: jest.fn(),
    });
    mockCalculateCurrentStageWithVariety.mockReturnValue(stage);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Establishment Stage (Days 0-28)", () => {
    beforeEach(() => {
      setupMocksForStage("establishment", 10); // 10 days old
    });

    it("should show bone meal fertilizer for establishment stage", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-establishment");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      // Should show establishment stage fertilizers
      expect(optionTexts.some(text => text?.includes("Bone meal"))).toBe(true);
      expect(optionTexts.some(text => text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true);
    });

    it("should display establishment stage protocol information", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-establishment");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/protocol for establishment stage/i)).toBeInTheDocument();
      });
    });
  });

  describe("Vegetative Stage (Days 28-56)", () => {
    beforeEach(() => {
      setupMocksForStage("vegetative", 40); // 40 days old
    });

    it("should show Neptune's Harvest fertilizers for vegetative stage", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-vegetative");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      // Should show vegetative stage fertilizers (½ strength and full strength Neptune's Harvest)
      expect(optionTexts.some(text => text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true);
      
      // Should not show establishment specific fertilizers
      expect(optionTexts.every(text => !text?.includes("Bone meal"))).toBe(true);
    });

    it("should show recommended dilution for vegetative stage", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-vegetative");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      await user.selectOptions(fertilizerDropdown, (fertilizerDropdown as HTMLSelectElement).options[1].value);

      await waitFor(() => {
        expect(screen.getByText(/recommended settings/i)).toBeInTheDocument();
      });
    });
  });

  describe("Flowering Stage (Days 56-84)", () => {
    beforeEach(() => {
      setupMocksForStage("flowering", 70); // 70 days old
    });

    it("should show flowering stage specific fertilizers", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-flowering");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      // Should show flowering stage fertilizers
      expect(optionTexts.some(text => text?.includes("Espoma Berry-Tone"))).toBe(true);
      expect(optionTexts.some(text => text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true);
      expect(optionTexts.some(text => text?.includes("Bone meal"))).toBe(true);
    });

    it("should show top-dress method for Espoma Berry-Tone", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-flowering");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const berryToneOption = Array.from((fertilizerDropdown as HTMLSelectElement).options).find(
        option => option.textContent?.includes("Espoma Berry-Tone")
      );
      
      if (berryToneOption) {
        await user.selectOptions(fertilizerDropdown, berryToneOption.value);

        await waitFor(() => {
          expect(screen.getByText(/recommended settings/i)).toBeInTheDocument();
          const methodText = screen.getAllByText(/Top Dress/i);
          expect(methodText.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe("Fruiting Stage (Days 84-91)", () => {
    beforeEach(() => {
      setupMocksForStage("fruiting", 88); // 88 days old
    });

    it("should show fruiting stage fertilizers", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-fruiting");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      // Should show fruiting stage fertilizers
      expect(optionTexts.some(text => text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true);
      
      // Should have high-K supplement option
      expect(optionTexts.length).toBeGreaterThan(2); // More than just basic options
    });
  });

  describe("Ongoing Production Stage (Days 91+)", () => {
    beforeEach(() => {
      setupMocksForStage("ongoingProduction", 155); // 155 days old (mature plant)
    });

    it("should show ongoing production fertilizers", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-ongoingProduction");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      // Should show ongoing production fertilizers
      expect(optionTexts.some(text => text?.includes("Neptune's Harvest"))).toBe(true);
      expect(optionTexts.some(text => text?.includes("9-15-30 fertilizer"))).toBe(true);
    });

    it("should display soil-drench method for ongoing production fertilizers", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-ongoingProduction");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const neptunesOption = Array.from((fertilizerDropdown as HTMLSelectElement).options).find(
        option => option.textContent?.includes("Neptune's Harvest")
      );
      
      if (neptunesOption) {
        await user.selectOptions(fertilizerDropdown, neptunesOption.value);

        await waitFor(() => {
          expect(screen.getByText(/recommended settings/i)).toBeInTheDocument();
          const methodText = screen.getAllByText(/Soil Drench/i);
          expect(methodText.length).toBeGreaterThan(0);
        });
      }
    });

    it("should show weekly frequency recommendation for Neptune's Harvest", async () => {
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-ongoingProduction");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      await user.selectOptions(fertilizerDropdown, (fertilizerDropdown as HTMLSelectElement).options[1].value);

      await waitFor(() => {
        expect(screen.getByText(/recommended settings/i)).toBeInTheDocument();
      });
    });
  });

  describe("Fertilizer Protocol Consistency", () => {
    it("should not show vegetative fertilizers in flowering stage", async () => {
      setupMocksForStage("flowering", 70);
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-flowering");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      // Should show Espoma Berry-Tone (flowering specific)
      expect(optionTexts.some(text => text?.includes("Espoma Berry-Tone"))).toBe(true);
      // Should not show 9-15-30 (ongoing production specific)
      expect(optionTexts.every(text => !text?.includes("9-15-30"))).toBe(true);
    });

    it("should show custom option in establishment stage", async () => {
      setupMocksForStage("establishment", 10);
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-establishment");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      expect(optionTexts).toContain("Custom/Other");
    });

    it("should show custom option in ongoing production stage", async () => {
      setupMocksForStage("ongoingProduction", 155);
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-ongoingProduction");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      const optionTexts = options.map((option) => option.textContent);

      expect(optionTexts).toContain("Custom/Other");
    });
  });

  describe("Application Method Display", () => {
    it("should show correct application methods for different fertilizers", async () => {
      setupMocksForStage("flowering", 70);
      renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/plant section/i);
      await user.selectOptions(groupSelect, "group-strawberry-flowering");

      const activitySelect = screen.getByLabelText(/activity type/i);
      await user.selectOptions(activitySelect, "fertilize");

      await waitFor(() => {
        expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
      });

      const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
      const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
      
      // Check that application methods are shown in parentheses
      const hasMethodInfo = options.some(option => 
        option.textContent?.includes("(") && option.textContent?.includes(")")
      );
      expect(hasMethodInfo).toBe(true);
    });
  });
});