import { 
  getDaysSincePlanting, 
  getTodayDateString, 
  createLocalDateFromString, 
  createDateForCareLogging 
} from "@/utils/dateUtils";

// Note: The provided testing skeleton includes tests for 'computeNextDueDate' and 'detect overdue tasks'.
// The logic for these functionalities resides in 'src/services/careSchedulingService.ts'.
// Therefore, their tests should be written in 'src/__tests__/services/careSchedulingService.test.ts'
// to properly mock dependencies and test the correct module. Here, we will focus on testing the
// functions available in 'src/utils/dateUtils.ts'.

describe("Date Calculations", () => {
  describe("getDaysSincePlanting", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should calculate daysSincePlanting across month boundaries", () => {
      // Set the "current" date for the test to be the beginning of a new month
      jest.setSystemTime(new Date("2024-03-03T12:00:00Z"));

      // Set a planting date in the previous month
      const plantedDate = new Date("2024-02-28T12:00:00Z");
      // The logic Math.ceil((now - past) / ms_in_day) should correctly count the days.
      // The days are Feb 28, Feb 29 (leap year), Mar 1, Mar 2, Mar 3. This is the 5th day.
      expect(getDaysSincePlanting(plantedDate)).toBe(5);
    });

    it("should handle leap year calculations correctly", () => {
      // Set a "current" date after Feb 29 on a leap year
      jest.setSystemTime(new Date("2024-03-01T12:00:00Z"));
      const plantedDate = new Date("2024-02-28T12:00:00Z");
      // The days are Feb 28, Feb 29, Mar 1. This is the 3rd day.
      expect(getDaysSincePlanting(plantedDate)).toBe(3);

      // Now test the same dates in a non-leap year
      jest.setSystemTime(new Date("2025-03-01T12:00:00Z"));
      const plantedDateNonLeap = new Date("2025-02-27T12:00:00Z");
      // The days are Feb 27, Feb 28, Mar 1. This is the 3rd day.
      expect(getDaysSincePlanting(plantedDateNonLeap)).toBe(3);
    });

    it("should return 1 for a plant planted on the same day", () => {
      jest.setSystemTime(new Date("2024-06-26T20:00:00Z"));
      const plantedDate = new Date("2024-06-26T08:00:00Z");
      // The difference is less than a day, so Math.ceil rounds it up to 1.
      expect(getDaysSincePlanting(plantedDate)).toBe(1);
    });
  });

  describe("Timezone-safe date functions", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe("getTodayDateString", () => {
      it("should return today's date in YYYY-MM-DD format using local timezone", () => {
        // Set a specific date and time
        jest.setSystemTime(new Date("2025-01-13T15:30:00"));
        
        const result = getTodayDateString();
        expect(result).toBe("2025-01-13");
      });

      it("should handle year-end transitions correctly", () => {
        jest.setSystemTime(new Date("2024-12-31T23:59:00"));
        
        const result = getTodayDateString();
        expect(result).toBe("2024-12-31");
      });
    });

    describe("createLocalDateFromString", () => {
      it("should create date at midnight in local timezone", () => {
        const result = createLocalDateFromString("2025-01-13");
        
        // Should be midnight in local timezone
        expect(result.getFullYear()).toBe(2025);
        expect(result.getMonth()).toBe(0); // January is 0
        expect(result.getDate()).toBe(13);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
      });

      it("should handle leap year dates correctly", () => {
        const result = createLocalDateFromString("2024-02-29");
        
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(1); // February is 1
        expect(result.getDate()).toBe(29);
      });

      it("should not have UTC timezone issues", () => {
        // This test ensures we don't get the classic "one day off" timezone bug
        const dateString = "2025-01-13";
        const localDate = createLocalDateFromString(dateString);
        
        // The date should stay the same day regardless of timezone
        expect(localDate.getDate()).toBe(13);
        expect(localDate.getMonth()).toBe(0); // January
        expect(localDate.getFullYear()).toBe(2025);
      });
    });

    describe("createDateForCareLogging", () => {
      it("should use current timestamp when logging for today", () => {
        // Set current time to 3:30 PM
        const mockNow = new Date("2025-01-13T15:30:45");
        jest.setSystemTime(mockNow);
        
        const todayString = "2025-01-13";
        const result = createDateForCareLogging(todayString);
        
        // Should match the current timestamp exactly
        expect(result.getTime()).toBe(mockNow.getTime());
        expect(result.getHours()).toBe(15);
        expect(result.getMinutes()).toBe(30);
        expect(result.getSeconds()).toBe(45);
      });

      it("should use midnight for past dates", () => {
        // Set current time to today
        jest.setSystemTime(new Date("2025-01-13T15:30:00"));
        
        const pastDateString = "2025-01-12";
        const result = createDateForCareLogging(pastDateString);
        
        // Should be midnight of the past date
        expect(result.getFullYear()).toBe(2025);
        expect(result.getMonth()).toBe(0); // January
        expect(result.getDate()).toBe(12);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
      });

      it("should handle timezone-sensitive scenarios correctly", () => {
        // Simulate being in Central Time (UTC-6) in the afternoon
        // This test ensures our fix prevents the "17 hours ago" bug
        const mockNow = new Date("2025-01-13T20:00:00"); // 8 PM local time
        jest.setSystemTime(mockNow);
        
        const todayString = getTodayDateString(); // Should be "2025-01-13"
        const result = createDateForCareLogging(todayString);
        
        // Should use current time, not midnight
        expect(result.getTime()).toBe(mockNow.getTime());
        
        // Verify it's not creating a date in the past due to timezone issues
        const hoursAgo = (mockNow.getTime() - result.getTime()) / (1000 * 60 * 60);
        expect(hoursAgo).toBe(0); // Should be exactly now, not hours ago
      });

      it("should work correctly across different days", () => {
        // Test at 11:30 PM to check day boundary handling
        jest.setSystemTime(new Date("2025-01-13T23:30:00"));
        
        const todayString = getTodayDateString();
        const yesterdayString = "2025-01-12";
        
        const todayResult = createDateForCareLogging(todayString);
        const yesterdayResult = createDateForCareLogging(yesterdayString);
        
        // Today should use current time (11:30 PM)
        expect(todayResult.getHours()).toBe(23);
        expect(todayResult.getMinutes()).toBe(30);
        
        // Yesterday should use midnight
        expect(yesterdayResult.getHours()).toBe(0);
        expect(yesterdayResult.getMinutes()).toBe(0);
        expect(yesterdayResult.getDate()).toBe(12);
      });
    });

    describe("Integration test: care logging workflow", () => {
      it("should prevent 'hours ago' timezone bugs in typical usage", () => {
        // Simulate a user in Central Time logging care in the afternoon
        const mockAfternoon = new Date("2025-01-13T14:30:00"); // 2:30 PM
        jest.setSystemTime(mockAfternoon);
        
        // Simulate the typical workflow:
        // 1. Form uses getTodayDateString() as default
        const formDateString = getTodayDateString();
        expect(formDateString).toBe("2025-01-13");
        
        // 2. Care logging uses createDateForCareLogging()
        const careLogDate = createDateForCareLogging(formDateString);
        
        // 3. Should result in current timestamp, not past timestamp
        expect(careLogDate.getTime()).toBe(mockAfternoon.getTime());
        
        // 4. Time difference should be 0 (not 12-17 hours)
        const timeDiffHours = (mockAfternoon.getTime() - careLogDate.getTime()) / (1000 * 60 * 60);
        expect(timeDiffHours).toBe(0);
      });
    });
  });
});
