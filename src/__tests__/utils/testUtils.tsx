// src/__tests__/utils/testUtils.tsx
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

export const mockPlantData = [
  {
    id: "1",
    varietyId: "astro-arugula",
    varietyName: "Astro Arugula",
    name: "My Arugula",
    plantedDate: new Date("2024-01-01"),
    currentStage: "vegetative" as const,
    location: "Kitchen Window",
    container: "4 inch pot",
    isActive: true,
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ... more mock plants
];

export const mockTaskData = [
  {
    id: "water-1",
    plantId: "1",
    name: "My Arugula",
    task: "Check water level",
    dueIn: "2 days",
    priority: "medium" as const,
    plantStage: "vegetative",
    dueDate: new Date(),
    canBypass: true,
  },
  // ... more mock tasks
];
