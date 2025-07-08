import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CatchUpAssistant } from "@/components/plant/CatchUpAssistant";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { FirebasePlantService } from "@/services/firebase/plantService";
import { PlantRecord, VarietyRecord, varietyService } from "@/types/database";
import { FirebaseAuthService } from "@/services/firebase/authService";
import {
  createMockPlantWithVariety,
  createMockCareActivity,
  getRealVariety,
} from "../utils/testDataFactories";
import { subDays, subWeeks } from "date-fns";

// We are NOT mocking CatchUpAssistant directly, nor its direct hooks (useFirebasePlants, useFirebaseAuth).
// Instead, we are controlling the behavior of the underlying Firebase services that these hooks/services use.

// Spy on the actual Firebase service methods that are globally mocked in setupTests.ts
const spyOnFirebaseCareActivityService = jest.spyOn(
  FirebaseCareActivityService,
  "getRecentActivitiesForPlant"
);
const spyOnFirebasePlantService = jest.spyOn(
  FirebasePlantService,
  "subscribeToPlantsChanges"
);
const spyOnVarietyService = jest.spyOn(varietyService, "getVariety");
const spyOnFirebaseAuthService = jest.spyOn(
  FirebaseAuthService,
  "onAuthStateChanged"
);

// Mock useCatchUpSummary to prevent it from interfering with CatchUpAssistant's own data loading
jest.mock("@/hooks/useCatchUpSummary", () => ({
  useCatchUpSummary: () => ({
    totalOpportunities: 0,
    plantsNeedingCatchUp: 0,
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("CatchUpAssistant (Integration-like)", () => {
  let mockPlant: PlantRecord;
  let mockVariety: VarietyRecord;

  beforeAll(() => {
    // Ensure the real variety data is available for the mock
    mockVariety = getRealVariety("Little Finger Carrots")!;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-15T12:00:00Z"));

    // Clear any localStorage from previous tests
    localStorage.clear();

    // 1. Mock Auth State
    spyOnFirebaseAuthService.mockImplementation((callback) => {
      callback({
        uid: "test-user-id",
        displayName: "Test User",
      } as import("firebase/auth").User);
      return jest.fn(); // Unsubscribe
    });

    // 2. Mock Plant Data
    mockPlant = createMockPlantWithVariety("Little Finger Carrots", {
      id: "test-plant-1",
      plantedDate: subWeeks(new Date("2025-01-15T12:00:00Z"), 7), // 7 weeks old
    });
    spyOnFirebasePlantService.mockImplementation((_, callback) => {
      callback([mockPlant]);
      return jest.fn(); // Unsubscribe
    });

    // 3. Mock Variety Service (used by CatchUpAnalysisService)
    spyOnVarietyService.mockResolvedValue(mockVariety);

    // 4. Mock Care Activity Service (used by CatchUpAnalysisService)
    // This will be set per test case to simulate different scenarios
    spyOnFirebaseCareActivityService.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    queryClient.clear();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("should display loading state initially and then show opportunities for an established plant", async () => {
    // Simulate overdue watering and fertilizing for an established plant
    spyOnFirebaseCareActivityService.mockResolvedValueOnce([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "water",
        date: subDays(new Date(), 12),
      }), // Last watered 12 days ago (expected ~7) -> daysMissed = 5 -> reschedule (Do Now)
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 25),
      }), // Last fertilized 25 days ago (expected ~14) -> daysMissed = 11 -> skip
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    // Check for analyzing state
    expect(screen.getByText(/Checking care history.../i)).toBeInTheDocument();

    // Wait for opportunities to appear
    await waitFor(() => {
      expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
    });

    // Assert that the opportunities are displayed
    expect(screen.getByText(/Regular Watering/i)).toBeInTheDocument();
    expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();

    // Check suggested actions
    expect(screen.getByRole("button", { name: /Do Now/i })).toBeInTheDocument(); // For watering
    expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument(); // For fertilization
  });

  it("should display initial care opportunities for a new plant", async () => {
    const newPlant = createMockPlantWithVariety("Astro Arugula", {
      id: "new-plant-1",
      plantedDate: subDays(new Date("2025-01-15T12:00:00Z"), 5), // 5 days old
    });

    // Mock plant service to return the new plant
    spyOnFirebasePlantService.mockImplementation((_, callback) => {
      callback([newPlant]);
      return jest.fn();
    });

    // No recent activities for the new plant
    spyOnFirebaseCareActivityService.mockResolvedValueOnce([
      // createMockActivity(newPlant.id, "photo", 3), // Photo task is removed
    ]);

    renderWithProviders(<CatchUpAssistant plantId={newPlant.id} />);

    await waitFor(() => {
      expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
    });

    // Expect initial watering and health check
    expect(screen.getByText(/Initial Watering/i)).toBeInTheDocument();
    expect(screen.getByText(/Initial Health Check/i)).toBeInTheDocument();
    expect(screen.queryByText(/First Feeding/i)).not.toBeInTheDocument(); // Should not be due for 5-day old plant

    // Check suggested actions for new plant tasks
    // Initial Watering (daysMissed=4) -> reschedule (Do Now)
    // Initial Health Check (daysMissed=2) -> reschedule (Do Now)
    const doNowButtons = screen.getAllByRole("button", { name: /Do Now/i });
    expect(doNowButtons.length).toBe(3); // Water, Observe, Note
    expect(
      screen.queryByRole("button", { name: /Log as Done/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Skip/i })
    ).not.toBeInTheDocument();
  });

  it("should show no opportunities if all care is up to date", async () => {
    // Simulate recent activities for all types
    spyOnFirebaseCareActivityService.mockResolvedValueOnce([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "water",
        date: subDays(new Date(), 1),
      }), // Watered yesterday
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 5),
      }), // Fertilized 5 days ago
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "observe",
        date: subDays(new Date(), 2),
      }), // Observed 2 days ago
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    // Wait for loading to finish and opportunities to be processed
    await waitFor(() => {
      expect(
        screen.queryByText(/Checking care history.../i)
      ).not.toBeInTheDocument();
    });

    // Assert that no opportunities are displayed
    expect(
      screen.queryByText(/Catch-Up Opportunities/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/missed care activities/i)
    ).not.toBeInTheDocument();
  });

  it("should display skip button for severely overdue tasks", async () => {
    // Simulate an overdue watering task that should be skipped
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "water",
        date: subDays(new Date(), 15),
      }), // Last watered 15 days ago (expected ~7) -> daysMissed = 8 -> skip
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    await waitFor(() => {
      expect(screen.getByText(/Regular Watering/i)).toBeInTheDocument();
    });

    // Should display skip button for severely overdue tasks
    const skipButton = screen.getByRole("button", { name: /Skip/i });
    expect(skipButton).toBeInTheDocument();
    expect(skipButton).not.toBeDisabled();
  });

  it("should display a missed fertilization opportunity", async () => {
    // Simulate an overdue fertilization task that should be rescheduled
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 20),
      }), // Last fertilized 20 days ago (expected ~14) -> daysMissed = 6 -> reschedule (Do Now)
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Assert that the fertilization opportunity is displayed
    await waitFor(
      () => {
        expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText(/6d ago/i)).toBeInTheDocument(); // 20 - 14 = 6 days missed
    expect(screen.getByRole("button", { name: /Do Now/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Skip/i })
    ).not.toBeInTheDocument();
  });

  it("should display a severely overdue fertilization opportunity with Skip", async () => {
    // Simulate a fertilization missed by a large margin (e.g., 30 days overdue, expected every 14)
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 44), // 30 days missed
      }),
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText(/30d ago/i)).toBeInTheDocument(); // 44 - 14 = 30 days missed
    expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Do Now/i })
    ).not.toBeInTheDocument();
  });

  it("should display both watering and fertilization when both are overdue", async () => {
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "water",
        date: subDays(new Date(), 20),
      }),
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 30),
      }),
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Regular Watering/i)).toBeInTheDocument();
        expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Both should have Do Now or Skip depending on the days missed threshold
    expect(
      screen.getAllByRole("button", { name: /Do Now|Skip/i }).length
    ).toBeGreaterThanOrEqual(2);
  });

  it("should display only fertilization if only fertilization is missed", async () => {
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 25),
      }),
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "water",
        date: subDays(new Date(), 2), // Watering is up to date
      }),
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.queryByText(/Regular Watering/i)).not.toBeInTheDocument();
  });

  it("should display First Feeding opportunity for new plants using real variety protocols", async () => {
    // Test with Astro Arugula which has specific fertilization protocols
    const arugulaVariety = getRealVariety("Astro Arugula");
    const newArugulaPlant = createMockPlantWithVariety("Astro Arugula", {
      id: "arugula-plant-1",
      plantedDate: subDays(new Date("2025-01-15T12:00:00Z"), 20), // 20 days old
    });

    // Mock plant service to return the arugula plant
    spyOnFirebasePlantService.mockImplementation((_, callback) => {
      callback([newArugulaPlant]);
      return jest.fn();
    });

    spyOnVarietyService.mockResolvedValue(arugulaVariety);

    // No fertilization activities yet
    spyOnFirebaseCareActivityService.mockResolvedValueOnce([
      createMockCareActivity({
        plantId: newArugulaPlant.id,
        type: "water",
        date: subDays(new Date(), 1),
      }),
    ]);

    renderWithProviders(<CatchUpAssistant plantId={newArugulaPlant.id} />);

    await waitFor(() => {
      expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
    });

    // Should show First Feeding opportunity (expected at day 14, plant is 20 days old)
    expect(screen.getByText(/First Feeding/i)).toBeInTheDocument();
    expect(screen.getByText(/6d ago/i)).toBeInTheDocument(); // 20 - 14 = 6 days missed

    // Check that there are multiple Do Now buttons (for multiple initial care tasks)
    const doNowButtons = screen.getAllByRole("button", { name: /Do Now/i });
    expect(doNowButtons.length).toBeGreaterThan(0);
  });

  it("should display fertilization opportunities for variety with complex protocols", async () => {
    // Test with Boston Pickling Cucumber which has detailed fertilization protocols
    const cucumberVariety = getRealVariety("Boston Pickling Cucumber");
    const cucumberPlant = createMockPlantWithVariety(
      "Boston Pickling Cucumber",
      {
        id: "cucumber-plant-1",
        plantedDate: subWeeks(new Date("2025-01-15T12:00:00Z"), 8), // 8 weeks old (established)
      }
    );

    // Mock plant service to return the cucumber plant
    spyOnFirebasePlantService.mockImplementation((_, callback) => {
      callback([cucumberPlant]);
      return jest.fn();
    });

    spyOnVarietyService.mockResolvedValue(cucumberVariety);

    // Simulate overdue fertilization
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: cucumberPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 20),
      }), // Last fertilized 20 days ago
      createMockCareActivity({
        plantId: cucumberPlant.id,
        type: "water",
        date: subDays(new Date(), 2),
      }),
    ]);

    renderWithProviders(<CatchUpAssistant plantId={cucumberPlant.id} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText(/6d ago/i)).toBeInTheDocument(); // 20 - 14 = 6 days missed
    expect(screen.getByRole("button", { name: /Do Now/i })).toBeInTheDocument();
  });

  it("should display fertilization for plants with specific nutrient requirements", async () => {
    // Test with Sugar Snap Peas which has specific fertilization timing
    const peasVariety = getRealVariety("Sugar Snap Peas");
    const peasPlant = createMockPlantWithVariety("Sugar Snap Peas", {
      id: "peas-plant-1",
      plantedDate: subWeeks(new Date("2025-01-15T12:00:00Z"), 6), // 6 weeks old
    });

    // Mock plant service to return the peas plant
    spyOnFirebasePlantService.mockImplementation((_, callback) => {
      callback([peasPlant]);
      return jest.fn();
    });

    spyOnVarietyService.mockResolvedValue(peasVariety);

    // Simulate overdue fertilization
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: peasPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 18),
      }), // Last fertilized 18 days ago
    ]);

    renderWithProviders(<CatchUpAssistant plantId={peasPlant.id} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText(/4d ago/i)).toBeInTheDocument(); // 18 - 14 = 4 days missed
    expect(screen.getByRole("button", { name: /Do Now/i })).toBeInTheDocument();
  });

  it("should display fertilization reason text correctly", async () => {
    // Test the reason text for fertilization opportunities
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 18),
      }),
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(
      screen.getByText(/Plants benefit from regular feeding/i)
    ).toBeInTheDocument();
  });

  it("should display correct fertilization reason for severely overdue tasks", async () => {
    // Test the reason text for severely overdue fertilization
    spyOnFirebaseCareActivityService.mockResolvedValue([
      createMockCareActivity({
        plantId: mockPlant.id,
        type: "fertilize",
        date: subDays(new Date(), 28), // 14 days overdue
      }),
    ]);

    renderWithProviders(<CatchUpAssistant plantId={mockPlant.id} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Catch-Up Opportunities/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Regular Fertilization/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(
      screen.getByText(/Consider adjusting fertilization schedule/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Skip/i })).toBeInTheDocument();
  });
});
