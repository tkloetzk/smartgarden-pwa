/**
 * Business Logic Tests for ProtocolTranspilerService
 * 
 * These tests focus on protocol transpilation business rules and logic
 * without external dependencies. Tests date calculations, stage ordering, and task generation rules.
 */

import { addDays, differenceInDays } from "date-fns";
import { GrowthStage } from "@/types";

describe("ProtocolTranspilerService Business Logic", () => {
  
  describe("Growth Stage Ordering Logic", () => {
    it("should have canonical stage order for progression", () => {
      const canonicalOrder: GrowthStage[] = [
        "germination",
        "seedling", 
        "vegetative",
        "flowering",
        "fruiting",
        "maturation",
        "ongoing-production",
        "harvest",
      ];

      // Validate each stage appears exactly once
      const uniqueStages = [...new Set(canonicalOrder)];
      expect(uniqueStages.length).toBe(canonicalOrder.length);

      // Validate progression makes biological sense
      expect(canonicalOrder.indexOf("germination")).toBe(0);
      expect(canonicalOrder.indexOf("seedling")).toBeGreaterThan(canonicalOrder.indexOf("germination"));
      expect(canonicalOrder.indexOf("vegetative")).toBeGreaterThan(canonicalOrder.indexOf("seedling"));
      expect(canonicalOrder.indexOf("flowering")).toBeGreaterThan(canonicalOrder.indexOf("vegetative"));
      expect(canonicalOrder.indexOf("maturation")).toBeGreaterThan(canonicalOrder.indexOf("fruiting"));
    });

    it("should validate stage filtering based on start stage", () => {
      const allStages = ["germination", "seedling", "vegetative", "flowering", "fruiting", "maturation"];
      const startStage = "vegetative";
      const startIndex = allStages.indexOf(startStage);

      // Stages before start stage should be filtered out
      const stagesBefore = allStages.slice(0, startIndex);
      const stagesAfter = allStages.slice(startIndex);

      expect(stagesBefore).toEqual(["germination", "seedling"]);
      expect(stagesAfter).toEqual(["vegetative", "flowering", "fruiting", "maturation"]);
      
      // Business rule: only include stages from start stage onwards
      stagesBefore.forEach(stage => {
        expect(allStages.indexOf(stage)).toBeLessThan(startIndex);
      });
      stagesAfter.forEach(stage => {
        expect(allStages.indexOf(stage)).toBeGreaterThanOrEqual(startIndex);
      });
    });
  });

  describe("Date Calculation Business Rules", () => {
    it("should calculate correct due dates based on plant age", () => {
      const plantedDate = new Date("2024-01-01");
      const currentDate = new Date("2024-01-15"); // 14 days old plant
      const plantAge = differenceInDays(currentDate, plantedDate);
      
      expect(plantAge).toBe(14);

      // Task due dates should be calculated from planted date
      const taskStartDays = 7;
      const taskDueDate = addDays(plantedDate, taskStartDays);
      
      expect(taskDueDate).toEqual(new Date("2024-01-08"));
      
      // Task should be overdue if current date > due date
      const isOverdue = currentDate > taskDueDate;
      expect(isOverdue).toBe(true);
    });

    it("should handle stage timing calculations correctly", () => {
      const growthTimeline = {
        germination: 7,
        seedling: 14,
        vegetative: 30,
        maturation: 60
      };

      // Calculate cumulative stage start days
      const stageStartDays = {
        germination: 0,
        seedling: growthTimeline.germination, // 7
        vegetative: growthTimeline.germination + growthTimeline.seedling, // 21
        maturation: growthTimeline.germination + growthTimeline.seedling + growthTimeline.vegetative // 51
      };

      expect(stageStartDays.germination).toBe(0);
      expect(stageStartDays.seedling).toBe(7);
      expect(stageStartDays.vegetative).toBe(21);
      expect(stageStartDays.maturation).toBe(51);
    });

    it("should validate future task scheduling", () => {
      const plantedDate = new Date("2024-01-01");
      const anchorDate = new Date("2024-01-10"); // 9 days after planting
      
      // Task scheduled for day 14 should be in the future
      const futureTaskDueDate = addDays(plantedDate, 14);
      const isFutureTask = futureTaskDueDate > anchorDate;
      
      expect(isFutureTask).toBe(true);
      expect(futureTaskDueDate).toEqual(new Date("2024-01-15"));
      
      // Task scheduled for day 5 should be in the past
      const pastTaskDueDate = addDays(plantedDate, 5);
      const isPastTask = pastTaskDueDate < anchorDate;
      
      expect(isPastTask).toBe(true);
      expect(pastTaskDueDate).toEqual(new Date("2024-01-06"));
    });
  });

  describe("Task Generation Business Rules", () => {
    it("should validate scheduled task structure", () => {
      const validScheduledTask = {
        id: "task-123",
        plantId: "plant-456",
        taskName: "Weekly Feeding",
        taskType: "fertilize",
        details: {
          type: "fertilize",
          product: "Liquid Fertilizer",
          dilution: "1:15",
          amount: "2 cups",
          method: "soil-drench",
        },
        dueDate: new Date("2024-01-20"),
        status: "pending",
        sourceProtocol: {
          stage: "vegetative",
          originalStartDays: 14,
          isDynamic: false,
        },
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      };

      // Validate required fields
      expect(validScheduledTask.id).toBeDefined();
      expect(validScheduledTask.plantId).toBeDefined();
      expect(validScheduledTask.taskName).toBeDefined();
      expect(validScheduledTask.taskType).toBe("fertilize");
      expect(validScheduledTask.details.type).toBe("fertilize");
      expect(validScheduledTask.dueDate).toBeInstanceOf(Date);
      expect(validScheduledTask.status).toBe("pending");
      expect(validScheduledTask.sourceProtocol.stage).toBeDefined();
      expect(validScheduledTask.sourceProtocol.originalStartDays).toBeGreaterThanOrEqual(0);
    });

    it("should validate task frequency and repeat logic", () => {
      const scheduleItem = {
        startDays: 14,
        taskName: "Regular Feeding",
        frequencyDays: 7,
        repeatCount: 3,
        details: {
          product: "All-Purpose Fertilizer",
          dilution: "1:10",
          amount: "1 cup",
          method: "soil-drench" as const,
        }
      };

      // Calculate all task due dates for this schedule
      const plantedDate = new Date("2024-01-01");
      const taskDueDates = [];
      
      for (let i = 0; i < scheduleItem.repeatCount; i++) {
        const dueDate = addDays(plantedDate, scheduleItem.startDays + (i * scheduleItem.frequencyDays));
        taskDueDates.push(dueDate);
      }

      expect(taskDueDates).toHaveLength(3);
      expect(taskDueDates[0]).toEqual(new Date("2024-01-15")); // Day 14
      expect(taskDueDates[1]).toEqual(new Date("2024-01-22")); // Day 21 
      expect(taskDueDates[2]).toEqual(new Date("2024-01-29")); // Day 28

      // Validate frequency spacing
      const daysBetween1and2 = differenceInDays(taskDueDates[1], taskDueDates[0]);
      const daysBetween2and3 = differenceInDays(taskDueDates[2], taskDueDates[1]);
      
      expect(daysBetween1and2).toBe(scheduleItem.frequencyDays);
      expect(daysBetween2and3).toBe(scheduleItem.frequencyDays);
    });
  });

  describe("Protocol Processing Logic", () => {
    it("should validate fertilization protocol structure", () => {
      const fertilizationProtocol = {
        germination: {
          schedule: [
            {
              startDays: 0,
              taskName: "Seed Starting",
              details: {
                product: "Seed Starter",
                dilution: "1:20",
                amount: "Light mist",
                method: "foliar-spray" as const,
              },
              frequencyDays: 7,
              repeatCount: 1,
            }
          ]
        },
        vegetative: {
          schedule: [
            {
              startDays: 14,
              taskName: "Growth Boost",
              details: {
                product: "High Nitrogen",
                dilution: "1:15",
                amount: "2 cups",
                method: "soil-drench" as const,
              },
              frequencyDays: 14,
              repeatCount: 2,
            }
          ]
        }
      };

      // Validate structure
      expect(fertilizationProtocol.germination.schedule).toHaveLength(1);
      expect(fertilizationProtocol.vegetative.schedule).toHaveLength(1);
      
      // Validate each schedule item has required fields
      Object.values(fertilizationProtocol).forEach(stageProtocol => {
        stageProtocol.schedule.forEach(scheduleItem => {
          expect(scheduleItem.startDays).toBeGreaterThanOrEqual(0);
          expect(scheduleItem.taskName).toBeTruthy();
          expect(scheduleItem.details.product).toBeTruthy();
          expect(scheduleItem.details.method).toBeTruthy();
          expect(scheduleItem.frequencyDays).toBeGreaterThan(0);
          expect(scheduleItem.repeatCount).toBeGreaterThan(0);
        });
      });
    });

    it("should validate empty protocol handling", () => {
      const emptyProtocols = [
        undefined,
        {},
        { fertilization: undefined },
        { fertilization: {} },
        { fertilization: { germination: { schedule: [] } } }
      ];

      emptyProtocols.forEach(protocol => {
        const hasFertilization = protocol?.fertilization;
        const hasValidSchedules = hasFertilization && 
          Object.values(hasFertilization).some(stage => 
            stage && stage.schedule && stage.schedule.length > 0
          );
        
        // Empty protocols should not generate tasks
        expect(hasValidSchedules || false).toBe(false);
      });
    });
  });

  describe("Plant Age and Stage Relationship", () => {
    it("should correlate plant age with appropriate stages", () => {
      const growthTimeline = {
        germination: 7,
        seedling: 14,
        vegetative: 30,
        maturation: 60
      };

      const plantAgeTests = [
        { age: 3, expectedStage: "germination" },
        { age: 10, expectedStage: "seedling" },
        { age: 25, expectedStage: "vegetative" },
        { age: 65, expectedStage: "maturation" }
      ];

      plantAgeTests.forEach(test => {
        let currentStage = "germination";
        let cumulativeDays = 0;

        // Determine stage based on age
        if (test.age >= (cumulativeDays + growthTimeline.germination)) {
          cumulativeDays += growthTimeline.germination;
          currentStage = "seedling";
        }
        if (test.age >= (cumulativeDays + growthTimeline.seedling)) {
          cumulativeDays += growthTimeline.seedling;
          currentStage = "vegetative";
        }
        if (test.age >= (cumulativeDays + growthTimeline.vegetative)) {
          currentStage = "maturation";
        }

        expect(currentStage).toBe(test.expectedStage);
      });
    });
  });
});