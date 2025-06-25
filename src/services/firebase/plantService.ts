// src/services/firebase/plantService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import {
  FirebasePlantRecord,
  convertPlantToFirebase,
  convertPlantFromFirebase,
} from "../../types/firebase";
import { PlantRecord } from "../../types/database";

export class FirebasePlantService {
  private static plantsCollection = collection(db, "plants");

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

  static async updatePlant(
    plantId: string,
    updates: Partial<PlantRecord>
  ): Promise<void> {
    const plantRef = doc(this.plantsCollection, plantId);
    const firebaseUpdates = {
      ...updates,
      updatedAt: Timestamp.now(),
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

  static subscribeToPlantsChanges(
    userId: string,
    callback: (plants: PlantRecord[]) => void,
    options?: { includeInactive?: boolean }
  ): () => void {
    const constraints = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ];

    if (!options?.includeInactive) {
      constraints.push(where("isActive", "==", true));
    }

    const plantsQuery = query(this.plantsCollection, ...constraints);

    return onSnapshot(plantsQuery, (snapshot) => {
      const plants = snapshot.docs.map((doc) => {
        const data = doc.data() as FirebasePlantRecord;
        return convertPlantFromFirebase({ ...data, id: doc.id });
      });
      callback(plants);
    });
  }

  static async getPlant(plantId: string): Promise<PlantRecord | null> {
    return new Promise((resolve) => {
      const plantRef = doc(this.plantsCollection, plantId);
      const unsubscribe = onSnapshot(plantRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as FirebasePlantRecord;
          resolve(convertPlantFromFirebase({ ...data, id: doc.id }));
        } else {
          resolve(null);
        }
        unsubscribe();
      });
    });
  }
}
