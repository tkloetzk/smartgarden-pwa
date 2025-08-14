// src/services/CatchUpAnalysisService.ts - Complete Implementation
import { differenceInDays, addDays } from "date-fns";
import { FirebaseCareActivityService } from "./firebase/careActivityService";
import { PlantRecord } from "@/types/database";
import { CareActivityType } from "@/types";
import { CareActivity } from "@/types";

export interface MissedOpportunity {
  id: string;
  plantId: string;
  plantName: string;
  taskName: string;
  originalDueDate: Date;
  taskType: CareActivityType;
  daysMissed: number;
  suggestedAction: "log-as-done" | "reschedule" | "skip";
  reason: string;
  isInitialCare?: boolean;
  plantAge?: number;
  expectedStartDay?: number;
  canCombineWithRecent?: {
    reasoning: string;
    suggestedCombination?: string;
  };
}

interface InitialCareItem {
  type: CareActivityType;
  taskName: string;
  shouldStartAtDay: number;
  reason: string;
}

export class CatchUpAnalysisService {
  private static SKIPPED_OPPORTUNITIES_KEY =
    "smartgarden_skipped_opportunities";

  private static getSkippedOpportunities(): Set<string> {
    try {
      const skipped = localStorage.getItem(this.SKIPPED_OPPORTUNITIES_KEY);
      return skipped ? new Set(JSON.parse(skipped)) : new Set();
    } catch (error) {
      console.error("Failed to load skipped opportunities:", error);
      return new Set();
    }
  }

  private static addSkippedOpportunity(opportunityId: string): void {
    console.log("addSkippedOpportunity: Adding", opportunityId);
    try {
      const skipped = this.getSkippedOpportunities();
      skipped.add(opportunityId);
      localStorage.setItem(
        this.SKIPPED_OPPORTUNITIES_KEY,
        JSON.stringify(Array.from(skipped))
      );
      console.log("addSkippedOpportunity: Added", opportunityId, ". Current skipped:", skipped);
    } catch (error) {
      console.error("Failed to save skipped opportunity:", error);
    }
  }

  private static cleanupOldSkippedOpportunities(): void {
    try {
      const skipped = this.getSkippedOpportunities();
      const skippedArray = Array.from(skipped);

      if (skippedArray.length > 100) {
        const cleaned = new Set(skippedArray.slice(-100));
        localStorage.setItem(
          this.SKIPPED_OPPORTUNITIES_KEY,
          JSON.stringify(Array.from(cleaned))
        );
      }
    } catch (error) {
      console.error("Failed to cleanup skipped opportunities:", error);
    }
  }

  // Main method to find missed opportunities for a specific plant
  static async findMissedOpportunitiesWithUserId(
    plantId: string,
    userId: string,
    lookbackDays: number = 14,
    plantData?: PlantRecord
  ): Promise<MissedOpportunity[]> {
    this.cleanupOldSkippedOpportunities();
    const skippedOpportunities = this.getSkippedOpportunities(); // Moved declaration outside try block

    console.log(`findMissedOpportunitiesWithUserId: Starting for ${plantId}. Skipped: ${skippedOpportunities.size}`);
    try {
      const recentActivities =
        await FirebaseCareActivityService.getRecentActivitiesForPlant(
          plantId,
          userId,
          lookbackDays
        );
      console.log(`findMissedOpportunitiesWithUserId: Found ${recentActivities.length} recent activities.`);

      const opportunities: MissedOpportunity[] = [];

      // If we have plant data, we can check its age and decide which logic to run.
      if (plantData) {
        const plantAge = differenceInDays(new Date(), plantData.plantedDate);
        console.log(`[CatchUpAnalysisService] Plant ${plantId} is ${plantAge} days old.`);

        if (plantAge <= 30) {
          console.log(`[CatchUpAnalysisService] Checking initial care opportunities for ${plantId}.`);
          const initialOpportunities = await this.findInitialCareOpportunities(
            plantId,
            recentActivities,
            skippedOpportunities,
            plantData
          );
          console.log(`[CatchUpAnalysisService] Found ${initialOpportunities.length} initial opportunities.`);
          opportunities.push(...initialOpportunities);
        } else {
          console.log(`[CatchUpAnalysisService] Checking regular missed care opportunities for ${plantId}.`);
          const missedOpportunities = await this.findMissedCareOpportunities(
            plantId,
            recentActivities,
            skippedOpportunities
          );
          console.log(`[CatchUpAnalysisService] Found ${missedOpportunities.length} regular missed opportunities.`);
          opportunities.push(...missedOpportunities);
        }
      }

      return opportunities.sort((a, b) => {
        // Prioritize by days missed, then by task type priority
        if (a.daysMissed !== b.daysMissed) {
          return b.daysMissed - a.daysMissed;
        }

        const typePriority: Record<CareActivityType, number> = {
          water: 9,
          fertilize: 8,
          observe: 7,
          harvest: 6,
          moisture: 5,
          pruning: 5,
          lighting: 4,
          thin: 4,
          transplant: 3,
          photo: 2,
          note: 1,
        };

        return typePriority[b.taskType] - typePriority[a.taskType];
      });
    } catch (error) {
      console.error("Failed to analyze opportunities:", error);
      return [];
    }
  }

