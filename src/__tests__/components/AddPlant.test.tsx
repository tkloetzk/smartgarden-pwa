// src/__tests__/pages/AddPlant.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import AddPlant from "@/pages/plants/AddPlant";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { varietyService } from "@/types/database";

// Mock dependencies
jest.mock("@/hooks/useFirebaseAuth");
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/types/database");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockUser = {
  uid: "test-user-id",
  email: "test@example.com",
  displayName: "Test User",
};

const mockVarieties = [
  {
    id: "variety-1",
    name: "Test Variety",
    category: "herbs" as const,
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      maturation: 45,
    },
    createdAt: new Date(),
  },
];

describe("AddPlant Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    (useFirebaseAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      signOut: jest.fn(),
    });

    (useFirebasePlants as jest.Mock).mockReturnValue({
      createPlant: jest.fn().mockResolvedValue("plant-id"),
    });

    (varietyService.getAllVarieties as jest.Mock).mockResolvedValue(
      mockVarieties
    );
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("renders the add plant page with proper styling", async () => {
    renderWithRouter(<AddPlant />);

    // Check for header elements
    expect(screen.getByText("Add New Plant")).toBeInTheDocument();
    expect(
      screen.getByText("Register a new plant to start tracking its growth")
    ).toBeInTheDocument();

    // Check for back button
    expect(
      screen.getByRole("button", { name: /go back/i })
    ).toBeInTheDocument();

    // Check for user info
    expect(screen.getByText("Welcome, Test User")).toBeInTheDocument();

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
    });
  });

  it("navigates back to dashboard when back button is clicked", async () => {
    renderWithRouter(<AddPlant />);

    const backButton = screen.getByRole("button", { name: /go back/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("navigates to dashboard on successful plant registration", async () => {
    renderWithRouter(<AddPlant />);

    // Wait for the form and varieties to load
    await waitFor(() => {
      expect(screen.getByText("Register Your Plant")).toBeInTheDocument();
    });

    // 1. Select a plant variety from the dropdown
    const varietySelect = screen.getByLabelText(/plant variety/i);
    await user.selectOptions(varietySelect, "variety-1");

    // 2. Select a container type by clicking its button
    const growBagButton = screen.getByTestId("container-type-grow-bag");
    await user.click(growBagButton);

    // 3. Select a soil mixture by clicking one of the preset cards
    const soilMixtureCard = screen.getByTestId(
      "mixture-card-leafy-greens-standard"
    );
    await user.click(soilMixtureCard);

    // 4. Find the submit button
    const submitButton = screen.getByRole("button", {
      name: /register plant/i,
    });

    // 5. Wait for the button to be enabled after filling the form, then click it
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    await user.click(submitButton);

    // 6. Assert that a successful submission calls navigate to the homepage
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows offline indicator when navigator is offline", () => {
    // 1. Simulate the offline state
    const onlineSpy = jest.spyOn(navigator, "onLine", "get");
    onlineSpy.mockReturnValue(false);

    renderWithRouter(<AddPlant />);

    // 2. Find the element by the text it displays to the user
    expect(
      screen.getByText(
        /You're offline - Data will sync when connection returns/i
      )
    ).toBeInTheDocument();

    // 3. Clean up the mock
    onlineSpy.mockRestore();
  });

  it("includes navigation component", () => {
    renderWithRouter(<AddPlant />);

    // Navigation component should be rendered
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
