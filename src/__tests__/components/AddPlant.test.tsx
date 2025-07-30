import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddPlant from "@/pages/plants/AddPlant";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { varietyService } from "@/types";
import { renderWithProviders } from "../utils/testHelpers";
import { createMockUser } from "../utils/testDataFactories";
import { varieties } from "@/data";

// Mock SimplifiedLocationSelector
jest.mock("@/components/plant/SimplifiedLocationSelector", () => ({
  SimplifiedLocationSelector: ({
    onBedSelect,
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

// Mock hooks and services
jest.mock("@/hooks/useFirebaseAuth");
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/types/database");

// Mock react-router-dom's navigate function
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock console.error to avoid cluttering test output
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Typecast mocks for easier use
const mockUseFirebaseAuth = useFirebaseAuth as jest.Mock;
const mockUseFirebasePlants = useFirebasePlants as jest.Mock;
const mockVarietyService = varietyService as jest.Mocked<typeof varietyService>;

describe("AddPlant Page", () => {
  const user = userEvent.setup();
  const mockSignOut = jest.fn();
  const mockCreatePlant = jest.fn();

  // Create mock data using factories
  const mockUser = createMockUser();
  const mockVarieties = varieties;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockConsoleError.mockClear();

    mockUseFirebaseAuth.mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    });

    mockUseFirebasePlants.mockReturnValue({
      createPlant: mockCreatePlant.mockResolvedValue("plant-id"),
    });

    mockVarietyService.getAllVarieties.mockResolvedValue(mockVarieties);

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

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe("Rendering and Layout", () => {
    it("renders the add plant page with correct header and user info", async () => {
      renderWithProviders(<AddPlant />);

      expect(screen.getByText("Add New Plant")).toBeInTheDocument();
      expect(
        screen.getByText("Register a new plant to start tracking its growth")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go back/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Welcome, ${mockUser.displayName}`)
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
      });
    });

    it("renders user email when displayName is not available", async () => {
      mockUseFirebaseAuth.mockReturnValue({
        user: { ...mockUser, displayName: null },
        signOut: mockSignOut,
      });

      renderWithProviders(<AddPlant />);

      await waitFor(() => {
        expect(
          screen.getByText(`Welcome, ${mockUser.email}`)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("navigates back when the 'Go back' button is clicked", async () => {
      renderWithProviders(<AddPlant />);

      const backButton = screen.getByRole("button", { name: /go back/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("navigates to dashboard on successful plant registration", async () => {
      renderWithProviders(<AddPlant />);

      await waitFor(() => {
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
      });

      const varietySelect = screen.getByLabelText(/plant variety/i);
      await user.selectOptions(varietySelect, "astro-arugula");

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
      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Authentication", () => {
    it("calls signOut when the sign out button is clicked", async () => {
      renderWithProviders(<AddPlant />);

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      await user.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("handles plant creation errors gracefully", async () => {
      const createError = new Error("Failed to create plant");
      mockCreatePlant.mockRejectedValueOnce(createError);

      renderWithProviders(<AddPlant />);
      await waitFor(() =>
        expect(screen.getByText("Register Your Plant")).toBeInTheDocument()
      );

      // Fill form to enable submission
      await user.selectOptions(
        screen.getByLabelText(/plant variety/i),
        "astro-arugula"
      );
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
      await waitFor(() => expect(submitButton).toBeEnabled());

      await user.click(submitButton);

      // Ensure navigation does not happen on error
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalledWith("/");
      });
    });
  });
});
