import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import {
  convertCareActivityToFirebase,
  convertCareActivityFromFirebase,
} from "@/types";
import { CareRecord } from "@/types";

// Mock all Firebase functions
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: "mock-care-id" }),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
}));

// Mock Firebase config
jest.mock("@/services/firebase/config", () => ({
  db: { mockDb: true },
}));

// Mock Logger
jest.mock("@/utils/logger", () => ({
  Logger: {
    database: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock type conversion utilities
jest.mock("@/types", () => ({
  convertCareActivityToFirebase: jest.fn().mockReturnValue({ converted: "care-activity" }),
  convertCareActivityFromFirebase: jest.fn().mockReturnValue({
    id: "care-1",
    plantId: "plant-1",
    type: "water",
    date: new Date("2024-01-01"),
    details: { type: "water", waterAmount: 16, waterUnit: "oz" },
  }),
}));

describe("FirebaseCareActivityService", () => {
  const mockUserId = "test-user-123";
  const mockPlantId = "plant-123";

  const mockCareActivity: Omit<CareRecord, "id" | "createdAt" | "updatedAt"> = {
    plantId: mockPlantId,
    type: "water",
    date: new Date("2024-01-01"),
    details: {
      type: "water",
      waterAmount: 16,
      waterUnit: "oz",
      moistureLevel: {
        before: 3,
        after: 7,
        scale: "1-10",
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    // Setup default mock returns  
    (collection as jest.Mock).mockReturnValue({ collection: "careActivities" });
    (query as jest.Mock).mockReturnValue({ query: "mock-query" });
    (where as jest.Mock).mockReturnValue({ where: "mock-where" });
    (orderBy as jest.Mock).mockReturnValue({ orderBy: "mock-orderBy" });
    (limit as jest.Mock).mockReturnValue({ limit: "mock-limit" });
    
    // Reset addDoc to resolved state (may have been rejected in error tests)
    (addDoc as jest.Mock).mockResolvedValue({ id: "mock-care-id" });
  });

  describe("createCareActivity", () => {
    it("creates a new care activity and returns the ID", async () => {
      const result = await FirebaseCareActivityService.createCareActivity(
        mockCareActivity,
        mockUserId
      );

      expect(result).toBe("mock-care-id");
      expect(convertCareActivityToFirebase).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockCareActivity,
          id: "",
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
        mockUserId
      );
      expect(addDoc).toHaveBeenCalled();
    });

    it("sets proper timestamps when creating care activity", async () => {
      await FirebaseCareActivityService.createCareActivity(
        mockCareActivity,
        mockUserId
      );

      expect(convertCareActivityToFirebase).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
        mockUserId
      );
    });

    it("propagates creation errors", async () => {
      const mockError = new Error("Firestore creation error");
      (addDoc as jest.Mock).mockRejectedValue(mockError);

      await expect(
        FirebaseCareActivityService.createCareActivity(mockCareActivity, mockUserId)
      ).rejects.toThrow(mockError);
    });
  });

  describe("subscribeToPlantActivities", () => {
    it("subscribes to activities for a specific plant", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = FirebaseCareActivityService.subscribeToPlantActivities(
        mockPlantId,
        mockUserId,
        mockCallback
      );

      expect(where).toHaveBeenCalledWith("userId", "==", mockUserId);
      expect(where).toHaveBeenCalledWith("plantId", "==", mockPlantId);
      expect(orderBy).toHaveBeenCalledWith("date", "desc");
      expect(limit).toHaveBeenCalledWith(50);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it("uses custom limit when provided", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      FirebaseCareActivityService.subscribeToPlantActivities(
        mockPlantId,
        mockUserId,
        mockCallback,
        25
      );

      expect(limit).toHaveBeenCalledWith(25);
    });

    it("processes query snapshot correctly", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      const mockSnapshot = {
        docs: [
          {
            id: "care-1",
            data: () => ({
              userId: mockUserId,
              plantId: mockPlantId,
              type: "water",
              date: { toDate: () => new Date("2024-01-01") },
              details: { type: "water", waterAmount: 16 },
            }),
          },
          {
            id: "care-2",
            data: () => ({
              userId: mockUserId,
              plantId: mockPlantId,
              type: "fertilize",
              date: { toDate: () => new Date("2024-01-02") },
              details: { type: "fertilize", product: "NPK" },
            }),
          },
        ],
      };

      (onSnapshot as jest.Mock).mockImplementation((_q, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      FirebaseCareActivityService.subscribeToPlantActivities(
        mockPlantId,
        mockUserId,
        mockCallback
      );

      expect(convertCareActivityFromFirebase).toHaveBeenCalledTimes(2);
      expect(convertCareActivityFromFirebase).toHaveBeenCalledWith({
        userId: mockUserId,
        plantId: mockPlantId,
        type: "water",
        date: { toDate: expect.any(Function) },
        details: { type: "water", waterAmount: 16 },
        id: "care-1",
      });
      expect(mockCallback).toHaveBeenCalledWith([
        {
          id: "care-1",
          plantId: "plant-1",
          type: "water",
          date: new Date("2024-01-01"),
          details: { type: "water", waterAmount: 16, waterUnit: "oz" },
        },
        {
          id: "care-1",
          plantId: "plant-1",
          type: "water",
          date: new Date("2024-01-01"),
          details: { type: "water", waterAmount: 16, waterUnit: "oz" },
        },
      ]);
    });

    it("handles empty snapshot", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      const mockSnapshot = { docs: [] };

      (onSnapshot as jest.Mock).mockImplementation((_q, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      FirebaseCareActivityService.subscribeToPlantActivities(
        mockPlantId,
        mockUserId,
        mockCallback
      );

      expect(mockCallback).toHaveBeenCalledWith([]);
    });
  });

  describe("subscribeToUserActivities", () => {
    it("subscribes to all activities for a user", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = FirebaseCareActivityService.subscribeToUserActivities(
        mockUserId,
        mockCallback
      );

      expect(where).toHaveBeenCalledWith("userId", "==", mockUserId);
      expect(orderBy).toHaveBeenCalledWith("date", "desc");
      expect(limit).toHaveBeenCalledWith(100);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it("uses custom limit when provided", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      FirebaseCareActivityService.subscribeToUserActivities(
        mockUserId,
        mockCallback,
        50
      );

      expect(limit).toHaveBeenCalledWith(50);
    });

    it("processes multi-plant activities correctly", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      const mockSnapshot = {
        docs: [
          {
            id: "care-1",
            data: () => ({
              userId: mockUserId,
              plantId: "plant-1",
              type: "water",
              date: { toDate: () => new Date("2024-01-01") },
              details: { type: "water" },
            }),
          },
          {
            id: "care-2",
            data: () => ({
              userId: mockUserId,
              plantId: "plant-2",
              type: "fertilize",
              date: { toDate: () => new Date("2024-01-02") },
              details: { type: "fertilize" },
            }),
          },
        ],
      };

      (onSnapshot as jest.Mock).mockImplementation((_q, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      FirebaseCareActivityService.subscribeToUserActivities(mockUserId, mockCallback);

      expect(convertCareActivityFromFirebase).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith([
        {
          id: "care-1",
          plantId: "plant-1",
          type: "water",
          date: new Date("2024-01-01"),
          details: { type: "water", waterAmount: 16, waterUnit: "oz" },
        },
        {
          id: "care-1",
          plantId: "plant-1",
          type: "water",
          date: new Date("2024-01-01"),
          details: { type: "water", waterAmount: 16, waterUnit: "oz" },
        },
      ]);
    });
  });

  describe("getRecentActivitiesForPlant", () => {
    it("returns recent activities for a plant with default lookback", async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn((callback) => {
          // Simulate two documents
          callback({
            id: "care-1",
            data: () => ({
              userId: mockUserId,
              plantId: mockPlantId,
              type: "water",
              date: { toDate: () => new Date("2024-01-01") },
              details: { type: "water" },
            }),
          });
          callback({
            id: "care-2",
            data: () => ({
              userId: mockUserId,
              plantId: mockPlantId,
              type: "fertilize",
              date: { toDate: () => new Date("2024-01-02") },
              details: { type: "fertilize" },
            }),
          });
        }),
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await FirebaseCareActivityService.getRecentActivitiesForPlant(
        mockPlantId,
        mockUserId
      );

      expect(where).toHaveBeenCalledWith("userId", "==", mockUserId);
      expect(where).toHaveBeenCalledWith("plantId", "==", mockPlantId);
      expect(where).toHaveBeenCalledWith("date", ">=", expect.any(Date));
      expect(orderBy).toHaveBeenCalledWith("date", "desc");

      expect(result).toHaveLength(2);
      expect(convertCareActivityFromFirebase).toHaveBeenCalledTimes(2);
    });

    it("uses custom lookback days when provided", async () => {
      const mockQuerySnapshot = { forEach: jest.fn() };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      await FirebaseCareActivityService.getRecentActivitiesForPlant(
        mockPlantId,
        mockUserId,
        7 // 7 days lookback
      );

      const expectedCutoffDate = new Date();
      expectedCutoffDate.setDate(expectedCutoffDate.getDate() - 7);

      expect(where).toHaveBeenCalledWith("date", ">=", expect.any(Date));
      // Verify the cutoff date is approximately correct (within 1 minute)
      const actualCall = (where as jest.Mock).mock.calls.find(
        call => call[0] === "date" && call[1] === ">="
      );
      const actualDate = actualCall[2];
      const timeDiff = Math.abs(actualDate.getTime() - expectedCutoffDate.getTime());
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });

    it("returns empty array when no activities found", async () => {
      const mockQuerySnapshot = { forEach: jest.fn() };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await FirebaseCareActivityService.getRecentActivitiesForPlant(
        mockPlantId,
        mockUserId
      );

      expect(result).toEqual([]);
    });

    it("handles query errors gracefully", async () => {
      const mockError = new Error("Firestore query error");
      (getDocs as jest.Mock).mockRejectedValue(mockError);

      const result = await FirebaseCareActivityService.getRecentActivitiesForPlant(
        mockPlantId,
        mockUserId
      );

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        "Failed to get recent activities for plant:",
        mockError
      );
    });

    it("calculates cutoff date correctly", async () => {
      const mockQuerySnapshot = { forEach: jest.fn() };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const now = new Date();
      const lookbackDays = 30;
      
      await FirebaseCareActivityService.getRecentActivitiesForPlant(
        mockPlantId,
        mockUserId,
        lookbackDays
      );

      const expectedCutoffDate = new Date();
      expectedCutoffDate.setDate(expectedCutoffDate.getDate() - lookbackDays);

      expect(where).toHaveBeenCalledWith("date", ">=", expect.any(Date));
      
      // Get the actual cutoff date used in the query
      const dateWhereCall = (where as jest.Mock).mock.calls.find(
        call => call[0] === "date" && call[1] === ">="
      );
      const actualCutoffDate = dateWhereCall[2];
      
      // Should be approximately 30 days ago (within 1 minute tolerance)
      const expectedTime = now.getTime() - (lookbackDays * 24 * 60 * 60 * 1000);
      const actualTime = actualCutoffDate.getTime();
      const tolerance = 60 * 1000; // 1 minute
      
      expect(Math.abs(actualTime - expectedTime)).toBeLessThan(tolerance);
    });
  });

  describe("Firebase Collection Reference", () => {
    it("service initializes with collection reference", () => {
      // The collection reference is created at module load time
      // Just verify the service can be used without errors
      expect(FirebaseCareActivityService).toBeDefined();
      expect(typeof FirebaseCareActivityService.createCareActivity).toBe("function");
      expect(typeof FirebaseCareActivityService.subscribeToPlantActivities).toBe("function");
      expect(typeof FirebaseCareActivityService.subscribeToUserActivities).toBe("function");
      expect(typeof FirebaseCareActivityService.getRecentActivitiesForPlant).toBe("function");
    });
  });

  describe("Data Conversion Integration", () => {
    it("properly converts care activity to Firebase format", async () => {
      const detailedActivity = {
        plantId: mockPlantId,
        type: "fertilize" as const,
        date: new Date("2024-01-15"),
        details: {
          type: "fertilize" as const,
          product: "General Hydroponics Flora Series",
          dilution: "1:1000",
          amount: "2 cups",
          applicationMethod: "soil-drench" as const,
          notes: "First feeding of the season",
        },
      };

      await FirebaseCareActivityService.createCareActivity(detailedActivity, mockUserId);

      expect(convertCareActivityToFirebase).toHaveBeenCalledWith(
        expect.objectContaining({
          plantId: mockPlantId,
          type: "fertilize",
          date: new Date("2024-01-15"),
          details: expect.objectContaining({
            type: "fertilize",
            product: "General Hydroponics Flora Series",
            dilution: "1:1000",
            amount: "2 cups",
            applicationMethod: "soil-drench",
            notes: "First feeding of the season",
          }),
        }),
        mockUserId
      );
    });

    it("properly converts different activity types", async () => {
      const observationActivity = {
        plantId: mockPlantId,
        type: "observe" as const,
        date: new Date("2024-01-20"),
        details: {
          type: "observe" as const,
          healthAssessment: "good" as const,
          observations: "New growth visible, leaves looking healthy",
          photos: ["photo1.jpg", "photo2.jpg"],
        },
      };

      await FirebaseCareActivityService.createCareActivity(observationActivity, mockUserId);

      expect(convertCareActivityToFirebase).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "observe",
          details: expect.objectContaining({
            type: "observe",
            healthAssessment: "good",
            observations: "New growth visible, leaves looking healthy",
            photos: ["photo1.jpg", "photo2.jpg"],
          }),
        }),
        mockUserId
      );
    });
  });

  describe("Query Optimization", () => {
    it("limits plant activities query correctly", () => {
      const mockCallback = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(jest.fn());

      FirebaseCareActivityService.subscribeToPlantActivities(
        mockPlantId,
        mockUserId,
        mockCallback,
        10 // Small limit for testing
      );

      expect(limit).toHaveBeenCalledWith(10);
    });

    it("limits user activities query correctly", () => {
      const mockCallback = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(jest.fn());

      FirebaseCareActivityService.subscribeToUserActivities(
        mockUserId,
        mockCallback,
        200 // Large limit for testing
      );

      expect(limit).toHaveBeenCalledWith(200);
    });

    it("orders activities by date descending", () => {
      const mockCallback = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(jest.fn());

      FirebaseCareActivityService.subscribeToPlantActivities(
        mockPlantId,
        mockUserId,
        mockCallback
      );

      expect(orderBy).toHaveBeenCalledWith("date", "desc");
    });
  });
});