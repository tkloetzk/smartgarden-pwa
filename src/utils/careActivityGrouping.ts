// src/utils/careActivityGrouping.ts
import { CareRecord } from "@/types";

export interface GroupedCareActivity {
  id: string;
  type: CareRecord['type'];
  date: Date;
  details: CareRecord['details'];
  plantIds: string[];
  plantCount: number;
  isGrouped: boolean;
  activities: CareRecord[];
}

export type CareActivityDisplayItem = CareRecord | GroupedCareActivity;

/**
 * Groups care activities that were likely logged together via bulk actions
 * Activities are grouped if they:
 * - Have the same type, details, and occur within 2 minutes of each other
 * - Are for different plants
 */
export function groupCareActivities(activities: CareRecord[]): CareActivityDisplayItem[] {
  if (activities.length === 0) return [];

  // Sort activities by date (newest first)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const grouped: CareActivityDisplayItem[] = [];
  const processed = new Set<string>();

  for (const activity of sortedActivities) {
    if (processed.has(activity.id)) continue;

    // Find similar activities that could be grouped with this one
    const similarActivities = sortedActivities.filter(other => {
      if (processed.has(other.id) || other.id === activity.id) return false;
      return canGroupActivities(activity, other);
    });

    if (similarActivities.length > 0) {
      // Create a grouped activity
      const allActivities = [activity, ...similarActivities];
      const plantIds = allActivities.map(a => a.plantId);
      
      const groupedActivity: GroupedCareActivity = {
        id: `group-${activity.id}`,
        type: activity.type,
        date: activity.date, // Use the first activity's date as representative
        details: activity.details,
        plantIds,
        plantCount: plantIds.length,
        isGrouped: true,
        activities: allActivities
      };

      grouped.push(groupedActivity);
      
      // Mark all activities as processed
      processed.add(activity.id);
      similarActivities.forEach(a => processed.add(a.id));
    } else {
      // Keep as individual activity
      grouped.push(activity);
      processed.add(activity.id);
    }
  }

  return grouped;
}

/**
 * Determines if two activities can be grouped together
 */
function canGroupActivities(a: CareRecord, b: CareRecord): boolean {
  // Must be different plants
  if (a.plantId === b.plantId) return false;
  
  // Must be same activity type
  if (a.type !== b.type) return false;
  
  // Must occur within 2 minutes of each other
  const timeDiff = Math.abs(
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (timeDiff > 2 * 60 * 1000) return false; // 2 minutes in milliseconds
  
  // Must have similar details (basic comparison)
  return haveSimilarDetails(a.details, b.details);
}

/**
 * Compares activity details to see if they're similar enough to group
 */
function haveSimilarDetails(a: CareRecord['details'], b: CareRecord['details']): boolean {
  // For water activities
  if (a.type === 'water' && b.type === 'water') {
    return (
      a.waterAmount === b.waterAmount &&
      a.waterUnit === b.waterUnit &&
      (a.notes || '') === (b.notes || '')
    );
  }
  
  // For fertilize activities
  if (a.type === 'fertilize' && b.type === 'fertilize') {
    return (
      a.product === b.product &&
      a.dilution === b.dilution &&
      a.applicationMethod === b.applicationMethod &&
      (a.notes || '') === (b.notes || '')
    );
  }
  
  // For observe activities
  if (a.type === 'observe' && b.type === 'observe') {
    return (
      a.healthAssessment === b.healthAssessment &&
      (a.notes || '') === (b.notes || '')
    );
  }
  
  // For harvest activities
  if (a.type === 'harvest' && b.type === 'harvest') {
    return (
      a.amount === b.amount &&
      a.quality === b.quality &&
      (a.notes || '') === (b.notes || '')
    );
  }
  
  // For transplant activities
  if (a.type === 'transplant' && b.type === 'transplant') {
    return (
      a.fromContainer === b.fromContainer &&
      a.toContainer === b.toContainer &&
      a.reason === b.reason &&
      (a.notes || '') === (b.notes || '')
    );
  }
  
  // Default: compare notes for other activity types
  return (a.notes || '') === (b.notes || '');
}

/**
 * Helper to check if an item is a grouped activity
 */
export function isGroupedActivity(item: CareActivityDisplayItem): item is GroupedCareActivity {
  return 'isGrouped' in item && item.isGrouped === true;
}