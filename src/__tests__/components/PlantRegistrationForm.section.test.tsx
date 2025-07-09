import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { PlantRegistrationForm } from "@/components/plant/PlantRegistrationForm";

// Mock toast to prevent console errors
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Firebase hooks completely
jest.mock("@/hooks/useFirebasePlants", () => ({
  useFirebasePlants: () => ({
    plants: [],
    loading: false,
    error: null,
    createPlant: jest.fn().mockResolvedValue({ id: "test-plant-id" }),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
    refetch: jest.fn(),
  }),
}));

// Mock varietyService to return empty for simplicity
jest.mock("@/types/database", () => ({
  varietyService: {
    getAll: jest.fn().mockResolvedValue([]),
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("PlantRegistrationForm - Section Support", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the section input field", async () => {
    renderWithProviders(<PlantRegistrationForm />);

    // Wait for the form to load and find the section field
    await waitFor(() => {
      const sectionInput = screen.getByLabelText(/Section\/Area/i);
      expect(sectionInput).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify the placeholder text
    const sectionInput = screen.getByPlaceholderText(/Row 1 - 6" section at 0"/i);
    expect(sectionInput).toBeInTheDocument();
    expect(sectionInput).toHaveAttribute("id", "section");
  });

  it("should allow entering section information", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlantRegistrationForm />);

    // Wait for form to render
    await waitFor(() => {
      const sectionInput = screen.getByLabelText(/Section\/Area/i);
      expect(sectionInput).toBeInTheDocument();
    }, { timeout: 3000 });

    const sectionInput = screen.getByLabelText(/Section\/Area/i) as HTMLInputElement;
    
    await user.type(sectionInput, "Row 1 - 6\" section at 0\"");
    expect(sectionInput.value).toBe("Row 1 - 6\" section at 0\"");
  });

  it("should show section field as optional", async () => {
    renderWithProviders(<PlantRegistrationForm />);

    await waitFor(() => {
      const sectionLabel = screen.getByText(/Section\/Area \(Optional\)/i);
      expect(sectionLabel).toBeInTheDocument();
    }, { timeout: 3000 });

    const helpText = screen.getByText(/Specify a section within your location for succession planting/i);
    expect(helpText).toBeInTheDocument();
  });

  it("should accept various section naming formats", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlantRegistrationForm />);

    await waitFor(() => {
      const sectionInput = screen.getByLabelText(/Section\/Area/i);
      expect(sectionInput).toBeInTheDocument();
    }, { timeout: 3000 });

    const sectionInput = screen.getByLabelText(/Section\/Area/i) as HTMLInputElement;
    
    // Test one example section name
    await user.type(sectionInput, "Section A");
    expect(sectionInput.value).toBe("Section A");
    
    await user.clear(sectionInput);
    await user.type(sectionInput, "Row 1 - North End");
    expect(sectionInput.value).toBe("Row 1 - North End");
  });
});