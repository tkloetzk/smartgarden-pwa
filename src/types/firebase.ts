// src/types/firebase.ts
import { Timestamp } from "firebase/firestore";
import { PlantRecord, CareRecord, CareActivityDetails } from "./database";
import { CareActivityType, PlantCategory } from "./core";

// Firebase versions of your existing types with Firestore timestamps
export interface FirebasePlantRecord {
  id?: string;
  userId: string;
  varietyId: string;
  varietyName: string;
  name: string;
  plantedDate: Timestamp;
  location: string;
  container: string;
  soilMix?: string;
  isActive: boolean;
  notes?: string[];
  quantity?: number;
  setupType?: "multiple-containers" | "same-container";
  reminderPreferences?: {
    watering: boolean;
    fertilizing: boolean;
    observation: boolean;
    lighting: boolean;
    pruning: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseCareRecord {
  id?: string;
  userId: string;
  plantId: string;
  type: CareActivityType;
  date: Timestamp;
  details: CareActivityDetails;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseVarietyRecord {
  id?: string;
  userId?: string;
  name: string;
  category: PlantCategory;
  growthTimeline: {
    germination: number;
    seedling: number;
    vegetative: number;
    maturation: number;
  };
  protocols?: Record<string, unknown>;
  moistureProtocols?: Record<string, unknown>;
  isCustom?: boolean;
  isEverbearing?: boolean;
  productiveLifespan?: number;
  createdAt: Timestamp;
}

// Utility functions to convert between local and Firebase types
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
  name: plant.name || plant.varietyName, // Fallback to varietyName if name is missing
  plantedDate: toFirebaseTimestamp(plant.plantedDate),
  location: plant.location,
  container: plant.container,
  soilMix: plant.soilMix,
  isActive: plant.isActive,
  notes: plant.notes,
  quantity: plant.quantity,
  setupType: plant.setupType,
  reminderPreferences: plant.reminderPreferences,
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
  createdAt: fromFirebaseTimestamp(firebasePlant.createdAt),
  updatedAt: fromFirebaseTimestamp(firebasePlant.updatedAt),
});

export const convertCareActivityToFirebase = (
  activity: CareRecord,
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
): CareRecord => ({
  id: firebaseActivity.id!,
  plantId: firebaseActivity.plantId,
  type: firebaseActivity.type,
  date: fromFirebaseTimestamp(firebaseActivity.date),
  details: firebaseActivity.details,
  createdAt: fromFirebaseTimestamp(firebaseActivity.createdAt),
  updatedAt: fromFirebaseTimestamp(firebaseActivity.updatedAt),
});
