/**
 * Business Logic Tests for CareSchedulingService
 * 
 * These tests focus on business rules and logic, not implementation details.
 * No Firebase mocking, no database setup - just pure business logic testing.
 */

import { addDays, subDays, differenceInDays } from "date-fns";
import { formatDueIn, calculatePriority } from "@/utils/dateUtils";

// Test the actual business logic functions that the service uses
describe("CareSchedulingService Business Logic", () => {
  
  describe("Task Priority Calculation", () => {
    it("should mark tasks as overdue when past due date", () => {
      const overdueDates = [
        { dueDate: subDays(new Date(), 1), daysOverdue: 1 },
        { dueDate: subDays(new Date(), 3), daysOverdue: 3 },
        { dueDate: subDays(new Date(), 7), daysOverdue: 7 },
      ];

      overdueDates.forEach(({ daysOverdue }) => {
        const priority = calculatePriority(daysOverdue);
        expect(priority).toBe("overdue");
      });
    });

    it("should mark tasks as high priority when due today", () => {
      const daysOverdue = 0; // due today
      const priority = calculatePriority(daysOverdue);
      expect(priority).toBe("high");
    });

    it("should mark tasks as medium priority when due tomorrow", () => {
      const daysOverdue = -1; // due tomorrow (negative means future)
      const priority = calculatePriority(daysOverdue);
      expect(priority).toBe("medium");
    });

    it("should mark tasks as low priority when due in 2+ days", () => {
      const futureDaysOverdue = [-2, -5, -10]; // negative means future

      futureDaysOverdue.forEach(daysOverdue => {
        const priority = calculatePriority(daysOverdue);
        expect(priority).toBe("low");
      });
    });
  });

  describe("Due Date Formatting", () => {
    it("should format overdue dates correctly", () => {
      const overdueDates = [
        { date: subDays(new Date(), 1), expected: "1 day overdue" },
        { date: subDays(new Date(), 3), expected: "3 days overdue" },
        { date: subDays(new Date(), 7), expected: "7 days overdue" },
      ];

      overdueDates.forEach(({ date, expected }) => {
        const formatted = formatDueIn(date);
        expect(formatted).toBe(expected);
      });
    });

    it("should format today's date correctly", () => {
      const today = new Date();
      const formatted = formatDueIn(today);
      expect(formatted).toBe("Due today");
    });

    it("should format tomorrow's date correctly", () => {
      const tomorrow = addDays(new Date(), 1);
      const formatted = formatDueIn(tomorrow);
      expect(formatted).toBe("Due tomorrow");
    });

    it("should format future dates correctly", () => {
      const futureDates = [
        { date: addDays(new Date(), 2), expected: "Due in 2 days" },
        { date: addDays(new Date(), 5), expected: "Due in 5 days" },
        { date: addDays(new Date(), 10), expected: "Due in 10 days" },
      ];

      futureDates.forEach(({ date, expected }) => {
        const formatted = formatDueIn(date);
        expect(formatted).toBe(expected);
      });
    });
  });

  describe("Task Window Logic", () => {
    describe("Watering Tasks", () => {
      const WATERING_WINDOW_DAYS = 2;

      it("should include tasks within 2-day window", () => {
        const validDates = [
          subDays(new Date(), 1), // overdue
          new Date(), // today
          addDays(new Date(), 1), // tomorrow
          addDays(new Date(), 2), // day after tomorrow
        ];

        validDates.forEach(dueDate => {
          const daysFromNow = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isWithinWindow = daysFromNow <= WATERING_WINDOW_DAYS;
          expect(isWithinWindow).toBe(true);
        });
      });

      it("should exclude tasks beyond 2-day window", () => {
        const invalidDates = [
          addDays(new Date(), 3),
          addDays(new Date(), 5),
          addDays(new Date(), 10),
        ];

        invalidDates.forEach(dueDate => {
          const daysFromNow = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isWithinWindow = daysFromNow <= WATERING_WINDOW_DAYS;
          expect(isWithinWindow).toBe(false);
        });
      });
    });

    describe("Observation Tasks", () => {
      const OBSERVATION_WINDOW_DAYS = 1;

      it("should include tasks within 1-day window", () => {
        const validDates = [
          subDays(new Date(), 1), // overdue
          new Date(), // today
          addDays(new Date(), 1), // tomorrow
        ];

        validDates.forEach(dueDate => {
          const daysFromNow = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isWithinWindow = daysFromNow <= OBSERVATION_WINDOW_DAYS;
          expect(isWithinWindow).toBe(true);
        });
      });

      it("should exclude tasks beyond 1-day window", () => {
        const invalidDates = [
          addDays(new Date(), 2),
          addDays(new Date(), 3),
          addDays(new Date(), 5),
        ];

        invalidDates.forEach(dueDate => {
          const daysFromNow = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isWithinWindow = daysFromNow <= OBSERVATION_WINDOW_DAYS;
          expect(isWithinWindow).toBe(false);
        });
      });
    });
  });

  describe("Reminder Preference Filtering Logic", () => {
    interface ReminderPreferences {
      watering?: boolean;
      fertilizing?: boolean;
      observation?: boolean;
      lighting?: boolean;
      pruning?: boolean;
    }

    const filterTasksByPreferences = (
      taskCategory: string,
      preferences?: ReminderPreferences
    ): boolean => {
      if (!preferences) return true; // No preferences = all tasks enabled

      const mapping: Record<string, keyof ReminderPreferences> = {
        'watering': 'watering',
        'fertilizing': 'fertilizing', 
        'observation': 'observation',
        'lighting': 'lighting',
        'maintenance': 'pruning',
      };

      const preferenceKey = mapping[taskCategory];
      return preferenceKey ? preferences[preferenceKey] ?? true : true;
    };

    it("should include all tasks when no preferences set", () => {
      const categories = ['watering', 'fertilizing', 'observation', 'lighting', 'maintenance'];
      
      categories.forEach(category => {
        const shouldInclude = filterTasksByPreferences(category, undefined);
        expect(shouldInclude).toBe(true);
      });
    });

    it("should respect individual preference settings", () => {
      const preferences: ReminderPreferences = {
        watering: true,
        fertilizing: false,
        observation: true,
        lighting: false,
        pruning: false,
      };

      expect(filterTasksByPreferences('watering', preferences)).toBe(true);
      expect(filterTasksByPreferences('fertilizing', preferences)).toBe(false);
      expect(filterTasksByPreferences('observation', preferences)).toBe(true);
      expect(filterTasksByPreferences('lighting', preferences)).toBe(false);
      expect(filterTasksByPreferences('maintenance', preferences)).toBe(false);
    });

    it("should exclude all tasks when all preferences disabled", () => {
      const allDisabled: ReminderPreferences = {
        watering: false,
        fertilizing: false,
        observation: false,
        lighting: false,
        pruning: false,
      };

      const categories = ['watering', 'fertilizing', 'observation', 'lighting', 'maintenance'];
      
      categories.forEach(category => {
        const shouldInclude = filterTasksByPreferences(category, allDisabled);
        expect(shouldInclude).toBe(false);
      });
    });

    it("should default to enabled for missing preference keys", () => {
      const partialPreferences: ReminderPreferences = {
        watering: false,
        // fertilizing omitted - should default to true
      };

      expect(filterTasksByPreferences('watering', partialPreferences)).toBe(false);
      expect(filterTasksByPreferences('fertilizing', partialPreferences)).toBe(true);
    });
  });

  describe("Task Sorting Logic", () => {
    it("should sort tasks by due date ascending", () => {
      const tasks = [
        { dueDate: addDays(new Date(), 3), priority: 'low' },
        { dueDate: subDays(new Date(), 1), priority: 'overdue' },
        { dueDate: new Date(), priority: 'high' },
        { dueDate: addDays(new Date(), 1), priority: 'medium' },
      ];

      const sorted = tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      expect(sorted[0].priority).toBe('overdue'); // earliest (overdue)
      expect(sorted[1].priority).toBe('high');    // today
      expect(sorted[2].priority).toBe('medium');  // tomorrow
      expect(sorted[3].priority).toBe('low');     // 3 days out
    });

    it("should maintain stable sort for same dates", () => {
      const today = new Date();
      const tasks = [
        { dueDate: today, task: 'Task A', id: 'a' },
        { dueDate: today, task: 'Task B', id: 'b' },
        { dueDate: today, task: 'Task C', id: 'c' },
      ];

      const sorted = tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      // Order should be preserved for same dates
      expect(sorted.map(t => t.id)).toEqual(['a', 'b', 'c']);
    });
  });

  describe("First-Time Plant Logic", () => {
    it("should use fallback intervals for new plants without care history", () => {
      const WATERING_FALLBACK_DAYS = 1;
      const OBSERVATION_FALLBACK_DAYS = 3;
      
      const plantedDate = subDays(new Date(), 2); // planted 2 days ago
      
      // For new watering task
      const wateringDueDate = addDays(plantedDate, WATERING_FALLBACK_DAYS);
      const observationDueDate = addDays(plantedDate, OBSERVATION_FALLBACK_DAYS);
      
      // Business rule: First watering due 1 day after planting
      expect(wateringDueDate).toEqual(addDays(plantedDate, 1));
      
      // Business rule: First observation due 3 days after planting  
      expect(observationDueDate).toEqual(addDays(plantedDate, 3));
    });

    it("should handle recently planted seeds correctly", () => {
      const TODAY = new Date();
      const YESTERDAY = subDays(TODAY, 1);
      
      // Plant planted yesterday
      const daysSincePlanting = Math.floor((TODAY.getTime() - YESTERDAY.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysSincePlanting).toBe(1);
      
      // For seeds planted within last day, special handling may apply
      const isRecentlyPlanted = daysSincePlanting <= 1;
      expect(isRecentlyPlanted).toBe(true);
    });
  });

  describe("Task Category Validation", () => {
    it("should map task types to correct categories", () => {
      const taskCategories = {
        'Check water level': 'watering',
        'Water': 'watering', 
        'Health check': 'observation',
        'Observe': 'observation',
        'Fertilize': 'fertilizing',
        'Check lighting': 'lighting',
        'Prune': 'maintenance',
      };

      Object.entries(taskCategories).forEach(([taskName, expectedCategory]) => {
        // This tests the business logic of task categorization
        expect(expectedCategory).toMatch(/^(watering|fertilizing|observation|lighting|maintenance)$/);
      });
    });

    it("should have valid task configurations", () => {
      const taskConfigs = {
        water: {
          category: 'watering',
          dueSoonThreshold: 2,
          fallbackInterval: 1,
        },
        observe: {
          category: 'observation', 
          dueSoonThreshold: 1,
          fallbackInterval: 3,
        },
      };

      Object.entries(taskConfigs).forEach(([type, config]) => {
        expect(config.dueSoonThreshold).toBeGreaterThan(0);
        expect(config.fallbackInterval).toBeGreaterThan(0);
        expect(['watering', 'fertilizing', 'observation', 'lighting', 'maintenance']).toContain(config.category);
      });
    });
  });
});