// src/__tests__/features/fertilization/fertilizationTaskFlow.test.tsx
/**
 * Business logic test for fertilization task protocols:
 * Tests fertilization protocol data structure and configuration
 * for strawberry plants (Neptune's Harvest and 9-15-30 fertilizer)
 */

import { seedVarieties } from "@/data/seedVarieties";

describe("Fertilization Protocol Data Validation", () => {
  describe("Strawberry Protocol Configuration", () => {
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

    it("should include Neptune's Harvest fertilizer task", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      const schedule = strawberryVariety?.protocols?.fertilization?.ongoingProduction?.schedule;
      
      const neptuneTask = schedule?.find(task => 
        task.taskName === "Apply Neptune's Harvest"
      );
      
      expect(neptuneTask).toBeDefined();
      expect(neptuneTask?.startDays).toBe(120);
      expect(neptuneTask?.frequencyDays).toBe(7);
      expect(neptuneTask?.details?.product).toContain("Neptune");
    });

    it("should include 9-15-30 fertilizer task", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      const schedule = strawberryVariety?.protocols?.fertilization?.ongoingProduction?.schedule;
      
      const fertilizer930Task = schedule?.find(task => 
        task.taskName === "Apply 9-15-30 Fertilizer (during fruiting periods)"
      );
      
      expect(fertilizer930Task).toBeDefined();
      expect(fertilizer930Task?.startDays).toBe(127);
      expect(fertilizer930Task?.frequencyDays).toBe(14);
      expect(fertilizer930Task?.details?.product).toContain("9-15-30");
    });

    it("should have correct timing relationship between fertilizers", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      const schedule = strawberryVariety?.protocols?.fertilization?.ongoingProduction?.schedule;
      
      const neptuneTask = schedule?.find(task => task.taskName === "Apply Neptune's Harvest");
      const fertilizer930Task = schedule?.find(task => task.taskName === "Apply 9-15-30 Fertilizer (during fruiting periods)");
      
      // 9-15-30 should start 7 days after Neptune's Harvest (127 vs 120)
      expect(fertilizer930Task?.startDays).toBe((neptuneTask?.startDays || 0) + 7);
    });

    it("should have complete fertilizer details", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      const schedule = strawberryVariety?.protocols?.fertilization?.ongoingProduction?.schedule;
      
      const neptuneTask = schedule?.find(task => task.taskName === "Apply Neptune's Harvest");
      const fertilizer930Task = schedule?.find(task => task.taskName === "Apply 9-15-30 Fertilizer (during fruiting periods)");
      
      // Neptune's Harvest details
      expect(neptuneTask?.details?.dilution).toBeDefined();
      expect(neptuneTask?.details?.amount).toBeDefined();
      expect(neptuneTask?.details?.method).toBeDefined();
      
      // 9-15-30 fertilizer details
      expect(fertilizer930Task?.details?.dilution).toBeDefined();
      expect(fertilizer930Task?.details?.amount).toBeDefined();
      expect(fertilizer930Task?.details?.method).toBeDefined();
    });

    it("should have reasonable repeat counts for ongoing production", () => {
      const strawberryVariety = seedVarieties.find(v => v.name === "Albion Strawberries");
      const schedule = strawberryVariety?.protocols?.fertilization?.ongoingProduction?.schedule;
      
      schedule?.forEach(task => {
        expect(task.repeatCount).toBeGreaterThan(0);
        expect(task.repeatCount).toBeLessThan(100); // Sanity check
      });
    });
  });
});