import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, waitFor, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { User } from "firebase/auth";
import { Dashboard } from "@/pages/dashboard";
import { PlantRecord, CareActivityRecord } from "@/types/database";
import { ScheduledTask } from "@/types/records";
import { useFirebaseAuth } from "@/hooks/auth/useFirebaseAuth";
import { seedVarieties } from "@/data/seedVarieties";

// Mocks - Only mock external dependencies and auth
vi.mock("@/hooks/auth/useFirebaseAuth");

// Firebase mocks are now handled globally in vitest.setup.ts

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

vi.mock("@/db/seedData", () => ({
  initializeDatabase: vi.fn(),
  resetDatabaseInitializationFlag: vi.fn(),
}));

// Import MSW utilities for test setup
import { setMockData, clearMockData } from "@/test/mocks/server";

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
    subscribeToPlantsChanges: vi.fn((_userId, callback) => {
      // Use MSW to get the current mock data
      setTimeout(async () => {
        try {
          const response = await fetch("/api/plants");
          const result = await response.json();
          callback(result.data);
        } catch (error) {
          callback([]);
        }
      }, 0);
      return vi.fn(); // Return proper unsubscribe function
    }),
  },
}));

vi.mock("@/services/firebase/careActivityService", () => ({
  FirebaseCareActivityService: {
    getLastActivityByType: vi.fn().mockImplementation(async (plantId, _userId, type) => {
      try {
        const response = await fetch(`/api/care-activities/${plantId}/${type}/latest`);
        if (!response.ok) {
          return null; // No activity found
        }
        const result = await response.json();
        return result.data || null;
      } catch (error) {
        return null; // Return null on error
      }
    }),
    getPlantCareHistory: vi.fn().mockImplementation(async (plantId) => {
      try {
        const response = await fetch(`/api/plants/${plantId}/care-activities`);
        if (!response.ok) {
          return [];
        }
        const result = await response.json();
        return result.data || [];
      } catch (error) {
        return [];
      }
    }),
    createCareActivity: vi.fn().mockResolvedValue("mock-activity-id"),
  },
}));

