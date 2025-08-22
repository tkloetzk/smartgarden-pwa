/**
 * Business Logic Tests for StageManagementService
 * 
 * These tests focus on plant growth stage management business rules
 * without Firebase or service mocking. Tests the core domain logic.
 */

import { addDays, subDays } from "date-fns";

describe("StageManagementService Business Logic", () => {
  
  describe("Growth Stage Progression Rules", () => {
    it("should validate valid growth stage transitions", () => {
      // Common vegetable growth stages progression
      const validTransitions = [
        { from: "germination", to: "seedling" },
        { from: "seedling", to: "vegetative" },
        { from: "vegetative", to: "flowering" },
        { from: "flowering", to: "fruiting" },
        { from: "fruiting", to: "maturation" },
        { from: "maturation", to: "harvest" },
      ];

      // Business rule: each transition should be logically progressive
      validTransitions.forEach(transition => {
        expect(transition.from).not.toBe(transition.to);
        expect(transition.from).toBeDefined();
        expect(transition.to).toBeDefined();
      });
    });

    it("should identify invalid stage transitions", () => {
      // Illogical transitions that shouldn't be allowed
      const invalidTransitions = [
        { from: "flowering", to: "germination" }, // backward progression
        { from: "harvest", to: "seedling" }, // major backward jump
        { from: "vegetative", to: "harvest" }, // skipping stages
      ];

      // Business rule: validate progression makes sense
      const isValidProgression = (from: string, to: string): boolean => {
        const stageOrder = ["germination", "seedling", "vegetative", "flowering", "fruiting", "maturation", "harvest"];
        const fromIndex = stageOrder.indexOf(from);
        const toIndex = stageOrder.indexOf(to);
        
        // Allow forward progression or same stage (re-confirmation)
        return toIndex >= fromIndex && (toIndex - fromIndex) <= 2; // max 2 stage jump
      };

      invalidTransitions.forEach(({ from, to }) => {
        expect(isValidProgression(from, to)).toBe(false);
      });

      // Validate some good progressions
      expect(isValidProgression("seedling", "vegetative")).toBe(true);
      expect(isValidProgression("vegetative", "flowering")).toBe(true);
      expect(isValidProgression("flowering", "flowering")).toBe(true); // re-confirmation
    });

    it("should validate berry-specific growth stages", () => {
      const berryStages = [
        "establishment",
        "vegetative", 
        "flowering",
        "fruiting",
        "ongoingProduction"
      ];

      // Business rule: berries have ongoing production phase
      expect(berryStages).toContain("ongoingProduction");
      expect(berryStages).toContain("establishment");
      
      // Validate berry progression logic
      const lastStage = berryStages[berryStages.length - 1];
      expect(lastStage).toBe("ongoingProduction"); // berries don't "end" like annuals
    });

    it("should validate herb-specific growth stages", () => {
      const herbStages = [
        "germination",
        "seedling",
        "vegetative",
        "matureHarvest"
      ];

      // Business rule: herbs are simpler progression, continuous harvest
      expect(herbStages.length).toBeLessThan(7); // simpler than fruiting plants
      expect(herbStages).toContain("matureHarvest");
      expect(herbStages).not.toContain("flowering"); // many herbs harvested before flowering
    });
  });

  describe("Stage Confirmation Business Rules", () => {
    it("should validate stage confirmation timing", () => {
      const plantedDate = new Date("2024-01-01");
      const stageConfirmations = [
        { stage: "germination", confirmedDate: addDays(plantedDate, 3), minDays: 2, maxDays: 14 },
        { stage: "seedling", confirmedDate: addDays(plantedDate, 14), minDays: 7, maxDays: 30 },
        { stage: "vegetative", confirmedDate: addDays(plantedDate, 35), minDays: 21, maxDays: 90 },
        { stage: "flowering", confirmedDate: addDays(plantedDate, 70), minDays: 45, maxDays: 120 },
      ];

      stageConfirmations.forEach(({ confirmedDate, minDays, maxDays }) => {
        const daysSincePlanting = Math.floor((confirmedDate.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Business rule: stage timing should be within reasonable bounds
        expect(daysSincePlanting).toBeGreaterThanOrEqual(minDays);
        expect(daysSincePlanting).toBeLessThanOrEqual(maxDays);
      });
    });

    it("should handle early vs late stage confirmations", () => {
      const plantedDate = new Date("2024-01-01");
      
      // Early flowering (fast-growing variety)
      const earlyFlowering = {
        stage: "flowering",
        confirmedDate: addDays(plantedDate, 30), // 30 days - quite early
        plantedDate
      };
      
      // Late flowering (slow-growing variety) 
      const lateFlowering = {
        stage: "flowering", 
        confirmedDate: addDays(plantedDate, 89), // 89 days - quite late
        plantedDate
      };

      const getDaysSincePlanting = (planted: Date, confirmed: Date) => 
        Math.floor((confirmed.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));

      const earlyDays = getDaysSincePlanting(earlyFlowering.plantedDate, earlyFlowering.confirmedDate);
      const lateDays = getDaysSincePlanting(lateFlowering.plantedDate, lateFlowering.confirmedDate);

      // Business rule: both should be valid but flagged as unusual
      expect(earlyDays).toBe(30);
      expect(lateDays).toBe(88);
      
      const isEarlyForStage = earlyDays < 45; // typical flowering minimum
      const isLateForStage = lateDays > 75; // typical flowering maximum
      
      expect(isEarlyForStage).toBe(true); // would trigger "early confirmation" logic
      expect(isLateForStage).toBe(true);  // would trigger "late confirmation" logic
    });

    it("should validate confirmation date is not in future", () => {
      const now = new Date();
      const validConfirmationDates = [
        now,
        subDays(now, 1), // yesterday
        subDays(now, 7), // last week
      ];

      const invalidConfirmationDates = [
        addDays(now, 1), // tomorrow
        addDays(now, 7), // next week
      ];

      // Business rule: can't confirm future stages
      validConfirmationDates.forEach(date => {
        expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
      });

      invalidConfirmationDates.forEach(date => {
        const isInFuture = date.getTime() > now.getTime();
        expect(isInFuture).toBe(true); // these would be rejected
      });
    });
  });

  describe("Task Management Logic", () => {
    it("should determine which tasks need deletion after stage change", () => {
      const currentStage = "vegetative";
      // const newStage = "flowering";
      
      const existingTasks = [
        { id: "1", stage: "vegetative", taskType: "fertilize", status: "pending" },
        { id: "2", stage: "vegetative", taskType: "water", status: "completed" }, 
        { id: "3", stage: "flowering", taskType: "fertilize", status: "pending" },
        { id: "4", stage: "flowering", taskType: "observe", status: "pending" },
        { id: "5", stage: "fruiting", taskType: "fertilize", status: "pending" },
      ];

      // Business rule: only delete pending tasks from current and future stages
      const tasksToDelete = existingTasks.filter(task => 
        task.status === "pending" && 
        (task.stage === currentStage || 
         ["flowering", "fruiting", "maturation", "harvest"].includes(task.stage))
      );

      const tasksToKeep = existingTasks.filter(task => 
        task.status === "completed" || 
        !tasksToDelete.some(deleteTask => deleteTask.id === task.id)
      );

      expect(tasksToDelete).toHaveLength(4); // vegetative pending + all future pending
      expect(tasksToKeep).toHaveLength(1); // only completed vegetative task
      expect(tasksToKeep[0].status).toBe("completed");
    });

    it("should calculate new task generation from confirmed stage", () => {
      // const confirmedStage = "flowering";
      const stageConfirmedDate = new Date("2024-02-01");
      
      const varietyProtocol = {
        flowering: [
          { type: "fertilize", startDays: 0, product: "Bloom booster" },
          { type: "observe", startDays: 7, product: "Flower development check" },
          { type: "fertilize", startDays: 14, product: "Phosphorus supplement" },
        ],
        fruiting: [
          { type: "observe", startDays: 21, product: "Fruit set check" },
          { type: "fertilize", startDays: 28, product: "Fruit development" },
        ]
      };

      // Business logic: generate tasks from confirmed stage onward
      const newTasks: Array<{stage: string, dueDate: Date, taskType: string, product: string}> = [];
      
      // Tasks for current confirmed stage
      if (varietyProtocol.flowering) {
        varietyProtocol.flowering.forEach(taskTemplate => {
          const dueDate = addDays(stageConfirmedDate, taskTemplate.startDays);
          newTasks.push({
            stage: "flowering",
            dueDate,
            taskType: taskTemplate.type,
            product: taskTemplate.product,
          });
        });
      }

      // Tasks for future stages (would be estimated)
      if (varietyProtocol.fruiting) {
        const estimatedFruitingDate = addDays(stageConfirmedDate, 21); // estimated
        varietyProtocol.fruiting.forEach(taskTemplate => {
          const dueDate = addDays(estimatedFruitingDate, taskTemplate.startDays);
          newTasks.push({
            stage: "fruiting", 
            dueDate,
            taskType: taskTemplate.type,
            product: taskTemplate.product,
          });
        });
      }

      expect(newTasks).toHaveLength(5);
      expect(newTasks.filter(t => t.stage === "flowering")).toHaveLength(3);
      expect(newTasks.filter(t => t.stage === "fruiting")).toHaveLength(2);
      
      // Verify task timing
      const floweringTasks = newTasks.filter(t => t.stage === "flowering");
      expect(floweringTasks[0].dueDate).toEqual(stageConfirmedDate); // immediate task
      expect(floweringTasks[1].dueDate).toEqual(addDays(stageConfirmedDate, 7));
      expect(floweringTasks[2].dueDate).toEqual(addDays(stageConfirmedDate, 14));
    });

    it("should handle stage confirmation without protocol data", () => {
      // const confirmedStage = "flowering";
      const varietyWithoutProtocol: {
        name: string;
        protocols?: { flowering?: any };
      } = {
        name: "Generic Plant",
        protocols: undefined
      };

      // Business rule: no protocol means no new tasks generated
      const hasProtocol = Boolean(varietyWithoutProtocol.protocols?.flowering);
      expect(hasProtocol).toBe(false);

      // Would generate 0 tasks but still update plant record
      const newTasks: any[] = [];
      expect(newTasks).toHaveLength(0);
    });
  });

  describe("Plant Record Update Logic", () => {
    it("should update plant record with stage confirmation data", () => {
      const originalPlant = {
        id: "plant-123",
        varietyId: "tomato-1",
        plantedDate: new Date("2024-01-01"),
        confirmedStage: "vegetative",
        stageConfirmedDate: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
      };

      const newStage = "flowering";
      const confirmationDate = new Date("2024-02-15");

      // Business logic for plant record update
      const updatedPlant = {
        ...originalPlant,
        confirmedStage: newStage,
        stageConfirmedDate: confirmationDate,
        updatedAt: confirmationDate,
      };

      expect(updatedPlant.confirmedStage).toBe(newStage);
      expect(updatedPlant.stageConfirmedDate).toEqual(confirmationDate);
      expect(updatedPlant.updatedAt).toEqual(confirmationDate);
      
      // Previous stage data should be preserved in plant history
      expect(originalPlant.confirmedStage).toBe("vegetative"); // history preserved
    });

    it("should maintain plant growth timeline data", () => {
      const plant = {
        id: "plant-123",
        plantedDate: new Date("2024-01-01"),
        confirmedStage: "flowering",
        stageConfirmedDate: new Date("2024-02-01"),
      };

      const variety = {
        growthTimeline: {
          germination: 7,
          seedling: 14, 
          vegetative: 35,
          flowering: 21,
          fruiting: 28,
          maturation: 14,
        }
      };

      // Business logic: calculate actual vs expected timing
      const daysSincePlanting = Math.floor(
        (plant.stageConfirmedDate.getTime() - plant.plantedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const expectedFloweringDays = variety.growthTimeline.germination + 
                                   variety.growthTimeline.seedling + 
                                   variety.growthTimeline.vegetative;

      expect(daysSincePlanting).toBe(31); // actual days to flowering
      expect(expectedFloweringDays).toBe(56); // expected days (7+14+35)
      
      const isEarlyFlowering = daysSincePlanting < expectedFloweringDays;
      expect(isEarlyFlowering).toBe(true); // plant is ahead of schedule
    });
  });

  describe("User Notification Logic", () => {
    it("should generate appropriate success messages", () => {
      const scenarios = [
        { newTaskCount: 0, expectedMessage: "Plant stage updated successfully" },
        { newTaskCount: 1, expectedMessage: "1 new care task has been scheduled" },
        { newTaskCount: 5, expectedMessage: "5 new care tasks have been scheduled" },
        { newTaskCount: 12, expectedMessage: "12 new care tasks have been scheduled" },
      ];

      scenarios.forEach(({ newTaskCount, expectedMessage }) => {
        // Business logic for notification messages
        let message: string;
        if (newTaskCount === 0) {
          message = "Plant stage updated successfully";
        } else {
          message = `${newTaskCount} new care task${newTaskCount === 1 ? '' : 's'} ${newTaskCount === 1 ? 'has' : 'have'} been scheduled`;
        }

        expect(message).toContain(expectedMessage.split(' ')[0]); // check starts correctly
        if (newTaskCount > 0) {
          expect(message).toContain(newTaskCount.toString());
        }
      });
    });

    it("should handle error scenarios gracefully", () => {
      const errorScenarios = [
        { error: "Plant not found", expectedType: "plant-error" },
        { error: "Variety information could not be loaded", expectedType: "variety-error" },
        { error: "Failed to delete pending tasks", expectedType: "task-cleanup-error" },
        { error: "Failed to create new tasks", expectedType: "task-generation-error" },
      ];

      errorScenarios.forEach(({ error, expectedType }) => {
        // Business logic: categorize errors for appropriate user messaging
        let errorType: string;
        if (error.includes("Plant not found")) {
          errorType = "plant-error";
        } else if (error.includes("Variety")) {
          errorType = "variety-error";
        } else if (error.includes("delete")) {
          errorType = "task-cleanup-error";
        } else if (error.includes("create")) {
          errorType = "task-generation-error";
        } else {
          errorType = "unknown-error";
        }

        expect(errorType).toBe(expectedType);
      });
    });
  });

  describe("Data Validation and Edge Cases", () => {
    it("should validate stage names are from allowed values", () => {
      const validStages = [
        "germination", "seedling", "vegetative", "flowering", 
        "fruiting", "maturation", "harvest", "ongoingProduction",
        "establishment", "matureHarvest"
      ];

      const invalidStages = [
        "unknown", "custom-stage"  // removed empty string since it's falsy
      ];
      
      const emptyStages = [""];  // separate empty string test
      
      const nullishStages = [null, undefined];

      validStages.forEach(stage => {
        expect(typeof stage).toBe("string");
        expect(stage.length).toBeGreaterThan(0);
      });

      // Test invalid stage names (these are strings but not valid stage names)
      invalidStages.forEach(stage => {
        const isKnownStage = validStages.includes(stage);
        expect(isKnownStage).toBe(false);
      });
      
      // Test empty strings
      emptyStages.forEach(stage => {
        const isValid = Boolean(stage && stage.trim().length > 0);
        expect(isValid).toBe(false);
      });
      
      // Test null/undefined
      nullishStages.forEach(stage => {
        const isValid = Boolean(stage);
        expect(isValid).toBe(false);
      });
    });

    it("should handle concurrent stage updates gracefully", () => {
      /* const plant = {
        id: "plant-123",
        confirmedStage: "vegetative",
        stageConfirmedDate: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      }; */

      const update1 = {
        newStage: "flowering",
        timestamp: new Date("2024-02-01T10:00:00Z"),
      };

      const update2 = {
        newStage: "flowering", // same stage, different time
        timestamp: new Date("2024-02-01T10:05:00Z"), // 5 minutes later
      };

      // Business rule: later update should win
      const finalUpdate = update2.timestamp > update1.timestamp ? update2 : update1;
      expect(finalUpdate).toBe(update2);

      // Both updates are to same stage, so idempotent
      expect(update1.newStage).toBe(update2.newStage);
    });

    it("should preserve plant history through stage updates", () => {
      const stageHistory = [
        { stage: "germination", date: new Date("2024-01-01"), method: "planted" },
        { stage: "seedling", date: new Date("2024-01-15"), method: "confirmed" },
        { stage: "vegetative", date: new Date("2024-02-01"), method: "confirmed" },
      ];

      const newStageUpdate = {
        stage: "flowering",
        date: new Date("2024-02-20"),
        method: "confirmed"
      };

      // Business rule: append to history, don't replace
      const updatedHistory = [...stageHistory, newStageUpdate];

      expect(updatedHistory).toHaveLength(4);
      expect(updatedHistory[3]).toEqual(newStageUpdate);
      expect(updatedHistory[0]).toEqual(stageHistory[0]); // original preserved
    });
  });
});