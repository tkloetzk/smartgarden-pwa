import { groupCareActivities, isGroupedActivity } from "@/utils/careActivityGrouping";
import { CareRecord } from "@/types";

describe("careActivityGrouping", () => {
  const createMockActivity = (overrides: Partial<CareRecord>): CareRecord => ({
    id: "default-id",
    plantId: "plant-1",
    type: "water",
    date: new Date("2024-01-01T10:00:00"),
    details: { type: "water", waterAmount: 100, waterUnit: "ml" },
    createdAt: new Date("2024-01-01T10:00:00"),
    updatedAt: new Date("2024-01-01T10:00:00"),
    ...overrides,
  });

  describe("groupCareActivities", () => {
    it("returns empty array for empty input", () => {
      const result = groupCareActivities([]);
      expect(result).toEqual([]);
    });

    it("returns single activity unchanged when no grouping possible", () => {
      const activities = [createMockActivity({ id: "1" })];
      const result = groupCareActivities(activities);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(activities[0]);
      expect(isGroupedActivity(result[0])).toBe(false);
    });

    it("groups activities from different plants with same type and similar time", () => {
      const baseDate = new Date("2024-01-01T10:00:00");
      const activities = [
        createMockActivity({
          id: "1",
          plantId: "plant-1",
          type: "water",
          date: baseDate,
          details: { type: "water", waterAmount: 100, waterUnit: "ml" }
        }),
        createMockActivity({
          id: "2",
          plantId: "plant-2",
          type: "water",
          date: new Date(baseDate.getTime() + 30000), // 30 seconds later
          details: { type: "water", waterAmount: 100, waterUnit: "ml" }
        })
      ];

      const result = groupCareActivities(activities);
      
      expect(result).toHaveLength(1);
      expect(isGroupedActivity(result[0])).toBe(true);
      
      const grouped = result[0] as any;
      expect(grouped.plantCount).toBe(2);
      expect(grouped.activities).toHaveLength(2);
      expect(grouped.type).toBe("water");
    });

    it("does NOT group activities from same plant", () => {
      const baseDate = new Date("2024-01-01T10:00:00");
      const activities = [
        createMockActivity({
          id: "1",
          plantId: "plant-1",
          type: "water",
          date: baseDate,
        }),
        createMockActivity({
          id: "2",
          plantId: "plant-1", // Same plant!
          type: "water",
          date: new Date(baseDate.getTime() + 30000),
        })
      ];

      const result = groupCareActivities(activities);
      
      // Should remain as 2 separate activities
      expect(result).toHaveLength(2);
      expect(isGroupedActivity(result[0])).toBe(false);
      expect(isGroupedActivity(result[1])).toBe(false);
    });

    it("does NOT group activities with different types", () => {
      const baseDate = new Date("2024-01-01T10:00:00");
      const activities = [
        createMockActivity({
          id: "1",
          plantId: "plant-1",
          type: "water",
          date: baseDate,
        }),
        createMockActivity({
          id: "2",
          plantId: "plant-2",
          type: "fertilize", // Different type!
          date: new Date(baseDate.getTime() + 30000),
        })
      ];

      const result = groupCareActivities(activities);
      
      // Should remain as 2 separate activities
      expect(result).toHaveLength(2);
      expect(isGroupedActivity(result[0])).toBe(false);
      expect(isGroupedActivity(result[1])).toBe(false);
    });

    it("does NOT group activities with time difference > 2 minutes", () => {
      const baseDate = new Date("2024-01-01T10:00:00");
      const activities = [
        createMockActivity({
          id: "1",
          plantId: "plant-1",
          type: "water",
          date: baseDate,
        }),
        createMockActivity({
          id: "2",
          plantId: "plant-2",
          type: "water",
          date: new Date(baseDate.getTime() + 3 * 60 * 1000), // 3 minutes later
        })
      ];

      const result = groupCareActivities(activities);
      
      // Should remain as 2 separate activities
      expect(result).toHaveLength(2);
      expect(isGroupedActivity(result[0])).toBe(false);
      expect(isGroupedActivity(result[1])).toBe(false);
    });

    it("groups multiple activities correctly (bulk action scenario)", () => {
      const baseDate = new Date("2024-01-01T10:00:00");
      const activities = [
        createMockActivity({
          id: "1",
          plantId: "plant-1",
          type: "water",
          date: baseDate,
          details: { type: "water", waterAmount: 100, waterUnit: "ml" }
        }),
        createMockActivity({
          id: "2",
          plantId: "plant-2",
          type: "water",
          date: new Date(baseDate.getTime() + 10000), // 10 seconds
          details: { type: "water", waterAmount: 100, waterUnit: "ml" }
        }),
        createMockActivity({
          id: "3",
          plantId: "plant-3",
          type: "water",
          date: new Date(baseDate.getTime() + 20000), // 20 seconds
          details: { type: "water", waterAmount: 100, waterUnit: "ml" }
        })
      ];

      const result = groupCareActivities(activities);
      
      expect(result).toHaveLength(1);
      expect(isGroupedActivity(result[0])).toBe(true);
      
      const grouped = result[0] as any;
      expect(grouped.plantCount).toBe(3);
      expect(grouped.activities).toHaveLength(3);
      expect(grouped.plantIds).toEqual(["plant-3", "plant-2", "plant-1"]); // Sorted by date desc
    });

    it("sorts activities by date (newest first)", () => {
      const activities = [
        createMockActivity({
          id: "1",
          date: new Date("2024-01-01T10:00:00"),
        }),
        createMockActivity({
          id: "2",
          date: new Date("2024-01-01T11:00:00"), // Newer
        }),
        createMockActivity({
          id: "3",
          date: new Date("2024-01-01T09:00:00"), // Older
        })
      ];

      const result = groupCareActivities(activities);
      
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("2"); // Newest first
      expect(result[1].id).toBe("1");
      expect(result[2].id).toBe("3"); // Oldest last
    });

    it("handles mixed groupable and non-groupable activities", () => {
      const baseDate = new Date("2024-01-01T10:00:00");
      const activities = [
        // These two should group
        createMockActivity({
          id: "1",
          plantId: "plant-1",
          type: "water",
          date: baseDate,
          details: { type: "water", waterAmount: 100, waterUnit: "ml" }
        }),
        createMockActivity({
          id: "2",
          plantId: "plant-2",
          type: "water",
          date: new Date(baseDate.getTime() + 30000),
          details: { type: "water", waterAmount: 100, waterUnit: "ml" }
        }),
        // This one should remain separate (different type)
        createMockActivity({
          id: "3",
          plantId: "plant-3",
          type: "fertilize",
          date: new Date(baseDate.getTime() + 45000),
        })
      ];

      const result = groupCareActivities(activities);
      
      expect(result).toHaveLength(2); // 1 grouped + 1 individual
      
      // First should be fertilize (newest)
      expect(result[0].id).toBe("3");
      expect(isGroupedActivity(result[0])).toBe(false);
      
      // Second should be grouped watering activities
      expect(isGroupedActivity(result[1])).toBe(true);
      const grouped = result[1] as any;
      expect(grouped.plantCount).toBe(2);
    });
  });

  describe("isGroupedActivity", () => {
    it("returns false for individual activities", () => {
      const activity = createMockActivity({});
      expect(isGroupedActivity(activity)).toBe(false);
    });

    it("returns true for grouped activities", () => {
      const groupedActivity = {
        id: "group-1",
        type: "water",
        date: new Date(),
        details: { type: "water" },
        plantIds: ["plant-1", "plant-2"],
        plantCount: 2,
        isGrouped: true,
        activities: []
      };
      expect(isGroupedActivity(groupedActivity)).toBe(true);
    });
  });
});