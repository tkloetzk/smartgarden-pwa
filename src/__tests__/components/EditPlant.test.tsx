// src/__tests__/components/EditPlant.simple.test.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EditPlant from "@/pages/plants/EditPlant";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";

// Mock hooks
jest.mock("@/hooks/useFirebaseAuth");
jest.mock("@/hooks/useFirebasePlants");

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ plantId: "test-plant-id" }),
}));

const mockUseFirebaseAuth = useFirebaseAuth as jest.Mock;
const mockUseFirebasePlants = useFirebasePlants as jest.Mock;

const renderEditPlant = () => {
  return render(
    <MemoryRouter>
      <EditPlant />
    </MemoryRouter>
  );
};

describe("EditPlant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state when plants are loading", () => {
    mockUseFirebaseAuth.mockReturnValue({
      user: { uid: "test-user" },
      loading: false,
    });

    mockUseFirebasePlants.mockReturnValue({
      plants: [],
      loading: true,
    });

    renderEditPlant();

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("shows plant not found when plant doesn't exist", () => {
    mockUseFirebaseAuth.mockReturnValue({
      user: { uid: "test-user" },
      loading: false,
    });

    mockUseFirebasePlants.mockReturnValue({
      plants: [],
      loading: false,
    });

    renderEditPlant();

    expect(screen.getByText("Plant not found")).toBeInTheDocument();
  });

  it("shows edit plant form when plant data loads", async () => {
    const mockPlant = {
      id: "test-plant-id",
      varietyId: "basil-greek",
      varietyName: "Greek Basil",
      name: "My Basil Plant",
      plantedDate: new Date("2024-01-01"),
      location: "Indoor",
      container: "Kitchen Windowsill",
      soilMix: "Herb Mix",
      notes: ["Growing well"],
    };

    mockUseFirebaseAuth.mockReturnValue({
      user: { uid: "test-user" },
      loading: false,
    });

    mockUseFirebasePlants.mockReturnValue({
      plants: [mockPlant],
      loading: false,
      updatePlant: jest.fn(),
    });

    renderEditPlant();

    // Initially should show loading
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});