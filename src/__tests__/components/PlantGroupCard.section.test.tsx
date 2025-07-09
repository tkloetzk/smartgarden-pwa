import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PlantGroupCard from "@/components/plant/PlantGroupCard";
import { PlantGroup } from "@/utils/plantGrouping";
import { subDays } from "date-fns";

// Mock the hooks
jest.mock("@/hooks/useDynamicStage", () => ({
  useDynamicStage: () => "vegetative",
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("PlantGroupCard - Section Display", () => {
  const mockOnBulkLogActivity = jest.fn();

  const createMockGroup = (sectionOverrides: any = {}): PlantGroup => ({
    id: "test-group",
    varietyId: "lettuce-variety",
    varietyName: "Butterhead Lettuce",
    plantedDate: subDays(new Date(), 14),
    container: "Raised Bed A",
    location: "Main Garden",
    soilMix: "Seed Starting Mix",
    setupType: "same-container",
    plants: [
      {
        id: "plant-1",
        varietyId: "lettuce-variety",
        varietyName: "Butterhead Lettuce",
        name: "Lettuce Plant 1",
        plantedDate: subDays(new Date(), 14),
        location: "Main Garden",
        container: "Raised Bed A",
        isActive: true,
        createdAt: new Date(),
        ...sectionOverrides,
      },
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display section information when plant has a section", () => {
    const groupWithSection = createMockGroup({
      section: "Row 1 - 6\" section at 0\"",
    });

    renderWithRouter(
      <PlantGroupCard 
        group={groupWithSection} 
        onBulkLogActivity={mockOnBulkLogActivity} 
      />
    );

    // Check that section is displayed with the tag icon
    expect(screen.getByText("🏷️")).toBeInTheDocument();
    expect(screen.getByText("Row 1 - 6\" section at 0\"")).toBeInTheDocument();
  });

  it("should not display section information when plant has no section", () => {
    const groupWithoutSection = createMockGroup();

    renderWithRouter(
      <PlantGroupCard 
        group={groupWithoutSection} 
        onBulkLogActivity={mockOnBulkLogActivity} 
      />
    );

    // Check that section icon is not displayed
    expect(screen.queryByText("🏷️")).not.toBeInTheDocument();
  });

  it("should display location and container information", () => {
    const group = createMockGroup();

    renderWithRouter(
      <PlantGroupCard 
        group={group} 
        onBulkLogActivity={mockOnBulkLogActivity} 
      />
    );

    // Check that location and container are displayed
    expect(screen.getByText("📍")).toBeInTheDocument();
    expect(screen.getByText("Main Garden")).toBeInTheDocument();
    expect(screen.getByText("• Raised Bed A")).toBeInTheDocument();
  });

  it("should display section with different naming formats", () => {
    const testSections = [
      "Section A",
      "North End",
      "Row 2 - Wave 1",
    ];

    testSections.forEach((sectionName) => {
      const groupWithSection = createMockGroup({
        section: sectionName,
      });

      const { unmount } = renderWithRouter(
        <PlantGroupCard 
          group={groupWithSection} 
          onBulkLogActivity={mockOnBulkLogActivity} 
        />
      );

      expect(screen.getByText(sectionName)).toBeInTheDocument();
      expect(screen.getByText("🏷️")).toBeInTheDocument();
      
      unmount();
    });
  });

  it("should display both location and section when both are present", () => {
    const groupWithBoth = createMockGroup({
      section: "Row 1 - 6\" at 0\"",
    });

    renderWithRouter(
      <PlantGroupCard 
        group={groupWithBoth} 
        onBulkLogActivity={mockOnBulkLogActivity} 
      />
    );

    // Check both location and section are displayed
    expect(screen.getByText("📍")).toBeInTheDocument();
    expect(screen.getByText("Main Garden")).toBeInTheDocument();
    expect(screen.getByText("🏷️")).toBeInTheDocument();
    expect(screen.getByText("Row 1 - 6\" at 0\"")).toBeInTheDocument();
  });
});