import { ProtocolTranspilerService } from "@/services/ProtocolTranspilerService";
import { PlantRecord, VarietyRecord, GrowthStage } from "@/types";

describe("ProtocolTranspilerService", () => {
  // Use a future date so tasks don't get skipped as "in the past"
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  const mockPlant: PlantRecord = {
    id: "plant-123",
    varietyId: "variety-1",
    varietyName: "Cherry Tomato",
    name: "My Tomato",
    plantedDate: futureDate,
    location: "Indoor",
    container: "6-inch pot",
    isActive: true,
    createdAt: futureDate,
    updatedAt: futureDate,
  };

  const mockVariety: VarietyRecord = {
    id: "variety-1",
    name: "Cherry Tomato",
    normalizedName: "cherry tomato",
    category: "fruiting-plants",
    createdAt: futureDate,
    updatedAt: futureDate,
    growthTimeline: {
      germination: 7,
      seedling: 14,
      vegetative: 21,
      maturation: 70
    },
    protocols: {
      fertilization: {
        germination: {
          schedule: [
            {
              startDays: 0,
              taskName: "Seed Starting Mix",
              details: {
                product: "Seed Starting Fertilizer",
                dilution: "1:20",
                amount: "Light application",
                method: "soil-drench" as const,
              },
              frequencyDays: 7,
              repeatCount: 1,
            },
          ],
        },
        vegetative: {
          schedule: [
            {
              startDays: 0,
              taskName: "High Nitrogen Feed",
              details: {
                product: "Fish Emulsion",
                dilution: "1:10",
                amount: "1 cup per plant",
                method: "soil-drench" as const,
              },
              frequencyDays: 14,
              repeatCount: 3,
            },
            {
              startDays: 7,
              taskName: "Liquid Kelp Supplement",
              details: {
                product: "Liquid Kelp",
                dilution: "1 tbsp/gal",
                amount: "Light foliar spray",
                method: "foliar-spray" as const,
              },
              frequencyDays: 14,
              repeatCount: 2,
            },
          ],
        },
        seedling: {
          schedule: []
        },
        maturation: {
          schedule: []
        },
      },
    },
  } as unknown as VarietyRecord;

  const mockVarietyNoProtocols: VarietyRecord = {
    ...mockVariety,
    protocols: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, "error").mockImplementation();
    jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("transpilePlantProtocol", () => {
    it("creates scheduled tasks for a complete fertilization protocol", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(mockPlant, mockVariety);

      expect(tasks.length).toBeGreaterThan(0);

      // Should have tasks from germination and vegetative stages
      const germinationTasks = tasks.filter(t => t.sourceProtocol.stage === "germination");
      const vegetativeTasks = tasks.filter(t => t.sourceProtocol.stage === "vegetative");

      expect(germinationTasks).toHaveLength(1); // 1 task × 1 repeat
      expect(vegetativeTasks).toHaveLength(5); // 2 tasks × (3+2) repeats

      // Verify task structure
      const firstTask = tasks[0];
      expect(firstTask).toEqual(
        expect.objectContaining({
          id: expect.stringContaining("plant-123"),
          plantId: "plant-123",
          taskName: expect.any(String),
          taskType: "fertilize",
          details: expect.objectContaining({
            type: "fertilize",
            product: expect.any(String),
            dilution: expect.any(String),
            amount: expect.any(String),
            method: expect.any(String),
          }),
          dueDate: expect.any(Date),
          status: "pending",
          sourceProtocol: expect.objectContaining({
            stage: expect.any(String),
            originalStartDays: expect.any(Number),
            isDynamic: true,
          }),
          priority: "normal",
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it("returns empty array when variety has no fertilization protocols", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockPlant,
        mockVarietyNoProtocols
      );

      expect(tasks).toEqual([]);
    });

    it("calculates correct due dates based on plant's planted date", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(mockPlant, mockVariety);

      const germinationTask = tasks.find(t => t.sourceProtocol.stage === "germination");
      const vegetativeTask = tasks.find(t => t.sourceProtocol.stage === "vegetative");

      expect(germinationTask?.dueDate).toEqual(futureDate); // Same as planted date
      
      const expectedVegetativeDate = new Date(futureDate);
      expectedVegetativeDate.setDate(expectedVegetativeDate.getDate() + 21); // 21 days after planted date (7+14)
      expect(vegetativeTask?.dueDate).toEqual(expectedVegetativeDate);
    });

    it("skips tasks that would be in the past", async () => {
      // Use a plant that was planted 90 days ago
      const pastPlant = {
        ...mockPlant,
        plantedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      };

      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(pastPlant, mockVariety);

      // All returned tasks should have due dates in the future
      tasks.forEach(task => {
        expect(task.dueDate.getTime()).toBeGreaterThan(Date.now());
      });
    });

    it("generates unique task IDs", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(mockPlant, mockVariety);

      const taskIds = tasks.map(t => t.id);
      const uniqueIds = new Set(taskIds);

      expect(uniqueIds.size).toBe(taskIds.length);
    });
  });

  describe("transpileProtocolFromStage", () => {
    it("starts transpilation from specified stage", async () => {
      const anchorDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
      const tasks = await ProtocolTranspilerService.transpileProtocolFromStage(
        mockPlant,
        mockVariety,
        "vegetative",
        anchorDate
      );

      // Should only have tasks from vegetative stage onward, not germination
      const stages = [...new Set(tasks.map(t => t.sourceProtocol.stage))];
      expect(stages).not.toContain("germination");
      expect(stages).toContain("vegetative");
    });

    it("uses custom anchor date for scheduling", async () => {
      const anchorDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
      const tasks = await ProtocolTranspilerService.transpileProtocolFromStage(
        mockPlant,
        mockVariety,
        "vegetative",
        anchorDate
      );

      const firstVegetativeTask = tasks.find(t => t.sourceProtocol.stage === "vegetative");
      expect(firstVegetativeTask?.dueDate).toEqual(anchorDate);
    });

    it("handles invalid start stage gracefully", async () => {
      const tasks = await ProtocolTranspilerService.transpileProtocolFromStage(
        mockPlant,
        mockVariety,
        "invalid-stage" as GrowthStage,
        new Date()
      );

      expect(tasks).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        "Invalid start stage provided: invalid-stage"
      );
    });

    it("handles variety without fertilization protocols", async () => {
      const tasks = await ProtocolTranspilerService.transpileProtocolFromStage(
        mockPlant,
        mockVarietyNoProtocols,
        "germination",
        new Date()
      );

      expect(tasks).toEqual([]);
    });
  });

  describe("stage progression and timing", () => {
    it("schedules tasks in correct chronological order", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(mockPlant, mockVariety);

      // Sort tasks by due date
      const sortedTasks = [...tasks].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      // Verify tasks are properly ordered by due date
      for (let i = 1; i < sortedTasks.length; i++) {
        expect(sortedTasks[i].dueDate.getTime()).toBeGreaterThanOrEqual(
          sortedTasks[i - 1].dueDate.getTime()
        );
      }

      // Verify all stages are valid
      const validStages = ["germination", "seedling", "vegetative", "flowering", "fruiting", "maturation"];
      tasks.forEach(task => {
        expect(validStages).toContain(task.sourceProtocol.stage);
      });

      // Verify that tasks from earlier-starting stages don't begin after later-starting stages
      // (but allow overlapping execution periods)
      const stageStartTimes = new Map<string, number>();
      
      // Find the earliest task for each stage
      tasks.forEach(task => {
        const stage = task.sourceProtocol.stage;
        const earliestTime = stageStartTimes.get(stage);
        if (!earliestTime || task.dueDate.getTime() < earliestTime) {
          stageStartTimes.set(stage, task.dueDate.getTime());
        }
      });

      // Verify stage start times follow logical progression
      const stageOrder = ["germination", "vegetative", "flowering"];
      for (let i = 1; i < stageOrder.length; i++) {
        const currentStage = stageOrder[i];
        const previousStage = stageOrder[i - 1];
        
        if (stageStartTimes.has(currentStage) && stageStartTimes.has(previousStage)) {
          expect(stageStartTimes.get(currentStage)!).toBeGreaterThanOrEqual(
            stageStartTimes.get(previousStage)!
          );
        }
      }
    });

    it("correctly calculates stage start days", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(mockPlant, mockVariety);

      const germinationTask = tasks.find(t => t.sourceProtocol.stage === "germination");
      const vegetativeTask = tasks.find(t => t.sourceProtocol.stage === "vegetative");

      // Based on growth timeline and calculateStageStartDays logic:
      // germination: 0, seedling: 7, vegetative: 21 (7+14)
      const plantedDate = mockPlant.plantedDate.getTime();
      
      expect(germinationTask?.dueDate.getTime()).toBe(plantedDate);
      expect(vegetativeTask?.dueDate.getTime()).toBe(plantedDate + 21 * 24 * 60 * 60 * 1000); // 21 days
    });
  });

  describe("task details and properties", () => {
    it("preserves fertilization protocol details", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(mockPlant, mockVariety);

      const fishEmulsionTask = tasks.find(t => t.details.product === "Fish Emulsion");
      expect(fishEmulsionTask).toEqual(
        expect.objectContaining({
          taskName: "High Nitrogen Feed",
          details: {
            type: "fertilize",
            product: "Fish Emulsion",
            dilution: "1:10",
            amount: "1 cup per plant",
            method: "soil-drench",
          },
        })
      );

      const kelpTask = tasks.find(t => t.details.product === "Liquid Kelp");
      expect(kelpTask).toEqual(
        expect.objectContaining({
          taskName: "Liquid Kelp Supplement",
          details: {
            type: "fertilize",
            product: "Liquid Kelp",
            dilution: "1 tbsp/gal",
            amount: "Light foliar spray",
            method: "foliar-spray",
          },
        })
      );
    });

    it("applies default values for missing details", async () => {
      const varietyWithDefaults = {
        ...mockVariety,
        protocols: {
          fertilization: {
            germination: {
              schedule: [
                {
                  startDays: 0,
                  taskName: "Basic Feed",
                  details: {
                    product: "Basic Fertilizer",
                    // Missing dilution, amount, method
                  },
                  frequencyDays: 7,
                  repeatCount: 1,
                },
              ],
            },
          },
        },
      };

      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockPlant,
        varietyWithDefaults as VarietyRecord
      );

      const task = tasks[0];
      expect(task.details).toEqual({
        type: "fertilize",
        product: "Basic Fertilizer",
        dilution: "As directed",
        amount: "Apply as needed",
        method: "soil-drench",
      });
    });

    it("correctly handles repeat count and frequency", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(mockPlant, mockVariety);

      // Fish Emulsion has repeatCount: 3, frequencyDays: 14
      const fishEmulsionTasks = tasks.filter(t => t.details.product === "Fish Emulsion");
      expect(fishEmulsionTasks).toHaveLength(3);

      // Check that tasks are spaced 14 days apart
      fishEmulsionTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      for (let i = 1; i < fishEmulsionTasks.length; i++) {
        const timeDiff = fishEmulsionTasks[i].dueDate.getTime() - fishEmulsionTasks[i - 1].dueDate.getTime();
        const daysDiff = timeDiff / (24 * 60 * 60 * 1000);
        expect(daysDiff).toBe(14);
      }
    });

    it("sets correct metadata for all tasks", async () => {
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(mockPlant, mockVariety);

      tasks.forEach(task => {
        expect(task.plantId).toBe(mockPlant.id);
        expect(task.taskType).toBe("fertilize");
        expect(task.status).toBe("pending");
        expect(task.priority).toBe("normal");
        expect(task.sourceProtocol.isDynamic).toBe(true);
        expect(task.createdAt).toBeInstanceOf(Date);
        expect(task.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe("edge cases", () => {
    it("handles variety with missing stages in protocol", async () => {
      const partialVariety = {
        ...mockVariety,
        protocols: {
          fertilization: {
            // Missing germination stage, only have vegetative
            vegetative: mockVariety.protocols!.fertilization!.vegetative,
            seedling: { schedule: [] },
            maturation: { schedule: [] },
          },
        },
      };

      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockPlant,
        partialVariety as unknown as VarietyRecord
      );

      // Should only have vegetative stage tasks
      const stages = [...new Set(tasks.map(t => t.sourceProtocol.stage))];
      expect(stages).toEqual(["vegetative"]);
    });

    it("handles empty schedule arrays", async () => {
      const emptyScheduleVariety = {
        ...mockVariety,
        protocols: {
          fertilization: {
            vegetative: {
              schedule: [], // Empty schedule
            },
          },
        },
      };

      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockPlant,
        emptyScheduleVariety as unknown as VarietyRecord
      );

      expect(tasks).toEqual([]);
    });

    it("handles tasks with zero repeat count", async () => {
      const zeroRepeatVariety = {
        ...mockVariety,
        protocols: {
          fertilization: {
            vegetative: {
              schedule: [
                {
                  startDays: 0,
                  taskName: "No Repeat Task",
                  details: {
                    product: "Test Fertilizer",
                    dilution: "1:10",
                    amount: "1 cup",
                    method: "soil-drench" as const,
                  },
                  frequencyDays: 14,
                  repeatCount: 0, // Zero repeats
                },
              ],
            },
          },
        },
      };

      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockPlant,
        zeroRepeatVariety as VarietyRecord
      );

      expect(tasks).toEqual([]);
    });
  });
});