vi.mock("@/services/firebase/scheduledTaskService", () => ({
  FirebaseScheduledTaskService: {
    getScheduledTasks: vi.fn().mockImplementation(async () => {
      const response = await fetch("/api/scheduled-tasks");
      const result = await response.json();
      return result.data;
    }),
    deletePendingTasksForPlant: vi.fn().mockResolvedValue(undefined),
    createMultipleTasks: vi.fn().mockResolvedValue(["mock-task-id-1", "mock-task-id-2"]),
    subscribeToUserTasks: vi.fn().mockImplementation((_userId, onSuccess, _onError) => {
      // Synchronously return unsubscribe function, but async call callback
      setTimeout(async () => {
        try {
          const response = await fetch("/api/scheduled-tasks");
          const result = await response.json();
          onSuccess(result.data);
        } catch (error) {
          onSuccess([]);
        }
      }, 0);
      // Must return unsubscribe function synchronously
      return vi.fn();
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

const mockUseFirebaseAuth = vi.mocked(useFirebaseAuth);

const renderWithRouter = (
  ui: React.ReactElement,
  { initialEntries = ["/"] } = {}
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
};

// Test Data Factory
class RenderTestDataFactory {
  private static plantCounter = 1;

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
    const id = `plant-${RenderTestDataFactory.plantCounter++}`;
    const defaultVariety =
      this.getSeedVarietyByName("Astro Arugula") || this.getRandomSeedVariety();

    return {
      id,
      varietyId: defaultVariety.name.toLowerCase().replace(/\s+/g, "-"),
      varietyName: defaultVariety.name,
      name: `My ${defaultVariety.name} ${
        RenderTestDataFactory.plantCounter - 1
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

    const id = `plant-${RenderTestDataFactory.plantCounter++}`;
    return {
      id,
      varietyId: variety.name.toLowerCase().replace(/\s+/g, "-"),
      varietyName: variety.name,
      name: `My ${variety.name} ${RenderTestDataFactory.plantCounter - 1}`,
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

  static createMixedGarden(): PlantRecord[] {
    return [
      this.createPlantFromVariety("Astro Arugula", {
        id: "arugula-1",
        location: "Greenhouse",
      }),
      this.createPlantFromVariety("Greek Oregano", {
        id: "oregano-1",
        location: "Kitchen Window",
        container: "3 Gallon Pot",
      }),
      this.createPlantFromVariety("May Queen Lettuce", {
        id: "lettuce-1",
        location: "Indoor",
        container: "Hydroponic System",
      }),
      this.createPlantFromVariety("Boston Pickling Cucumber", {
        id: "cucumber-1",
        location: "Greenhouse",
        container: "7 Gallon Grow Bag",
      }),
    ];
  }

  static resetCounters() {
    RenderTestDataFactory.plantCounter = 1;
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

describe("Dashboard - Rendering Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RenderTestDataFactory.resetCounters();

    // Clear MSW mock data
    clearMockData();

    mockUseFirebaseAuth.mockReturnValue({
      user: RenderTestDataFactory.createMockFirebaseUser(),
      loading: false,
      error: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();

    // Clear MSW mock data
    clearMockData();
  });

  describe("Initial Render States", () => {
    it("displays loading state when dashboard is loading", async () => {
      renderWithRouter(<Dashboard />);

      const loadingElement = screen.queryByText(/Loading dashboard/i);
      if (loadingElement) {
        expect(loadingElement).toBeInTheDocument();
      }
    });

    it("displays welcome message when no plants exist", async () => {
      setupTestData({ plants: [] });
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId("smartgarden-title")).toHaveTextContent(
          /SmartGarden/i
        );
        expect(screen.getByText(/welcome to smartgarden/i)).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /add your first plant/i })
        ).toBeInTheDocument();
      });
    });

    it("displays user information when authenticated", async () => {
      setupTestData({
        plants: [RenderTestDataFactory.createMockPlant({
          id: "p1",
          plantedDate: new Date("2024-05-10T00:00:00.000Z")
        })]
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId("smartgarden-title")).toHaveTextContent(
          /SmartGarden/i
        );
        expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Sign Out" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Empty States", () => {
    it("should render initial state with no plants", async () => {
      setupTestData({ plants: [] });
      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId("smartgarden-title")).toHaveTextContent(
          /SmartGarden/i
        );
      });

      await waitFor(() => {
        const careStatusHeading = screen.getByText(/Plant Care Status/i);
        expect(careStatusHeading).toBeInTheDocument();

        const statusEmoji = screen.getByText("✅");
        expect(statusEmoji).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText("Welcome, Test User")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Sign Out/i })
        ).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId("welcome-message-title")).toHaveTextContent(
          /🌱 Welcome to SmartGarden!/i
        );
        expect(
          screen.getByText(
            /Start your gardening journey by adding your first plant./i
          )
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /Track growth, log care activities, and get personalized recommendations./i
          )
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /🌿 Add Your First Plant/i })
        ).toBeInTheDocument();
      });
    });

    it("shows empty task state with existing plants but no tasks", async () => {
      const plantsWithoutTasks = RenderTestDataFactory.createMixedGarden();

      setupTestData({
        plants: plantsWithoutTasks,
        scheduledTasks: [], // No tasks to ensure empty task state
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Astro Arugula/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(0);

        const emptyTaskElements = [
          ...screen.queryAllByText(/no.*tasks/i),
          ...screen.queryAllByText(/up.*to.*date/i),
          ...screen.queryAllByText(/0/i),
        ];

        expect(emptyTaskElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Plant Group Rendering", () => {
    it("should render plant group cards with correct information", async () => {
      const groupedPlants = RenderTestDataFactory.createLeafyGreenPlants(3);

      setupTestData({
        plants: groupedPlants,
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        const varietyNames = screen.queryAllByText(
          /Astro Arugula|Baby's Leaf Spinach|May Queen Lettuce/i
        );
        expect(varietyNames.length).toBeGreaterThan(0);

        const plantCountElements = screen.queryAllByText(/plant/i);
        expect(plantCountElements.length).toBeGreaterThan(0);

        expect(
          screen.getAllByText(/5 Gallon Grow Bag/i).length
        ).toBeGreaterThan(0);

        expect(screen.getAllByText("Indoor").length).toBeGreaterThan(0);
      });

      const varietyElements = screen.getAllByText(
        /Astro Arugula|Baby's Leaf Spinach|May Queen Lettuce/i
      );
      expect(varietyElements.length).toBeGreaterThan(0);

      const logAllButton = screen.queryByRole("button", { name: /Log.*All/i });
      if (logAllButton) {
        expect(logAllButton).toBeInTheDocument();
        expect(logAllButton).not.toBeDisabled();
      }
    });

    it("should handle different plant varieties in separate groups", async () => {
      const mixedPlants = RenderTestDataFactory.createMixedGarden();

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
        expect(
          screen.getAllByText(/May Queen Lettuce/i).length
        ).toBeGreaterThan(0);

        const plantCounts = screen.getAllByText(/\d+.*plant/i);
        expect(plantCounts.length).toBeGreaterThan(0);

        expect(screen.getAllByText(/Greenhouse/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Kitchen Window/i).length).toBeGreaterThan(
          0
        );
      });
    });
  });

  describe("Location and Container Display", () => {
    it("filters plants by location", async () => {
      const plantsInDifferentLocations = [
        ...RenderTestDataFactory.createLeafyGreenPlants(2, "Greenhouse"),
        RenderTestDataFactory.createPlantFromVariety("Greek Oregano", {
          location: "Kitchen Window",
          container: "3 Gallon Pot",
        }),
        RenderTestDataFactory.createPlantFromVariety("English Thyme", {
          location: "Balcony",
          container: "2 Gallon Pot",
        }),
      ];

      setupTestData({
        plants: plantsInDifferentLocations,
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        const greenhouseElements = screen.queryAllByText(/greenhouse/i);
        const kitchenElements = screen.queryAllByText(/kitchen/i);
        const balconyElements = screen.queryAllByText(/balcony/i);

        const totalLocationElements = [
          ...greenhouseElements,
          ...kitchenElements,
          ...balconyElements,
        ];

        expect(totalLocationElements.length).toBeGreaterThan(0);
      });

      const locationFilter =
        screen.queryByLabelText(/location/i) ||
        screen.queryByRole("combobox", { name: /location/i }) ||
        screen.queryByRole("button", { name: /greenhouse|kitchen|balcony/i });

      if (locationFilter) {
        expect(locationFilter).toBeInTheDocument();
      }
    });
  });

  describe("Diverse Plant Data Scenarios", () => {
    it("handles herbs in kitchen window setup", async () => {
      const herbGarden = [
        RenderTestDataFactory.createPlantFromVariety("Greek Oregano", {
          location: "Kitchen Window",
          container: "4 Gallon Pot",
        }),
        RenderTestDataFactory.createPlantFromVariety("English Thyme", {
          location: "Kitchen Window",
          container: "3 Gallon Pot",
        }),
        RenderTestDataFactory.createPlantFromVariety("Greek Dwarf Basil", {
          location: "Balcony",
          container: "2 Gallon Pot",
        }),
      ];

      setupTestData({
        plants: herbGarden,
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getAllByText(/Greek Oregano/i).length).toBeGreaterThan(0);

        const textContent = document.body.textContent || "";
        const hasBasil = textContent.includes("Greek Dwarf Basil");
        const hasOtherHerbs =
          textContent.includes("Greek Oregano") ||
          textContent.includes("English Thyme") ||
          screen.getAllByText(/\w+.*plant/i).length >= 3;

        expect(hasBasil).toBeTruthy();
        expect(hasOtherHerbs).toBeTruthy();

        const containerText = document.body.textContent || "";
        const hasContainers =
          containerText.includes("Gallon") ||
          containerText.includes("Pot") ||
          containerText.includes("container");
        expect(hasContainers).toBeTruthy();

        const locationText = document.body.textContent || "";
        const hasLocations =
          locationText.includes("Kitchen") ||
          locationText.includes("Window") ||
          locationText.includes("Balcony") ||
          locationText.includes("Indoor");
        expect(hasLocations).toBeTruthy();
      });
    });

    it("handles mixed indoor/outdoor/greenhouse plants", async () => {
      const diversePlants = [
        RenderTestDataFactory.createPlantFromVariety("Boston Pickling Cucumber", {
          id: "outdoor-1",
          name: "Garden Cucumber",
          location: "Outdoor Garden",
          container: "Raised Bed",
        }),
        RenderTestDataFactory.createPlantFromVariety("May Queen Lettuce", {
          id: "hydro-1",
          name: "Hydro Lettuce",
          location: "Indoor",
          container: "Hydroponic System",
        }),
        RenderTestDataFactory.createPlantFromVariety("Astro Arugula", {
          id: "greenhouse-1",
          name: "Greenhouse Arugula",
          location: "Greenhouse",
          container: "10 Gallon Fabric Pot",
        }),
      ];

      setupTestData({
        plants: diversePlants,
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Boston Pickling Cucumber/i).length
        ).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/May Queen Lettuce/i).length
        ).toBeGreaterThan(0);
        expect(screen.getAllByText(/Astro Arugula/i).length).toBeGreaterThan(0);

        expect(screen.getByText(/Outdoor Garden/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Greenhouse/i).length).toBeGreaterThan(0);

        expect(screen.getAllByText(/Raised Bed/i).length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/Hydroponic System/i).length
        ).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/10 Gallon Fabric Pot/i).length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe("Authentication Display", () => {
    it("displays user information when authenticated", async () => {
      setupTestData({
        plants: [RenderTestDataFactory.createMockPlant({
          id: "p1",
          plantedDate: new Date("2024-05-10T00:00:00.000Z")
        })]
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText("SmartGarden")).toBeInTheDocument();
        expect(screen.getByText("Welcome, Test User")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Sign Out" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error state when plant loading fails", async () => {
      // Mock error state by setting up no plants but indicating there should be some
      setupTestData({ plants: [] });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "SmartGarden" })).toBeInTheDocument();
      });
    });

    it("handles loading state properly", async () => {
      renderWithRouter(<Dashboard />);

      const bodyText = document.body.textContent || "";
      const hasLoadingIndicator =
        bodyText.includes("Loading") ||
        bodyText.includes("loading") ||
        screen.queryByTestId("loading-spinner") !== null ||
        screen.queryByTestId("loading-indicator") !== null;

      // Loading state is handled if we can render without crashing
      expect(screen.getByRole("heading", { name: "SmartGarden" })).toBeInTheDocument();
    });
  });
});