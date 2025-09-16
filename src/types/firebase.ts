/**
 * Firebase-Specific Types
 * 
 * Types for Firebase integration, including Firestore document types
 * and conversion utilities.
 */

import { Timestamp } from "firebase/firestore";
import { 
  PlantRecord, 
  CareActivityRecord, 
  VarietyRecord, 
  ScheduledTask,
  UserProfile 
} from "./records";
import { ReminderPreferences } from "./protocols";
import { CareActivityType, PlantCategory } from "./core";

// ============================================================================
// FIREBASE DOCUMENT TYPES
// ============================================================================

export interface FirebasePlantRecord {
  id?: string;
  userId: string;
  varietyId: string;
  varietyName: string;
  name: string;
  plantedDate: Timestamp;
  location?: string;
  container?: string;
  soilMix?: string;
  isActive: boolean;
  notes?: string;
  quantity?: number;
  setupType?: "seed" | "transplant" | "cutting" | "bare-root";
  reminderPreferences?: ReminderPreferences;
  growthRateModifier?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseCareRecord {
  id?: string;
  userId: string;
  plantId: string;
  type: CareActivityType;
  date: Timestamp;
  details?: {
    amount?: string;
    unit?: string;
    product?: string;
    dilution?: string;
    method?: string;
    notes?: string;
    [key: string]: any;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseVarietyRecord {
  id?: string;
  name: string;
  normalizedName: string;
  category: PlantCategory;
  description?: string;
  timeline?: {
    [key: string]: number;
  };
  protocols?: {
    [key: string]: any;
  };
  isCustom?: boolean;
  source?: string;
  tags?: string[];
  userId?: string; // For custom varieties
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseScheduledTask {
  id?: string;
  userId: string;
  plantId: string;
  taskType: CareActivityType;
  dueDate: Timestamp;
  status: "pending" | "completed" | "bypassed";
  priority?: "low" | "medium" | "high";
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseUserProfile {
  id?: string;
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  settings: {
    theme: "light" | "dark" | "system";
    units: {
      volume: string;
      weight: string;
      temperature: string;
      length: string;
    };
    defaultReminders: ReminderPreferences;
    privacy: {
      shareData: boolean;
      analytics: boolean;
    };
    notifications: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  isFirstTimeUser: boolean;
  onboardingCompleted: boolean;
  lastActiveDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// FIREBASE QUERY TYPES
// ============================================================================

export interface FirebaseQueryConfig {
  collection: string;
  userId?: string;
  filters?: Array<{
    field: string;
    operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "not-in" | "array-contains";
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    direction: "asc" | "desc";
  }>;
  limit?: number;
  startAfter?: any;
}

export interface FirebaseSubscriptionOptions {
  includeMetadataChanges?: boolean;
  errorHandler?: (error: Error) => void;
  onData?: (data: any[]) => void;
}

// ============================================================================
// CONVERSION UTILITY TYPES
// ============================================================================

export interface FirebaseConverter<T, F> {
  toFirestore: (data: T, userId: string) => Omit<F, "id">;
  fromFirestore: (data: F) => T;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const toFirebaseTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

export const fromFirebaseTimestamp = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const convertPlantToFirebase = (
  plant: PlantRecord,
  userId: string
): Omit<FirebasePlantRecord, "id"> => ({
  userId,
  varietyId: plant.varietyId,
  varietyName: plant.varietyName,
  name: plant.name || plant.varietyName,
  plantedDate: toFirebaseTimestamp(plant.plantedDate),
  location: plant.location,
  container: plant.container,
  soilMix: plant.soilMix,
  isActive: plant.isActive,
  notes: plant.notes,
  quantity: plant.quantity,
  setupType: plant.setupType,
  reminderPreferences: plant.reminderPreferences,
  growthRateModifier: plant.growthRateModifier,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

export const convertPlantFromFirebase = (
  firebasePlant: FirebasePlantRecord
): PlantRecord => ({
  id: firebasePlant.id!,
  varietyId: firebasePlant.varietyId,
  varietyName: firebasePlant.varietyName,
  name: firebasePlant.name,
  plantedDate: fromFirebaseTimestamp(firebasePlant.plantedDate),
  location: firebasePlant.location,
  container: firebasePlant.container,
  soilMix: firebasePlant.soilMix,
  isActive: firebasePlant.isActive,
  notes: firebasePlant.notes,
  quantity: firebasePlant.quantity,
  setupType: firebasePlant.setupType,
  reminderPreferences: firebasePlant.reminderPreferences,
  growthRateModifier: firebasePlant.growthRateModifier,
  createdAt: fromFirebaseTimestamp(firebasePlant.createdAt),
  updatedAt: fromFirebaseTimestamp(firebasePlant.updatedAt),
});

export const convertCareActivityToFirebase = (
  activity: CareActivityRecord,
  userId: string
): Omit<FirebaseCareRecord, "id"> => ({
  userId,
  plantId: activity.plantId,
  type: activity.type,
  date: toFirebaseTimestamp(activity.date),
  details: activity.details,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

export const convertCareActivityFromFirebase = (
  firebaseActivity: FirebaseCareRecord
): CareActivityRecord => ({
  id: firebaseActivity.id!,
  plantId: firebaseActivity.plantId,
  type: firebaseActivity.type,
  date: fromFirebaseTimestamp(firebaseActivity.date),
  details: firebaseActivity.details as any,
  createdAt: fromFirebaseTimestamp(firebaseActivity.createdAt),
  updatedAt: fromFirebaseTimestamp(firebaseActivity.updatedAt),
});

export const convertVarietyToFirebase = (
  variety: VarietyRecord,
  userId?: string
): Omit<FirebaseVarietyRecord, "id"> => ({
  name: variety.name,
  normalizedName: variety.normalizedName,
  category: variety.category,
  description: variety.description,
  timeline: variety.timeline as any,
  protocols: variety.protocols as any,
  isCustom: variety.isCustom,
  source: variety.source,
  tags: variety.tags,
  userId: userId,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

export const convertVarietyFromFirebase = (
  firebaseVariety: FirebaseVarietyRecord
): VarietyRecord => ({
  id: firebaseVariety.id!,
  name: firebaseVariety.name,
  normalizedName: firebaseVariety.normalizedName,
  category: firebaseVariety.category,
  description: firebaseVariety.description,
  timeline: firebaseVariety.timeline,
  protocols: firebaseVariety.protocols,
  isCustom: firebaseVariety.isCustom,
  source: firebaseVariety.source,
  tags: firebaseVariety.tags,
  createdAt: fromFirebaseTimestamp(firebaseVariety.createdAt),
  updatedAt: fromFirebaseTimestamp(firebaseVariety.updatedAt),
});

export const convertScheduledTaskToFirebase = (
  task: ScheduledTask,
  userId: string
): Omit<FirebaseScheduledTask, "id"> => ({
  userId,
  plantId: task.plantId,
  taskType: task.taskType,
  dueDate: toFirebaseTimestamp(task.dueDate),
  status: task.status,
  priority: task.priority,
  description: task.description,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

export const convertScheduledTaskFromFirebase = (
  firebaseTask: FirebaseScheduledTask
): ScheduledTask => ({
  id: firebaseTask.id!,
  plantId: firebaseTask.plantId,
  taskType: firebaseTask.taskType,
  dueDate: fromFirebaseTimestamp(firebaseTask.dueDate),
  status: firebaseTask.status,
  priority: firebaseTask.priority,
  description: firebaseTask.description,
  createdAt: fromFirebaseTimestamp(firebaseTask.createdAt),
  updatedAt: fromFirebaseTimestamp(firebaseTask.updatedAt),
});

export const convertUserProfileToFirebase = (
  profile: UserProfile
): Omit<FirebaseUserProfile, "id"> => ({
  uid: profile.uid,
  email: profile.email,
  displayName: profile.displayName,
  photoURL: profile.photoURL,
  settings: profile.settings,
  isFirstTimeUser: profile.isFirstTimeUser,
  onboardingCompleted: profile.onboardingCompleted,
  lastActiveDate: toFirebaseTimestamp(profile.lastActiveDate),
  createdAt: toFirebaseTimestamp(profile.createdAt),
  updatedAt: Timestamp.now(),
});

export const convertUserProfileFromFirebase = (
  firebaseProfile: FirebaseUserProfile
): UserProfile => ({
  id: firebaseProfile.id!,
  uid: firebaseProfile.uid,
  email: firebaseProfile.email,
  displayName: firebaseProfile.displayName,
  photoURL: firebaseProfile.photoURL,
  settings: firebaseProfile.settings as any,
  isFirstTimeUser: firebaseProfile.isFirstTimeUser,
  onboardingCompleted: firebaseProfile.onboardingCompleted,
  lastActiveDate: fromFirebaseTimestamp(firebaseProfile.lastActiveDate),
  createdAt: fromFirebaseTimestamp(firebaseProfile.createdAt),
  updatedAt: fromFirebaseTimestamp(firebaseProfile.updatedAt),
});
