import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "@/pages/dashboard";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebasePlants } from "@/hooks/useFirebasePlants";
import { useFirebaseCareActivities } from "@/hooks/useFirebaseCareActivities";
import { PlantRecord } from "@/types/database";
import { useScheduledTasks } from "@/hooks/useScheduledTasks";
import { useLastCareActivities } from "@/hooks/useLastCareActivities";
import { useDynamicStage } from "@/hooks/useDynamicStage";

// Mock the hooks
jest.mock("@/hooks/useFirebaseAuth");
jest.mock("@/hooks/useFirebasePlants");
jest.mock("@/hooks/useFirebaseCareActivities");

// Mock the Firebase services
jest.mock("@/services/firebase/careActivityService", () => ({
  FirebaseCareActivityService: {
    getLastActivityByType: jest.fn(),
  },
}));

jest.mock("@/services/firebaseCareSchedulingService", () => ({
  FirebaseCareSchedulingService: {
    getUpcomingTasks: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("@/hooks/useScheduledTasks", () => ({
  useScheduledTasks: jest.fn(),
}));

jest.mock("@/hooks/useLastCareActivities", () => ({
  useLastCareActivities: jest.fn(),
}));

jest.mock("@/hooks/useDynamicStage", () => ({
  useDynamicStage: jest.fn(),
}));

// Mock the toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock database initialization
jest.mock("@/db/seedData", () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  resetDatabaseInitializationFlag: jest.fn(),
}));

describe("Fertilizer and Water Dashboard Flow", () => {
  const mockUseFirebaseAuth = useFirebaseAuth as jest.MockedFunction<
    typeof useFirebaseAuth
  >;
  const mockUseFirebasePlants = useFirebasePlants as jest.MockedFunction<
    typeof useFirebasePlants
  >;
  const mockUseFirebaseCareActivities =
    useFirebaseCareActivities as jest.MockedFunction<
      typeof useFirebaseCareActivities
    >;
  const mockUseScheduledTasks = useScheduledTasks as jest.MockedFunction<
    typeof useScheduledTasks
  >;
  const mockUseLastCareActivities = useLastCareActivities as jest.MockedFunction<
    typeof useLastCareActivities
  >;
  const mockUseDynamicStage = useDynamicStage as jest.MockedFunction<
    typeof useDynamicStage
  >;

  // Test plant data
  const testPlant: PlantRecord = {
    id: "test-plant-1",
    name: "Test Plant",
    varietyId: "test-variety-1",
    varietyName: "Test Variety",
    plantedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Planted 7 days ago - as Date object
    location: "indoor",
    container: "test-container-1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create the mock functions that we'll reuse
  const mockLogActivity = jest.fn().mockResolvedValue("test-activity-1");

  // Mock the hooks return values
  beforeEach(() => {
    // Reset the mock function
    mockLogActivity.mockClear();

    // Mock auth
    mockUseFirebaseAuth.mockReturnValue({
      user: { uid: "test-user-1" },
      loading: false,
      signOut: jest.fn(),
    } as any);

    // Mock plants
    mockUseFirebasePlants.mockReturnValue({
      plants: [testPlant],
      loading: false,
      error: null,
      addPlant: jest.fn(),
      updatePlant: jest.fn(),
      deletePlant: jest.fn(),
    } as any);

    // Mock care activities
    mockUseFirebaseCareActivities.mockReturnValue({
      logActivity: mockLogActivity,
      activities: [],
      loading: false,
      error: null,
    } as any);

    // Mock scheduled tasks
    mockUseScheduledTasks.mockReturnValue({
      tasks: [],
      loading: false,
      error: null,
      getUpcomingFertilizationTasks: jest.fn().mockReturnValue([]),
      getFertilizationTasksBeforeNextWatering: jest.fn().mockReturnValue(Promise.resolve([])),
    } as any);

    // Mock last care activities
    mockUseLastCareActivities.mockReturnValue({
      activities: {
        watering: null,
        fertilizing: null,
      },
      loading: false,
      refetch: jest.fn(),
    } as any);

    // Mock dynamic stage - return just the stage string, not an object
    mockUseDynamicStage.mockReturnValue('vegetative' as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should log fertilizing with automatic water logging via quick actions", async () => {
    const user = userEvent.setup();

    // Render the dashboard
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for the dashboard to load and show the plant group
    await waitFor(() => {
      expect(screen.getByText("Test Variety")).toBeInTheDocument();
    });

    // Find and click the "Log Care" button to show quick actions
    const logCareButton = screen.getByRole("button", { name: /log care/i });
    expect(logCareButton).toBeInTheDocument();
    await user.click(logCareButton);

    // Wait for quick actions to appear and click fertilize
    await waitFor(() => {
      const fertilizeButton = screen.getByRole("button", { name: /fertilize/i });
      expect(fertilizeButton).toBeInTheDocument();
    });

    const fertilizeButton = screen.getByRole("button", { name: /fertilize/i });
    await user.click(fertilizeButton);

    // Wait for the bulk activity modal to appear - look for any indication of the modal
    await waitFor(() => {
      // Look for the application method select which is unique to fertilize modal
      expect(screen.getByLabelText(/Application Method/i)).toBeInTheDocument();
    });

    // Find the application method dropdown and select soil-drench
    const methodSelect = screen.getByLabelText(/Application Method/i);
    await user.selectOptions(methodSelect, "soil-drench");

    // Find and click the submit button - check the actual button text for fertilize
    const submitButton = screen.getByRole("button", { name: /log.*fertilizing/i });
    await user.click(submitButton);

    // Wait for the activities to be logged
    await waitFor(() => {
      expect(mockLogActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          plantId: testPlant.id,
          type: "fertilize",
          details: expect.objectContaining({
            type: "fertilize",
            applicationMethod: "soil-drench",
          }),
        })
      );
    }, { timeout: 3000 });

    // Wait for both activities to be logged (fertilize + automatic water)
    await waitFor(() => {
      expect(mockLogActivity).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });

    // Check that water activity was logged with appropriate details
    const waterActivityCall = mockLogActivity.mock.calls.find((call: any) => 
      call[0].type === "water"
    );
    expect(waterActivityCall).toBeTruthy();
    expect(waterActivityCall[0]).toEqual(
      expect.objectContaining({
        plantId: testPlant.id,
        type: "water",
        details: expect.objectContaining({
          type: "water",
          notes: expect.stringContaining("Watered in fertilizer"),
        }),
      })
    );
  });
});
