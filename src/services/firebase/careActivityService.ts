// src/services/firebase/careActivityService.ts
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";
import {
  FirebaseCareRecord,
  convertCareActivityToFirebase,
  convertCareActivityFromFirebase,
} from "../../types";
import { CareRecord } from "../../types";

export class FirebaseCareActivityService {
  private static careActivitiesCollection = collection(db, "careActivities");

  static async createCareActivity(
    activity: Omit<CareRecord, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<string> {
    const activityWithDates: CareRecord = {
      ...activity,
      id: "", // Will be set by Firebase
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const firebaseActivity = convertCareActivityToFirebase(
      activityWithDates,
      userId
    );
    const docRef = await addDoc(
      this.careActivitiesCollection,
      firebaseActivity
    );
    return docRef.id;
  }

  static subscribeToPlantActivities(
    plantId: string,
    userId: string,
    callback: (activities: CareRecord[]) => void,
    limitCount = 50
  ): () => void {
    const activitiesQuery = query(
      this.careActivitiesCollection,
      where("userId", "==", userId),
      where("plantId", "==", plantId),
      orderBy("date", "desc"),
      limit(limitCount)
    );

    return onSnapshot(activitiesQuery, (snapshot) => {
      const activities = snapshot.docs.map((doc) => {
        const data = doc.data() as FirebaseCareRecord;
        return convertCareActivityFromFirebase({ ...data, id: doc.id });
      });
      callback(activities);
    });
  }

  static subscribeToUserActivities(
    userId: string,
    callback: (activities: CareRecord[]) => void,
    limitCount = 100
  ): () => void {
    const activitiesQuery = query(
      this.careActivitiesCollection,
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(limitCount)
    );

    return onSnapshot(activitiesQuery, (snapshot) => {
      const activities = snapshot.docs.map((doc) => {
        const data = doc.data() as FirebaseCareRecord;
        return convertCareActivityFromFirebase({ ...data, id: doc.id });
      });
      callback(activities);
    });
  }

  /**
   * Get the last activity of a specific type for a plant
   */
  static async getLastActivityByType(
    plantId: string,
    userId: string,
    type: string
  ): Promise<CareRecord | null> {
    try {
      const activitiesQuery = query(
        this.careActivitiesCollection,
        where("userId", "==", userId),
        where("plantId", "==", plantId),
        where("type", "==", type),
        orderBy("date", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(activitiesQuery);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as FirebaseCareRecord;
      return convertCareActivityFromFirebase({ ...data, id: doc.id });
    } catch (error) {
      console.error("Error getting last activity by type:", error);
      return null;
    }
  }

  // ✅ ADD THIS NEW METHOD
  static async getRecentActivitiesForPlant(
    plantId: string,
    userId: string,
    lookbackDays: number = 14
  ): Promise<CareRecord[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

      const q = query(
        this.careActivitiesCollection,
        where("userId", "==", userId),
        where("plantId", "==", plantId),
        where("date", ">=", cutoffDate),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      const activities: CareRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseCareRecord;
        activities.push(
          convertCareActivityFromFirebase({ ...data, id: doc.id })
        );
      });

      return activities;
    } catch (error) {
      console.error("Failed to get recent activities for plant:", error);
      return [];
    }
  }

  /**
   * Delete a care activity by ID
   */
  static async deleteCareActivity(activityId: string): Promise<void> {
    try {
      const activityDoc = doc(this.careActivitiesCollection, activityId);
      await deleteDoc(activityDoc);
    } catch (error) {
      console.error("Error deleting care activity:", error);
      throw new Error("Failed to delete care activity");
    }
  }
}