  // Find initial care opportunities for new plants
  private static async findInitialCareOpportunities(
    plantId: string,
    recentActivities: CareActivity[],
    skippedOpportunities: Set<string>,
    plantData?: PlantRecord
  ): Promise<MissedOpportunity[]> {
    const opportunities: MissedOpportunity[] = [];

    if (!plantData) {
      return opportunities;
    }

    const now = new Date();
    const plantAge = differenceInDays(now, plantData.plantedDate);
    const plantName = plantData.name || plantData.varietyName;

    // Define initial care schedule
    const initialCareSchedule = this.getInitialCareSchedule();

    for (const careItem of initialCareSchedule) {
      const expectedStartDate = addDays(
        plantData.plantedDate,
        careItem.shouldStartAtDay
      );
      const daysSinceExpected = differenceInDays(now, expectedStartDate);

      if (daysSinceExpected > 0) {
        // Check if this care type has been performed recently (within plant's lifetime)
        const hasPerformedCare = recentActivities.some(
          (activity) =>
            activity.type === careItem.type &&
            differenceInDays(now, activity.date) <= plantAge
        );

        if (!hasPerformedCare) {
          const opportunityId = `${plantId}-initial-${careItem.type}-${careItem.shouldStartAtDay}`;
          console.log(`  Initial Opportunity: ${careItem.taskName} (ID: ${opportunityId}). Skipped? ${skippedOpportunities.has(opportunityId)}`);

          if (!skippedOpportunities.has(opportunityId)) {
            opportunities.push({
              id: opportunityId,
              plantId,
              plantName,
              taskName: careItem.taskName,
              originalDueDate: expectedStartDate,
              taskType: careItem.type,
              daysMissed: daysSinceExpected,
              suggestedAction: this.getInitialCareAction(
                careItem.type,
                daysSinceExpected
              ),
              reason: careItem.reason,
              isInitialCare: true,
              plantAge,
              expectedStartDay: careItem.shouldStartAtDay,
            });
          }
        }
      }
    }

    return opportunities;
  }

  // Define the initial care schedule for new plants
  private static getInitialCareSchedule(): InitialCareItem[] {
    const schedule: InitialCareItem[] = [

    // Water: Should start within first 3 days
    {
      type: "water",
      taskName: "Initial Watering",
      shouldStartAtDay: 1,
      reason: "Newly planted seedlings need immediate moisture",
    },

    // First observation: Day 3-5
    {
      type: "observe",
      taskName: "Initial Health Check",
      shouldStartAtDay: 3,
      reason: "Check for transplant shock and establishment",
    },

    // First fertilization: Day 14 (after establishment)
    {
      type: "fertilize",
      taskName: "First Feeding",
      shouldStartAtDay: 14,
      reason: "Begin feeding routine after plant establishes",
    },

    // Setup documentation: Day 1
    {
      type: "note",
      taskName: "Setup Documentation",
      shouldStartAtDay: 1,
      reason: "Document initial growing conditions and setup",
    },
    ];

    return schedule;
  }

