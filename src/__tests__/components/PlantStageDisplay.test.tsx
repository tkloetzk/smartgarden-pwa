// src/__tests__/components/PlantStageDisplay.test.tsx
import { render, screen } from "@testing-library/react";
import PlantStageDisplay from "@/components/plant/PlantStageDisplay";
import { PlantRecord } from "@/types/database";

// Mock the useDynamicStage hook
jest.mock("@/hooks/useDynamicStage", () => ({
  useDynamicStage: jest.fn(),
}));

import { useDynamicStage } from "@/hooks/useDynamicStage";
const mockUseDynamicStage = useDynamicStage as jest.MockedFunction<
  typeof useDynamicStage
>;

describe("PlantStageDisplay", () => {
  const mockPlant: PlantRecord = {
    id: "test-plant",
    varietyId: "test-variety",
    varietyName: "Test Variety",
    name: "Test Plant",
    plantedDate: new Date(),
    location: "Indoor",
    container: "5 gallon",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUseDynamicStage.mockReturnValue("flowering");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("displays plant stage without emoji by default", () => {
    render(<PlantStageDisplay plant={mockPlant} />);

    expect(screen.getByText("Stage: flowering")).toBeInTheDocument();
    expect(screen.queryByText("🌱")).not.toBeInTheDocument();
  });

  it("displays plant stage with emoji when showEmoji is true", () => {
    render(<PlantStageDisplay plant={mockPlant} showEmoji={true} />);

    expect(screen.getByText("Stage: flowering")).toBeInTheDocument();
    expect(screen.getByText("🌱")).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    render(<PlantStageDisplay plant={mockPlant} className="custom-class" />);

    const stageDisplay = screen.getByText(/Stage:/).closest("div");
    expect(stageDisplay).toHaveClass("custom-class");
  });

  it("uses calculated stage from useDynamicStage hook", () => {
    mockUseDynamicStage.mockReturnValue("harvest");

    render(<PlantStageDisplay plant={mockPlant} />);

    expect(screen.getByText("Stage: harvest")).toBeInTheDocument();
    expect(mockUseDynamicStage).toHaveBeenCalledWith(mockPlant);
  });
});
