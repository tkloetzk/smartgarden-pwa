// src/services/retroactiveWateringService.ts
import { plantService, db } from "@/types/database";
import { PartialWateringService } from "./partialWateringService";
import { Logger } from "@/utils/logger";
import { CareActivityRecord } from "@/types/database";

export class RetroactiveWateringService {
  /**
   * Analyze and update existing water activities that may be missing partial watering flags
   */
  static async analyzeAndUpdateWaterActivities(): Promise<{
    analyzed: number;
    updated: number;
    errors: number;
  }> {
    try {
      console.log("🔍 Starting retroactive water activity analysis...");
      
      // Get all plants
      const plants = await plantService.getActivePlants();
      let analyzed = 0;
      let updated = 0;
      let errors = 0;

      for (const plant of plants) {
        try {
          // Get recent water activities for this plant (last 30 days)
          const allActivities = await db.careActivities
            .where("plantId")
            .equals(plant.id)
            .and((activity: CareActivityRecord) => activity.type === "water")
            .reverse()
            .sortBy("date");

          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentActivities = allActivities
            .filter((activity: CareActivityRecord) => {
              const activityDate = new Date(activity.date);
              return activityDate >= thirtyDaysAgo;
            })
            .slice(0, 10); // Limit to last 10 activities

          for (const activity of recentActivities) {
            analyzed++;
            
            // Skip if already has partial watering analysis
            if (activity.details.isPartialWatering !== undefined) {
              continue;
            }

            // Skip if no water amount recorded
            if (!activity.details.waterAmount || !activity.details.waterUnit) {
              continue;
            }

            console.log(`📊 Analyzing ${plant.varietyName || "unknown"}: ${activity.details.waterAmount} ${activity.details.waterUnit}`);

            // Analyze the watering amount
            const analysis = await PartialWateringService.analyzeWateringAmount(
              plant,
              activity.details.waterAmount,
              activity.details.waterUnit as any
            );

            // Update the activity with analysis results
            const updatedDetails = {
              ...activity.details,
              recommendedAmount: analysis.recommendedAmount,
              isPartialWatering: analysis.isPartial,
              wateringCompleteness: analysis.completeness,
            };

            // Update the activity record directly in the database
            await db.careActivities.update(activity.id, {
              details: updatedDetails,
              updatedAt: new Date(),
            });

            updated++;
            console.log(`✅ Updated activity: ${analysis.isPartial ? 'PARTIAL' : 'COMPLETE'} (${Math.round(analysis.completeness * 100)}%)`);
          }
        } catch (error) {
          errors++;
          Logger.error(`Failed to analyze activities for plant ${plant.id}:`, error);
        }
      }

      console.log(`🎉 Retroactive analysis complete: ${analyzed} analyzed, ${updated} updated, ${errors} errors`);
      
      return { analyzed, updated, errors };
    } catch (error) {
      Logger.error("Failed to run retroactive water analysis:", error);
      throw error;
    }
  }
}