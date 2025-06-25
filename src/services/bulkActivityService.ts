// src/services/bulkActivityService.ts
import { CareActivityType } from "@/types";
import { careService } from "@/types/database";
import { CareActivityDetails } from "@/types/database";

export interface BulkActivityData {
  type: CareActivityType;
  date?: Date;
  details: Partial<CareActivityDetails>;
}

export class BulkActivityService {
  static async logActivityForPlants(
    plantIds: string[],
    activityData: BulkActivityData
  ): Promise<string[]> {
    const results: string[] = [];
    const date = activityData.date || new Date();

    for (const plantId of plantIds) {
      try {
        const careId = await careService.addCareActivity({
          plantId,
          type: activityData.type,
          date,
          details: {
            type: activityData.type,
            ...activityData.details,
          } as CareActivityDetails,
        });
        results.push(careId);
      } catch (error) {
        console.error(`Failed to log activity for plant ${plantId}:`, error);
      }
    }

    return results;
  }

  static async createBulkWateringActivity(
    amount: number,
    unit: string,
    moistureBefore?: number,
    moistureAfter?: number,
    notes?: string
  ): Promise<BulkActivityData> {
    return {
      type: "water",
      details: {
        type: "water",
        amount: { value: amount, unit: unit as any },
        moistureReading:
          moistureBefore && moistureAfter
            ? {
                before: moistureBefore,
                after: moistureAfter,
                scale: "1-10" as const,
              }
            : undefined,
        notes,
      },
    };
  }

  static async createBulkFertilizeActivity(
    product: string,
    dilution: string,
    amount: string,
    notes?: string
  ): Promise<BulkActivityData> {
    return {
      type: "fertilize",
      details: {
        type: "fertilize",
        product,
        dilution,
        amount,
        notes,
      },
    };
  }

  static async createBulkObservationActivity(
    healthAssessment: "excellent" | "good" | "fair" | "concerning" | "critical",
    observations: string,
    notes?: string
  ): Promise<BulkActivityData> {
    return {
      type: "observe",
      details: {
        type: "observe",
        healthAssessment,
        observations,
        notes,
      },
    };
  }
}