  // Determine suggested action for initial care
  private static getInitialCareAction(
    careType: CareActivityType,
    daysMissed: number
  ): "log-as-done" | "reschedule" | "skip" {
    switch (careType) {
      case "water":
        if (daysMissed >= 14) return "skip"; // If it's been 2 weeks, skip initial watering
        if (daysMissed > 3) return "reschedule"; // Otherwise, do it now
        return "log-as-done";

      case "fertilize":
        if (daysMissed > 30) return "skip";
        return "reschedule";

      case "observe":
        return "reschedule"; // Always beneficial to observe

      case "note":
        if (daysMissed > 7) return "skip"; // Initial setup notes less relevant later
        return "reschedule";

      case "photo":
        if (daysMissed >= 14) return "skip"; // If it's been 2 weeks, skip initial photo
        return "reschedule";

      default:
        return "reschedule";
    }
  }

  // Find missed care opportunities for established plants
  private static async findMissedCareOpportunities(
    plantId: string,
    recentActivities: CareActivity[],
    skippedOpportunities: Set<string>
  ): Promise<MissedOpportunity[]> {
    const opportunities: MissedOpportunity[] = [];
    const now = new Date();
    const plantName = "Plant"; // Will be overridden by caller

    // ✅ WATER: Check every 7 days
    const lastWatering = recentActivities
      .filter((a) => a.type === "water")
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (lastWatering) {
      const daysSinceWatering = differenceInDays(now, lastWatering.date);
      const expectedInterval = 7;

      if (daysSinceWatering > expectedInterval) {
        const daysMissed = daysSinceWatering - expectedInterval;
        const id = `${plantId}-water-${lastWatering.date.toISOString()}`;
        console.log(`  Regular Watering Opportunity: ${id}. Skipped? ${skippedOpportunities.has(id)}`);

        if (!skippedOpportunities.has(id)) {
          opportunities.push({
            id,
            plantId,
            plantName,
            taskName: "Regular Watering",
            originalDueDate: addDays(lastWatering.date, expectedInterval),
            taskType: "water",
            daysMissed,
            suggestedAction:
              daysMissed > 7
                ? "skip"
                : daysMissed > 3
                ? "reschedule"
                : "log-as-done",
            reason:
              daysMissed > 7
                ? "Too much time has passed - check if plant needs different care schedule"
                : "Plant may be thirsty - consider watering soon",
          });
        }
      }
    }

    // ✅ FERTILIZE: Check every 14 days
    const lastFertilization = recentActivities
      .filter((a) => a.type === "fertilize")
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (lastFertilization) {
      const daysSinceFertilization = differenceInDays(
        now,
        lastFertilization.date
      );
      const expectedInterval = 14;

      if (daysSinceFertilization > expectedInterval) {
        const daysMissed = daysSinceFertilization - expectedInterval;
        const id = `${plantId}-fertilize-${lastFertilization.date.toISOString()}`;
        console.log(`  Regular Fertilization Opportunity: ${id}. Skipped? ${skippedOpportunities.has(id)}`);

        if (!skippedOpportunities.has(id)) {
          opportunities.push({
            id,
            plantId,
            plantName,
            taskName: "Regular Fertilization",
            originalDueDate: addDays(lastFertilization.date, expectedInterval),
            taskType: "fertilize",
            daysMissed,
            suggestedAction: daysMissed > 10 ? "skip" : "reschedule",
            reason:
              daysMissed > 10
                ? "Consider adjusting fertilization schedule"
                : "Plants benefit from regular feeding",
          });
        }
      }
    }

    // ✅ OBSERVE: Check every 10 days
    const lastObservation = recentActivities
      .filter((a) => a.type === "observe")
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (lastObservation) {
      const daysSinceObservation = differenceInDays(now, lastObservation.date);
      const expectedInterval = 10;

      if (daysSinceObservation > expectedInterval) {
        const daysMissed = daysSinceObservation - expectedInterval;
        const id = `${plantId}-observe-${lastObservation.date.toISOString()}`;
        console.log(`  Regular Observation Opportunity: ${id}. Skipped? ${skippedOpportunities.has(id)}`);

        if (!skippedOpportunities.has(id)) {
          opportunities.push({
            id,
            plantId,
            plantName,
            taskName: "Health Check",
            originalDueDate: addDays(lastObservation.date, expectedInterval),
            taskType: "observe",
            daysMissed,
            suggestedAction: "reschedule", // Always reschedule observations
            reason: "Regular health checks help catch issues early",
          });
        }
      }
    }

    // ✅ PHOTO: Check every 14 days
    const lastPhoto = recentActivities
      .filter((a) => a.type === "photo")
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (lastPhoto) {
      const daysSincePhoto = differenceInDays(now, lastPhoto.date);
      const expectedInterval = 14;

      if (daysSincePhoto > expectedInterval) {
        const daysMissed = daysSincePhoto - expectedInterval;
        const id = `${plantId}-photo-${lastPhoto.date.toISOString()}`;
        console.log(`  Regular Photo Opportunity: ${id}. Skipped? ${skippedOpportunities.has(id)}`);

        if (!skippedOpportunities.has(id)) {
          opportunities.push({
            id,
            plantId,
            plantName,
            taskName: "Progress Photo",
            originalDueDate: addDays(lastPhoto.date, expectedInterval),
            taskType: "photo",
            daysMissed,
            suggestedAction: daysMissed > 21 ? "skip" : "reschedule",
            reason: "Photo documentation helps track plant progress",
          });
        }
      }
    }

    // ✅ NOTE: Check every 30 days (general documentation)
    const lastNote = recentActivities
      .filter((a) => a.type === "note")
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (lastNote) {
      const daysSinceNote = differenceInDays(now, lastNote.date);
      const expectedInterval = 30;

      if (daysSinceNote > expectedInterval) {
        const daysMissed = daysSinceNote - expectedInterval;
        const id = `${plantId}-note-${lastNote.date.toISOString()}`;
        console.log(`  Regular Note Opportunity: ${id}. Skipped? ${skippedOpportunities.has(id)}`);

        if (!skippedOpportunities.has(id)) {
          opportunities.push({
            id,
            plantId,
            plantName,
            taskName: "Documentation Update",
            originalDueDate: addDays(lastNote.date, expectedInterval),
            taskType: "note",
            daysMissed,
            suggestedAction: daysMissed > 45 ? "skip" : "reschedule",
            reason: "Add notes about plant progress or changes",
          });
        }
      }
    }

    return opportunities;
  }

