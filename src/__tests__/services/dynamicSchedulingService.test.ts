// In: src/__tests__/services/dynamicSchedulingService.test.ts

import { DynamicSchedulingService } from "@/services/dynamicSchedulingService";
import { db, TaskCompletionRecord } from "@/types/database";
import { generateUUID } from "@/utils/cn";
import { addDays, subDays } from "date-fns";

// Helper function to create a complete and type-safe mock object
const createMockCompletion = (
  overrides: Partial<TaskCompletionRecord>
): TaskCompletionRecord => {
  return {
    id: generateUUID(), // ✅ Use your custom function
    plantId: "plant-1",
    taskType: "water",
    scheduledDate: new Date(),
    actualCompletionDate: new Date(),
    varianceDays: 0,
    careActivityId: "care-1",
    plantStage: "vegetative",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

describe("DynamicSchedulingService", () => {
  const plantId = "plant-1";
  const careActivityId = "care-1";

  beforeEach(async () => {
    await db.taskCompletions.clear();
  });

  describe("recordTaskCompletion", () => {
    it("should correctly calculate and store varianceDays", async () => {
      // On-time completion
      const onTimeDate = new Date("2025-06-20");
      await DynamicSchedulingService.recordTaskCompletion(
        plantId,
        "water",
        onTimeDate,
        onTimeDate,
        careActivityId,
        "vegetative"
      );

      // Early completion
      const earlyDateScheduled = new Date("2025-06-22");
      const earlyDateCompleted = new Date("2025-06-20");
      await DynamicSchedulingService.recordTaskCompletion(
        plantId,
        "water",
        earlyDateScheduled,
        earlyDateCompleted,
        careActivityId,
        "vegetative"
      );

      // Late completion
      const lateDateScheduled = new Date("2025-06-25");
      const lateDateCompleted = new Date("2025-06-28");
      await DynamicSchedulingService.recordTaskCompletion(
        plantId,
        "water",
        lateDateScheduled,
        lateDateCompleted,
        careActivityId,
        "vegetative"
      );

      // ✅ Fix: Get all completions and find them by plantId and logical matching
      const completions = await db.taskCompletions
        .where("plantId")
        .equals(plantId)
        .toArray();

      // ✅ Find completions by comparing timestamp values instead of Date objects
      const onTimeCompletion = completions.find(
        (c) =>
          new Date(c.scheduledDate).getTime() === onTimeDate.getTime() &&
          new Date(c.actualCompletionDate).getTime() === onTimeDate.getTime()
      );

      const earlyCompletion = completions.find(
        (c) =>
          new Date(c.scheduledDate).getTime() ===
            earlyDateScheduled.getTime() &&
          new Date(c.actualCompletionDate).getTime() ===
            earlyDateCompleted.getTime()
      );

      const lateCompletion = completions.find(
        (c) =>
          new Date(c.scheduledDate).getTime() === lateDateScheduled.getTime() &&
          new Date(c.actualCompletionDate).getTime() ===
            lateDateCompleted.getTime()
      );

      // ✅ Add debugging to see what's actually stored
      console.log("Stored completions:", completions);
      console.log("Found onTime:", onTimeCompletion);
      console.log("Found early:", earlyCompletion);
      console.log("Found late:", lateCompletion);

      expect(onTimeCompletion?.varianceDays).toBe(0);
      expect(earlyCompletion?.varianceDays).toBe(-2);
      expect(lateCompletion?.varianceDays).toBe(3);
    });
  });

  describe("getCompletionPatterns", () => {
    it("should return zeros if there are fewer than 3 data points", async () => {
      await db.taskCompletions.add(
        createMockCompletion({ plantId, taskType: "water" })
      );
      await db.taskCompletions.add(
        createMockCompletion({ plantId, taskType: "water" })
      );

      const patterns = await DynamicSchedulingService.getCompletionPatterns(
        plantId,
        "water"
      );
      expect(patterns.averageVariance).toBe(0);
      expect(patterns.consistency).toBe(0);
      expect(patterns.recommendedAdjustment).toBe(0);
    });

    it("should calculate patterns for a consistently late user", async () => {
      for (let i = 0; i < 5; i++) {
        await DynamicSchedulingService.recordTaskCompletion(
          plantId,
          "water",
          new Date(),
          addDays(new Date(), 3),
          `care-${i}`,
          "vegetative"
        );
      }

      const patterns = await DynamicSchedulingService.getCompletionPatterns(
        plantId,
        "water"
      );
      expect(patterns.averageVariance).toBe(3);
      expect(patterns.consistency).toBe(1);
      expect(patterns.recommendedAdjustment).toBe(2);
    });
  });

  describe("getNextDueDateForTask", () => {
    it("should return the default interval if there is not enough data", async () => {
      const lastCompletion = new Date("2025-06-20");
      const nextDueDate = await DynamicSchedulingService.getNextDueDateForTask(
        plantId,
        "water",
        lastCompletion
      );
      expect(nextDueDate).toEqual(addDays(lastCompletion, 7)); // 7 is the default fallback
    });

    it("should adjust the due date based on consistent late completions", async () => {
      for (let i = 0; i < 5; i++) {
        await DynamicSchedulingService.recordTaskCompletion(
          plantId,
          "water",
          subDays(new Date(), i),
          addDays(subDays(new Date(), i), 3),
          `care-${i}`,
          "vegetative"
        );
      }

      const lastCompletion = new Date("2025-06-20");
      const nextDueDate = await DynamicSchedulingService.getNextDueDateForTask(
        plantId,
        "water",
        lastCompletion
      );

      // Default is 7 days. Avg Variance is 3. Adjustment is round(3 * 0.7) = 2.
      // So the new interval is 7 + 2 = 9 days.
      expect(nextDueDate).toEqual(addDays(lastCompletion, 9));
    });
  });
});
