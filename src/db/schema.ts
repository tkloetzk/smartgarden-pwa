// src/db/schema.ts
import Dexie, { Table } from "dexie";
import {
  PlantInstance,
  PlantVariety,
  CareActivity,
  UserSettings,
} from "../types";

export interface Database extends Dexie {
  plantVarieties: Table<PlantVariety>;
  plantInstances: Table<PlantInstance>;
  careActivities: Table<CareActivity>;
  userSettings: Table<UserSettings>;
  syncQueue: Table<SyncQueueItem>;
}

// Type-safe discriminated union for sync queue items
export type SyncQueueItem =
  | {
      id?: number;
      entity: "plantInstance";
      action: "create" | "update" | "delete";
      data: Partial<PlantInstance>;
      timestamp: Date;
      synced: boolean;
    }
  | {
      id?: number;
      entity: "careActivity";
      action: "create" | "update" | "delete";
      data: Partial<CareActivity>;
      timestamp: Date;
      synced: boolean;
    }
  | {
      id?: number;
      entity: "plantVariety";
      action: "create" | "update" | "delete";
      data: Partial<PlantVariety>;
      timestamp: Date;
      synced: boolean;
    }
  | {
      id?: number;
      entity: "userSettings";
      action: "create" | "update" | "delete";
      data: Partial<UserSettings>;
      timestamp: Date;
      synced: boolean;
    };

export const db = new Dexie("SmartGardenDB") as Database;

db.version(1).stores({
  plantVarieties: "++id, name, category",
  plantInstances: "++id, varietyId, plantedDate, currentStage, isActive",
  careActivities: "++id, plantId, type, date",
  userSettings: "++id",
  syncQueue: "++id, entity, synced, timestamp",
});

// Add these helper functions at the end of schema.ts

export const syncQueueHelpers = {
  // Type-safe function to add items to sync queue
  async addToSyncQueue<T extends SyncQueueItem>(
    item: Omit<T, "id" | "timestamp" | "synced">
  ): Promise<number> {
    const syncItem: Omit<SyncQueueItem, "id"> = {
      ...item,
      timestamp: new Date(),
      synced: false,
    };
    return await db.syncQueue.add(syncItem as SyncQueueItem);
  },

  // Type-safe function to get unsynced items by entity type
  async getUnsyncedItems(
    entity?: SyncQueueItem["entity"]
  ): Promise<SyncQueueItem[]> {
    if (entity) {
      return await db.syncQueue
        .where("entity")
        .equals(entity)
        .and((item) => !item.synced)
        .toArray();
    }
    return await db.syncQueue.where("synced").equals(0).toArray();
  },

  // Mark items as synced
  async markAsSynced(ids: number[]): Promise<void> {
    await db.syncQueue.where("id").anyOf(ids).modify({ synced: true });
  },
};
