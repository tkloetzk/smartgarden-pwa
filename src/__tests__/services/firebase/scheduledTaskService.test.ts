import { FirebaseScheduledTaskService, FirebaseScheduledTask } from "@/services/firebase/scheduledTaskService";
import { ScheduledTask } from "@/services/ProtocolTranspilerService";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  writeBatch,
  getDocs,
  updateDoc,
  doc,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/services/firebase/config";

// Mock Firestore functions
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({ name: "scheduledTasks" })),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(),
    now: jest.fn(),
  },
  writeBatch: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

// Mock the db config
jest.mock("@/services/firebase/config", () => ({
  db: {},
}));

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockTimestamp = Timestamp as jest.Mocked<typeof Timestamp>;
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

describe("FirebaseScheduledTaskService", () => {
  const mockUserId = "user-123";
  const mockPlantId = "plant-456";
  
  const mockScheduledTask: ScheduledTask = {
    id: "task-1",
    plantId: mockPlantId,
    taskName: "Water Plant",
    taskType: "fertilize",
    details: {
      type: "fertilize",
      product: "Nitrogen Fertilizer",
      dilution: "1:10",
      amount: "1 cup",
      method: "soil-drench",
    },
    dueDate: new Date("2024-02-01"),
    status: "pending",
    sourceProtocol: {
      stage: "vegetative",
      originalStartDays: 14,
      isDynamic: true,
    },
    priority: "normal",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  };

  const mockFirebaseTask: FirebaseScheduledTask = {
    id: "task-1",
    userId: mockUserId,
    plantId: mockPlantId,
    taskName: "Water Plant",
    taskType: "fertilize",
    details: {
      type: "fertilize",
      product: "Nitrogen Fertilizer",
      dilution: "1:10",
      amount: "1 cup",
      method: "soil-drench",
    },
    dueDate: Timestamp.fromDate(new Date("2024-02-01")) as any,
    status: "pending",
    sourceProtocol: {
      stage: "vegetative",
      originalStartDays: 14,
      isDynamic: true,
    },
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    const mockCollectionRef = { name: "scheduledTasks" };
    mockCollection.mockReturnValue(mockCollectionRef as any);
    mockTimestamp.fromDate.mockImplementation((date: Date) => ({
      toDate: () => date,
    }) as any);
    mockTimestamp.now.mockReturnValue({
      toDate: () => new Date(),
    } as any);
  });

  describe("createTask", () => {
    it("successfully creates a single task", async () => {
      const mockDocRef = { id: "new-task-id" };
      mockAddDoc.mockResolvedValue(mockDocRef as any);

      const taskId = await FirebaseScheduledTaskService.createTask(mockScheduledTask, mockUserId);

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(), // Don't check collection ref since it's static
        expect.objectContaining({
          userId: mockUserId,
          plantId: mockPlantId,
          taskName: "Water Plant",
          taskType: "fertilize",
          details: mockScheduledTask.details,
          status: "pending",
          sourceProtocol: mockScheduledTask.sourceProtocol,
        })
      );
      expect(taskId).toBe("new-task-id");
    });

    it("converts dates to Firestore Timestamps", async () => {
      const mockDocRef = { id: "new-task-id" };
      mockAddDoc.mockResolvedValue(mockDocRef as any);

      await FirebaseScheduledTaskService.createTask(mockScheduledTask, mockUserId);

      expect(mockTimestamp.fromDate).toHaveBeenCalledWith(mockScheduledTask.dueDate);
      expect(mockTimestamp.now).toHaveBeenCalledTimes(2); // createdAt and updatedAt
    });

    it("throws error when task creation fails", async () => {
      const createError = new Error("Firestore error");
      mockAddDoc.mockRejectedValue(createError);

      await expect(
        FirebaseScheduledTaskService.createTask(mockScheduledTask, mockUserId)
      ).rejects.toThrow("Firestore error");
    });
  });

  describe("createMultipleTasks", () => {
    it("successfully creates multiple tasks", async () => {
      const task2: ScheduledTask = { ...mockScheduledTask, id: "task-2" };
      const tasks = [mockScheduledTask, task2];
      
      mockAddDoc
        .mockResolvedValueOnce({ id: "task-id-1" } as any)
        .mockResolvedValueOnce({ id: "task-id-2" } as any);

      const taskIds = await FirebaseScheduledTaskService.createMultipleTasks(tasks, mockUserId);

      expect(mockAddDoc).toHaveBeenCalledTimes(2);
      expect(taskIds).toEqual(["task-id-1", "task-id-2"]);
    });

    it("handles partial failure in batch creation", async () => {
      const task2: ScheduledTask = { ...mockScheduledTask, id: "task-2" };
      const tasks = [mockScheduledTask, task2];
      
      mockAddDoc
        .mockResolvedValueOnce({ id: "task-id-1" } as any)
        .mockRejectedValueOnce(new Error("Second task failed"));

      await expect(
        FirebaseScheduledTaskService.createMultipleTasks(tasks, mockUserId)
      ).rejects.toThrow("Second task failed");
    });
  });

  describe("getTasksForPlant", () => {
    it("successfully retrieves tasks for a plant", async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn((callback: (doc: any) => void) => {
          const mockDoc = {
            id: "task-1",
            data: () => ({
              ...mockFirebaseTask,
              dueDate: { toDate: () => new Date("2024-02-01") },
              createdAt: { toDate: () => new Date("2024-01-15") },
              updatedAt: { toDate: () => new Date("2024-01-15") },
            }),
          };
          callback(mockDoc);
        }),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const tasks = await FirebaseScheduledTaskService.getTasksForPlant(mockPlantId);

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith("plantId", "==", mockPlantId);
      expect(mockOrderBy).toHaveBeenCalledWith("dueDate", "asc");
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual(
        expect.objectContaining({
          id: "task-1",
          plantId: mockPlantId,
          taskName: "Water Plant",
          dueDate: new Date("2024-02-01"),
        })
      );
    });

    it("returns empty array when no tasks found", async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn(),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const tasks = await FirebaseScheduledTaskService.getTasksForPlant(mockPlantId);

      expect(tasks).toEqual([]);
    });

    it("handles query error gracefully", async () => {
      const queryError = new Error("Firestore query failed");
      mockGetDocs.mockRejectedValue(queryError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const tasks = await FirebaseScheduledTaskService.getTasksForPlant(mockPlantId);

      expect(tasks).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get tasks for plant:", queryError);
      
      consoleSpy.mockRestore();
    });
  });

  describe("subscribeToUserTasks", () => {
    it("sets up real-time subscription for user tasks", () => {
      const mockCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const unsubscribe = FirebaseScheduledTaskService.subscribeToUserTasks(
        mockUserId,
        mockCallback,
        mockErrorCallback
      );

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", mockUserId);
      expect(mockWhere).toHaveBeenCalledWith("status", "==", "pending");
      expect(mockOrderBy).toHaveBeenCalledWith("dueDate", "asc");
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it("calls callback with tasks on snapshot update", () => {
      const mockCallback = jest.fn();
      const mockErrorCallback = jest.fn();

      // Mock onSnapshot to immediately call the success callback
      mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        const mockSnapshot = {
          docs: [{
            id: "task-1",
            data: () => ({
              ...mockFirebaseTask,
              dueDate: { toDate: () => new Date("2024-02-01") },
              createdAt: { toDate: () => new Date("2024-01-15") },
              updatedAt: { toDate: () => new Date("2024-01-15") },
            }),
          }],
        };
        successCallback(mockSnapshot);
        return jest.fn();
      });

      FirebaseScheduledTaskService.subscribeToUserTasks(
        mockUserId,
        mockCallback,
        mockErrorCallback
      );

      expect(mockCallback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "task-1",
          plantId: mockPlantId,
          taskName: "Water Plant",
        })
      ]);
    });

    it("calls error callback on subscription error", () => {
      const mockCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      const subscriptionError = new Error("Subscription failed");

      // Mock onSnapshot to call the error callback
      mockOnSnapshot.mockImplementation((query, successCallback, errorCallback) => {
        errorCallback(subscriptionError);
        return jest.fn();
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      FirebaseScheduledTaskService.subscribeToUserTasks(
        mockUserId,
        mockCallback,
        mockErrorCallback
      );

      expect(mockErrorCallback).toHaveBeenCalledWith(subscriptionError);
      expect(consoleSpy).toHaveBeenCalledWith("❌ Error subscribing to tasks:", subscriptionError);
      
      consoleSpy.mockRestore();
    });
  });

  describe("deletePendingTasksForPlant", () => {
    it("successfully deletes pending tasks for a plant", async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };

      const mockQuerySnapshot = {
        empty: false,
        size: 2,
        forEach: jest.fn((callback: (doc: any) => void) => {
          [{ ref: "doc-ref-1" }, { ref: "doc-ref-2" }].forEach(callback);
        }),
      };

      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await FirebaseScheduledTaskService.deletePendingTasksForPlant(mockPlantId, mockUserId);

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith("userId", "==", mockUserId);
      expect(mockWhere).toHaveBeenCalledWith("plantId", "==", mockPlantId);
      expect(mockWhere).toHaveBeenCalledWith("status", "==", "pending");
      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        `🗑️ Deleted 2 pending tasks for plant ${mockPlantId}.`
      );

      consoleSpy.mockRestore();
    });

    it("handles no tasks to delete gracefully", async () => {
      const mockQuerySnapshot = {
        empty: true,
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      await FirebaseScheduledTaskService.deletePendingTasksForPlant(mockPlantId, mockUserId);

      expect(mockWriteBatch).not.toHaveBeenCalled();
    });

    it("throws error when deletion fails", async () => {
      const deleteError = new Error("Batch commit failed");
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockRejectedValue(deleteError),
      };

      const mockQuerySnapshot = {
        empty: false,
        size: 1,
        forEach: jest.fn((callback: (doc: any) => void) => {
          callback({ ref: "doc-ref-1" });
        }),
      };

      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        FirebaseScheduledTaskService.deletePendingTasksForPlant(mockPlantId, mockUserId)
      ).rejects.toThrow("Batch commit failed");

      expect(consoleSpy).toHaveBeenCalledWith(
        `❌ Failed to delete pending tasks for plant ${mockPlantId}:`,
        deleteError
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getOverdueTasksForPlant", () => {
    it("successfully retrieves overdue tasks within lookback period", async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn((callback: (doc: any) => void) => {
          const mockDoc = {
            id: "overdue-task-1",
            data: () => ({
              ...mockFirebaseTask,
              dueDate: { toDate: () => new Date("2024-01-01") }, // Overdue
              createdAt: { toDate: () => new Date("2024-01-01") },
              updatedAt: { toDate: () => new Date("2024-01-01") },
            }),
          };
          callback(mockDoc);
        }),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const overdueTasks = await FirebaseScheduledTaskService.getOverdueTasksForPlant(
        mockPlantId,
        7 // 7 days lookback
      );

      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith("plantId", "==", mockPlantId);
      expect(mockWhere).toHaveBeenCalledWith("status", "==", "pending");
      expect(mockOrderBy).toHaveBeenCalledWith("dueDate", "desc");
      expect(overdueTasks).toHaveLength(1);
      expect(overdueTasks[0].id).toBe("overdue-task-1");
    });

    it("uses default lookback period when none specified", async () => {
      const mockQuerySnapshot = { forEach: jest.fn() };
      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      await FirebaseScheduledTaskService.getOverdueTasksForPlant(mockPlantId);

      // Should use default 14 days lookback
      expect(mockWhere).toHaveBeenCalledWith("dueDate", ">", expect.any(Date));
    });

    it("handles query error gracefully", async () => {
      const queryError = new Error("Query failed");
      mockGetDocs.mockRejectedValue(queryError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const overdueTasks = await FirebaseScheduledTaskService.getOverdueTasksForPlant(mockPlantId);

      expect(overdueTasks).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Failed to get overdue tasks for plant:", queryError);

      consoleSpy.mockRestore();
    });
  });

  describe("updateTaskStatus", () => {
    it("successfully updates task status", async () => {
      const mockTaskDoc = {};
      mockDoc.mockReturnValue(mockTaskDoc as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      await FirebaseScheduledTaskService.updateTaskStatus("task-123", "completed");

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), "task-123");
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockTaskDoc, {
        status: "completed",
        updatedAt: expect.anything(),
      });
      expect(mockTimestamp.now).toHaveBeenCalled();
    });

    it("handles different status values", async () => {
      const mockTaskDoc = {};
      mockDoc.mockReturnValue(mockTaskDoc as any);
      mockUpdateDoc.mockResolvedValue(undefined);

      const statusValues: Array<"completed" | "pending" | "skipped"> = ["completed", "pending", "skipped"];

      for (const status of statusValues) {
        jest.clearAllMocks();
        mockDoc.mockReturnValue(mockTaskDoc as any);

        await FirebaseScheduledTaskService.updateTaskStatus("task-123", status);

        expect(mockUpdateDoc).toHaveBeenCalledWith(mockTaskDoc, {
          status,
          updatedAt: expect.anything(),
        });
      }
    });

    it("throws error when update fails", async () => {
      const updateError = new Error("Update failed");
      const mockTaskDoc = {};
      mockDoc.mockReturnValue(mockTaskDoc as any);
      mockUpdateDoc.mockRejectedValue(updateError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        FirebaseScheduledTaskService.updateTaskStatus("task-123", "completed")
      ).rejects.toThrow("Update failed");

      expect(consoleSpy).toHaveBeenCalledWith("Failed to update task status:", updateError);

      consoleSpy.mockRestore();
    });
  });

  describe("data transformation", () => {
    it("correctly transforms ScheduledTask to FirebaseScheduledTask", async () => {
      const mockDocRef = { id: "new-task-id" };
      mockAddDoc.mockResolvedValue(mockDocRef as any);

      const task: ScheduledTask = {
        id: "task-id",
        plantId: "plant-123",
        taskName: "Test Task",
        taskType: "fertilize",
        details: {
          type: "fertilize",
          product: "Test Product",
          dilution: "1:5",
          amount: "2 cups",
          method: "foliar-spray",
        },
        dueDate: new Date("2024-03-01"),
        status: "pending",
        sourceProtocol: {
          stage: "flowering",
          originalStartDays: 7,
          isDynamic: false,
        },
        priority: "high",
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      };

      await FirebaseScheduledTaskService.createTask(task, "user-456");

      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(), // Don't check collection ref since it's static
        expect.objectContaining({
          userId: "user-456",
          plantId: "plant-123",
          taskName: "Test Task",
          taskType: "fertilize",
          details: {
            type: "fertilize",
            product: "Test Product",
            dilution: "1:5",
            amount: "2 cups",
            method: "foliar-spray",
          },
          status: "pending",
          sourceProtocol: {
            stage: "flowering",
            originalStartDays: 7,
            isDynamic: false,
          },
        })
      );
    });

    it("correctly transforms FirebaseScheduledTask to ScheduledTask", async () => {
      const mockQuerySnapshot = {
        forEach: jest.fn((callback: (doc: any) => void) => {
          const mockDoc = {
            id: "firebase-task-1",
            data: () => ({
              userId: "user-123",
              plantId: "plant-456",
              taskName: "Firebase Task",
              taskType: "fertilize",
              details: {
                type: "fertilize",
                product: "Firebase Product",
                dilution: "1:8",
                amount: "3 cups",
                method: "soil-drench",
              },
              dueDate: { toDate: () => new Date("2024-04-01") },
              status: "pending",
              sourceProtocol: {
                stage: "vegetative",
                originalStartDays: 10,
                isDynamic: true,
              },
              createdAt: { toDate: () => new Date("2024-03-01") },
              updatedAt: { toDate: () => new Date("2024-03-01") },
            }),
          };
          callback(mockDoc);
        }),
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);

      const tasks = await FirebaseScheduledTaskService.getTasksForPlant("plant-456");

      expect(tasks[0]).toEqual({
        id: "firebase-task-1",
        plantId: "plant-456",
        taskName: "Firebase Task",
        taskType: "fertilize",
        details: {
          type: "fertilize",
          product: "Firebase Product",
          dilution: "1:8",
          amount: "3 cups",
          method: "soil-drench",
        },
        dueDate: new Date("2024-04-01"),
        status: "pending",
        sourceProtocol: {
          stage: "vegetative",
          originalStartDays: 10,
          isDynamic: true,
        },
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
      });
    });
  });
});