// src/services/firebase/plantService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import {
  FirebasePlantRecord,
  convertPlantToFirebase,
  convertPlantFromFirebase,
} from "../../types/firebase";
import { PlantRecord } from "../../types/database";
import { Logger } from "@/utils/logger";

export class FirebasePlantService {
  private static plantsCollection = collection(db, "plants");

  static async updatePlant(
    plantId: string,
    updates: Partial<PlantRecord>
  ): Promise<void> {
    const plantRef = doc(this.plantsCollection, plantId);
    const firebaseUpdates = {
      ...updates,
      updatedAt: serverTimestamp(),
      ...(updates.plantedDate && {
        plantedDate: Timestamp.fromDate(updates.plantedDate),
      }),
    };

    await updateDoc(plantRef, firebaseUpdates);
  }

  static async deletePlant(plantId: string): Promise<void> {
    // Soft delete - mark as inactive
    await this.updatePlant(plantId, { isActive: false });
  }

  static async hardDeletePlant(plantId: string): Promise<void> {
    const batch = writeBatch(db);

    // Delete the plant
    const plantRef = doc(this.plantsCollection, plantId);
    batch.delete(plantRef);

    // Note: In a real implementation, you'd also delete associated care activities
    await batch.commit();
  }

  public static subscribeToPlantsChanges(
    userId: string,
    callback: (plants: PlantRecord[]) => void,
    options: { includeInactive: boolean } = { includeInactive: false }
  ): () => void {
    Logger.database("plants", "Creating plants query for userId:", userId);

    let q;
    if (options.includeInactive) {
      // Query for all plants belonging to the user
      q = query(this.plantsCollection, where("userId", "==", userId));
    } else {
      // Query for only active plants belonging to the user
      q = query(
        this.plantsCollection,
        where("userId", "==", userId),
        where("isActive", "==", true)
      );
    }

    Logger.database("plants", "Plants query created");

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        Logger.database("plants", "Query successful, received:", querySnapshot.size, "documents");

        const plants: PlantRecord[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          plants.push({
            id: doc.id,
            ...data,
            // Convert Firestore Timestamps to JS Dates
            plantedDate: (data.plantedDate as Timestamp)?.toDate(),
            createdAt: (data.createdAt as Timestamp)?.toDate(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate(),
          } as PlantRecord);
        });
        callback(plants);
      },
      (error) => {
        Logger.error("Plants query failed:", error);
        Logger.error("Query details:", { userId, options });
      }
    );

    return unsubscribe;
  }

  // src/services/firebase/plantService.ts
  static async getPlant(
    plantId: string,
    userId: string
  ): Promise<PlantRecord | null> {
    return new Promise((resolve) => {
      const plantRef = doc(this.plantsCollection, plantId);
      const unsubscribe = onSnapshot(
        plantRef,
        (doc) => {
          if (doc.exists()) {
            const data = doc.data() as FirebasePlantRecord;

            // ✅ Verify ownership before returning data
            if (data.userId !== userId) {
              console.error("❌ User does not own this plant");
              resolve(null);
              return;
            }

            resolve(convertPlantFromFirebase({ ...data, id: doc.id }));
          } else {
            resolve(null);
          }
          unsubscribe();
        },
        (error) => {
          console.error("❌ Error fetching plant:", error);
          resolve(null);
          unsubscribe();
        }
      );
    });
  }
  // src/services/firebase/plantService.ts - Fix the plant creation
  static async createPlant(
    plant: Omit<PlantRecord, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<string> {
    const plantWithDates: PlantRecord = {
      ...plant,
      id: "", // Will be set by Firebase
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const firebasePlant = convertPlantToFirebase(plantWithDates, userId);
    const docRef = await addDoc(this.plantsCollection, firebasePlant);
    return docRef.id;
  }
}
