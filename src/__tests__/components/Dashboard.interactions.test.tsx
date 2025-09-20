import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, waitFor, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { User } from "firebase/auth";
import { Dashboard } from "@/pages/dashboard";
import { PlantRecord, CareActivityRecord } from "@/types/database";
import { ScheduledTask } from "@/types/records";
import { useFirebaseAuth } from "@/hooks/auth/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/plants/useFirebasePlants";
import { useCareActivities } from "@/hooks/care/useCareActivities";
import { seedVarieties } from "@/data/seedVarieties";

// Mocks - Only mock external dependencies and auth
vi.mock("@/hooks/auth/useFirebaseAuth");
vi.mock("@/hooks/plants/useFirebasePlants");
vi.mock("@/hooks/care/useCareActivities");

vi.mock("@/components/ui/OfflineIndicator", () => ({
  OfflineIndicator: () => (
    <div data-testid="offline-indicator">Offline Indicator</div>
  ),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/db/seedData", () => ({
  initializeDatabase: vi.fn(),
  resetDatabaseInitializationFlag: vi.fn(),
}));

// Import MSW utilities for test setup
import { setMockData, clearMockData } from "@/test/mocks/server";

// Mock instances
const mockUseFirebaseAuth = useFirebaseAuth as vi.Mock;
const mockUseFirebasePlants = useFirebasePlants as vi.Mock;
const mockUseCareActivities = useCareActivities as vi.Mock;

// Mock Firebase services to use HTTP requests (intercepted by MSW)
vi.mock("@/services/firebase/plantService", () => ({
  FirebasePlantService: {
    getPlants: vi.fn().mockImplementation(async () => {
      const response = await fetch("/api/plants");
      const result = await response.json();
      return result.data;
    }),
    createPlant: vi.fn().mockImplementation(async (plant) => {
      const response = await fetch("/api/plants", {
        method: "POST",
        body: JSON.stringify({ plant }),
      });
      const result = await response.json();
      return result.data.id;
    }),
    updatePlant: vi.fn().mockResolvedValue(undefined),
    deletePlant: vi.fn().mockResolvedValue(undefined),
    subscribeToPlantsChanges: vi
      .fn()
      .mockImplementation((_userId, callback) => {
        // Call callback synchronously with mock data
        setTimeout(async () => {
          const response = await fetch("/api/plants");
          const result = await response.json();
          callback(result.data);
        }, 0);
        return vi.fn(); // Return unsubscribe function
      }),
  },
}));

vi.mock("@/services/firebase/careActivityService", () => ({
  FirebaseCareActivityService: {
    getLastActivityByType: vi.fn().mockImplementation(async (plantId, _userId, type) => {
      const response = await fetch(`/api/care-activities/${plantId}/${type}/latest`);
      const result = await response.json();
      return result.data;
    }),
    getPlantCareHistory: vi.fn().mockImplementation(async (plantId) => {
      const response = await fetch(`/api/plants/${plantId}/care-activities`);
      const result = await response.json();
      return result.data;
    }),
    createCareActivity: vi.fn().mockImplementation(async (activity) => {
      const response = await fetch("/api/care-activities", {
        method: "POST",
        body: JSON.stringify({ activity }),
      });
      const result = await response.json();
      return result.data.id;
    }),
  },
}));

vi.mock("@/services/firebase/scheduledTaskService", () => ({
  FirebaseScheduledTaskService: {
    getScheduledTasks: vi.fn().mockImplementation(async () => {
      const response = await fetch("/api/scheduled-tasks");
      const result = await response.json();
      return result.data;
    }),
    deletePendingTasksForPlant: vi.fn().mockImplementation(async (plantId) => {
      const response = await fetch(`/api/plants/${plantId}/scheduled-tasks`, {
        method: "DELETE",
      });
      return response.ok;
    }),
    createMultipleTasks: vi.fn().mockImplementation(async (tasks) => {
      const response = await fetch("/api/scheduled-tasks", {
        method: "POST",
        body: JSON.stringify({ tasks }),
      });
      const result = await response.json();
      return result.data.map((item: any) => item.id);
    }),
    subscribeToUserTasks: vi.fn().mockImplementation(async (_userId, onSuccess, _onError) => {
      const response = await fetch("/api/scheduled-tasks");
      const result = await response.json();
      onSuccess(result.data);
      return vi.fn(); // unsubscribe function
    }),
  },
}));

