import { http, HttpResponse, delay } from "msw";
import { PlantRecord, CareActivityRecord } from "@/types/database";
import { ScheduledTask } from "@/types/records";

// Mock data arrays that can be controlled by tests
export let mockPlants: PlantRecord[] = [];
export let mockCareActivities: CareActivityRecord[] = [];
export let mockScheduledTasks: ScheduledTask[] = [];

// Helper function to ensure Date objects are preserved
const ensureDateObjects = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(ensureDateObjects);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convert date strings back to Date objects for known date fields
      if ((key === 'plantedDate' || key === 'createdAt' || key === 'updatedAt' || key === 'timestamp' || key === 'loggedAt' || key === 'date') &&
          typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        result[key] = new Date(value);
      } else {
        result[key] = ensureDateObjects(value);
      }
    }
    return result;
  }

  return obj;
};

// Helper function to set mock data
export const setMockData = ({
  plants = [],
  careActivities = [],
  scheduledTasks = [],
}: {
  plants?: PlantRecord[];
  careActivities?: CareActivityRecord[];
  scheduledTasks?: ScheduledTask[];
} = {}) => {
  mockPlants.length = 0;
  mockCareActivities.length = 0;
  mockScheduledTasks.length = 0;

  // Ensure all dates are properly converted to Date objects
  mockPlants.push(...ensureDateObjects(plants));
  mockCareActivities.push(...ensureDateObjects(careActivities));
  mockScheduledTasks.push(...ensureDateObjects(scheduledTasks));
};

// Helper function to clear all mock data
export const clearMockData = () => {
  mockPlants.length = 0;
  mockCareActivities.length = 0;
  mockScheduledTasks.length = 0;
};

// Utility to add realistic delays
const addRealisticDelay = () => delay(50 + Math.random() * 100); // 50-150ms

// MSW handlers for Firebase-like API endpoints
export const handlers = [
  // Plants endpoints
  http.get("/api/plants", async () => {
    await addRealisticDelay();
    // Ensure dates are properly converted - use the comprehensive ensureDateObjects function
    return HttpResponse.json({
      data: ensureDateObjects(mockPlants),
      status: "success",
    });
  }),

  http.get("/api/plants/:userId", async ({ params }) => {
    await addRealisticDelay();
    const { userId } = params;

    // Filter plants by userId if needed (for multi-user scenarios)
    const userPlants = mockPlants.filter(plant =>
      plant.createdBy === userId || !plant.createdBy
    );

    return HttpResponse.json({
      data: ensureDateObjects(userPlants),
      status: "success",
    });
  }),

  http.post<never, { plant: Omit<PlantRecord, "id"> }>("/api/plants", async ({ request }) => {
    const { plant } = await request.json();
    const newPlant: PlantRecord = {
      ...plant,
      id: `plant-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPlants.push(newPlant);
    return HttpResponse.json({
      data: { id: newPlant.id },
      status: "success",
    });
  }),

  http.put<{ plantId: string }, { plant: Partial<PlantRecord> }>("/api/plants/:plantId", async ({ params, request }) => {
    const { plantId } = params;
    const { plant } = await request.json();

    const index = mockPlants.findIndex(p => p.id === plantId);
    if (index === -1) {
      return HttpResponse.json(
        { status: "error", message: "Plant not found" },
        { status: 404 }
      );
    }

    mockPlants[index] = { ...mockPlants[index], ...plant, updatedAt: new Date() };
    return HttpResponse.json({
      data: mockPlants[index],
      status: "success",
    });
  }),

  http.delete<{ plantId: string }>("/api/plants/:plantId", ({ params }) => {
    const { plantId } = params;
    const index = mockPlants.findIndex(p => p.id === plantId);
    if (index === -1) {
      return HttpResponse.json(
        { status: "error", message: "Plant not found" },
        { status: 404 }
      );
    }

    mockPlants.splice(index, 1);
    return HttpResponse.json({
      status: "success",
    });
  }),

  // Care Activities endpoints
  http.get<{ plantId: string }>("/api/plants/:plantId/care-activities", async ({ params }) => {
    await addRealisticDelay();
    const { plantId } = params;
    const activities = mockCareActivities.filter(activity => activity.plantId === plantId);
    return HttpResponse.json({
      data: ensureDateObjects(activities),
      status: "success",
    });
  }),

  http.get("/api/care-activities/:plantId/:type/latest", async ({ params }) => {
    await addRealisticDelay();
    const { plantId, type } = params;

    // Find the most recent activity of this type for this plant
    const activities = mockCareActivities
      .filter(activity => activity.plantId === plantId && activity.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latestActivity = activities[0] || null;

    return HttpResponse.json({
      data: ensureDateObjects(latestActivity),
      status: "success",
    });
  }),

  http.post<never, { activity: Omit<CareActivityRecord, "id"> }>("/api/care-activities", async ({ request }) => {
    const { activity } = await request.json();
    const newActivity: CareActivityRecord = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      loggedAt: new Date(),
    };
    mockCareActivities.push(newActivity);
    return HttpResponse.json({
      data: { id: newActivity.id },
      status: "success",
    });
  }),

  // Scheduled Tasks endpoints
  http.get<{ userId: string }>("/api/users/:userId/scheduled-tasks", async ({ params }) => {
    await addRealisticDelay();
    return HttpResponse.json({
      data: mockScheduledTasks,
      status: "success",
    });
  }),

  http.get("/api/scheduled-tasks", async () => {
    await addRealisticDelay();
    return HttpResponse.json({
      data: mockScheduledTasks,
      status: "success",
    });
  }),

  http.post<never, { tasks: Omit<ScheduledTask, "id">[] }>("/api/scheduled-tasks", async ({ request }) => {
    await addRealisticDelay();
    const { tasks } = await request.json();
    const newTasks: ScheduledTask[] = tasks.map(task => ({
      ...task,
      id: `task-${Date.now()}-${Math.random()}`,
    }));
    mockScheduledTasks.push(...newTasks);
    return HttpResponse.json({
      data: newTasks.map(task => ({ id: task.id })),
      status: "success",
    });
  }),

  http.delete<{ plantId: string }>("/api/plants/:plantId/scheduled-tasks", async ({ params }) => {
    await addRealisticDelay();
    const { plantId } = params;
    const initialLength = mockScheduledTasks.length;
    const filteredTasks = mockScheduledTasks.filter(task => task.plantId !== plantId);

    // Update the global array
    mockScheduledTasks.length = 0;
    mockScheduledTasks.push(...filteredTasks);

    return HttpResponse.json({
      data: { deleted: initialLength - mockScheduledTasks.length },
      status: "success",
    });
  }),

  http.delete<{ taskId: string }>("/api/scheduled-tasks/:taskId", async ({ params }) => {
    await addRealisticDelay();
    const { taskId } = params;
    const initialLength = mockScheduledTasks.length;
    const filteredTasks = mockScheduledTasks.filter(task => task.id !== taskId);

    // Update the global array
    mockScheduledTasks.length = 0;
    mockScheduledTasks.push(...filteredTasks);

    if (filteredTasks.length === initialLength) {
      return HttpResponse.json(
        { status: "error", message: "Task not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      data: { deleted: 1 },
      status: "success",
    });
  }),

  // Error scenarios for testing
  http.get("/api/plants/error", () => {
    return HttpResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }),

  http.post("/api/care-activities/error", () => {
    return HttpResponse.json(
      { status: "error", message: "Failed to create activity" },
      { status: 500 }
    );
  }),
];