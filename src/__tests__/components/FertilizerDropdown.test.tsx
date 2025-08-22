// src/__tests__/components/FertilizerDropdown.test.tsx
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

// Get real varieties for testing
// Note: These varieties are available but not used in current tests

const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ["/log-care"]
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

describe("Fertilizer Dropdown Tests", () => {
  const user = userEvent.setup();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock variety service to return null (forcing fallback to seedVarieties)
    mockVarietyService.getVariety.mockResolvedValue(undefined);

    // Mock plant data with real varieties
    const baseDate = new Date('2024-01-01');
    const mockPlantGroups = [
      {
        id: "group-strawberry-vegetative",
        varietyName: "Albion Strawberries",
        container: "Container A",
        location: "Indoor",
        plantedDate: baseDate,
        plants: [
          { 
            id: "strawberry1", 
            varietyName: "Albion Strawberries",
            varietyId: "albion-strawberries",
            plantedDate: baseDate,
            name: "Strawberry Plant 1"
          }
        ],
      },
      {
        id: "group-arugula-vegetative",
        varietyName: "Astro Arugula",
        container: "Container B",
        location: "Indoor",
        plantedDate: baseDate,
        plants: [
          { 
            id: "arugula1", 
            varietyName: "Astro Arugula",
            varietyId: "astro-arugula",
            plantedDate: baseDate,
            name: "Arugula Plant 1"
          }
        ],
      },
      {
        id: "group-peas-vegetative",
        varietyName: "Sugar Snap Peas",
        container: "Container C",
        location: "Indoor",
        plantedDate: baseDate,
        plants: [
          { 
            id: "peas1", 
            varietyName: "Sugar Snap Peas",
            varietyId: "sugar-snap-peas",
            plantedDate: baseDate,
            name: "Peas Plant 1"
          }
        ],
      },
    ];

    mockUseFirebasePlants.mockReturnValue({
      plants: [
        ...mockPlantGroups[0].plants,
        ...mockPlantGroups[1].plants,
        ...mockPlantGroups[2].plants,
      ],
      loading: false,
      error: null,
    });

    mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);

    mockUseFirebaseCareActivities.mockReturnValue({
      logActivity: jest.fn(),
    });

    // Mock growth stage calculations
    mockCalculateCurrentStageWithVariety.mockImplementation((_plantedDate, variety) => {
      if (variety?.name === "Albion Strawberries") return "vegetative";
      if (variety?.name === "Astro Arugula") return "vegetative";
      if (variety?.name === "Sugar Snap Peas") return "vegetativeVining";
      return "germination";
    });
  });

  it("should show fertilizer products for Albion Strawberries in vegetative stage", async () => {
    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
    });

    // Select Strawberry plant group
    const groupSelect = screen.getByLabelText(/plant section/i);
    await user.selectOptions(groupSelect, "group-strawberry-vegetative");

    // Select fertilize activity type
    const activitySelect = screen.getByLabelText(/activity type/i);
    await user.selectOptions(activitySelect, "fertilize");

    // Wait for fertilizer dropdown to appear
    await waitFor(() => {
      expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
    });

    // Check that Strawberry-specific products are displayed
    const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
    expect(fertilizerDropdown).toBeInTheDocument();

    // Verify correct options for Strawberries in vegetative stage
    const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
    const optionTexts = options.map((option) => option.textContent);

    // Should show Neptune's Harvest products from the actual protocol
    expect(optionTexts.some(text => text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true);
    expect(optionTexts).toContain("Custom/Other");
  });

  it("should show fertilizer products for Astro Arugula in vegetative stage", async () => {
    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
    });

    // Select Arugula plant group
    const groupSelect = screen.getByLabelText(/plant section/i);
    await user.selectOptions(groupSelect, "group-arugula-vegetative");

    // Select fertilize activity type
    const activitySelect = screen.getByLabelText(/activity type/i);
    await user.selectOptions(activitySelect, "fertilize");

    // Wait for fertilizer dropdown to appear
    await waitFor(() => {
      expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
    });

    // Check that Arugula-specific products are displayed
    const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
    expect(fertilizerDropdown).toBeInTheDocument();

    // Verify correct options for Arugula in vegetative stage
    const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
    const optionTexts = options.map((option) => option.textContent);

    // Should show the actual fertilizer from arugula protocol
    expect(optionTexts.some(text => text?.includes("Fish Emulsion"))).toBe(true);
    expect(optionTexts).toContain("Custom/Other");
    expect(optionTexts.every(text => !text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true); // Should not show Strawberry products
  });

  it("should show fertilizer products for Sugar Snap Peas in vegetativeVining stage", async () => {
    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
    });

    // Select Peas plant group
    const groupSelect = screen.getByLabelText(/plant section/i);
    await user.selectOptions(groupSelect, "group-peas-vegetative");

    // Select fertilize activity type
    const activitySelect = screen.getByLabelText(/activity type/i);
    await user.selectOptions(activitySelect, "fertilize");

    // Wait for fertilizer dropdown to appear
    await waitFor(() => {
      expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
    });

    // Check that Peas-specific products are displayed
    const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
    expect(fertilizerDropdown).toBeInTheDocument();

    // Verify correct options for Peas in vegetativeVining stage
    const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
    const optionTexts = options.map((option) => option.textContent);

    // Should show the actual fertilizer from peas protocol
    expect(optionTexts.some(text => text?.includes("Fish emulsion/fish+kelp (optional)"))).toBe(true);
    expect(optionTexts).toContain("Custom/Other");
    expect(optionTexts.every(text => !text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true); // Should not show Strawberry products
  });

  it("should display protocol information for selected fertilizer", async () => {
    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
    });

    // Select Strawberry plant group
    const groupSelect = screen.getByLabelText(/plant section/i);
    await user.selectOptions(groupSelect, "group-strawberry-vegetative");

    // Select fertilize activity type
    const activitySelect = screen.getByLabelText(/activity type/i);
    await user.selectOptions(activitySelect, "fertilize");

    // Wait for fertilizer dropdown to appear
    await waitFor(() => {
      expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
    });

    // Select a fertilizer product
    const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
    await user.selectOptions(fertilizerDropdown, "Neptune's Harvest Fish + Seaweed");

    // Check that protocol information appears
    await waitFor(() => {
      expect(
        screen.getByText(/protocol for vegetative stage/i)
      ).toBeInTheDocument();
    });

    // Check that recommended settings appear
    await waitFor(() => {
      expect(screen.getByText(/recommended settings/i)).toBeInTheDocument();
    });
  });

  it("should show custom option in dropdown", async () => {
    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
    });

    // Select Strawberry plant group
    const groupSelect = screen.getByLabelText(/plant section/i);
    await user.selectOptions(groupSelect, "group-strawberry-vegetative");

    // Select fertilize activity type
    const activitySelect = screen.getByLabelText(/activity type/i);
    await user.selectOptions(activitySelect, "fertilize");

    // Wait for fertilizer dropdown to appear
    await waitFor(() => {
      expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
    });

    // Check that custom option exists
    const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
    const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
    const optionTexts = options.map((option) => option.textContent);

    expect(optionTexts).toContain("Custom/Other");
  });

  it("should update fertilizer products when changing plant variety", async () => {
    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
    });

    // Select Strawberry plant group first
    const groupSelect = screen.getByLabelText(/plant section/i);
    await user.selectOptions(groupSelect, "group-strawberry-vegetative");

    // Select fertilize activity type
    const activitySelect = screen.getByLabelText(/activity type/i);
    await user.selectOptions(activitySelect, "fertilize");

    // Wait for fertilizer dropdown to appear and check Strawberry products
    await waitFor(() => {
      expect(screen.getByText(/Choose a fertilizer/i)).toBeInTheDocument();
    });

    let fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
    const strawberryOptions = Array.from(
      fertilizerDropdown.querySelectorAll("option")
    );
    const strawberryOptionTexts = strawberryOptions.map((option) => option.textContent);

    expect(strawberryOptionTexts.some(text => text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true);

    // Now change to Arugula
    await user.selectOptions(groupSelect, "group-arugula-vegetative");

    // Check that dropdown now shows Arugula products
    fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
    const arugulaOptions = Array.from(
      fertilizerDropdown.querySelectorAll("option")
    );
    const arugulaOptionTexts = arugulaOptions.map(
      (option) => option.textContent
    );

    expect(arugulaOptionTexts.some(text => text?.includes("Fish Emulsion"))).toBe(true);
    expect(arugulaOptionTexts.every(text => !text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true); // Should not show Strawberry products
  });

  it("should handle missing protocols gracefully", async () => {
    // Create a mock plant with no fertilization protocols
    const mockPlantGroups = [
      {
        id: "group-unknown-plant",
        varietyName: "Unknown Plant",
        container: "Container D",
        location: "Indoor",
        plantedDate: new Date('2024-01-01'),
        plants: [
          { 
            id: "plant1", 
            varietyName: "Unknown Plant",
            varietyId: "unknown-plant",
            plantedDate: new Date('2024-01-01'),
            name: "Unknown Plant 1"
          }
        ],
      },
    ];

    mockUseFirebasePlants.mockReturnValue({
      plants: mockPlantGroups[0].plants,
      loading: false,
      error: null,
    });

    mockGroupPlantsByConditions.mockReturnValue(mockPlantGroups);

    renderWithRouter(<CareLogForm onSuccess={mockOnSuccess} />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/plant section/i)).toBeInTheDocument();
    });

    // Select Unknown Plant group
    const groupSelect = screen.getByLabelText(/plant section/i);
    await user.selectOptions(groupSelect, "group-unknown-plant");

    // Select fertilize activity type
    const activitySelect = screen.getByLabelText(/activity type/i);
    await user.selectOptions(activitySelect, "fertilize");

    // Should not crash even if no protocols exist
    expect(screen.getByLabelText(/fertilizer product/i)).toBeInTheDocument();
    
    // Should still show custom option
    const fertilizerDropdown = screen.getByLabelText(/fertilizer product/i);
    const options = Array.from(fertilizerDropdown.querySelectorAll("option"));
    const optionTexts = options.map((option) => option.textContent);
    expect(optionTexts).toContain("Custom/Other");
  });

  it("should show different fertilizers for different growth stages", async () => {
    // Test that flowering stage shows different fertilizers than vegetative
    mockCalculateCurrentStageWithVariety.mockImplementation((_plantedDate, variety) => {
      if (variety?.name === "Albion Strawberries") return "flowering"; // Change to flowering stage
      return "germination";
    });

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

    // Should show flowering stage fertilizers (e.g., Espoma Berry-Tone, Bone meal)
    expect(optionTexts.some(text => text?.includes("Espoma Berry-Tone"))).toBe(true);
    expect(optionTexts.some(text => text?.includes("Bone meal"))).toBe(true);
    expect(optionTexts.some(text => text?.includes("Neptune's Harvest Fish + Seaweed"))).toBe(true);
  });
});
