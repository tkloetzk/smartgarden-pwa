// src/__tests__/services/firebase/plantService.taskGeneration.test.ts
/**
 * Business logic test for plant service task generation
 * Tests the core logic of plant-to-task protocol relationships
 * and fertilization schedule validation
 */

import { seedVarieties } from "@/data/seedVarieties";
import { PlantRecord } from "@/types";

describe("Plant Service Task Generation Business Logic", () => {
  // Mock test data based on real strawberry variety
  const mockStrawberryPlant: PlantRecord = {
    id: "plant-123",
    varietyId: "strawberry-albion",
    varietyName: "Albion Strawberries",
    name: "My Strawberries",
    plantedDate: new Date("2024-01-01"),
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

  describe("Strawberry Plant Protocol Validation", () => {
    it("should have correct fertilization protocol for Albion strawberries", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      
      expect(strawberryVariety).toBeDefined();
      expect(strawberryVariety?.protocols?.fertilization).toBeDefined();
      
      const fertilizationProtocol = strawberryVariety?.protocols?.fertilization;
      expect(fertilizationProtocol?.ongoingProduction).toBeDefined();
      
      const ongoingProductionSchedule = fertilizationProtocol?.ongoingProduction?.schedule;
      expect(ongoingProductionSchedule).toBeInstanceOf(Array);
      expect(ongoingProductionSchedule?.length).toBeGreaterThan(0);
    });

    it("should have Neptune's Harvest and 9-15-30 fertilizer tasks", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      const schedule = strawberryVariety?.protocols?.fertilization?.ongoingProduction?.schedule;
      
      const neptuneTask = schedule?.find(task => 
        task.taskName === "Apply Neptune's Harvest"
      );
      const fertilizer930Task = schedule?.find(task => 
        task.taskName === "Apply 9-15-30 Fertilizer (during fruiting periods)"
      );
      
      expect(neptuneTask).toBeDefined();
      expect(neptuneTask?.startDays).toBe(120);
      expect(neptuneTask?.frequencyDays).toBe(7);
      
      expect(fertilizer930Task).toBeDefined();
      expect(fertilizer930Task?.startDays).toBe(127);
      expect(fertilizer930Task?.frequencyDays).toBe(14);
    });

    it("should verify plant matches expected variety", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === mockStrawberryPlant.varietyName);
      
      expect(strawberryVariety).toBeDefined();
      expect(strawberryVariety?.name).toBe("Albion Strawberries");
      expect(strawberryVariety?.category).toBe("berries");
      expect(strawberryVariety?.protocols?.fertilization).toBeDefined();
    });
  });

  describe("Plant Growth Timeline Validation", () => {
    it("should have correct growth stages for strawberry variety", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      
      expect(strawberryVariety?.growthTimeline).toBeDefined();
      expect(strawberryVariety?.growthTimeline.germination).toBeDefined();
      expect(strawberryVariety?.growthTimeline.vegetative).toBeDefined();
      expect(strawberryVariety?.growthTimeline.flowering).toBeDefined();
      expect(strawberryVariety?.growthTimeline.fruiting).toBeDefined();
    });

    it("should have everbearing characteristics for strawberries", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      
      expect(strawberryVariety?.isEverbearing).toBe(true);
      expect(strawberryVariety?.productiveLifespan).toBeDefined();
      
      // Check if productiveLifespan has expected structure
      if (typeof strawberryVariety?.productiveLifespan === 'object' && strawberryVariety?.productiveLifespan !== null) {
        expect(strawberryVariety?.productiveLifespan).toHaveProperty('value');
      } else {
        // Might be a simple number value
        expect(strawberryVariety?.productiveLifespan).toBeGreaterThan(0);
      }
    });

    it("should calculate correct plant age for task generation", () => {
      const plantAge = Math.floor(
        (new Date().getTime() - mockStrawberryPlant.plantedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Plant from January 1st, 2024 should be quite mature by now
      expect(plantAge).toBeGreaterThan(200);
      
      // Should be well into ongoingProduction stage (starts at day 91)
      expect(plantAge).toBeGreaterThan(91);
    });
  });

  describe("Fertilizer Product Details", () => {
    it("should have complete fertilizer details for strawberry protocol", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      const schedule = strawberryVariety?.protocols?.fertilization?.ongoingProduction?.schedule;
      
      const neptuneTask = schedule?.find(task => task.taskName === "Apply Neptune's Harvest");
      const fertilizer930Task = schedule?.find(task => task.taskName === "Apply 9-15-30 Fertilizer (during fruiting periods)");
      
      // Neptune's Harvest details
      expect(neptuneTask?.details?.product).toContain("Neptune");
      expect(neptuneTask?.details?.dilution).toBeDefined();
      expect(neptuneTask?.details?.amount).toBeDefined();
      expect(neptuneTask?.details?.method).toBeDefined();
      
      // 9-15-30 fertilizer details
      expect(fertilizer930Task?.details?.product).toContain("9-15-30");
      expect(fertilizer930Task?.details?.dilution).toBeDefined();
      expect(fertilizer930Task?.details?.amount).toBeDefined();
      expect(fertilizer930Task?.details?.method).toBeDefined();
    });

    it("should have reasonable timing for fertilization schedule", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      const schedule = strawberryVariety?.protocols?.fertilization?.ongoingProduction?.schedule;
      
      schedule?.forEach(task => {
        expect(task.repeatCount).toBeGreaterThan(0);
        expect(task.repeatCount).toBeLessThan(100); // Sanity check
        expect(task.startDays).toBeGreaterThan(0);
        expect(task.frequencyDays).toBeGreaterThan(0);
      });
    });
  });
});