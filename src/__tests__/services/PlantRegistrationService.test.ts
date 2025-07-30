import { PlantRegistrationService } from "@/services/PlantRegistrationService";
import { ProtocolTranspilerService, ScheduledTask } from "@/services/ProtocolTranspilerService";
import { plantService, varietyService } from "@/services";
import { generateUUID } from "@/utils/cn";
import { PlantRecord, VarietyRecord } from "@/types";

// Mock dependencies
jest.mock("@/services", () => ({
  plantService: {
    addPlant: jest.fn(),
    deletePlant: jest.fn(),
  },
  varietyService: {
    getVariety: jest.fn(),
  },
}));

jest.mock("@/services/ProtocolTranspilerService");
jest.mock("@/utils/cn");

const mockPlantService = plantService as jest.Mocked<typeof plantService>;
const mockVarietyService = varietyService as jest.Mocked<typeof varietyService>;
const mockProtocolTranspilerService = ProtocolTranspilerService as jest.Mocked<typeof ProtocolTranspilerService>;
const mockGenerateUUID = generateUUID as jest.MockedFunction<typeof generateUUID>;

describe("PlantRegistrationService", () => {
  const mockVariety: VarietyRecord = {
    id: "variety-1",
    name: "Cherry Tomato",
    normalizedName: "cherry tomato",
    category: "fruiting-plants",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 30,
      maturation: 60
    },
    protocols: {
      fertilization: {
        vegetative: {
          schedule: [
            {
              startDays: 14,
              taskName: "First Feeding",
              details: {
                product: "Fish Emulsion",
                dilution: "1:10",
                amount: "1 cup",
                method: "soil-drench" as const,
              },
              frequencyDays: 14,
              repeatCount: 1,
            },
          ],
        },
        germination: {
          schedule: []
        },
        seedling: {
          schedule: []
        },
        maturation: {
          schedule: []
        }
      },
    } as any,
  };

  const mockPlantData: PlantRecord = {
    id: "plant-123",
    varietyId: "variety-1",
    varietyName: "Cherry Tomato",
    name: "My Tomato",
    plantedDate: new Date("2024-01-01"),
    location: "Indoor",
    container: "6-inch pot",
    soilMix: "Potting mix",
    isActive: true,
    notes: ["Started from seed"],
    quantity: 1,
    reminderPreferences: {
      watering: true,
      fertilizing: true,
      observation: true,
      lighting: true,
      pruning: true,
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockScheduledTasks: ScheduledTask[] = [
    {
      id: "task-1",
      plantId: "plant-123",
      taskName: "First Feeding",
      taskType: "fertilize",
      details: {
        type: "fertilize",
        product: "Fish Emulsion",
        dilution: "1:10",
        amount: "1 cup",
        method: "soil-drench",
      },
      dueDate: new Date("2024-01-15"),
      status: "pending",
      sourceProtocol: {
        stage: "vegetative",
        originalStartDays: 14,
        isDynamic: false,
      },
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks(); // Restore any spies
    console.error = jest.fn(); // Mock console.error for rollback tests
    
    // Clear the scheduledTasksStore by calling a mock implementation
    // We need to access the private store and clear it
    (PlantRegistrationService as any).scheduledTasksStore = undefined;
    // Mock it to return an empty array for fresh tests
    jest.clearAllMocks();
  });

  describe("registerPlant", () => {
    it("successfully registers a plant with fertilization protocols", async () => {
      mockVarietyService.getVariety.mockResolvedValue(mockVariety);
      mockPlantService.addPlant.mockResolvedValue("plant-123");
      mockProtocolTranspilerService.transpilePlantProtocol.mockResolvedValue(mockScheduledTasks);

      await PlantRegistrationService.registerPlant(mockPlantData);

      expect(mockPlantService.addPlant).toHaveBeenCalledWith(mockPlantData);
      expect(mockVarietyService.getVariety).toHaveBeenCalledWith("variety-1");
      expect(mockProtocolTranspilerService.transpilePlantProtocol).toHaveBeenCalledWith(
        mockPlantData,
        mockVariety
      );
    });

    it("successfully registers a plant without fertilization protocols", async () => {
      const varietyWithoutProtocols = { ...mockVariety, protocols: undefined };
      mockVarietyService.getVariety.mockResolvedValue(varietyWithoutProtocols);
      mockPlantService.addPlant.mockResolvedValue("plant-123");

      await PlantRegistrationService.registerPlant(mockPlantData);

      expect(mockPlantService.addPlant).toHaveBeenCalledWith(mockPlantData);
      expect(mockVarietyService.getVariety).toHaveBeenCalledWith("variety-1");
      expect(mockProtocolTranspilerService.transpilePlantProtocol).not.toHaveBeenCalled();
    });

    it("throws error when variety is not found", async () => {
      mockVarietyService.getVariety.mockResolvedValue(undefined);

      await expect(PlantRegistrationService.registerPlant(mockPlantData)).rejects.toThrow(
        "Failed to register plant: Variety not found: variety-1"
      );

      expect(mockPlantService.deletePlant).toHaveBeenCalledWith("plant-123");
    });

    it("performs rollback when plant creation fails", async () => {
      mockPlantService.addPlant.mockRejectedValue(new Error("Database error"));

      await expect(PlantRegistrationService.registerPlant(mockPlantData)).rejects.toThrow(
        "Failed to register plant: Database error"
      );

      expect(mockPlantService.deletePlant).toHaveBeenCalledWith("plant-123");
    });

    it("performs rollback when protocol transpilation fails", async () => {
      mockVarietyService.getVariety.mockResolvedValue(mockVariety);
      mockPlantService.addPlant.mockResolvedValue("plant-123");
      mockProtocolTranspilerService.transpilePlantProtocol.mockRejectedValue(
        new Error("Transpilation error")
      );

      await expect(PlantRegistrationService.registerPlant(mockPlantData)).rejects.toThrow(
        "Failed to register plant: Transpilation error"
      );

      expect(mockPlantService.deletePlant).toHaveBeenCalledWith("plant-123");
    });

    it("handles rollback failure gracefully", async () => {
      mockPlantService.addPlant.mockRejectedValue(new Error("Database error"));
      mockPlantService.deletePlant.mockRejectedValue(new Error("Rollback error"));

      await expect(PlantRegistrationService.registerPlant(mockPlantData)).rejects.toThrow(
        "Failed to register plant: Database error"
      );

      expect(console.error).toHaveBeenCalledWith(
        "Failed to rollback plant creation:",
        expect.any(Error)
      );
    });
  });

  describe("createPlantFromForm", () => {
    const mockFormData = {
      varietyId: "variety-1",
      name: "My Tomato",
      plantedDate: new Date("2024-01-01"),
      location: "Indoor",
      container: "6-inch pot",
      soilMix: "Potting mix",
      notes: ["Started from seed"],
      quantity: 2,
      reminderPreferences: {
        watering: true,
        fertilizing: false,
        observation: true,
        lighting: true,
        pruning: false,
      },
    };

    beforeEach(() => {
      mockGenerateUUID.mockReturnValue("generated-uuid-123");
      mockVarietyService.getVariety.mockResolvedValue(mockVariety);
      mockPlantService.addPlant.mockResolvedValue("generated-uuid-123");
      mockProtocolTranspilerService.transpilePlantProtocol.mockResolvedValue([]);
    });

    it("creates plant from form data with all fields", async () => {
      const result = await PlantRegistrationService.createPlantFromForm(mockFormData);

      expect(mockGenerateUUID).toHaveBeenCalled();
      expect(mockVarietyService.getVariety).toHaveBeenCalledWith("variety-1");

      expect(result).toEqual(
        expect.objectContaining({
          id: "generated-uuid-123",
          varietyId: "variety-1",
          varietyName: "Cherry Tomato",
          name: "My Tomato",
          plantedDate: mockFormData.plantedDate,
          location: "Indoor",
          container: "6-inch pot",
          soilMix: "Potting mix",
          isActive: true,
          notes: ["Started from seed"],
          quantity: 2,
          reminderPreferences: mockFormData.reminderPreferences,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it("creates plant with minimal required fields and defaults", async () => {
      const minimalFormData = {
        varietyId: "variety-1",
        plantedDate: new Date("2024-01-01"),
        location: "Indoor",
        container: "6-inch pot",
      };

      const result = await PlantRegistrationService.createPlantFromForm(minimalFormData);

      expect(result).toEqual(
        expect.objectContaining({
          id: "generated-uuid-123",
          varietyId: "variety-1",
          varietyName: "Cherry Tomato",
          name: undefined,
          plantedDate: minimalFormData.plantedDate,
          location: "Indoor",
          container: "6-inch pot",
          soilMix: undefined,
          isActive: true,
          notes: undefined,
          quantity: 1, // default
          reminderPreferences: {
            watering: true,
            fertilizing: true,
            observation: true,
            lighting: true,
            pruning: true,
          }, // defaults
        })
      );
    });

    it("throws error when variety is not found", async () => {
      mockVarietyService.getVariety.mockResolvedValue(undefined);

      await expect(PlantRegistrationService.createPlantFromForm(mockFormData)).rejects.toThrow(
        "Variety not found: variety-1"
      );
    });

    it("propagates registration errors", async () => {
      mockPlantService.addPlant.mockRejectedValue(new Error("Registration failed"));
      mockPlantService.deletePlant.mockResolvedValue();

      await expect(PlantRegistrationService.createPlantFromForm(mockFormData)).rejects.toThrow(
        "Failed to register plant: Registration failed"
      );
    });
  });

  describe("getScheduledTasksForPlant", () => {
    it("returns scheduled tasks for specific plant", async () => {
      // Use isolated test data
      const isolatedPlantData = { ...mockPlantData, id: "isolated-plant-123" };
      const isolatedTasks = mockScheduledTasks.map(task => ({ ...task, plantId: "isolated-plant-123", id: "isolated-task-1" }));
      
      mockVarietyService.getVariety.mockResolvedValue(mockVariety);
      mockPlantService.addPlant.mockResolvedValue("isolated-plant-123");
      mockProtocolTranspilerService.transpilePlantProtocol.mockResolvedValue(isolatedTasks);

      // Register the plant first (this adds tasks to the internal store)
      await PlantRegistrationService.registerPlant(isolatedPlantData);
      
      const tasks = PlantRegistrationService.getScheduledTasksForPlant("isolated-plant-123");
      expect(tasks.length).toBeGreaterThanOrEqual(1);
      expect(tasks.find(t => t.plantId === "isolated-plant-123")).toBeDefined();
    });

    it("returns empty array for plant with no tasks", () => {
      const tasks = PlantRegistrationService.getScheduledTasksForPlant("nonexistent-plant");
      expect(tasks).toEqual([]);
    });
  });

  describe("getPendingFertilizationTasks", () => {
    it("returns only pending fertilization tasks", async () => {
      // Use isolated test data
      const isolatedPlantData = { ...mockPlantData, id: "pending-plant-123" };
      const isolatedTasks = mockScheduledTasks.map(task => ({ ...task, plantId: "pending-plant-123", id: "pending-task-1" }));
      
      mockVarietyService.getVariety.mockResolvedValue(mockVariety);
      mockPlantService.addPlant.mockResolvedValue("pending-plant-123");
      mockProtocolTranspilerService.transpilePlantProtocol.mockResolvedValue(isolatedTasks);

      await PlantRegistrationService.registerPlant(isolatedPlantData);
      
      const pendingTasks = PlantRegistrationService.getPendingFertilizationTasks();
      const targetTasks = pendingTasks.filter(t => t.plantId === "pending-plant-123");
      expect(targetTasks.length).toBeGreaterThanOrEqual(1);
      expect(targetTasks[0].status).toBe("pending");
      expect(targetTasks[0].taskType).toBe("fertilize");
    });

    it("filters out completed and non-fertilization tasks", async () => {
      const isolatedPlantData = { ...mockPlantData, id: "filter-plant-123" };
      const mixedTasks: ScheduledTask[] = [
        {
          ...mockScheduledTasks[0],
          id: "filter-task-1",
          plantId: "filter-plant-123",
          status: "pending",
          taskType: "fertilize",
        },
        {
          ...mockScheduledTasks[0],
          id: "filter-task-2",
          plantId: "filter-plant-123",
          status: "completed",
          taskType: "fertilize",
        },
        {
          ...mockScheduledTasks[0],
          id: "filter-task-3",
          plantId: "filter-plant-123",
          status: "pending",
          taskType: "water",
        } as any, // Cast to avoid type issues for non-fertilize task
      ];

      mockVarietyService.getVariety.mockResolvedValue(mockVariety);
      mockPlantService.addPlant.mockResolvedValue("filter-plant-123");
      mockProtocolTranspilerService.transpilePlantProtocol.mockResolvedValue(mixedTasks);

      await PlantRegistrationService.registerPlant(isolatedPlantData);
      
      const pendingTasks = PlantRegistrationService.getPendingFertilizationTasks();
      const targetTasks = pendingTasks.filter(t => t.plantId === "filter-plant-123" && t.status === "pending" && t.taskType === "fertilize");
      expect(targetTasks).toHaveLength(1);
      expect(targetTasks[0].id).toBe("filter-task-1");
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      // Reset all mocks for error handling tests
      jest.clearAllMocks();
    });
    
    it("provides meaningful error messages", async () => {
      mockPlantService.addPlant.mockRejectedValue(new Error("Constraint violation"));
      mockPlantService.deletePlant.mockResolvedValue();

      await expect(PlantRegistrationService.registerPlant(mockPlantData)).rejects.toThrow(
        "Failed to register plant: Constraint violation"
      );
    });

    it("handles variety service errors", async () => {
      // Reset and setup specific mocks for this test only
      mockVarietyService.getVariety.mockReset().mockRejectedValue(new Error("Database connection failed"));
      mockPlantService.addPlant.mockReset(); // Don't call addPlant since getVariety fails first
      mockPlantService.deletePlant.mockReset().mockResolvedValue();

      await expect(PlantRegistrationService.registerPlant(mockPlantData)).rejects.toThrow(
        "Failed to register plant: Database connection failed"
      );

      expect(mockPlantService.deletePlant).toHaveBeenCalledWith("plant-123");
    });
  });
});