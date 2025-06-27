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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import {
  FirebasePlantRecord,
  convertPlantToFirebase,
  convertPlantFromFirebase,
} from "../../types/firebase";
import { PlantRecord, varietyService } from "../../types/database";
import { ProtocolTranspilerService } from "../ProtocolTranspilerService";
import { FirebaseScheduledTaskService } from "./scheduledTaskService";

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
  // In src/services/firebase/plantService.ts, add extensive logging to the createPlant method:
  static async createPlant(
    plant: Omit<PlantRecord, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<string> {
    try {
      // Create the plant with dates
      const plantWithDates: PlantRecord = {
        ...plant,
        id: "",
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const firebasePlantData = convertPlantToFirebase(plantWithDates, userId);
      const docRef = await addDoc(collection(db, "plants"), firebasePlantData);

      const variety = await varietyService.getVariety(plant.varietyId);

      if (!variety) {
        console.error("❌ Variety not found:", plant.varietyId);
        return docRef.id;
      }

      if (variety.protocols?.fertilization) {
        const fullPlant: PlantRecord = {
          ...plantWithDates,
          id: docRef.id,
        };

        const scheduledTasks =
          await ProtocolTranspilerService.transpilePlantProtocol(
            fullPlant,
            variety
          );

        // Save tasks to Firestore
        if (scheduledTasks.length > 0) {
          // TODO: We need to implement this!
          await FirebaseScheduledTaskService.createMultipleTasks(
            scheduledTasks,
            userId
          );
        } else {
          console.log("⚠️ No tasks generated");
        }
      } else {
        console.log("⚠️ No fertilization protocols found for variety");
      }

      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating plant:", error);
      throw error;
    }
  }
}
