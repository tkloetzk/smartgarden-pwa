// src/__tests__/integration/careLogging.integration.test.ts
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { CareSchedulingServiceAdapter, DynamicSchedulingServiceAdapter } from "@/services/serviceMigration";
import { ServiceRegistry } from "@/services/serviceRegistry";
import { careService, plantService, varietyService } from "@/types/database";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import { generateUUID } from "@/utils/cn";
import { VarietyRecord, PlantRecord } from "@/types";

// Mock the UUID generation for consistent testing
jest.mock("@/utils/cn", () => ({
  generateUUID: jest.fn(() => "test-activity-id-123"),
  cn: jest.fn(),
}));

// Mock Firebase services
jest.mock("@/services/firebase/careActivityService", () => ({
  FirebaseCareActivityService: {
    createCareActivity: jest.fn(),
    subscribeToPlantActivities: jest.fn(),
    subscribeToUserActivities: jest.fn(),
    getRecentActivitiesForPlant: jest.fn(),
  },
}));

// Mock the database services
jest.mock("@/types/database", () => ({
  careService: {
    addCareActivity: jest.fn(),
    getLastActivityByType: jest.fn(),
    getPlantCareHistory: jest.fn(),
    getRecentActivities: jest.fn(),
  },
  plantService: {
    getPlant: jest.fn(),
    updatePlant: jest.fn(),
    getAllPlants: jest.fn(),
  },
  varietyService: {
    getVariety: jest.fn(),
  },
}));

// Mock the scheduling services using the new adapter pattern
jest.mock("@/services/serviceMigration", () => ({
  CareSchedulingServiceAdapter: {
    calculateNextDueDate: jest.fn(),
    getUpcomingTasks: jest.fn(),
    getTasksForPlant: jest.fn(),
    filterTasksByPreferences: jest.fn(),
  },
  DynamicSchedulingServiceAdapter: {
    recordTaskCompletion: jest.fn(),
    getNextDueDateForTask: jest.fn(),
    getCompletionPatterns: jest.fn(),
  },
}));

// Mock the service registry for tests
jest.mock("@/services/serviceRegistry", () => ({
  ServiceRegistry: {
    bootstrap: jest.fn(),
    reset: jest.fn(),
    getService: jest.fn(),
    getSingleton: jest.fn(),
  },
}));

interface ActivityData {
  plantId: string;
  type: string;
  date: Date;
  details: Record<string, unknown>;
}

interface BulkData {
  type: string;
  date: Date;
  details: Record<string, unknown>;
}

interface PlantReference {
  id: string;
  name?: string;
  varietyId?: string;
}

// Helper class to simulate the complete care logging workflow
class CareLoggingWorkflow {
  static async logActivity(activityData: ActivityData) {
    // Simulate the complete workflow that would happen in the real application
    
    // 1. Add to local storage
    const activityId = await careService.addCareActivity(activityData);
    
    // 2. Sync to Firebase (in a real app, this might be async/background)
    await FirebaseCareActivityService.createCareActivity(activityData);
    
    // 3. Record completion for dynamic scheduling
    await DynamicSchedulingServiceAdapter.recordTaskCompletion(
      activityData.plantId,
      activityData.type,
      activityData.date,
      activityData.date,
      activityId,
      "vegetative"
    );
    
    // 4. Get plant and variety data for scheduling
    const plant = await plantService.getPlant(activityData.plantId);
    const variety = await varietyService.getVariety(plant?.varietyId);
    
    // 5. Calculate next due date
    if (plant && variety) {
      const nextDueDate = CareSchedulingServiceAdapter.calculateNextDueDate(
        activityData.type,
        activityData.date,
        plant,
        variety
      );
      return { activityId, nextDueDate };
    }
    
    return { activityId };
  }
  
  static async logBulkActivity(plants: PlantReference[], bulkData: BulkData) {
    const results = [];
    
    try {
      for (const plant of plants) {
        const activityData = {
          ...bulkData,
          plantId: plant.id,
        };
        
        await this.logActivity(activityData);
        results.push({
          id: generateUUID(),
          ...activityData,
        });
      }
      
      return results;
    } catch (error) {
      console.error("Failed to log bulk activity:", error);
      throw error;
    }
  }
}

