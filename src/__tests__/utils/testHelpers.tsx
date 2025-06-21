import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: { initialEntries?: string[] }
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Fixed: Made this an array instead of a single object
export const mockPlantData = [
  {
    id: "test-plant-1",
    varietyId: "test-variety-1",
    varietyName: "Test Variety",
    name: "Test Plant",
    plantedDate: new Date("2024-01-01"),
    currentStage: "vegetative" as const,
    location: "Indoor",
    container: "5 gallon pot",
    isActive: true,
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Fixed: Added all required properties for UpcomingTask
export const mockTaskData = [
  {
    id: "task-1",
    plantId: "test-plant-1",
    name: "Test Plant",
    task: "Check water level",
    dueIn: "overdue by 1 day",
    activityType: "water" as const,
    dueDate: new Date(),
    priority: "high" as const,
    description: "Water the plant",
    canBypass: true,
  },
];

// This test ensures testHelpers exports work correctly
describe("Test Helpers", () => {
  it("should export helper functions", () => {
    expect(renderWithProviders).toBeDefined();
    expect(mockPlantData).toBeDefined();
    expect(mockTaskData).toBeDefined();
  });
});
