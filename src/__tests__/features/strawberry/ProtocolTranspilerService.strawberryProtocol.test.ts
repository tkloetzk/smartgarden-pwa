// src/__tests__/services/ProtocolTranspilerService.strawberryProtocol.test.ts
/**
 * Test the protocol transpiler specifically for the updated strawberry protocol
 * to ensure Neptune's Harvest and 9-15-30 tasks are generated correctly
 */

import { ProtocolTranspilerService } from "@/services/ProtocolTranspilerService";
import { PlantRecord } from "@/types";
import { seedVarieties } from "@/data/seedVarieties";
import { addDays } from "date-fns";

describe("ProtocolTranspilerService - Strawberry Protocol", () => {
  const mockPlantedDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
  
  const mockStrawberryPlant: PlantRecord = {
    id: "strawberry-test",
    varietyId: "strawberry-albion",
    varietyName: "Albion Strawberry",
    name: "Test Strawberries",
    plantedDate: mockPlantedDate,
    location: "Indoor",
    container: "Grow Bag",
    soilMix: "Potting Mix",
    isActive: true,
    quantity: 1,
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

  // Convert seedVariety to VarietyRecord format
  const getStrawberryVariety = () => {
    const seedVariety = seedVarieties.find(v => v.name.includes("Albion"));
    if (!seedVariety) {
      throw new Error("Strawberry variety not found in seed data");
    }

    return {
      id: "strawberry-albion",
      name: seedVariety.name,
      normalizedName: seedVariety.name.toLowerCase(),
      category: seedVariety.category,
      description: undefined,
      growthTimeline: {
        germination: seedVariety.growthTimeline.germination || 14,
        seedling: seedVariety.growthTimeline.establishment || seedVariety.growthTimeline.seedling || 14,
        vegetative: seedVariety.growthTimeline.vegetative || 28,
        maturation: seedVariety.growthTimeline.maturation || seedVariety.growthTimeline.fruiting || 91,
        rootDevelopment: seedVariety.growthTimeline.rootDevelopment,
      },
      protocols: seedVariety.protocols,
      isEverbearing: seedVariety.isEverbearing,
      productiveLifespan: seedVariety.productiveLifespan,
      isCustom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  describe("Strawberry Fertilization Protocol", () => {
    it("should generate Neptune's Harvest tasks starting at day 120", async () => {
      const variety = getStrawberryVariety();
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockStrawberryPlant,
        variety
      );

      const neptuneTasks = tasks.filter(task => 
        task.taskName.includes("Neptune's Harvest")
      );

      expect(neptuneTasks.length).toBeGreaterThan(0);
      
      // For a 100-day old plant, should have upcoming Neptune's Harvest tasks
      const firstNeptuneTask = neptuneTasks[0];
      
      // Task should be scheduled for the future (not in the past)
      expect(firstNeptuneTask.dueDate.getTime()).toBeGreaterThan(Date.now());
      expect(firstNeptuneTask.details.product).toBe("Neptune's Harvest");
      expect(firstNeptuneTask.details.dilution).toBe("1 tbsp/gallon");
      expect(firstNeptuneTask.details.amount).toBe("1-2 quarts per grow bag");
      expect(firstNeptuneTask.details.method).toBe("soil-drench");
    });

    it("should generate 9-15-30 fertilizer tasks starting at day 127", async () => {
      const variety = getStrawberryVariety();
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockStrawberryPlant,
        variety
      );

      const fertilizer930Tasks = tasks.filter(task => 
        task.taskName.includes("9-15-30 Fertilizer")
      );

      expect(fertilizer930Tasks.length).toBeGreaterThan(0);
      
      // First 9-15-30 task should be due on day 127
      const firstFertilizerTask = fertilizer930Tasks[0];
      const expectedDate = addDays(mockPlantedDate, 127);
      
      expect(firstFertilizerTask.dueDate).toEqual(expectedDate);
      expect(firstFertilizerTask.details.product).toBe("9-15-30 fertilizer");
      expect(firstFertilizerTask.details.dilution).toBe("As directed");
      expect(firstFertilizerTask.details.amount).toBe("1-2 quarts per grow bag");
      expect(firstFertilizerTask.details.method).toBe("soil-drench");
    });

    it("should generate weekly Neptune's Harvest tasks", async () => {
      const variety = getStrawberryVariety();
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockStrawberryPlant,
        variety
      );

      const neptuneTasks = tasks.filter(task => 
        task.taskName.includes("Neptune's Harvest")
      ).slice(0, 5); // Check first 5 tasks

      // Tasks should be 7 days apart (weekly)
      for (let i = 1; i < neptuneTasks.length; i++) {
        const prevTask = neptuneTasks[i - 1];
        const currentTask = neptuneTasks[i];
        
        const daysDiff = Math.round(
          (currentTask.dueDate.getTime() - prevTask.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        expect(daysDiff).toBe(7);
      }
    });

    it("should generate biweekly 9-15-30 fertilizer tasks", async () => {
      const variety = getStrawberryVariety();
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockStrawberryPlant,
        variety
      );

      const fertilizer930Tasks = tasks.filter(task => 
        task.taskName.includes("9-15-30 Fertilizer")
      ).slice(0, 5); // Check first 5 tasks

      // Tasks should be 14 days apart (biweekly)
      for (let i = 1; i < fertilizer930Tasks.length; i++) {
        const prevTask = fertilizer930Tasks[i - 1];
        const currentTask = fertilizer930Tasks[i];
        
        const daysDiff = Math.round(
          (currentTask.dueDate.getTime() - prevTask.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        expect(daysDiff).toBe(14);
      }
    });

    it("should generate correct number of tasks for a full year", async () => {
      const variety = getStrawberryVariety();
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockStrawberryPlant,
        variety
      );

      const neptuneTasks = tasks.filter(task => 
        task.taskName.includes("Neptune's Harvest")
      );
      
      const fertilizer930Tasks = tasks.filter(task => 
        task.taskName.includes("9-15-30 Fertilizer")
      );

      // Neptune's Harvest: weekly for 52 weeks = 52 tasks
      expect(neptuneTasks.length).toBe(52);
      
      // 9-15-30: biweekly for 52 weeks = 26 tasks
      expect(fertilizer930Tasks.length).toBe(26);
    });

    it("should set correct source protocol information", async () => {
      const variety = getStrawberryVariety();
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockStrawberryPlant,
        variety
      );

      const allFertilizationTasks = tasks.filter(task => task.taskType === "fertilize");

      for (const task of allFertilizationTasks) {
        expect(task.sourceProtocol.stage).toBe("ongoingProduction");
        expect(task.sourceProtocol.isDynamic).toBe(true); // Protocol-generated tasks are dynamic
        expect([120, 127]).toContain(task.sourceProtocol.originalStartDays);
      }
    });

    it("should handle different plant ages correctly", async () => {
      // Test with a plant that's already 200 days old
      const olderPlant = {
        ...mockStrawberryPlant,
        plantedDate: addDays(new Date(), -200), // 200 days ago
      };

      const variety = getStrawberryVariety();
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        olderPlant,
        variety
      );

      const allTasks = tasks.filter(task => task.taskType === "fertilize");

      // Should still generate tasks, some may be in the past (overdue)
      expect(allTasks.length).toBeGreaterThan(0);
      
      // Check that some tasks are overdue for older plants
      const overdueTasks = allTasks.filter(task => task.dueDate < new Date());
      expect(overdueTasks.length).toBeGreaterThan(0);
    });
  });

  describe("Protocol Structure Validation", () => {
    it("should have correct protocol structure in seed varieties", () => {
      const strawberryVariety = seedVarieties.find(v => v.name.includes("Albion"));
      
      expect(strawberryVariety).toBeDefined();
      expect(strawberryVariety?.protocols?.fertilization).toBeDefined();
      expect(strawberryVariety?.protocols?.fertilization?.ongoingProduction).toBeDefined();
      
      const protocol = strawberryVariety?.protocols?.fertilization?.ongoingProduction;
      expect(protocol?.schedule).toHaveLength(2);
      
      // Check Neptune's Harvest task
      const neptuneTask = protocol?.schedule?.find(task => 
        task.taskName.includes("Neptune's Harvest")
      );
      expect(neptuneTask).toEqual({
        taskName: "Apply Neptune's Harvest",
        details: {
          product: "Neptune's Harvest",
          dilution: "1 tbsp/gallon",
          amount: "1-2 quarts per grow bag",
          method: "soil-drench",
        },
        startDays: 120,
        frequencyDays: 7,
        repeatCount: 52,
      });
      
      // Check 9-15-30 task
      const fertilizer930Task = protocol?.schedule?.find(task => 
        task.taskName.includes("9-15-30 Fertilizer")
      );
      expect(fertilizer930Task).toEqual({
        taskName: "Apply 9-15-30 Fertilizer (during fruiting periods)",
        details: {
          product: "9-15-30 fertilizer",
          dilution: "As directed",
          amount: "1-2 quarts per grow bag",
          method: "soil-drench",
        },
        startDays: 127,
        frequencyDays: 14,
        repeatCount: 26,
      });
    });

    it("should not have duplicate or conflicting protocols", () => {
      const strawberryVariety = seedVarieties.find(v => v.name.includes("Albion"));
      
      expect(strawberryVariety).toBeDefined();
      
      const fertilizationProtocol = strawberryVariety?.protocols?.fertilization;
      
      // Should have protocols for multiple stages including ongoingProduction
      expect(Object.keys(fertilizationProtocol || {})).toContain("ongoingProduction");
      expect(Object.keys(fertilizationProtocol || {})).toContain("establishment");
      expect(Object.keys(fertilizationProtocol || {})).toContain("vegetative");
      expect(Object.keys(fertilizationProtocol || {})).toContain("flowering");
      expect(Object.keys(fertilizationProtocol || {})).toContain("fruiting");
    });
  });

  describe("Growth Stage Integration", () => {
    it("should only generate ongoing production tasks for strawberries", async () => {
      const variety = getStrawberryVariety();
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockStrawberryPlant,
        variety
      );

      const fertilizationTasks = tasks.filter(task => task.taskType === "fertilize");
      
      // All fertilization tasks should be from ongoing production stage
      for (const task of fertilizationTasks) {
        expect(task.sourceProtocol.stage).toBe("ongoingProduction");
      }
    });

    it("should calculate correct timing based on growth timeline", async () => {
      const variety = getStrawberryVariety();
      const timeline = variety.growthTimeline;
      
      // Calculate expected start of ongoing production
      const expectedOngoingStart = 
        (timeline.germination || 0) +
        (timeline.seedling || 0) + 
        (timeline.vegetative || 0) +
        (timeline.maturation || 0);
      
      // For transformed Albion strawberries: 14 + 14 + 28 + (maturation includes the rest) 
      // Based on the getStrawberryVariety transformation
      expect(expectedOngoingStart).toBeGreaterThan(40);
      
      const tasks = await ProtocolTranspilerService.transpilePlantProtocol(
        mockStrawberryPlant,
        variety
      );

      const fertilizationTasks = tasks.filter(task => task.taskType === "fertilize");
      
      // First fertilization task should be at day 120 (91 + 29 days into ongoing production)
      const firstTask = fertilizationTasks[0];
      const expectedFirstTaskDate = addDays(mockPlantedDate, 120);
      
      expect(firstTask.dueDate).toEqual(expectedFirstTaskDate);
    });
  });
});