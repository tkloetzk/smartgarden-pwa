import { getDaysSincePlanting } from "@/utils/dateUtils";
import { mockDate, restoreDate } from "@/setupTests";

// Note: The provided testing skeleton includes tests for 'computeNextDueDate' and 'detect overdue tasks'.
// The logic for these functionalities resides in 'src/services/careSchedulingService.ts'.
// Therefore, their tests should be written in 'src/__tests__/services/careSchedulingService.test.ts'
// to properly mock dependencies and test the correct module. Here, we will focus on testing the
// functions available in 'src/utils/dateUtils.ts'.

describe("Date Calculations", () => {
  describe("getDaysSincePlanting", () => {
    afterEach(() => {
      // Restore the original Date object after each test
      restoreDate();
    });

    it("should calculate daysSincePlanting across month boundaries", () => {
      // Set the "current" date for the test to be the beginning of a new month
      mockDate("2024-03-03T12:00:00Z");
      // Set a planting date in the previous month
      const plantedDate = new Date("2024-02-28T12:00:00Z");
      // The logic Math.ceil((now - past) / ms_in_day) should correctly count the days.
      // The days are Feb 28, Feb 29 (leap year), Mar 1, Mar 2, Mar 3. This is the 5th day.
      expect(getDaysSincePlanting(plantedDate)).toBe(5);
    });

    it("should handle leap year calculations correctly", () => {
      // Set a "current" date after Feb 29 on a leap year
      mockDate("2024-03-01T12:00:00Z");
      const plantedDate = new Date("2024-02-28T12:00:00Z");
      // The days are Feb 28, Feb 29, Mar 1. This is the 3rd day.
      expect(getDaysSincePlanting(plantedDate)).toBe(3);

      // Now test the same dates in a non-leap year
      mockDate("2025-03-01T12:00:00Z");
      const plantedDateNonLeap = new Date("2025-02-27T12:00:00Z");
      // The days are Feb 27, Feb 28, Mar 1. This is the 3rd day.
      expect(getDaysSincePlanting(plantedDateNonLeap)).toBe(3);
    });

    it("should return 1 for a plant planted on the same day", () => {
      mockDate("2024-06-26T20:00:00Z");
      const plantedDate = new Date("2024-06-26T08:00:00Z");
      // The difference is less than a day, so Math.ceil rounds it up to 1.
      expect(getDaysSincePlanting(plantedDate)).toBe(1);
    });
  });
});
