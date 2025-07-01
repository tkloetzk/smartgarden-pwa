import { screen, waitFor, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { User } from "firebase/auth";
import { Dashboard } from "@/pages/dashboard";
import { PlantRecord } from "@/types/database";

// --- MOCKS ---
jest.mock("@/hooks/useFirebaseAuth", () => ({
  useFirebaseAuth: jest.fn(),
}));

jest.mock("@/hooks/useFirebasePlants", () => ({
  useFirebasePlants: jest.fn(),
}));

const mockLogActivity = jest.fn();
jest.mock("@/hooks/useFirebaseCareActivities", () => ({
  useFirebaseCareActivities: () => ({
    logActivity: mockLogActivity,
  }),
}));

jest.mock("@/components/Navigation", () => ({
  __esModule: true,
  default: () => <div data-testid="navigation">Navigation</div>,
}));

jest.mock("@/components/ui/OfflineIndicator", () => ({
  OfflineIndicator: () => (
    <div data-testid="offline-indicator">Offline Indicator</div>
  ),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  // Also provide the named export if it's used directly
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";

const mockUseFirebaseAuth = useFirebaseAuth as jest.Mock;
const mockUseFirebasePlants = useFirebasePlants as jest.Mock;

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));
// --- END MOCKS ---

const renderWithRouter = (
  ui: React.ReactElement,
  { initialEntries = ["/"] } = {}
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
};

const createMockFirebaseUser = (overrides?: Partial<User>): User =>
  ({
    uid: "test-user-id",
    email: "test@example.com",
    emailVerified: true,
    displayName: "Test User",
    isAnonymous: false,
    metadata: {
      creationTime: "2024-01-01T00:00:00.000Z",
      lastSignInTime: "2024-01-01T00:00:00.000Z",
    },
    providerData: [],
    refreshToken: "mock-refresh-token",
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    phoneNumber: null,
    photoURL: null,
    providerId: "firebase",
    ...overrides,
  } as User);

const createMockPlant = (overrides: Partial<PlantRecord>): PlantRecord => ({
  id: `plant-${Math.random()}`,
  varietyId: "tomato-1",
  varietyName: "Cherry Tomato",
  name: "My Tomato",
  plantedDate: new Date("2024-05-10T00:00:00.000Z"),
  location: "Indoor",
  container: "5 Gallon Grow Bag",
  soilMix: "standard-mix",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFirebaseAuth.mockReturnValue({
      user: createMockFirebaseUser(),
      loading: false,
      error: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
    });
    mockUseFirebasePlants.mockReturnValue({
      plants: [],
      loading: false,
      error: null,
      createPlant: jest.fn(),
      updatePlant: jest.fn(),
      deletePlant: jest.fn(),
    });
    mockLogActivity.mockResolvedValue(undefined);
  });

  describe("Loading State", () => {
    it("displays loading state when Firebase plants hook is loading", () => {
      mockUseFirebasePlants.mockReturnValue({
        plants: [],
        loading: true,
        error: null,
        createPlant: jest.fn(),
        updatePlant: jest.fn(),
        deletePlant: jest.fn(),
      });

      renderWithRouter(<Dashboard />);

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  describe("Authentication", () => {
    it("displays user information when authenticated", () => {
      mockUseFirebasePlants.mockReturnValue({
        plants: [createMockPlant({ id: "p1" })],
        loading: false,
        error: null,
        createPlant: jest.fn(),
        updatePlant: jest.fn(),
        deletePlant: jest.fn(),
      });

      renderWithRouter(<Dashboard />);

      expect(screen.getByText("SmartGarden")).toBeInTheDocument();
      expect(screen.getByText("Welcome, Test User")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign Out" })
      ).toBeInTheDocument();
    });

    it("calls signOut when sign out button is clicked", async () => {
      const mockSignOut = jest.fn();
      mockUseFirebaseAuth.mockReturnValue({
        user: createMockFirebaseUser(),
        loading: false,
        error: null,
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: mockSignOut,
        resetPassword: jest.fn(),
      });

      renderWithRouter(<Dashboard />);

      const signOutButton = screen.getByRole("button", { name: "Sign Out" });
      await userEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("Empty State / Welcome", () => {
    it("displays welcome message when no plants exist", () => {
      renderWithRouter(<Dashboard />);

      expect(screen.getByText("Welcome to SmartGarden!")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Start your gardening journey by adding your first plant. Track growth, log care activities, and get personalized recommendations."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "🌿 Add Your First Plant" })
      ).toBeInTheDocument();
    });

    it("navigates to add plant page when 'Add Your First Plant' is clicked", async () => {
      renderWithRouter(<Dashboard />);
      const addPlantButton = screen.getByRole("button", {
        name: "🌿 Add Your First Plant",
      });
      await userEvent.click(addPlantButton);

      expect(mockNavigate).toHaveBeenCalledWith("/add-plant");
    });
  });

  describe("Plant Grouping and Bulk Actions", () => {
    const groupedPlants = [
      createMockPlant({ id: "p1", name: "Tomato 1" }),
      createMockPlant({ id: "p2", name: "Tomato 2" }),
    ];

    it("should render a plant group card and allow bulk logging", async () => {
      mockUseFirebasePlants.mockReturnValue({
        plants: groupedPlants,
        loading: false,
        error: null,
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      // Wait for the group card to appear
      await waitFor(() => {
        expect(screen.getByText("Cherry Tomato")).toBeInTheDocument();
      });

      const groupCardText = await screen.findByText("2 plants");
      expect(groupCardText).toBeInTheDocument();

      // Expand the bulk actions menu
      const logAllButton = await screen.findByRole("button", {
        name: /Log All/i,
      });
      await user.click(logAllButton);

      // Click the "Water All" button from the expanded menu
      const waterAllButton = await screen.findByRole("button", {
        name: /Water All/i,
      });
      await user.click(waterAllButton);

      // Assert that the modal opens
      await waitFor(() => {
        expect(screen.getByText("💧 Water All Plants")).toBeInTheDocument();
      });

      // Fill and submit the modal - now using the corrected label
      const amountInput = screen.getByLabelText(/Amount \(oz\)/i);
      await user.clear(amountInput);
      await user.type(amountInput, "100");

      const submitButton = screen.getByRole("button", {
        name: /Log Activity for All 2 Plants/i,
      });
      await user.click(submitButton);

      // Verify the activity was logged for both plants
      await waitFor(() => {
        expect(mockLogActivity).toHaveBeenCalledTimes(2);
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            plantId: "p1",
            type: "water",
            details: expect.objectContaining({
              amount: { value: 100, unit: "oz" },
            }),
          })
        );
        expect(mockLogActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            plantId: "p2",
            type: "water",
            details: expect.objectContaining({
              amount: { value: 100, unit: "oz" },
            }),
          })
        );
      });

      // Check that the modal closed after submission
      expect(screen.queryByText("💧 Water All Plants")).not.toBeInTheDocument();
    });
  });
});