  // Find all missed opportunities for multiple plants
  static async findAllMissedOpportunitiesForUser(
    plants: PlantRecord[],
    userId: string,
    lookbackDays: number = 14
  ): Promise<MissedOpportunity[]> {
    const allOpportunities: MissedOpportunity[] = [];

    for (const plant of plants) {
      try {
        const plantOpportunities = await this.findMissedOpportunitiesWithUserId(
          plant.id,
          userId,
          lookbackDays,
          plant
        );

        const updatedOpportunities = plantOpportunities.map((opp) => ({
          ...opp,
          plantName: plant.name || plant.varietyName,
        }));

        allOpportunities.push(...updatedOpportunities);
      } catch (error) {
        console.error(
          `Failed to get opportunities for plant ${plant.id}:`,
          error
        );
      }
    }

    return allOpportunities.sort((a, b) => {
      if (a.daysMissed !== b.daysMissed) {
        return b.daysMissed - a.daysMissed;
      }

      const typePriority: Record<CareActivityType, number> = {
        water: 9,
        fertilize: 8,
        observe: 7,
        harvest: 6,
        moisture: 5,
        pruning: 5,
        thin: 4,
        lighting: 4,
        transplant: 3,
        photo: 2,
        note: 1,
      };

      return typePriority[b.taskType] - typePriority[a.taskType];
    });
  }

  // Skip an opportunity (mark as handled)
  static async skipOpportunity(opportunityId: string): Promise<void> {
    console.log("skipOpportunity: Starting for", opportunityId);
    try {
      this.addSkippedOpportunity(opportunityId);
      console.log("skipOpportunity: addSkippedOpportunity finished.");
    } catch (error) {
      console.error("Failed to skip opportunity:", error);
      throw error;
    }
  }

  // Unskip an opportunity
  static unskipOpportunity(opportunityId: string): void {
    try {
      const skipped = this.getSkippedOpportunities();
      skipped.delete(opportunityId);
      localStorage.setItem(
        this.SKIPPED_OPPORTUNITIES_KEY,
        JSON.stringify(Array.from(skipped))
      );
    } catch (error) {
      console.error("Failed to unskip opportunity:", error);
    }
  }

  // Clear all skipped opportunities
  static clearAllSkippedOpportunities(): void {
    try {
      localStorage.removeItem(this.SKIPPED_OPPORTUNITIES_KEY);
    } catch (error) {
      console.error("Failed to clear skipped opportunities:", error);
    }
  }
}