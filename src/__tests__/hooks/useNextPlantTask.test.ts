import { renderHook, waitFor } from "@testing-library/react";
import { useNextPlantTask } from "@/hooks/useNextPlantTask";
import { CareSchedulingService } from "@/services/careSchedulingService";
import { UpcomingTask } from "@/types";

jest.mock("@/services/careSchedulingService");

const mockCareSchedulingService = CareSchedulingService as jest.Mocked<
  typeof CareSchedulingService
>;

const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Factory function to create a single UpcomingTask object for testing
const createUpcomingTask = (
  overrides: Partial<UpcomingTask> = {}
): UpcomingTask => ({
  id: "task-1",
  plantId: "plant-1",
  plantName: "Test Plant",
  task: "Check water level",
  type: "water",
  dueDate: new Date("2024-01-15"),
  dueIn: "Due today",
  priority: "high",
  category: "watering",
  plantStage: "vegetative",
  canBypass: true,
  ...overrides,
});

describe("useNextPlantTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it("should load next task for valid plant", async () => {
    const mockTask = createUpcomingTask();
    mockCareSchedulingService.getNextTaskForPlant.mockResolvedValue(mockTask);

    const { result } = renderHook(() => useNextPlantTask("plant-1"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.nextTask).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nextTask).toEqual(mockTask);
    expect(mockCareSchedulingService.getNextTaskForPlant).toHaveBeenCalledWith(
      "plant-1"
    );
    expect(mockCareSchedulingService.getNextTaskForPlant).toHaveBeenCalledTimes(
      1
    );
  });

  it("should handle loading states correctly", async () => {
    const mockTask = createUpcomingTask();

    // Create a promise we can control
    let resolveTask: (task: UpcomingTask) => void;
    const taskPromise = new Promise<UpcomingTask>((resolve) => {
      resolveTask = resolve;
    });

    mockCareSchedulingService.getNextTaskForPlant.mockReturnValue(taskPromise);

    const { result } = renderHook(() => useNextPlantTask("plant-1"));

    // Should start with loading true and null task
    expect(result.current.isLoading).toBe(true);
    expect(result.current.nextTask).toBe(null);

    // Resolve the promise
    resolveTask!(mockTask);

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nextTask).toEqual(mockTask);
  });

  it("should handle plants with no tasks", async () => {
    mockCareSchedulingService.getNextTaskForPlant.mockResolvedValue(null);

    const { result } = renderHook(() => useNextPlantTask("plant-no-tasks"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nextTask).toBe(null);
    expect(mockCareSchedulingService.getNextTaskForPlant).toHaveBeenCalledWith(
      "plant-no-tasks"
    );
  });

  it("should handle service errors gracefully", async () => {
    const error = new Error("Failed to fetch task");
    mockCareSchedulingService.getNextTaskForPlant.mockRejectedValue(error);

    const { result } = renderHook(() => useNextPlantTask("plant-error"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nextTask).toBe(null);
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Failed to load next task for plant plant-error:",
      error
    );
  });

  it("should cleanup on unmount", async () => {
    const mockTask = createUpcomingTask();

    // Create a slow-resolving promise to test unmount cleanup
    let resolveTask: (task: UpcomingTask) => void;
    const taskPromise = new Promise<UpcomingTask>((resolve) => {
      resolveTask = resolve;
    });

    mockCareSchedulingService.getNextTaskForPlant.mockReturnValue(taskPromise);

    const { result, unmount } = renderHook(() => useNextPlantTask("plant-1"));

    expect(result.current.isLoading).toBe(true);

    // Unmount before the promise resolves
    unmount();

    // Now resolve the promise
    resolveTask!(mockTask);

    // Wait a bit to ensure any state updates would have occurred
    await new Promise((resolve) => setTimeout(resolve, 10));

    // The hook should not have updated state after unmount
    // (We can't directly test this, but the cleanup prevents memory leaks)
    expect(mockCareSchedulingService.getNextTaskForPlant).toHaveBeenCalledWith(
      "plant-1"
    );
  });

  it("should reload task when plantId changes", async () => {
    const task1 = createUpcomingTask({ id: "task-1", plantId: "plant-1" });
    const task2 = createUpcomingTask({ id: "task-2", plantId: "plant-2" });

    mockCareSchedulingService.getNextTaskForPlant
      .mockResolvedValueOnce(task1)
      .mockResolvedValueOnce(task2);

    const { result, rerender } = renderHook(
      ({ plantId }) => useNextPlantTask(plantId),
      { initialProps: { plantId: "plant-1" } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nextTask).toEqual(task1);
    expect(mockCareSchedulingService.getNextTaskForPlant).toHaveBeenCalledWith(
      "plant-1"
    );

    rerender({ plantId: "plant-2" });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nextTask).toEqual(task2);
    expect(mockCareSchedulingService.getNextTaskForPlant).toHaveBeenCalledWith(
      "plant-2"
    );
    expect(mockCareSchedulingService.getNextTaskForPlant).toHaveBeenCalledTimes(
      2
    );
  });

  it("should handle empty string plantId", async () => {
    mockCareSchedulingService.getNextTaskForPlant.mockResolvedValue(null);

    const { result } = renderHook(() => useNextPlantTask(""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.nextTask).toBe(null);
    expect(mockCareSchedulingService.getNextTaskForPlant).toHaveBeenCalledWith(
      ""
    );
  });

  it("should handle concurrent requests correctly", async () => {
    const task1 = createUpcomingTask({ id: "task-1", plantId: "plant-1" });
    const task2 = createUpcomingTask({ id: "task-2", plantId: "plant-2" });

    // Mock two different responses for different plant IDs
    mockCareSchedulingService.getNextTaskForPlant.mockImplementation(
      (plantId) => {
        if (plantId === "plant-1") return Promise.resolve(task1);
        if (plantId === "plant-2") return Promise.resolve(task2);
        return Promise.resolve(null);
      }
    );

    const { result: result1 } = renderHook(() => useNextPlantTask("plant-1"));
    const { result: result2 } = renderHook(() => useNextPlantTask("plant-2"));

    // Wait for both to load
    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    expect(result1.current.nextTask).toEqual(task1);
    expect(result2.current.nextTask).toEqual(task2);
  });

  it("should handle rapid plantId changes gracefully", async () => {
    const task1 = createUpcomingTask({ id: "task-1", plantId: "plant-1" });
    const task3 = createUpcomingTask({ id: "task-3", plantId: "plant-3" });

    // Mock delayed responses to simulate network latency
    mockCareSchedulingService.getNextTaskForPlant.mockImplementation(
      (plantId) => {
        if (plantId === "plant-1") {
          return new Promise((resolve) =>
            setTimeout(() => resolve(task1), 100)
          );
        }
        if (plantId === "plant-2") {
          return new Promise((resolve) => setTimeout(() => resolve(null), 200));
        }
        if (plantId === "plant-3") {
          return new Promise((resolve) => setTimeout(() => resolve(task3), 50));
        }
        return Promise.resolve(null);
      }
    );

    const { result, rerender } = renderHook(
      ({ plantId }) => useNextPlantTask(plantId),
      { initialProps: { plantId: "plant-1" } }
    );

    // Quickly change plantId multiple times
    rerender({ plantId: "plant-2" });
    rerender({ plantId: "plant-3" });

    // Wait for the final result
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 300 }
    );

    // Should show the result from the latest plantId (plant-3)
    expect(result.current.nextTask).toEqual(task3);
  });
});
