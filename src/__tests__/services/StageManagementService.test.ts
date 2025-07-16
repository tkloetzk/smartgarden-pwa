import { StageManagementService } from "@/services/StageManagementService";
import { FirebasePlantService } from "@/services/firebase/plantService";
import { varietyService } from "@/types/database";
import { ProtocolTranspilerService, ScheduledTask } from "@/services/ProtocolTranspilerService";
import { FirebaseScheduledTaskService } from "@/services/firebase/scheduledTaskService";
import { PlantRecord, VarietyRecord, GrowthStage } from "@/types";
import { toast } from "react-hot-toast";

// Mock dependencies
jest.mock("@/services/firebase/plantService");
jest.mock("@/types/database", () => ({
  varietyService: {
    getVariety: jest.fn(),
  },
}));
jest.mock("@/services/ProtocolTranspilerService");
jest.mock("@/services/firebase/scheduledTaskService");
jest.mock("react-hot-toast");

const mockFirebasePlantService = FirebasePlantService as jest.Mocked<typeof FirebasePlantService>;
const mockVarietyService = varietyService as jest.Mocked<typeof varietyService>;
const mockProtocolTranspilerService = ProtocolTranspilerService as jest.Mocked<typeof ProtocolTranspilerService>;
const mockFirebaseScheduledTaskService = FirebaseScheduledTaskService as jest.Mocked<typeof FirebaseScheduledTaskService>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe("StageManagementService", () => {
  const mockUserId = "user-123";
  const mockPlantId = "plant-456";
  
  const mockPlant: PlantRecord = {
    id: mockPlantId,
    varietyId: "variety-1",
    varietyName: "Cherry Tomato",
    name: "My Tomato",
    plantedDate: new Date("2024-01-01"),
    location: "Indoor",
    container: "6-inch pot",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockVariety: VarietyRecord = {
    id: "variety-1",
    name: "Cherry Tomato",
    normalizedName: "cherry tomato",
    category: "fruits",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      flowering: 14,
      fruiting: 30,
      maturation: 70,
    },
    protocols: {
      fertilization: {
        vegetative: {
          schedule: [
            {
              startDays: 0,
              taskName: "Vegetative Feed",
              details: {
                product: "Nitrogen Fertilizer",
                dilution: "1:10",
                amount: "1 cup",
                method: "soil-drench" as const,
              },
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
        },
        flowering: {
          schedule: [
            {
              startDays: 0,
              taskName: "Bloom Booster",
              details: {
                product: "Phosphorus Fertilizer",
                dilution: "2 tbsp/gal",
                amount: "Full application",
                method: "soil-drench" as const,
              },
              frequencyDays: 10,
              repeatCount: 3,
            },
          ],
        },
      },
    },
  };

  const mockScheduledTasks: ScheduledTask[] = [
    {
      id: "task-1",
      plantId: mockPlantId,
      taskName: "Bloom Booster",
      taskType: "fertilize",
      details: {
        type: "fertilize",
        product: "Phosphorus Fertilizer",
        dilution: "2 tbsp/gal",
        amount: "Full application",
        method: "soil-drench",
      },
      dueDate: new Date("2024-02-01"),
      status: "pending",
      sourceProtocol: {
        stage: "flowering",
        originalStartDays: 0,
        isDynamic: true,
      },
      priority: "normal",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "task-2",
      plantId: mockPlantId,
      taskName: "Bloom Booster",
      taskType: "fertilize",
      details: {
        type: "fertilize",
        product: "Phosphorus Fertilizer",
        dilution: "2 tbsp/gal",
        amount: "Full application",
        method: "soil-drench",
      },
      dueDate: new Date("2024-02-11"),
      status: "pending",
      sourceProtocol: {
        stage: "flowering",
        originalStartDays: 0,
        isDynamic: true,
      },
      priority: "normal",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful mocks
    mockFirebasePlantService.getPlant.mockResolvedValue(mockPlant);
    mockVarietyService.getVariety.mockResolvedValue(mockVariety);
    mockFirebasePlantService.updatePlant.mockResolvedValue();
    mockFirebaseScheduledTaskService.deletePendingTasksForPlant.mockResolvedValue();
    mockProtocolTranspilerService.transpileProtocolFromStage.mockResolvedValue(mockScheduledTasks);
    mockFirebaseScheduledTaskService.createMultipleTasks.mockResolvedValue();
    mockToast.success = jest.fn();
  });

  describe("confirmNewStage", () => {
    it("successfully confirms a new growth stage with complete workflow", async () => {
      await StageManagementService.confirmNewStage(
        mockPlantId,
        "flowering",
        mockUserId
      );

      // Verify plant is retrieved
      expect(mockFirebasePlantService.getPlant).toHaveBeenCalledWith(
        mockPlantId,
        mockUserId
      );

      // Verify variety is retrieved
      expect(mockVarietyService.getVariety).toHaveBeenCalledWith("variety-1");

      // Verify plant is updated with new stage
      expect(mockFirebasePlantService.updatePlant).toHaveBeenCalledWith(
        mockPlantId,
        expect.objectContaining({
          confirmedStage: "flowering",
          stageConfirmedDate: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );

      // Verify pending tasks are deleted
      expect(mockFirebaseScheduledTaskService.deletePendingTasksForPlant).toHaveBeenCalledWith(
        mockPlantId,
        mockUserId
      );

      // Verify new tasks are transpiled from the new stage
      expect(mockProtocolTranspilerService.transpileProtocolFromStage).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockPlant,
          confirmedStage: "flowering",
          stageConfirmedDate: expect.any(Date),
        }),
        mockVariety,
        "flowering"
      );

      // Verify new tasks are created
      expect(mockFirebaseScheduledTaskService.createMultipleTasks).toHaveBeenCalledWith(
        mockScheduledTasks,
        mockUserId
      );

      // Verify success toast is shown
      expect(mockToast.success).toHaveBeenCalledWith(
        "2 new care tasks have been scheduled."
      );
    });

    it("handles no new tasks scenario gracefully", async () => {
      // Mock no new tasks
      mockProtocolTranspilerService.transpileProtocolFromStage.mockResolvedValue([]);

      await StageManagementService.confirmNewStage(
        mockPlantId,
        "flowering",
        mockUserId
      );

      // Verify workflow still completes
      expect(mockFirebasePlantService.updatePlant).toHaveBeenCalled();
      expect(mockFirebaseScheduledTaskService.deletePendingTasksForPlant).toHaveBeenCalled();
      expect(mockProtocolTranspilerService.transpileProtocolFromStage).toHaveBeenCalled();

      // Verify no tasks are created and no toast is shown
      expect(mockFirebaseScheduledTaskService.createMultipleTasks).not.toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it("throws error when plant is not found", async () => {
      mockFirebasePlantService.getPlant.mockResolvedValue(undefined);

      await expect(
        StageManagementService.confirmNewStage(mockPlantId, "flowering", mockUserId)
      ).rejects.toThrow("Plant not found during stage update.");

      // Verify no further operations are attempted
      expect(mockVarietyService.getVariety).not.toHaveBeenCalled();
      expect(mockFirebasePlantService.updatePlant).not.toHaveBeenCalled();
    });

    it("throws error when variety is not found", async () => {
      mockVarietyService.getVariety.mockResolvedValue(undefined);

      await expect(
        StageManagementService.confirmNewStage(mockPlantId, "flowering", mockUserId)
      ).rejects.toThrow("Variety information could not be loaded for the plant.");

      // Verify plant was retrieved but no update operations occur
      expect(mockFirebasePlantService.getPlant).toHaveBeenCalled();
      expect(mockFirebasePlantService.updatePlant).not.toHaveBeenCalled();
    });

    it("handles plant update failure", async () => {
      const updateError = new Error("Database connection failed");
      mockFirebasePlantService.updatePlant.mockRejectedValue(updateError);

      await expect(
        StageManagementService.confirmNewStage(mockPlantId, "flowering", mockUserId)
      ).rejects.toThrow("Database connection failed");

      // Verify subsequent operations are not attempted
      expect(mockFirebaseScheduledTaskService.deletePendingTasksForPlant).not.toHaveBeenCalled();
      expect(mockProtocolTranspilerService.transpileProtocolFromStage).not.toHaveBeenCalled();
    });

    it("handles pending task deletion failure", async () => {
      const deleteError = new Error("Failed to delete tasks");
      mockFirebaseScheduledTaskService.deletePendingTasksForPlant.mockRejectedValue(deleteError);

      await expect(
        StageManagementService.confirmNewStage(mockPlantId, "flowering", mockUserId)
      ).rejects.toThrow("Failed to delete tasks");

      // Verify plant update occurs but subsequent operations are not attempted
      expect(mockFirebasePlantService.updatePlant).toHaveBeenCalled();
      expect(mockProtocolTranspilerService.transpileProtocolFromStage).not.toHaveBeenCalled();
    });

    it("handles protocol transpilation failure", async () => {
      const transpileError = new Error("Protocol transpilation failed");
      mockProtocolTranspilerService.transpileProtocolFromStage.mockRejectedValue(transpileError);

      await expect(
        StageManagementService.confirmNewStage(mockPlantId, "flowering", mockUserId)
      ).rejects.toThrow("Protocol transpilation failed");

      // Verify all pre-transpilation operations complete
      expect(mockFirebasePlantService.updatePlant).toHaveBeenCalled();
      expect(mockFirebaseScheduledTaskService.deletePendingTasksForPlant).toHaveBeenCalled();
      expect(mockFirebaseScheduledTaskService.createMultipleTasks).not.toHaveBeenCalled();
    });

    it("handles task creation failure", async () => {
      const createError = new Error("Failed to create tasks");
      mockFirebaseScheduledTaskService.createMultipleTasks.mockRejectedValue(createError);

      await expect(
        StageManagementService.confirmNewStage(mockPlantId, "flowering", mockUserId)
      ).rejects.toThrow("Failed to create tasks");

      // Verify all operations up to task creation complete
      expect(mockFirebasePlantService.updatePlant).toHaveBeenCalled();
      expect(mockFirebaseScheduledTaskService.deletePendingTasksForPlant).toHaveBeenCalled();
      expect(mockProtocolTranspilerService.transpileProtocolFromStage).toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it("correctly passes plant with updated stage to transpiler", async () => {
      const newStage: GrowthStage = "fruiting";
      
      await StageManagementService.confirmNewStage(
        mockPlantId,
        newStage,
        mockUserId
      );

      // Verify the transpiler receives the plant with updated stage information
      expect(mockProtocolTranspilerService.transpileProtocolFromStage).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockPlant,
          confirmedStage: newStage,
          stageConfirmedDate: expect.any(Date),
        }),
        mockVariety,
        newStage
      );
    });

    it("handles different growth stages correctly", async () => {
      const testStages: GrowthStage[] = ["germination", "seedling", "vegetative", "flowering", "fruiting", "maturation"];
      
      for (const stage of testStages) {
        jest.clearAllMocks();
        mockFirebasePlantService.getPlant.mockResolvedValue(mockPlant);
        mockVarietyService.getVariety.mockResolvedValue(mockVariety);
        mockFirebasePlantService.updatePlant.mockResolvedValue();
        mockFirebaseScheduledTaskService.deletePendingTasksForPlant.mockResolvedValue();
        mockProtocolTranspilerService.transpileProtocolFromStage.mockResolvedValue([]);
        
        await StageManagementService.confirmNewStage(
          mockPlantId,
          stage,
          mockUserId
        );

        expect(mockFirebasePlantService.updatePlant).toHaveBeenCalledWith(
          mockPlantId,
          expect.objectContaining({
            confirmedStage: stage,
          })
        );

        expect(mockProtocolTranspilerService.transpileProtocolFromStage).toHaveBeenCalledWith(
          expect.any(Object),
          mockVariety,
          stage
        );
      }
    });

    it("preserves original plant data during update", async () => {
      await StageManagementService.confirmNewStage(
        mockPlantId,
        "flowering",
        mockUserId
      );

      // Verify the transpiler receives a plant object with original data preserved
      const call = mockProtocolTranspilerService.transpileProtocolFromStage.mock.calls[0];
      const updatedPlant = call[0];
      
      expect(updatedPlant).toEqual(
        expect.objectContaining({
          id: mockPlant.id,
          varietyId: mockPlant.varietyId,
          varietyName: mockPlant.varietyName,
          name: mockPlant.name,
          plantedDate: mockPlant.plantedDate,
          location: mockPlant.location,
          container: mockPlant.container,
          isActive: mockPlant.isActive,
          confirmedStage: "flowering",
          stageConfirmedDate: expect.any(Date),
        })
      );
    });
  });
});