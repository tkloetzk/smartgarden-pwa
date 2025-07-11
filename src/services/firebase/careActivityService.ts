// src/services/firebase/careActivityService.ts
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs, // ✅ Add this import
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
}