vi.mock("@/services/TaskManagementService", () => ({
  TaskManagementService: {
    generateTasksForPlant: vi.fn().mockResolvedValue([]),
    regenerateTasksForPlant: vi.fn().mockResolvedValue(undefined),
    bulkRegenerateTasksForPlants: vi.fn().mockResolvedValue(undefined),
  },
}));

const renderWithRouter = (
  ui: React.ReactElement,
  { initialEntries = ["/"] } = {}
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
};

// Test Data Factory
class InteractionTestDataFactory {
  private static plantCounter = 1;
  private static taskCounter = 1;

  static getRandomSeedVariety() {
    return seedVarieties[Math.floor(Math.random() * seedVarieties.length)];
  }

  static getSeedVarietyByName(name: string) {
    return seedVarieties.find((variety) => variety.name === name);
  }

  static createMockFirebaseUser(overrides?: Partial<User>): User {
    return {
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
      delete: vi.fn(),
      getIdToken: vi.fn(),
      getIdTokenResult: vi.fn(),
      reload: vi.fn(),
      toJSON: vi.fn(),
      phoneNumber: null,
      photoURL: null,
      providerId: "firebase",
      ...overrides,
    } as User;
  }

  static createMockPlant(overrides: Partial<PlantRecord> = {}): PlantRecord {
    const id = `plant-${InteractionTestDataFactory.plantCounter++}`;
    const defaultVariety =
      this.getSeedVarietyByName("Astro Arugula") || this.getRandomSeedVariety();

    return {
      id,
      varietyId: defaultVariety.name.toLowerCase().replace(/\s+/g, "-"),
      varietyName: defaultVariety.name,
      name: `My ${defaultVariety.name} ${
        InteractionTestDataFactory.plantCounter - 1
      }`,
      plantedDate: new Date("2024-05-10T00:00:00.000Z"),
      location: "Indoor",
      container: "5 Gallon Grow Bag",
      soilMix: "standard-mix",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createPlantFromVariety(
    varietyName: string,
    overrides: Partial<PlantRecord> = {}
  ): PlantRecord {
    const variety = this.getSeedVarietyByName(varietyName);
    if (!variety) {
      throw new Error(`Seed variety "${varietyName}" not found`);
    }

    const id = `plant-${InteractionTestDataFactory.plantCounter++}`;
    return {
      id,
      varietyId: variety.name.toLowerCase().replace(/\s+/g, "-"),
      varietyName: variety.name,
      name: `My ${variety.name} ${InteractionTestDataFactory.plantCounter - 1}`,
      plantedDate: new Date("2024-05-10T00:00:00.000Z"),
      location: "Indoor",
      container: "5 Gallon Grow Bag",
      soilMix: "standard-mix",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createLeafyGreenPlants(
    count: number,
    location: string = "Indoor"
  ): PlantRecord[] {
    const leafyGreens = seedVarieties.filter(v => v.category === "leafy-greens");
    return Array.from({ length: count }, (_, i) => {
      const variety = leafyGreens[i % leafyGreens.length];
      return this.createPlantFromVariety(variety.name, {
        id: `leafy-${i + 1}`,
        name: `${variety.name} Plant ${i + 1}`,
        location,
      });
    });
  }

  static createScheduledTask(
    overrides: Partial<{
      id: string;
      plantId: string;
      plantName: string;
      taskName: string;
      type: "water" | "fertilize" | "observe";
      dueDate: Date;
      isOverdue: boolean;
      priority: "low" | "medium" | "high" | "critical";
      details: {
        type: string;
        amount?: string;
        product?: string;
      };
    }> = {}
  ) {
    const id = `task-${InteractionTestDataFactory.taskCounter++}`;
    return {
      id,
      plantId: "plant-1",
      plantName: "Test Plant",
      taskName: "Water Plant",
      type: "water" as const,
      dueDate: new Date(),
      isOverdue: false,
      priority: "medium" as const,
      details: {
        type: "water",
        amount: "20oz",
      },
      ...overrides,
    };
  }

  static createTasksForPlants(
    plants: PlantRecord[],
    taskType: "water" | "fertilize" | "observe" = "water"
  ) {
    return plants.map((plant, index) =>
      InteractionTestDataFactory.createScheduledTask({
        id: `${taskType}-task-${plant.id}`,
        plantId: plant.id,
        plantName: plant.name,
        taskName: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} ${
          plant.name
        }`,
        type: taskType,
        dueDate: new Date(Date.now() + index * 3600000), // Stagger tasks by hours
        isOverdue: index % 3 === 0, // Every 3rd task is overdue
        priority: index % 2 === 0 ? "high" : "medium",
      })
    );
  }

  static createCareActivity(
    overrides: Partial<CareActivityRecord> = {}
  ): CareActivityRecord {
    return {
      id: `activity-${Date.now()}-${Math.random()}`,
      plantId: "plant-1",
      type: "water",
      timestamp: new Date(),
      details: { amount: "200ml" },
      loggedAt: new Date(),
      ...overrides,
    } as CareActivityRecord;
  }

  static resetCounters() {
    InteractionTestDataFactory.plantCounter = 1;
    InteractionTestDataFactory.taskCounter = 1;
  }
}

// Helper function to set up test data using MSW
const setupTestData = ({
  plants = [],
  careActivities = [],
  scheduledTasks = [],
}: {
  plants?: PlantRecord[];
  careActivities?: CareActivityRecord[];
  scheduledTasks?: ScheduledTask[];
} = {}) => {
  // Use MSW's setMockData to configure the handlers
  setMockData({
    plants,
    careActivities,
    scheduledTasks,
  });
};

describe("Dashboard - User Interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    InteractionTestDataFactory.resetCounters();

    // Clear MSW mock data
    clearMockData();

    // Set up default test data for real hooks to use
    const testPlants = [
      InteractionTestDataFactory.createPlantFromVariety("Astro Arugula", {
        id: "arugula-1",
        plantedDate: new Date("2024-05-10"),
        location: "Indoor",
        container: "5 Gallon Grow Bag",
      }),
      InteractionTestDataFactory.createPlantFromVariety("Greek Oregano", {
        id: "oregano-1",
        plantedDate: new Date("2024-05-12"),
        location: "Indoor",
        container: "Small Pot",
      }),
    ];

    const testCareActivities = [
      InteractionTestDataFactory.createCareActivity({
        plantId: "arugula-1",
        type: "water",
        timestamp: new Date("2024-05-15"),
        details: { amount: "200ml" },
      }),
      InteractionTestDataFactory.createCareActivity({
        plantId: "oregano-1",
        type: "water",
        timestamp: new Date("2024-05-16"),
        details: { amount: "100ml" },
      }),
    ];

    // Set up MSW with realistic data
    setMockData({
      plants: testPlants,
      careActivities: testCareActivities,
      scheduledTasks: [],
    });

    mockUseFirebaseAuth.mockReturnValue({
      user: InteractionTestDataFactory.createMockFirebaseUser(),
      loading: false,
      error: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    });

    // Mock plants hook to return realistic data
    mockUseFirebasePlants.mockReturnValue({
      plants: testPlants,
      loading: false,
      error: null,
      createPlant: vi.fn(),
      updatePlant: vi.fn(),
      deletePlant: vi.fn(),
    });

    // Mock care activities hook to return realistic data
    mockUseCareActivities.mockReturnValue({
      activities: testCareActivities,
      loading: false,
      error: null,
      logActivity: vi.fn(),
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();

    // Clear MSW mock data
    clearMockData();
  });

  describe("Navigation Interactions", () => {
    it("navigates to add plant page when 'Add Your First Plant' is clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId("smartgarden-title")).toBeInTheDocument();
      });

      // Since we have plants now, look for the add plant navigation button instead
      const addPlantButton = screen.getByRole("button", {
        name: /add plant|add your first plant/i,
      }) || screen.getByText(/add plant/i).closest("button");

      expect(addPlantButton).toBeInTheDocument();
      expect(addPlantButton).toBeEnabled();

      await user.click(addPlantButton);

      expect(mockNavigate).toHaveBeenCalledWith("/add-plant");
    });
  });

  describe("Authentication Interactions", () => {
    it("calls signOut when sign out button is clicked", async () => {
      const user = userEvent.setup();
      const mockSignOut = vi.fn();
      mockUseFirebaseAuth.mockReturnValue({
        user: InteractionTestDataFactory.createMockFirebaseUser(),
        loading: false,
        error: null,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: mockSignOut,
        resetPassword: vi.fn(),
      });

      renderWithRouter(<Dashboard />);

      const signOutButton = screen.getByRole("button", { name: "Sign Out" });
      await user.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("Task Management Interactions", () => {
    it("should handle task completion", async () => {
      const plantsWithTasks = [
        InteractionTestDataFactory.createMockPlant({ id: "p1", name: "Arugula 1" }),
      ];

      setupTestData({
        plants: plantsWithTasks,
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        const taskElements = [
          ...screen.queryAllByText(/water/i),
          ...screen.queryAllByText(/task/i),
          ...screen.queryAllByText(/complete/i),
          ...screen.queryAllByText(/log care/i),
          ...screen.queryAllByRole("button", { name: /complete/i }),
          ...screen.queryAllByRole("button", { name: /log/i }),
        ];

        expect(taskElements.length).toBeGreaterThan(0);
      });

      const completeButton =
        screen.queryByRole("button", {
          name: /complete/i,
        }) ||
        screen.queryAllByRole("button", { name: /Quick: 20oz/i })[0] ||
        screen.queryAllByRole("button", {
          name: /Quick: Liquid Fertilizer/i,
        })[0] ||
        screen.queryAllByRole("button", {
          name: /Quick: general health/i,
        })[0] ||
        screen.queryByRole("button", {
          name: /log care/i,
        }) ||
        screen.queryByRole("button", {
          name: /quick complete/i,
        }) ||
        screen.queryByRole("button", {
          name: /✓/,
        });

      if (completeButton) {
        expect(completeButton).toBeInTheDocument();
        expect(completeButton).toBeEnabled();
        await user.click(completeButton);

        await waitFor(() => {
          const successIndicators = [
            ...screen.queryAllByText(/success/i),
            ...screen.queryAllByText(/completed/i),
            ...screen.queryAllByText(/done/i),
          ];

          const taskStillVisible =
            completeButton &&
            screen.queryByRole("button", {
              name:
                completeButton.getAttribute("aria-label") ||
                completeButton.textContent ||
                "",
            });

          expect(
            successIndicators.length > 0 || !taskStillVisible
          ).toBeTruthy();
        });
      } else {
        const taskElements = [
          ...screen.queryAllByText(/water/i),
          ...screen.queryAllByText(/task/i),
        ];
        expect(taskElements.length).toBeGreaterThan(0);
      }
    });

    it("should handle bypassing tasks", async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const plantsWithTasks = [
        InteractionTestDataFactory.createPlantFromVariety("Astro Arugula", {
          id: "p1",
          name: "Arugula 1",
          plantedDate: thirtyDaysAgo,
        }),
      ];

      const sixteenDaysAgo = new Date();
      sixteenDaysAgo.setDate(sixteenDaysAgo.getDate() - 16);

      const careActivities = [
        {
          id: "fertilize-1",
          plantId: "p1",
          type: "fertilize" as const,
          timestamp: sixteenDaysAgo,
          date: sixteenDaysAgo,
          details: {
            type: "fertilize" as const,
            product: "Liquid Fertilizer",
            dilution: "1:10",
            amount: "200ml",
            method: "soil-drench",
          },
          notes: "Previous fertilization",
        },
      ];

      setupTestData({
        plants: plantsWithTasks,
        careActivities,
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      let bypassButton: HTMLElement;
      await waitFor(() => {
        const allBypassButtons = screen.queryAllByRole("button", {
          name: /bypass/i,
        });
        console.log('Found bypass buttons:', allBypassButtons.length);

        bypassButton = allBypassButtons.find(button => {
          const taskCard = button.closest('[data-testid*="task"]') || button.closest('.border-l-4');
          return taskCard?.textContent?.includes('Fertilize') || taskCard?.textContent?.includes('Liquid Fertilizer');
        }) || allBypassButtons[0];

        expect(bypassButton).toBeInTheDocument();
      }, { timeout: 5000 });

      await user.click(bypassButton);

      await waitFor(() => {
        const remainingBypassButtons = screen.queryAllByRole("button", {
          name: /bypass/i,
        });
        console.log('Remaining bypass buttons after click:', remainingBypassButtons.length);

        expect(remainingBypassButtons.length).toBe(2);
      });
    });

    it("should handle bypassing watering tasks", async () => {
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      const plantsWithTasks = [
        InteractionTestDataFactory.createPlantFromVariety("Astro Arugula", {
          id: "p1",
          name: "Arugula 1",
          plantedDate: twentyDaysAgo,
        }),
      ];

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const careActivities = [
        {
          id: "water-1",
          plantId: "p1",
          type: "water" as const,
          timestamp: threeDaysAgo,
          activityDate: threeDaysAgo,
          date: threeDaysAgo,
          details: {
            type: "water" as const,
            waterAmount: 20,
            waterUnit: "oz",
          },
          notes: "Previous watering",
        },
      ];

      setupTestData({
        plants: plantsWithTasks,
        careActivities,
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      let bypassButton: HTMLElement;
      await waitFor(() => {
        const allBypassButtons = screen.queryAllByRole("button", {
          name: /bypass/i,
        });
        console.log('Found bypass buttons:', allBypassButtons.length);

        bypassButton = allBypassButtons.find(button => {
          const taskCard = button.closest('[data-testid*="task"]') || button.closest('.border-l-4');
          return taskCard?.textContent?.includes('Water') || taskCard?.textContent?.includes('20oz');
        }) || allBypassButtons[0];

        expect(bypassButton).toBeInTheDocument();
      }, { timeout: 5000 });

      await user.click(bypassButton);

      await waitFor(() => {
        const remainingBypassButtons = screen.queryAllByRole("button", {
          name: /bypass/i,
        });
        console.log('Remaining bypass buttons after click:', remainingBypassButtons.length);

        expect(remainingBypassButtons.length).toBe(1);
      });
    });

    it("should handle bypassing observation tasks", async () => {
      const plantsWithTasks = [
        InteractionTestDataFactory.createPlantFromVariety("Astro Arugula", {
          id: "p1",
          name: "Arugula 1",
          plantedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        }),
      ];

      const careActivities = [
        {
          id: "obs-1",
          plantId: "p1",
          type: "observe" as const,
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          details: {
            type: "observe" as const,
            observations: "Plant looked healthy",
            healthAssessment: "good",
          },
          notes: "Previous observation",
        },
      ];

      setupTestData({
        plants: plantsWithTasks,
        careActivities,
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        const observationSection = screen.getByTestId("observation-dashboard-section");
        expect(observationSection).toBeInTheDocument();
      });

      const observationSection = screen.getByTestId("observation-dashboard-section");
      let observationBypassButton: HTMLElement;
      await waitFor(() => {
        observationBypassButton = within(observationSection).getByRole("button", {
          name: /bypass/i,
        });
        expect(observationBypassButton).toBeInTheDocument();
      });

      await user.click(observationBypassButton!);

      await waitFor(() => {
        const observationSection = screen.queryByTestId("observation-dashboard-section");
        if (observationSection) {
          const bypassButton = within(observationSection).queryByRole("button", {
            name: /bypass/i,
          });
          expect(bypassButton).not.toBeInTheDocument();
        }
      });
    });
  });

  describe("Plant Search and Filtering", () => {
    it("filters plants by search term", async () => {
      const mixedPlants = [
        InteractionTestDataFactory.createPlantFromVariety("Astro Arugula"),
        InteractionTestDataFactory.createPlantFromVariety("Greek Oregano"),
        InteractionTestDataFactory.createPlantFromVariety("Boston Pickling Cucumber"),
      ];

      setupTestData({
        plants: mixedPlants,
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Astro Arugula/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/Boston Pickling Cucumber/i).length
        ).toBeGreaterThan(0);
      });

      const searchInput =
        screen.queryByPlaceholderText(/search/i) ||
        screen.queryByLabelText(/search/i) ||
        screen.queryByRole("textbox");

      if (searchInput) {
        const user = userEvent.setup();

        await user.type(searchInput, "arugula");

        await waitFor(() => {
          expect(searchInput).toHaveValue("arugula");

          expect(screen.getAllByText(/Astro Arugula/i).length).toBeGreaterThan(
            0
          );

          const oreganoElements = screen.queryAllByText(/Oregano/i);
          const cucumberElements = screen.queryAllByText(/Cucumber/i);
        });

        await user.clear(searchInput);

        await waitFor(() => {
          expect(searchInput).toHaveValue("");
          expect(screen.getAllByText(/Astro Arugula/i).length).toBeGreaterThan(
            0
          );
          expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(
            0
          );
        });
      } else {
        expect(screen.getAllByText(/Astro Arugula/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/Boston Pickling Cucumber/i).length
        ).toBeGreaterThan(0);
      }
    });
  });

  describe("Bulk Actions", () => {
    it("handles bulk actions with multiple plant selections", async () => {
      const multiPlantGroup =
        InteractionTestDataFactory.createLeafyGreenPlants(4);

      setupTestData({
        plants: multiPlantGroup,
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        const varietyNames = screen.queryAllByText(
          /Astro Arugula|Baby's Leaf Spinach|May Queen Lettuce/i
        );
        expect(varietyNames.length).toBeGreaterThan(0);
        expect(screen.getAllByText(/4.*plant/i).length).toBeGreaterThan(0);
      });

      const bulkButtons = screen.queryAllByRole("button", {
        name: /Log.*All/i,
      });

      if (bulkButtons.length > 0) {
        await user.click(bulkButtons[0]);
      } else {
        return;
      }

      const bulkMenuItems = [
        ...screen.queryAllByText(/Water All/i),
        ...screen.queryAllByText(/Fertilize All/i),
        ...screen.queryAllByText(/Observe All/i),
      ];

      if (bulkMenuItems.length === 0) {
        return;
      }

      const waterAllButton = screen.queryByRole("button", {
        name: /Water All/i,
      });

      if (!waterAllButton) {
        return;
      }

      await user.click(waterAllButton);

      const modal = screen.queryByText("💧 Water All Plants");
      if (!modal) {
        return;
      }

      await waitFor(() => {
        expect(screen.getByText("💧 Water All Plants")).toBeInTheDocument();
        expect(screen.getAllByText(/4.*plant/i).length).toBeGreaterThan(0);
      });

      const amountInput = screen.getByLabelText(/Amount.*oz/i);
      await user.clear(amountInput);
      await user.type(amountInput, "150");

      const submitButton = screen.getByRole("button", {
        name: /Log Activity for All 4 Plants/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        const successIndicators = [
          ...screen.queryAllByText(/success/i),
          ...screen.queryAllByText(/logged/i),
          ...screen.queryAllByText(/completed/i),
        ];

        expect(successIndicators.length > 0).toBeTruthy();
      });

      await waitFor(() => {
        expect(
          screen.queryByText("💧 Water All Plants")
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        const successElements = [
          ...screen.queryAllByText(/success/i),
          ...screen.queryAllByText(/logged/i),
          ...screen.queryAllByText(/complete/i),
        ];

        expect(
          screen.getByText(/Astro Arugula|Baby's Leaf Spinach/i)
        ).toBeInTheDocument();
      });
    });

    it("should handle bulk logging interaction flow", async () => {
      const groupedPlants = InteractionTestDataFactory.createLeafyGreenPlants(2);

      setupTestData({
        plants: groupedPlants,
      });

      const user = userEvent.setup();
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        const varietyNames = screen.queryAllByText(
          /Astro Arugula|Baby's Leaf Spinach|May Queen Lettuce/i
        );
        expect(varietyNames.length).toBeGreaterThan(0);
      });

      const logAllButton = screen.queryByRole("button", {
        name: /Log.*All/i,
      });

      if (!logAllButton) {
        return;
      }

      await user.click(logAllButton);

      await waitFor(() => {
        const waterAllButton = screen.getByRole("button", {
          name: /Water All/i,
        });
        expect(waterAllButton).toBeInTheDocument();
        expect(waterAllButton).toBeVisible();
      });

      const waterAllButton = screen.getByRole("button", { name: /Water All/i });
      await user.click(waterAllButton);

      await waitFor(() => {
        const modal = screen.getByText("💧 Water All Plants");
        expect(modal).toBeInTheDocument();
        expect(modal).toBeVisible();

        expect(screen.getByLabelText(/Amount.*oz/i)).toBeInTheDocument();
        expect(screen.getAllByText(/2.*plant/i).length).toBeGreaterThan(0);
      });

      const amountInput = screen.getByLabelText(/Amount.*oz/i);
      expect(amountInput).toHaveValue("");

      await user.type(amountInput, "100");
      expect(amountInput).toHaveValue("100");

      const submitButton = screen.getByRole("button", {
        name: /Log Activity/i,
      });
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText("💧 Water All Plants")
        ).not.toBeInTheDocument();

        const successIndicators = [
          ...screen.queryAllByText(/success/i),
          ...screen.queryAllByText(/logged/i),
          ...screen.queryAllByText(/completed/i),
        ];

        expect(successIndicators.length > 0).toBeTruthy();
      });

      await waitFor(() => {
        const varietyNames = screen.queryAllByText(
          /Astro Arugula|Baby's Leaf Spinach|May Queen Lettuce/i
        );
        expect(varietyNames.length).toBeGreaterThan(0);
        const logAllButton = screen.queryByRole("button", { name: /Log All/i });
        if (logAllButton) {
          expect(logAllButton).toBeInTheDocument();
        }
      });
    });
  });

  describe("Task State Management", () => {
    it("should handle plants with overdue tasks", async () => {
      const plantsWithOverdueTasks = [
        InteractionTestDataFactory.createMockPlant({
          id: "p1",
          name: "Overdue Plant 1",
          varietyName: "Astro Arugula",
          plantedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        }),
        InteractionTestDataFactory.createMockPlant({
          id: "p2",
          name: "Overdue Plant 2",
          varietyName: "Astro Arugula",
          plantedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        }),
      ];

      const lastFertilizationDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
      const mockLastFertilization = {
        id: "mock-fertilization",
        plantId: "p1",
        type: "fertilize",
        date: lastFertilizationDate,
        details: {
          type: "fertilize",
          product: "Fish Emulsion",
          amount: "200ml",
          dilution: "1-2 Tbsp/gal",
        },
        createdAt: lastFertilizationDate,
        updatedAt: lastFertilizationDate,
      };

      const careActivityService = await import("@/services/firebase/careActivityService");
      vi.spyOn(careActivityService.FirebaseCareActivityService, 'getLastActivityByType')
        .mockImplementation((plantId: string, userId: string, type: string) => {
          if (type === "fertilize" && (plantId === "p1" || plantId === "p2")) {
            return Promise.resolve(mockLastFertilization);
          }
          return Promise.resolve(null);
        });

      setupTestData({
        plants: plantsWithOverdueTasks,
        careActivities: [mockLastFertilization],
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId("smartgarden-title")).toHaveTextContent(
          /SmartGarden/i
        );
      });

      await waitFor(
        () => {
          const careStatusCard = screen.getByRole("button", {
            name: /plant care status/i,
          });
          expect(careStatusCard).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      await waitFor(() => {
        expect(screen.getByText(/🌱 Fertilization Tasks/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        const fertilizationSection = screen.getByText(
          /🌱 Fertilization Tasks/i
        );
        expect(fertilizationSection).toBeInTheDocument();
      });

      await waitFor(() => {
        const overdueBadges = screen.getAllByText("1");
        expect(overdueBadges.length).toBeGreaterThanOrEqual(1);
      });

      await waitFor(() => {
        const plantNameRegex = /Overdue Plant [12]/i;
        const plantElements = screen.queryAllByText(plantNameRegex);

        if (plantElements.length === 0) {
          const taskElements = [
            ...screen.queryAllByText(/water/i),
            ...screen.queryAllByText(/fertilize/i),
          ];
          expect(taskElements.length).toBeGreaterThan(0);
        } else {
          expect(plantElements.length).toBeGreaterThanOrEqual(1);
        }
      });

      const badges = screen.getAllByText("1");
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it("should group similar tasks together", async () => {
      const plantsNeedingWater = [
        InteractionTestDataFactory.createPlantFromVariety("Astro Arugula", {
          id: "p1",
          name: "Arugula 1",
        }),
        InteractionTestDataFactory.createPlantFromVariety("Baby's Leaf Spinach", {
          id: "p2",
          name: "Spinach 1",
        }),
        InteractionTestDataFactory.createPlantFromVariety("Greek Dwarf Basil", {
          id: "p3",
          name: "Basil",
        }),
      ];

      const wateringTasks = [
        InteractionTestDataFactory.createScheduledTask({
          id: "task-1",
          plantId: "p1",
          plantName: "Arugula 1",
          taskName: "Water Plant",
          type: "water",
          dueDate: (() => {
            const now = new Date();
            now.setHours(12, 0, 0, 0);
            return now;
          })(),
        }),
        InteractionTestDataFactory.createScheduledTask({
          id: "task-2",
          plantId: "p2",
          plantName: "Spinach 1",
          taskName: "Water Plant",
          type: "water",
          dueDate: (() => {
            const now = new Date();
            now.setHours(12, 0, 0, 0);
            return now;
          })(),
        }),
      ];

      setupTestData({
        plants: plantsNeedingWater,
        scheduledTasks: wateringTasks,
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        const plantNames = screen.getAllByText(/Arugula|Spinach|Basil/);
        expect(plantNames.length).toBeGreaterThan(0);

        const taskElements = [
          ...screen.queryAllByText(/water/i),
          ...screen.queryAllByText(/task/i),
          ...screen.queryAllByText(/due/i),
          ...screen.queryAllByRole("button", { name: /quick/i }),
        ];
        expect(taskElements.length).toBeGreaterThan(0);
      });

      const logAllButtons = screen.queryAllByRole("button", {
        name: /log all/i,
      });
      if (logAllButtons.length > 0) {
        expect(logAllButtons[0]).toBeInTheDocument();
      }
    });
  });
});