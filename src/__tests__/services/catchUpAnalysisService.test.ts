// src/__tests__/services/CatchUpAnalysisService.test.ts
import {
  CatchUpAnalysisService,
} from "@/services/CatchUpAnalysisService";
import { FirebaseCareActivityService } from "@/services/firebase/careActivityService";
import {
  PlantRecord,
  VarietyRecord,
  varietyService,
  CareActivityRecord,
} from "@/types/database";
import { subDays, subWeeks } from "date-fns";
import { CareActivityType } from "@/types/core";
import { getRealVariety, createMockPlantWithVariety } from "../utils/testDataFactories";

// Mock dependencies
jest.mock("@/services/firebase/careActivityService");
jest.mock("@/types/database", () => ({
  ...jest.requireActual("@/types/database"),
  varietyService: {
    getVariety: jest.fn(),
  },
}));

const mockFirebaseCareActivityService =
  FirebaseCareActivityService as jest.Mocked<
    typeof FirebaseCareActivityService
  >;
const mockVarietyService = varietyService as jest.Mocked<typeof varietyService>;

describe("CatchUpAnalysisService", () => {
  const userId = "test-user-123";
  let littleFingerCarrotsRecord: VarietyRecord;

  // Helper to create mock care activities
  const createMockActivity = (
    plantId: string,
    type: CareActivityType,
    daysAgo: number
  ): CareActivityRecord => ({
    id: `care-${type}-${daysAgo}`,
    plantId,
    type,
    date: subDays(new Date(), daysAgo),
    details: { type, notes: `Last ${type}` },
    createdAt: subDays(new Date(), daysAgo),
    updatedAt: subDays(new Date(), daysAgo),
  });

  beforeAll(() => {
    const variety = getRealVariety("Little Finger Carrots");
    if (!variety) {
      throw new Error("Test setup failed: 'Little Finger Carrots' variety not found.");
    }
    littleFingerCarrotsRecord = variety;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-15T12:00:00Z"));

    // Mock localStorage for skipped opportunities
    const localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    // Default mock for variety service
    mockVarietyService.getVariety.mockResolvedValue(littleFingerCarrotsRecord);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("For Established Plants (Missed Care)", () => {
    let plant: PlantRecord;

    beforeEach(() => {
      plant = createMockPlantWithVariety("Little Finger Carrots", {
        plantedDate: subWeeks(new Date(), 7), // 7 weeks old
      });
    });

    it("should identify multiple overdue tasks for a plant with minimal care history", async () => {
      mockFirebaseCareActivityService.getRecentActivitiesForPlant.mockResolvedValue([
        createMockActivity(plant.id, "water", 11),
        createMockActivity(plant.id, "fertilize", 20),
        createMockActivity(plant.id, "observe", 15),
        ]);

      const opportunities =
        await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
          plant.id,
          userId,
          30,
          plant
        );

      expect(opportunities.length).toBe(3);

      const wateringOpp = opportunities.find((o) => o.taskType === "water");
      expect(wateringOpp).toBeDefined();
      expect(wateringOpp?.daysMissed).toBe(4); // 11 days ago - 7 day interval = 4 days missed
      expect(wateringOpp?.suggestedAction).toBe("reschedule");

      const fertilizeOpp = opportunities.find((o) => o.taskType === "fertilize");
      expect(fertilizeOpp).toBeDefined();
      expect(fertilizeOpp?.daysMissed).toBe(6); // 20 days ago - 14 day interval = 6 days missed
      expect(fertilizeOpp?.suggestedAction).toBe("reschedule");

      const observeOpp = opportunities.find((o) => o.taskType === "observe");
      expect(observeOpp).toBeDefined();
      expect(observeOpp?.daysMissed).toBe(5); // 15 days ago - 10 day interval = 5 days missed
      expect(observeOpp?.suggestedAction).toBe("reschedule");
    });

    it("should suggest 'skip' for tasks that are very overdue", async () => {
      mockFirebaseCareActivityService.getRecentActivitiesForPlant.mockResolvedValue([
        createMockActivity(plant.id, "water", 15), // 15-7=8 days missed (>7 -> skip)
        createMockActivity(plant.id, "fertilize", 25), // 25-14=11 days missed (>10 -> skip)
      ]);

      const opportunities =
        await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
          plant.id,
          userId,
          30,
          plant
        );

      const wateringOpp = opportunities.find((o) => o.taskType === "water");
      expect(wateringOpp?.suggestedAction).toBe("skip");
      expect(wateringOpp?.reason).toMatch(
        /Too much time has passed/
      );

      const fertilizeOpp = opportunities.find((o) => o.taskType === "fertilize");
      expect(fertilizeOpp?.suggestedAction).toBe("skip");
      expect(fertilizeOpp?.reason).toMatch(
        /Consider adjusting fertilization schedule/
      );
    });

    it("should only identify the single missed category for a well-cared-for plant", async () => {
      mockFirebaseCareActivityService.getRecentActivitiesForPlant.mockResolvedValue([
        createMockActivity(plant.id, "water", 2),
        createMockActivity(plant.id, "fertilize", 10),
        createMockActivity(plant.id, "observe", 15), // The only overdue one
      ]);

      const opportunities =
        await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
          plant.id,
          userId,
          30,
          plant
        );

      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].taskType).toBe("observe");
      expect(opportunities[0].daysMissed).toBe(5);
    });

    it("should return an empty array for a plant with comprehensive recent care", async () => {
      mockFirebaseCareActivityService.getRecentActivitiesForPlant.mockResolvedValue([
        createMockActivity(plant.id, "water", 3),
        createMockActivity(plant.id, "fertilize", 10),
        createMockActivity(plant.id, "observe", 5),
      ]);

      const opportunities =
        await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
          plant.id,
          userId,
          30,
          plant
        );

      expect(opportunities).toHaveLength(0);
    });
  });

  describe("For New Plants (Initial Care)", () => {
    it("should identify all initial care tasks for a 15-day-old plant with no history", async () => {
      const plant = createMockPlantWithVariety("Astro Arugula", {
        plantedDate: subDays(new Date(), 15),
      });

      // No recent activities
      mockFirebaseCareActivityService.getRecentActivitiesForPlant.mockResolvedValue([]);

      const opportunities =
        await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
          plant.id,
          userId,
          30,
          plant // Pass plant data for initial care check
        );

      expect(opportunities.length).toBeGreaterThanOrEqual(3);

      const wateringOpp = opportunities.find((o) => o.taskType === "water");
      expect(wateringOpp).toBeDefined();
      expect(wateringOpp?.isInitialCare).toBe(true);
      expect(wateringOpp?.suggestedAction).toBe("skip"); // 15 days > 14 days missed

      const observeOpp = opportunities.find((o) => o.taskType === "observe");
      expect(observeOpp).toBeDefined();
      expect(observeOpp?.isInitialCare).toBe(true);
      expect(observeOpp?.suggestedAction).toBe("reschedule");

      const fertilizeOpp = opportunities.find((o) => o.taskType === "fertilize");
      expect(fertilizeOpp).toBeDefined();
      expect(fertilizeOpp?.isInitialCare).toBe(true);
      expect(fertilizeOpp?.suggestedAction).toBe("reschedule");
    });

    it("should not identify initial care tasks that have already been performed", async () => {
       const plant = createMockPlantWithVariety("Astro Arugula", {
        plantedDate: subDays(new Date(), 10),
      });

      // User already watered and took a photo
      mockFirebaseCareActivityService.getRecentActivitiesForPlant.mockResolvedValue([
        createMockActivity(plant.id, "water", 9),
      ]);

       const opportunities =
        await CatchUpAnalysisService.findMissedOpportunitiesWithUserId(
          plant.id,
          userId,
          30,
          plant
        );

      // Should not find watering or photo opportunities
      expect(opportunities.find((o) => o.taskType === "water")).toBeUndefined();

      // Should still find the missed observation and note
      expect(opportunities.find((o) => o.taskType === "observe")).toBeDefined();
      expect(opportunities.find((o) => o.taskType === "note")).toBeDefined();
    });
  });
});