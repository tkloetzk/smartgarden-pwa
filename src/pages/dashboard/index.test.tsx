import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock router
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock dashboard hooks module
const useDashboardDataMock = vi.fn(() => ({
  plants: [],
  loading: false,
  user: { uid: "u1", email: "test@example.com" },
  signOut: vi.fn(),
  logActivity: vi.fn(),
  getUpcomingFertilizationTasks: vi.fn(),
  scheduledTasksError: null,
}));

vi.mock("@/hooks/dashboard", async () => {
  const actual = await vi.importActual<any>("@/hooks/dashboard");
  return {
    ...actual,
    useDashboardData: () => useDashboardDataMock(),
    useHiddenGroupsManager: () => ({ hiddenGroups: new Set(), hideGroup: vi.fn(), restoreAllHidden: vi.fn() }),
    useContainerGroups: () => ({ plantGroups: [], containerGroups: [], visiblePlants: [], visiblePlantsCount: 0 }),
    useCareStatus: () => ({ groupsNeedingCatchUp: 0, careStatusLoading: false }),
    useFertilizationTasks: () => ({ upcomingFertilization: [], handleTaskComplete: vi.fn(), handleTaskBypass: vi.fn(), handleTaskLogActivity: vi.fn() }),
  };
});

// Mock other hooks imported directly
vi.mock("@/hooks/dashboard/useObservationTasks", () => ({ useObservationTasks: () => ({ upcomingObservation: [], handleTaskComplete: vi.fn(), handleTaskBypass: vi.fn(), handleTaskLogActivity: vi.fn() }) }));
vi.mock("@/hooks/dashboard/useWateringTasks", () => ({ useWateringTasks: () => ({ upcomingWatering: [], handleTaskComplete: vi.fn(), handleTaskBypass: vi.fn(), handleTaskLogActivity: vi.fn() }) }));

// Mock UI components used by Dashboard
vi.mock("@/components/ui/OfflineIndicator", () => ({ OfflineIndicator: () => <div data-testid="offline">offline</div> }));
vi.mock("@/components/ui/Button", () => ({ Button: ({ children }: any) => <button>{children}</button> }));
vi.mock("@/components/dashboard/SummaryCards", () => ({ SummaryCards: ({ children }: any) => <div>{children}</div> }));
vi.mock("@/components/dashboard/PlantGarden", () => ({ PlantGarden: { Container: ({ children }: any) => <div>{children}</div>, Empty: () => <div>No plants</div>, Header: () => <div>Header</div>, ContainerGroup: () => <div>Group</div> } }));
vi.mock("@/components/plant/BulkActivityModal", () => ({ __esModule: true, default: () => null }));
vi.mock("@/components/fertilization/FertilizationDashboardSection", () => ({ __esModule: true, default: () => null }));
vi.mock("@/components/watering/WateringDashboardSection", () => ({ __esModule: true, default: () => null }));
vi.mock("@/components/observation/ObservationDashboardSection", () => ({ __esModule: true, default: () => null }));
vi.mock("@/components/ui/Card", () => ({ Card: ({ children }: any) => <div>{children}</div>, CardContent: ({ children }: any) => <div>{children}</div> }));

// Now import the component under test
import Dashboard from "./index";

describe("Dashboard basic render", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders header and welcome with user email", () => {
    useDashboardDataMock.mockImplementation(() => ({
      plants: [],
      loading: false,
      user: { uid: "u1", email: "test@example.com" },
      signOut: vi.fn(),
      logActivity: vi.fn(),
      getUpcomingFertilizationTasks: vi.fn(),
      scheduledTasksError: null,
    }));

    render(<Dashboard />);

    expect(screen.getByTestId("smartgarden-title")).toHaveTextContent("SmartGarden");
    expect(screen.getByText(/Welcome, test@example.com/)).toBeTruthy();
  });

  it("shows loading state when loading is true", () => {
    useDashboardDataMock.mockImplementationOnce(() => ({
      plants: [],
      loading: true,
      user: { uid: "", email: "" },
      signOut: vi.fn(),
      logActivity: vi.fn(),
      getUpcomingFertilizationTasks: vi.fn(),
      scheduledTasksError: null,
    }));

    render(<Dashboard />);

    expect(screen.getByText(/Loading dashboard.../)).toBeTruthy();
  });
});
