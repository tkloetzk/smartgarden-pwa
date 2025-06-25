// src/services/firebase/careActivityService.ts
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./config";
import {
  FirebaseCareRecord,
  convertCareActivityToFirebase,
  convertCareActivityFromFirebase,
} from "../../types/firebase";
import { CareRecord } from "../../types/database";

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
    callback: (activities: CareRecord[]) => void,
    limitCount = 50
  ): () => void {
    const activitiesQuery = query(
      this.careActivitiesCollection,
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
}
