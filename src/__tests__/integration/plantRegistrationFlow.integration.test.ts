import { PlantRegistrationService } from "@/services/PlantRegistrationService";
import { ProtocolTranspilerService } from "@/services/ProtocolTranspilerService";
import { plantService, varietyService } from "@/types/database";
import { VarietyRecord } from "@/types";
import { generateUUID } from "@/utils/cn";

// Mock UUID generation for consistent testing
jest.mock("@/utils/cn", () => ({
  generateUUID: jest.fn(() => "test-plant-id-123"),
  cn: jest.fn(),
}));

// Mock the services to control their behavior in tests
jest.mock("@/types/database", () => ({
  plantService: {
    addPlant: jest.fn(),
    getPlant: jest.fn(),
    deletePlant: jest.fn(),
    updatePlant: jest.fn(),
  },
  varietyService: {
    getVariety: jest.fn(),
    getAllVarieties: jest.fn(),
    addVariety: jest.fn(),
    getVarietyByName: jest.fn(),
  },
}));

jest.mock("@/services/ProtocolTranspilerService", () => ({
  ProtocolTranspilerService: {
    transpilePlantProtocol: jest.fn(),
  },
}));

describe("Plant Registration Flow Integration Tests", () => {
  const mockPlantId = "test-plant-id-123";

  // Mock variety with fertilization protocol
  const mockVarietyWithProtocol: VarietyRecord = {
    id: "tomato-variety-1",
    name: "Cherry Tomato",
    normalizedName: "cherry-tomato",
    category: "fruiting-plants",
    createdAt: new Date(),
    updatedAt: new Date(),
    description: "Small cherry tomatoes perfect for containers",
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 30,
      maturation: 60
    },
    protocols: {
      fertilization: {
        germination: {
          schedule: [{
            taskName: "Weekly Starter Feed",
            startDays: 0,
            frequencyDays: 7,
            repeatCount: 2,
            details: {
              product: "Starter fertilizer",
              dilution: "1:2000",
              amount: "100ml",
              method: "soil-drench"
            }
          }]
        },
        seedling: {
          schedule: []
        },
        vegetative: {
          schedule: [{
            taskName: "Weekly Growth Feed",
            startDays: 0,
            frequencyDays: 7,
            repeatCount: 3,
            details: {
              product: "Growth fertilizer",
              dilution: "1:1000",
              amount: "200ml",
              method: "soil-drench"
            }
          }]
        },
        maturation: {
          schedule: []
        }
      },
    } as any,
  };

  // Mock variety without protocol
  const mockVarietyWithoutProtocol: VarietyRecord = {
    id: "basil-variety-1",
    name: "Sweet Basil",
    normalizedName: "sweet-basil",
    category: "herbs",
    createdAt: new Date(),
    updatedAt: new Date(),
    description: "Classic culinary basil",
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      maturation: 30
    },
    protocols: {},
  };

  // Sample scheduled tasks that would be created
  const mockScheduledTasks = [
    {
      id: "task-1",
      plantId: mockPlantId,
      taskType: "fertilize" as const,
      scheduledDate: new Date("2024-01-15"),
      status: "pending" as const,
      details: {
        product: "Starter fertilizer",
        dilution: "1:2000",
        amount: "100ml",
      },
    },
    {
      id: "task-2", 
      plantId: mockPlantId,
      taskType: "fertilize" as const,
      scheduledDate: new Date("2024-01-22"),
      status: "pending" as const,
      details: {
        product: "Starter fertilizer",
        dilution: "1:2000", 
        amount: "100ml",
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    // Set up default successful mock responses
    (generateUUID as jest.Mock).mockReturnValue(mockPlantId);
    (plantService.addPlant as jest.Mock).mockResolvedValue(mockPlantId);
    (plantService.getPlant as jest.Mock).mockResolvedValue(null);
    (plantService.deletePlant as jest.Mock).mockResolvedValue(undefined);
    // Don't set default for varietyService.getVariety - let individual tests control this
    (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockResolvedValue(mockScheduledTasks);
  });

  describe("Complete Plant Registration with All Optional Fields", () => {
    it("registers plant with all optional fields successfully", async () => {
      (varietyService.getVariety as jest.Mock).mockResolvedValue(mockVarietyWithProtocol);
      const completeFormData = {
        varietyId: "tomato-variety-1",
        name: "My Cherry Tomato Plant",
        plantedDate: new Date("2024-01-01"),
        location: "South Window",
        container: "5-gallon fabric pot",
        soilMix: "Premium potting mix with perlite and compost",
        notes: ["Started from seed", "Using grow light supplement", "Expecting high yield"],
        quantity: 3,
        reminderPreferences: {
          watering: true,
          fertilizing: true,
          observation: true,
          lighting: false,
          pruning: true,
        },
      };

      const result = await PlantRegistrationService.createPlantFromForm(completeFormData);

      // Verify plant data structure
      expect(result).toEqual({
        id: mockPlantId,
        varietyId: "tomato-variety-1",
        varietyName: "Cherry Tomato",
        name: "My Cherry Tomato Plant",
        plantedDate: new Date("2024-01-01"),
        location: "South Window",
        container: "5-gallon fabric pot",
        soilMix: "Premium potting mix with perlite and compost",
        isActive: true,
        notes: ["Started from seed", "Using grow light supplement", "Expecting high yield"],
        quantity: 3,
        reminderPreferences: {
          watering: true,
          fertilizing: true,
          observation: true,
          lighting: false,
          pruning: true,
        },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify service interactions
      expect(varietyService.getVariety).toHaveBeenCalledWith("tomato-variety-1");
      expect(plantService.addPlant).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockPlantId,
          varietyId: "tomato-variety-1",
          varietyName: "Cherry Tomato",
          name: "My Cherry Tomato Plant",
          quantity: 3,
          soilMix: "Premium potting mix with perlite and compost",
          notes: ["Started from seed", "Using grow light supplement", "Expecting high yield"],
        })
      );
      expect(ProtocolTranspilerService.transpilePlantProtocol).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockPlantId }),
        mockVarietyWithProtocol
      );
    });

    it("applies default values for optional fields when not provided", async () => {
      (varietyService.getVariety as jest.Mock).mockResolvedValue(mockVarietyWithProtocol);
      const minimalFormData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Small pot",
      };

      const result = await PlantRegistrationService.createPlantFromForm(minimalFormData);

      expect(result).toEqual(
        expect.objectContaining({
          name: undefined, // Should remain undefined when not provided
          soilMix: undefined,
          notes: undefined,
          quantity: 1, // Default value
          reminderPreferences: { // Default values
            watering: true,
            fertilizing: true,
            observation: true,
            lighting: true,
            pruning: true,
          },
        })
      );
    });
  });

  describe("Variety Validation and Handling", () => {
    it("handles variety creation during registration", async () => {
      // First call fails (variety doesn't exist), second call succeeds (after creation)
      (varietyService.getVariety as jest.Mock)
        .mockResolvedValueOnce(null); // First attempt - variety not found

      // Mock variety creation process
      (varietyService.getVarietyByName as jest.Mock).mockResolvedValue(null);
      (varietyService.addVariety as jest.Mock).mockResolvedValue("new-variety-id");

      const formDataWithNewVariety = {
        varietyId: "new-variety-id",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Small pot",
      };

      // This would typically be handled by a higher-level service or UI component
      // but we can test the error handling here
      await expect(
        PlantRegistrationService.createPlantFromForm(formDataWithNewVariety)
      ).rejects.toThrow("Variety not found: new-variety-id");

      expect(varietyService.getVariety).toHaveBeenCalledWith("new-variety-id");
    });

    it("validates variety exists before proceeding with registration", async () => {
      // Reset mocks for this specific test to ensure clean state
      (plantService.addPlant as jest.Mock).mockClear();
      (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockClear();
      (varietyService.getVariety as jest.Mock).mockResolvedValueOnce(null);

      const formData = {
        varietyId: "non-existent-variety",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor", 
        container: "Small pot",
      };

      await expect(
        PlantRegistrationService.createPlantFromForm(formData)
      ).rejects.toThrow("Variety not found: non-existent-variety");

      // Should not attempt to create plant if variety doesn't exist
      expect(plantService.addPlant).not.toHaveBeenCalled();
      expect(ProtocolTranspilerService.transpilePlantProtocol).not.toHaveBeenCalled();
    });

    it("retrieves variety name and applies it to plant record", async () => {
      const varietyWithLongName: VarietyRecord = {
        ...mockVarietyWithProtocol,
        id: "specialty-variety",
        name: "Heirloom Cherokee Purple Tomato",
        normalizedName: "heirloom-cherokee-purple-tomato",
      };

      (varietyService.getVariety as jest.Mock).mockResolvedValue(varietyWithLongName);

      const formData = {
        varietyId: "specialty-variety",
        plantedDate: new Date("2024-01-01"),
        location: "Garden bed",
        container: "In-ground",
      };

      const result = await PlantRegistrationService.createPlantFromForm(formData);

      expect(result.varietyName).toBe("Heirloom Cherokee Purple Tomato");
      expect(plantService.addPlant).toHaveBeenCalledWith(
        expect.objectContaining({
          varietyId: "specialty-variety",
          varietyName: "Heirloom Cherokee Purple Tomato",
        })
      );
    });
  });

  describe("Initial Care Schedule Setup", () => {
    it("sets up initial care schedule correctly for varieties with protocols", async () => {
      // Clear mocks and get baseline count
      jest.clearAllMocks();
      (varietyService.getVariety as jest.Mock).mockResolvedValue(mockVarietyWithProtocol);
      (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockResolvedValue(mockScheduledTasks);

      const beforeTaskCount = PlantRegistrationService.getScheduledTasksForPlant(mockPlantId).length;

      const formData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      await PlantRegistrationService.createPlantFromForm(formData);

      // Verify protocol transpilation was called
      expect(ProtocolTranspilerService.transpilePlantProtocol).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockPlantId,
          varietyId: "tomato-variety-1",
          plantedDate: new Date("2024-01-01"),
        }),
        mockVarietyWithProtocol
      );

      // Verify scheduled tasks were added (should be 2 more than before)
      const afterTaskCount = PlantRegistrationService.getScheduledTasksForPlant(mockPlantId).length;
      expect(afterTaskCount).toBe(beforeTaskCount + 2);

      // Verify the structure of the newly added tasks
      const allTasks = PlantRegistrationService.getScheduledTasksForPlant(mockPlantId);
      const newTasks = allTasks.slice(-2); // Get the last 2 tasks (newly added)
      expect(newTasks[0]).toEqual(
        expect.objectContaining({
          plantId: mockPlantId,
          taskType: "fertilize",
          status: "pending",
          details: expect.objectContaining({
            product: "Starter fertilizer",
            dilution: "1:2000",
            amount: "100ml",
          }),
        })
      );
    });

    it("skips care schedule setup for varieties without protocols", async () => {
      // Clear mocks and set up variety without protocol
      jest.clearAllMocks();
      (varietyService.getVariety as jest.Mock).mockResolvedValue(mockVarietyWithoutProtocol);

      const beforeTaskCount = PlantRegistrationService.getScheduledTasksForPlant(mockPlantId).length;

      const formData = {
        varietyId: "basil-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Small pot",
      };

      await PlantRegistrationService.createPlantFromForm(formData);

      // Plant should be created successfully
      expect(plantService.addPlant).toHaveBeenCalled();

      // But no protocol transpilation should occur
      expect(ProtocolTranspilerService.transpilePlantProtocol).not.toHaveBeenCalled();

      // No new scheduled tasks should be created (count should remain the same)
      const afterTaskCount = PlantRegistrationService.getScheduledTasksForPlant(mockPlantId).length;
      expect(afterTaskCount).toBe(beforeTaskCount);
    });

    it("retrieves pending fertilization tasks correctly", async () => {
      // Clear mocks and set up fresh test
      jest.clearAllMocks();
      (varietyService.getVariety as jest.Mock).mockResolvedValue(mockVarietyWithProtocol);
      (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockResolvedValue(mockScheduledTasks);

      const beforePendingCount = PlantRegistrationService.getPendingFertilizationTasks().length;

      const formData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      await PlantRegistrationService.createPlantFromForm(formData);

      const afterPendingCount = PlantRegistrationService.getPendingFertilizationTasks().length;
      expect(afterPendingCount).toBe(beforePendingCount + 2);

      const allPendingTasks = PlantRegistrationService.getPendingFertilizationTasks();
      const newTasks = allPendingTasks.slice(-2); // Get the last 2 tasks
      expect(newTasks.every(task => task.taskType === "fertilize")).toBe(true);
      expect(newTasks.every(task => task.status === "pending")).toBe(true);
    });

    it("handles protocol transpilation errors gracefully", async () => {
      const protocolError = new Error("Failed to create fertilization schedule");
      (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockRejectedValue(protocolError);

      const formData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      await expect(
        PlantRegistrationService.createPlantFromForm(formData)
      ).rejects.toThrow("Failed to register plant: Failed to create fertilization schedule");

      // Should attempt rollback
      expect(plantService.deletePlant).toHaveBeenCalledWith(mockPlantId);
    });
  });

  describe("Error Handling and Rollback", () => {
    it("rolls back plant creation when care schedule setup fails", async () => {
      const scheduleError = new Error("Protocol transpilation failed");
      (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockRejectedValue(scheduleError);

      const formData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      await expect(
        PlantRegistrationService.createPlantFromForm(formData)
      ).rejects.toThrow("Failed to register plant: Protocol transpilation failed");

      // Verify plant was created first
      expect(plantService.addPlant).toHaveBeenCalled();

      // Verify rollback was attempted
      expect(plantService.deletePlant).toHaveBeenCalledWith(mockPlantId);
    });

    it("handles rollback failures gracefully", async () => {
      const scheduleError = new Error("Protocol error");
      const rollbackError = new Error("Database rollback failed");

      (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockRejectedValue(scheduleError);
      (plantService.deletePlant as jest.Mock).mockRejectedValue(rollbackError);

      const formData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      await expect(
        PlantRegistrationService.createPlantFromForm(formData)
      ).rejects.toThrow("Failed to register plant: Protocol error");

      expect(console.error).toHaveBeenCalledWith(
        "Failed to rollback plant creation:",
        rollbackError
      );
    });

    it("handles plant creation database errors", async () => {
      const dbError = new Error("Database connection failed");
      (plantService.addPlant as jest.Mock).mockRejectedValue(dbError);

      const formData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      await expect(
        PlantRegistrationService.createPlantFromForm(formData)
      ).rejects.toThrow("Failed to register plant: Database connection failed");

      // Should not attempt protocol transpilation if plant creation fails
      expect(ProtocolTranspilerService.transpilePlantProtocol).not.toHaveBeenCalled();

      // Should still attempt rollback even though plant creation failed
      expect(plantService.deletePlant).toHaveBeenCalledWith(mockPlantId);
    });
  });

  describe("Data Persistence and Integrity", () => {
    it("generates unique plant IDs for each registration", async () => {
      const firstId = "plant-id-1";
      const secondId = "plant-id-2";

      (generateUUID as jest.Mock)
        .mockReturnValueOnce(firstId)
        .mockReturnValueOnce(secondId);

      const formData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      const firstPlant = await PlantRegistrationService.createPlantFromForm(formData);
      const secondPlant = await PlantRegistrationService.createPlantFromForm(formData);

      expect(firstPlant.id).toBe(firstId);
      expect(secondPlant.id).toBe(secondId);
      expect(firstPlant.id).not.toBe(secondPlant.id);
    });

    it("maintains data consistency across registration steps", async () => {
      const formData = {
        varietyId: "tomato-variety-1",
        name: "Test Plant",
        plantedDate: new Date("2024-01-01"),
        location: "South Window",
        container: "5-gallon pot",
        soilMix: "Custom mix",
        notes: ["Note 1", "Note 2"],
        quantity: 2,
        reminderPreferences: {
          watering: true,
          fertilizing: false,
          observation: true,
          lighting: false,
          pruning: false,
        },
      };

      const result = await PlantRegistrationService.createPlantFromForm(formData);

      // Verify all data was preserved correctly
      expect(result).toEqual(
        expect.objectContaining({
          varietyId: "tomato-variety-1",
          varietyName: "Cherry Tomato", // From variety lookup
          name: "Test Plant",
          plantedDate: new Date("2024-01-01"),
          location: "South Window",
          container: "5-gallon pot",
          soilMix: "Custom mix",
          notes: ["Note 1", "Note 2"],
          quantity: 2,
          reminderPreferences: {
            watering: true,
            fertilizing: false,
            observation: true,
            lighting: false,
            pruning: false,
          },
          isActive: true,
        })
      );

      // Verify the same data was passed to database service
      expect(plantService.addPlant).toHaveBeenCalledWith(
        expect.objectContaining({
          varietyId: "tomato-variety-1",
          varietyName: "Cherry Tomato",
          name: "Test Plant",
          location: "South Window",
          container: "5-gallon pot",
          soilMix: "Custom mix",
          notes: ["Note 1", "Note 2"],
          quantity: 2,
          isActive: true,
        })
      );
    });

    it("sets proper timestamps during registration", async () => {
      const beforeRegistration = new Date();

      const formData = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      const result = await PlantRegistrationService.createPlantFromForm(formData);

      const afterRegistration = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime());
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterRegistration.getTime());
      expect(result.updatedAt?.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime());
      expect(result.updatedAt?.getTime()).toBeLessThanOrEqual(afterRegistration.getTime());
      expect(result.createdAt.getTime()).toBe(result.updatedAt?.getTime());
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("handles multiple plants with same variety correctly", async () => {
      // Clear call counts for clean test
      (varietyService.getVariety as jest.Mock).mockClear();
      (plantService.addPlant as jest.Mock).mockClear();
      (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockClear();
      
      // Set up fresh mock responses
      (varietyService.getVariety as jest.Mock).mockResolvedValue(mockVarietyWithProtocol);
      
      // Mock protocol transpiler to return tasks for the correct plant IDs
      (ProtocolTranspilerService.transpilePlantProtocol as jest.Mock).mockImplementation((plant) => {
        return Promise.resolve([
          {
            id: `task-1-${plant.id}`,
            plantId: plant.id,
            taskType: "fertilize" as const,
            scheduledDate: new Date("2024-01-15"),
            status: "pending" as const,
            details: {
              product: "Starter fertilizer",
              dilution: "1:2000",
              amount: "100ml",
            },
          },
          {
            id: `task-2-${plant.id}`,
            plantId: plant.id,
            taskType: "fertilize" as const,
            scheduledDate: new Date("2024-01-22"),
            status: "pending" as const,
            details: {
              product: "Starter fertilizer",
              dilution: "1:2000",
              amount: "100ml",
            },
          },
        ]);
      });

      const varietyId = "tomato-variety-1";
      const plantIds = ["plant-1", "plant-2", "plant-3"];

      (generateUUID as jest.Mock)
        .mockReturnValueOnce(plantIds[0])
        .mockReturnValueOnce(plantIds[1])
        .mockReturnValueOnce(plantIds[2]);

      const formData = {
        varietyId,
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
      };

      // Register three plants with same variety sequentially for predictable call counts
      const plant1 = await PlantRegistrationService.createPlantFromForm({ ...formData, name: "Plant 1" });
      const plant2 = await PlantRegistrationService.createPlantFromForm({ ...formData, name: "Plant 2" });
      const plant3 = await PlantRegistrationService.createPlantFromForm({ ...formData, name: "Plant 3" });

      const plants = [plant1, plant2, plant3];

      // Each should have unique ID but same variety
      expect(plants[0].id).toBe(plantIds[0]);
      expect(plants[1].id).toBe(plantIds[1]);
      expect(plants[2].id).toBe(plantIds[2]);

      expect(plants.every(plant => plant.varietyId === varietyId)).toBe(true);
      expect(plants.every(plant => plant.varietyName === "Cherry Tomato")).toBe(true);

      // Verify variety service was called with the correct variety ID
      expect(varietyService.getVariety).toHaveBeenCalledWith(varietyId);

      // Each plant should have their own scheduled tasks
      const plant1Tasks = PlantRegistrationService.getScheduledTasksForPlant(plantIds[0]);
      const plant2Tasks = PlantRegistrationService.getScheduledTasksForPlant(plantIds[1]);
      const plant3Tasks = PlantRegistrationService.getScheduledTasksForPlant(plantIds[2]);

      expect(plant1Tasks.length).toBeGreaterThanOrEqual(2);
      expect(plant2Tasks.length).toBeGreaterThanOrEqual(2);
      expect(plant3Tasks.length).toBeGreaterThanOrEqual(2);

      // Verify tasks belong to correct plants
      expect(plant1Tasks.every(task => task.plantId === plantIds[0])).toBe(true);
      expect(plant2Tasks.every(task => task.plantId === plantIds[1])).toBe(true);
      expect(plant3Tasks.every(task => task.plantId === plantIds[2])).toBe(true);
    });

    it("integrates with reminder preferences for care scheduling", async () => {
      const formDataWithCustomReminders = {
        varietyId: "tomato-variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "Container",
        reminderPreferences: {
          watering: false,
          fertilizing: true, // Only fertilizing enabled
          observation: false,
          lighting: false,
          pruning: false,
        },
      };

      const result = await PlantRegistrationService.createPlantFromForm(formDataWithCustomReminders);

      expect(result.reminderPreferences).toEqual({
        watering: false,
        fertilizing: true,
        observation: false,
        lighting: false,
        pruning: false,
      });

      // Even with limited reminder preferences, fertilization schedule should still be created
      // because the variety has a fertilization protocol
      expect(ProtocolTranspilerService.transpilePlantProtocol).toHaveBeenCalled();
      
      const fertilizationTasks = PlantRegistrationService.getPendingFertilizationTasks();
      expect(fertilizationTasks.length).toBeGreaterThan(0);
    });
  });
});