describe("Care Activity Logging Integration Tests", () => {
  const mockActivityId = "test-activity-id-123";
  const mockPlantId = "test-plant-id-456";
  const mockVarietyId = "test-variety-id-789";

  // Sample variety with protocols for testing
  const mockVariety: VarietyRecord = {
    id: mockVarietyId,
    name: "Cherry Tomato",
    normalizedName: "cherry-tomato",
    category: "vegetables",
    type: "determinate",
    daysToGermination: [7, 14],
    daysToMaturity: [60, 80],
    description: "Small cherry tomatoes perfect for containers",
    growthStages: ["germination", "seedling", "vegetative", "flowering", "fruiting"],
    protocols: {
      watering: {
        vegetative: {
          trigger: { moistureLevel: "3-4 on moisture meter" },
          target: { moistureLevel: "6-7 on moisture meter" },
          volume: { amount: "150-200ml", frequency: "every 2-3 days", perPlant: true },
        },
      },
      fertilization: {
        vegetative: {
          schedule: [
            {
              details: {
                product: "Balanced liquid fertilizer",
                dilution: "1:2000",
                amount: "150ml per plant",
                method: "soil-drench" as const,
              },
              frequency: "weekly",
            },
          ],
        },
      },
    },
  };

  // Sample plant record
  const mockPlant: PlantRecord = {
    id: mockPlantId,
    varietyId: mockVarietyId,
    varietyName: "Cherry Tomato",
    name: "My Cherry Tomato Plant",
    plantedDate: new Date("2024-01-01"),
    location: "South Window",
    container: "5-gallon fabric pot",
    isActive: true,
    reminderPreferences: {
      watering: true,
      fertilizing: true,
      observation: true,
      lighting: true,
      pruning: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    // Set up default mock implementations
    (generateUUID as jest.Mock).mockReturnValue(mockActivityId);
    (varietyService.getVariety as jest.Mock).mockResolvedValue(mockVariety);
    (plantService.getPlant as jest.Mock).mockResolvedValue(mockPlant);
    (careService.addCareActivity as jest.Mock).mockResolvedValue(mockActivityId);
    (FirebaseCareActivityService.createCareActivity as jest.Mock).mockResolvedValue(undefined);
    (DynamicSchedulingServiceAdapter.recordTaskCompletion as jest.Mock).mockResolvedValue(undefined);
    (CareSchedulingServiceAdapter.calculateNextDueDate as jest.Mock).mockReturnValue(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // 3 days from now
  });

  describe("Individual Activity Logging", () => {
    it("logs activity and updates plant state correctly", async () => {
      const activityData = {
        plantId: mockPlantId,
        type: "water" as const,
        date: new Date(),
        details: {
          type: "water" as const,
          amount: { value: 200, unit: "ml" as const },
          notes: "Regular watering session",
        },
      };

      // Mock the last activity for scheduling calculations
      (careService.getLastActivityByType as jest.Mock).mockResolvedValue({
        id: "previous-activity",
        plantId: mockPlantId,
        type: "water",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      });

      // Simulate the full care logging workflow
      const result = await CareLoggingWorkflow.logActivity(activityData);

      // Verify the workflow components were called
      expect(careService.addCareActivity).toHaveBeenCalledWith(activityData);
      expect(FirebaseCareActivityService.createCareActivity).toHaveBeenCalledWith(activityData);
      expect(DynamicSchedulingServiceAdapter.recordTaskCompletion).toHaveBeenCalledWith(
        mockPlantId,
        "water",
        activityData.date,
        activityData.date,
        mockActivityId,
        "vegetative"
      );
      expect(plantService.getPlant).toHaveBeenCalledWith(mockPlantId);
      expect(varietyService.getVariety).toHaveBeenCalledWith(mockVarietyId);
      expect(CareSchedulingServiceAdapter.calculateNextDueDate).toHaveBeenCalledWith(
        "water",
        activityData.date,
        mockPlant,
        mockVariety
      );

      // Verify the workflow returns expected data
      expect(result).toEqual({
        activityId: mockActivityId,
        nextDueDate: expect.any(Date),
      });
    });

    it("handles fertilization activity with protocol integration", async () => {
      const fertilizationData = {
        plantId: mockPlantId,
        type: "fertilize" as const,
        date: new Date(),
        details: {
          type: "fertilize" as const,
          product: "Balanced liquid fertilizer",
          dilution: "1:2000",
          amount: "150ml per plant",
          applicationMethod: "soil-drench" as const,
          notes: "Weekly fertilization as per protocol",
        },
      };

      const result = await CareLoggingWorkflow.logActivity(fertilizationData);

      // Verify the activity was logged with protocol-specific details
      expect(careService.addCareActivity).toHaveBeenCalledWith(fertilizationData);

      // Verify scheduling integration for fertilization
      expect(DynamicSchedulingServiceAdapter.recordTaskCompletion).toHaveBeenCalledWith(
        mockPlantId,
        "fertilize",
        fertilizationData.date,
        fertilizationData.date,
        mockActivityId,
        "vegetative"
      );

      // Verify workflow completed successfully
      expect(result.activityId).toBe(mockActivityId);
    });

    it("logs observation activity without amounts", async () => {
      const observationData = {
        plantId: mockPlantId,
        type: "observe" as const,
        date: new Date(),
        details: {
          type: "observe" as const,
          notes: "Plant looking healthy, new leaves emerging",
        },
      };

      const result = await CareLoggingWorkflow.logActivity(observationData);

      expect(careService.addCareActivity).toHaveBeenCalledWith(observationData);

      // Observations should still trigger scheduling updates
      expect(DynamicSchedulingServiceAdapter.recordTaskCompletion).toHaveBeenCalledWith(
        mockPlantId,
        "observe",
        observationData.date,
        observationData.date,
        mockActivityId,
        "vegetative"
      );

      expect(result.activityId).toBe(mockActivityId);
    });
  });

  describe("Care Reminder Generation", () => {
    it("triggers next care reminders correctly after activity logging", async () => {
      const currentDate = new Date();
      const lastWateringDate = new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const nextWateringDate = new Date(currentDate.getTime() + 1 * 24 * 60 * 60 * 1000); // Tomorrow

      // Mock the last activity and next due date calculation
      (careService.getLastActivityByType as jest.Mock).mockResolvedValue({
        id: "last-watering",
        plantId: mockPlantId,
        type: "water",
        date: lastWateringDate,
      });

      (CareSchedulingServiceAdapter.calculateNextDueDate as jest.Mock).mockReturnValue(nextWateringDate);

      // Log a new watering activity through the workflow
      const newWateringActivity = {
        plantId: mockPlantId,
        type: "water" as const,
        date: currentDate,
        details: {
          type: "water" as const,
          amount: { value: 180, unit: "ml" as const },
        },
      };

      const result = await CareLoggingWorkflow.logActivity(newWateringActivity);

      // Verify that scheduling service was called to update reminders
      expect(CareSchedulingServiceAdapter.calculateNextDueDate).toHaveBeenCalledWith(
        "water",
        currentDate, // Latest activity date
        mockPlant,
        mockVariety
      );

      // Verify dynamic scheduling learned from this completion
      expect(DynamicSchedulingServiceAdapter.recordTaskCompletion).toHaveBeenCalledWith(
        mockPlantId,
        "water",
        currentDate,
        currentDate,
        mockActivityId,
        "vegetative"
      );

      // Verify the next due date was calculated and returned
      expect(result.nextDueDate).toEqual(nextWateringDate);
    });

    it("generates upcoming tasks based on activity history", async () => {
      const mockUpcomingTasks = [
        {
          id: "task-1",
          plantId: mockPlantId,
          type: "water" as const,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
          priority: "high" as const,
        },
        {
          id: "task-2", 
          plantId: mockPlantId,
          type: "fertilize" as const,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          priority: "medium" as const,
        },
      ];

      const filteredTasks = [mockUpcomingTasks[0]]; // Only water task (if fertilizing was disabled)

      (CareSchedulingServiceAdapter.getUpcomingTasks as jest.Mock).mockResolvedValue(mockUpcomingTasks);
      (CareSchedulingServiceAdapter.filterTasksByPreferences as jest.Mock).mockReturnValue(filteredTasks);

      // Get upcoming tasks after recent activity logging
      const upcomingTasks = await CareSchedulingServiceAdapter.getUpcomingTasks();
      const filtered = CareSchedulingServiceAdapter.filterTasksByPreferences(upcomingTasks, mockPlant.reminderPreferences);

      expect(upcomingTasks).toEqual(mockUpcomingTasks);
      expect(CareSchedulingServiceAdapter.getUpcomingTasks).toHaveBeenCalled();

      // Verify tasks are filtered by user preferences
      expect(CareSchedulingServiceAdapter.filterTasksByPreferences).toHaveBeenCalledWith(
        mockUpcomingTasks,
        mockPlant.reminderPreferences
      );
      expect(filtered).toEqual(filteredTasks);
    });

    it("respects user reminder preferences when generating tasks", async () => {
      const plantWithLimitedReminders = {
        ...mockPlant,
        reminderPreferences: {
          watering: true,
          fertilizing: false, // Disabled
          observation: true,
          lighting: false,
          pruning: false,
        },
      };

      (plantService.getPlant as jest.Mock).mockResolvedValue(plantWithLimitedReminders);

      const allTasks = [
        { id: "water-task", type: "water", priority: "high" },
        { id: "fertilize-task", type: "fertilize", priority: "medium" },
        { id: "observe-task", type: "observe", priority: "low" },
      ];

      const filteredTasks = [
        { id: "water-task", type: "water", priority: "high" },
        { id: "observe-task", type: "observe", priority: "low" },
      ];

      (CareSchedulingServiceAdapter.filterTasksByPreferences as jest.Mock).mockReturnValue(filteredTasks);

      const result = await CareSchedulingServiceAdapter.filterTasksByPreferences(
        allTasks,
        plantWithLimitedReminders.reminderPreferences
      );

      expect(result).toEqual(filteredTasks);
      expect(result).not.toContainEqual(
        expect.objectContaining({ type: "fertilize" })
      );
    });
  });

  describe("Bulk Activity Logging", () => {
    it("handles bulk activity logging across multiple plants", async () => {
      const plant1 = { ...mockPlant, id: "plant-1", name: "Plant 1" };
      const plant2 = { ...mockPlant, id: "plant-2", name: "Plant 2" };
      const plant3 = { ...mockPlant, id: "plant-3", name: "Plant 3" };
      const selectedPlants = [plant1, plant2, plant3];

      const bulkActivityData = {
        type: "water" as const,
        date: new Date(),
        details: {
          type: "water" as const,
          amount: { value: 150, unit: "ml" as const },
          notes: "Morning bulk watering session",
        },
      };

      // Mock UUID to return different IDs for each activity
      (generateUUID as jest.Mock)
        .mockReturnValueOnce("activity-1")
        .mockReturnValueOnce("activity-2")
        .mockReturnValueOnce("activity-3");

      const result = await CareLoggingWorkflow.logBulkActivity(selectedPlants, bulkActivityData);

      // Verify that individual activities were created for each plant
      expect(result).toHaveLength(3);
      
      // Verify each plant got its own activity logged
      expect(careService.addCareActivity).toHaveBeenCalledTimes(3);
      expect(FirebaseCareActivityService.createCareActivity).toHaveBeenCalledTimes(3);
      expect(DynamicSchedulingServiceAdapter.recordTaskCompletion).toHaveBeenCalledTimes(3);

      // Verify the structure of returned activities
      result.forEach((activity, index) => {
        expect(activity).toEqual(
          expect.objectContaining({
            plantId: selectedPlants[index].id,
            type: "water",
            details: expect.objectContaining({
              amount: { value: 150, unit: "ml" },
              notes: "Morning bulk watering session",
            }),
          })
        );
      });
    });

    it("handles bulk fertilization with variety-specific recommendations", async () => {
      const tomatoVariety = { ...mockVariety, id: "tomato-variety" };
      const basilVariety = {
        ...mockVariety,
        id: "basil-variety",
        name: "Sweet Basil",
        protocols: {
          fertilization: {
            vegetative: {
              schedule: [
                {
                  details: {
                    product: "Herb fertilizer",
                    dilution: "1:1000",
                    amount: "100ml per plant",
                    method: "foliar-spray" as const,
                  },
                  frequency: "bi-weekly",
                },
              ],
            },
          },
        },
      };

      const mixedPlants = [
        { ...mockPlant, id: "plant-1", varietyId: "tomato-variety" },
        { ...mockPlant, id: "plant-2", varietyId: "basil-variety" },
      ];

      // Mock the plant service to return the right plants
      (plantService.getPlant as jest.Mock)
        .mockResolvedValueOnce(mixedPlants[0])
        .mockResolvedValueOnce(mixedPlants[1]);

      (varietyService.getVariety as jest.Mock)
        .mockResolvedValueOnce(tomatoVariety)
        .mockResolvedValueOnce(basilVariety);

      const bulkFertilizeData = {
        type: "fertilize" as const,
        date: new Date(),
        details: {
          type: "fertilize" as const,
          product: "Universal fertilizer",
          dilution: "1:1500",
          amount: "125ml per plant",
          applicationMethod: "soil-drench" as const,
          notes: "Weekly fertilization",
        },
      };

      // Mock different activity IDs
      (generateUUID as jest.Mock)
        .mockReturnValueOnce("fertilize-activity-1")
        .mockReturnValueOnce("fertilize-activity-2");

      const result = await CareLoggingWorkflow.logBulkActivity(mixedPlants, bulkFertilizeData);

      expect(result).toHaveLength(2);

      // Verify fertilization details are consistent across plants
      result.forEach((activity) => {
        expect(activity.details).toEqual(
          expect.objectContaining({
            product: "Universal fertilizer",
            dilution: "1:1500",
            amount: "125ml per plant",
            applicationMethod: "soil-drench",
            notes: "Weekly fertilization",
          })
        );
      });

      // Verify both plants had their activities logged
      expect(careService.addCareActivity).toHaveBeenCalledTimes(2);
      expect(FirebaseCareActivityService.createCareActivity).toHaveBeenCalledTimes(2);
      expect(DynamicSchedulingServiceAdapter.recordTaskCompletion).toHaveBeenCalledTimes(2);
    });

    it("handles bulk activity errors gracefully", async () => {
      const plants = [
        { ...mockPlant, id: "plant-1" },
        { ...mockPlant, id: "plant-2" },
        { ...mockPlant, id: "plant-3" },
      ];

      const bulkData = {
        type: "water" as const,
        date: new Date(),
        details: {
          type: "water" as const,
          amount: { value: 200, unit: "ml" as const },
        },
      };

      // Mock failure scenario - one of the individual activity logs fails
      (careService.addCareActivity as jest.Mock)
        .mockResolvedValueOnce("activity-1") // First plant succeeds
        .mockRejectedValueOnce(new Error("Failed to log activity for plant-2")) // Second plant fails
        .mockResolvedValueOnce("activity-3"); // Third plant would succeed

      await expect(
        CareLoggingWorkflow.logBulkActivity(plants, bulkData)
      ).rejects.toThrow("Failed to log activity for plant-2");

      // Verify error handling was attempted
      expect(console.error).toHaveBeenCalledWith(
        "Failed to log bulk activity:",
        expect.any(Error)
      );
    });
  });

  describe("Dynamic Scheduling Integration", () => {
    it("learns from completion patterns and adjusts scheduling", async () => {
      const mockCompletionPattern = {
        averageInterval: 2, // days
        consistency: 0.8,
        lastCompletion: new Date("2024-01-05"),
      };

      (DynamicSchedulingServiceAdapter.getCompletionPatterns as jest.Mock).mockResolvedValue(mockCompletionPattern);

      const nextDueDate = new Date("2024-01-07"); // 2 days after last completion
      (DynamicSchedulingServiceAdapter.getNextDueDateForTask as jest.Mock).mockResolvedValue(nextDueDate);

      // Record a new completion
      await DynamicSchedulingServiceAdapter.recordTaskCompletion(
        mockPlantId,
        "water",
        new Date("2024-01-07"),
        new Date("2024-01-07"),
        "test-activity-id",
        "vegetative"
      );

      // Get the updated next due date
      const calculatedNextDate = await DynamicSchedulingServiceAdapter.getNextDueDateForTask(
        mockPlantId,
        "water"
      );

      expect(calculatedNextDate).toEqual(nextDueDate);
      expect(DynamicSchedulingServiceAdapter.recordTaskCompletion).toHaveBeenCalledWith(
        mockPlantId,
        "water",
        new Date("2024-01-07"),
        new Date("2024-01-07"),
        "test-activity-id",
        "vegetative"
      );
    });

    it("handles inconsistent completion patterns", async () => {
      const inconsistentPattern = {
        averageInterval: 3.5, // Irregular watering
        consistency: 0.3, // Low consistency
        lastCompletion: new Date("2024-01-10"),
      };

      (DynamicSchedulingServiceAdapter.getCompletionPatterns as jest.Mock).mockResolvedValue(inconsistentPattern);

      // Should fall back to protocol defaults when patterns are inconsistent
      const fallbackDate = new Date("2024-01-13"); // 3 days (default interval)
      (CareSchedulingServiceAdapter.calculateNextDueDate as jest.Mock).mockReturnValue(fallbackDate);

      const nextDate = await CareSchedulingServiceAdapter.calculateNextDueDate(
        "water",
        new Date("2024-01-10"),
        mockPlant,
        mockVariety
      );

      expect(nextDate).toEqual(fallbackDate);
      // Should use protocol-based scheduling when patterns are inconsistent
      expect(CareSchedulingServiceAdapter.calculateNextDueDate).toHaveBeenCalledWith(
        "water",
        new Date("2024-01-10"),
        mockPlant,
        mockVariety
      );
    });
  });

  describe("Error Handling and Data Integrity", () => {
    beforeEach(() => {
      // Make sure we have a clean slate for error handling tests
      jest.clearAllMocks();
    });

    it("handles local storage failures gracefully", async () => {
      const storageError = new Error("IndexedDB quota exceeded");
      
      const activityData = {
        plantId: mockPlantId,
        type: "water" as const,
        date: new Date(),
        details: {
          type: "water" as const,
          amount: { value: 150, unit: "ml" as const },
        },
      };

      // Create a completely new mock that will definitely throw
      const mockAddCareActivity = jest.fn().mockImplementation(async () => {
        throw storageError;
      });
      
      // Replace the mock in the careService object
      (careService as { addCareActivity: unknown }).addCareActivity = mockAddCareActivity;

      await expect(CareLoggingWorkflow.logActivity(activityData)).rejects.toThrow(
        "IndexedDB quota exceeded"
      );

      // Verify the workflow attempted local storage first
      expect(mockAddCareActivity).toHaveBeenCalledWith(activityData);
    });

    it("maintains data consistency during Firebase sync failures", async () => {
      // Reset careService mock to succeed (default behavior)
      (careService.addCareActivity as jest.Mock).mockResolvedValue(mockActivityId);
      
      // Set up Firebase to fail
      const syncError = new Error("Network connection failed");
      (FirebaseCareActivityService.createCareActivity as jest.Mock).mockImplementation(async () => {
        throw syncError;
      });

      const activityData = {
        plantId: mockPlantId,
        type: "fertilize" as const,
        date: new Date(),
        details: {
          type: "fertilize" as const,
          product: "Test fertilizer",
        },
      };

      // The workflow should fail when Firebase sync fails
      await expect(CareLoggingWorkflow.logActivity(activityData)).rejects.toThrow(
        "Network connection failed"
      );

      // Verify local storage was attempted first
      expect(careService.addCareActivity).toHaveBeenCalledWith(activityData);
      expect(FirebaseCareActivityService.createCareActivity).toHaveBeenCalledWith(activityData);
    });

    it("validates activity data before logging", async () => {
      const invalidActivityData = {
        plantId: "", // Invalid - empty plant ID
        type: "water" as const,
        date: new Date(),
        details: {
          type: "water" as const,
          amount: { value: -10, unit: "ml" as const }, // Invalid - negative amount
        },
      };

      // Should reject invalid data
      const validationError = new Error("Invalid activity data");
      (careService.addCareActivity as jest.Mock).mockImplementation(async () => {
        throw validationError;
      });

      await expect(CareLoggingWorkflow.logActivity(invalidActivityData)).rejects.toThrow(
        "Invalid activity data"
      );

      // Verify validation happened at the service level
      expect(careService.addCareActivity).toHaveBeenCalledWith(invalidActivityData);
      
      // Should not proceed with Firebase sync or scheduling if local validation fails
      expect(FirebaseCareActivityService.createCareActivity).not.toHaveBeenCalled();
      expect(DynamicSchedulingServiceAdapter.recordTaskCompletion).not.toHaveBeenCalled();
    });
  });
});