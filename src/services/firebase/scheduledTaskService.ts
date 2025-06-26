// src/services/firebase/scheduledTaskService.ts
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { ScheduledTask } from "../ProtocolTranspilerService";

export interface FirebaseScheduledTask {
  id?: string;
  userId: string;
  plantId: string;
  taskName: string;
  taskType: string;
  details: {
    type: string;
    product: string;
    dilution: string;
    amount: string;
    method: string;
  };
  dueDate: Timestamp;
  status: string;
  sourceProtocol: {
    stage: string;
    originalStartDays: number;
    isDynamic: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class FirebaseScheduledTaskService {
  private static tasksCollection = collection(db, "scheduledTasks");

  static async createTask(
    task: ScheduledTask,
    userId: string
  ): Promise<string> {
    const firebaseTask: Omit<FirebaseScheduledTask, "id"> = {
      userId,
      plantId: task.plantId,
      taskName: task.taskName,
      taskType: task.taskType,
      details: task.details,
      dueDate: Timestamp.fromDate(task.dueDate),
      status: task.status,
      sourceProtocol: task.sourceProtocol,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(this.tasksCollection, firebaseTask);
    return docRef.id;
  }

  static async createMultipleTasks(
    tasks: ScheduledTask[],
    userId: string
  ): Promise<string[]> {
    const promises = tasks.map((task) => this.createTask(task, userId));
    const taskIds = await Promise.all(promises);

    return taskIds;
  }

  static subscribeToUserTasks(
    userId: string,
    callback: (tasks: ScheduledTask[]) => void,
    errorCallback: (error: Error) => void // Add an error callback
  ) {
    const q = query(
      this.tasksCollection,
      where("userId", "==", userId),
      where("status", "==", "pending"),
      orderBy("dueDate", "asc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const tasks: ScheduledTask[] = snapshot.docs.map((doc) => {
          const data = doc.data() as FirebaseScheduledTask;
          return {
            id: doc.id,
            plantId: data.plantId,
            taskName: data.taskName,
            taskType: data.taskType as ScheduledTask["taskType"],
            details: data.details as ScheduledTask["details"],
            dueDate: data.dueDate.toDate(),
            status: data.status as ScheduledTask["status"],
            sourceProtocol:
              data.sourceProtocol as ScheduledTask["sourceProtocol"],
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          };
        });
        callback(tasks);
      },
      (error) => {
        // Error handler
        console.error("❌ Error subscribing to tasks:", error);
        errorCallback(error);
      }
    );
  }
}
