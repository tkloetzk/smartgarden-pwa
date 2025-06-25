import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface RenderOptions {
  initialEntries?: string[];
  withRouter?: boolean;
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions = {}
) => {
  const {
    withRouter = true,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    }),
  } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const content = (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    if (withRouter) {
      return <BrowserRouter>{content}</BrowserRouter>;
    }

    return content;
  };

  return render(ui, { wrapper: Wrapper });
};

// Export mock data for reuse in tests
export const mockPlantData = [
  {
    id: "plant-1",
    varietyId: "tomato-1",
    varietyName: "Cherry Tomato",
    name: "My Cherry Tomato",
    plantedDate: new Date("2024-01-01"),
    currentStage: "vegetative" as const,
    location: "Indoor",
    container: "5 gallon pot",
    isActive: true,
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "plant-2",
    varietyId: "basil-1",
    varietyName: "Sweet Basil",
    name: "My Basil",
    plantedDate: new Date("2024-01-15"),
    currentStage: "seedling" as const,
    location: "Indoor",
    container: "3 gallon pot",
    isActive: true,
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockUser = {
  uid: "test-user-id",
  email: "test@example.com",
  displayName: "Test User",
};
