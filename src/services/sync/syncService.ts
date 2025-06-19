// src/services/syncService.ts
import { db, SyncQueueRecord } from "@/types/database";

interface SyncConfig {
  apiBaseUrl: string;
  timeout: number;
  maxRetries: number;
}

export class SyncService {
  private static config: SyncConfig = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    timeout: 10000, // 10 seconds
    maxRetries: 3,
  };

  static async syncWhenOnline(): Promise<void> {
    if (!navigator.onLine) {
      console.log("Offline - skipping sync");
      return;
    }

    try {
      const unsyncedItems = await db.syncQueue
        .filter((item) => !item.synced)
        .toArray();

      if (unsyncedItems.length === 0) {
        console.log("No items to sync");
        return;
      }

      console.log(`Syncing ${unsyncedItems.length} items...`);

      for (const item of unsyncedItems) {
        try {
          await this.syncItem(item);
          await db.syncQueue.update(item.id, { synced: true });
          console.log(
            `Synced ${item.table} ${item.operation} for ${item.recordId}`
          );
        } catch (error) {
          console.warn(`Sync failed for item ${item.id}:`, error);

          // Increment retry count
          const retryCount = (item.retryCount || 0) + 1;

          if (retryCount >= this.config.maxRetries) {
            console.error(`Max retries exceeded for item ${item.id}`);
            // Mark as failed or handle differently
            await db.syncQueue.update(item.id, {
              retryCount,
              // Could add a 'failed' status field here
            });
          } else {
            await db.syncQueue.update(item.id, { retryCount });
          }
        }
      }
    } catch (error) {
      console.error("Sync process failed:", error);
    }
  }

  private static async syncItem(item: SyncQueueRecord): Promise<void> {
    const { table, operation, recordId, data } = item;

    let endpoint = `${this.config.apiBaseUrl}/${table}`;
    let method = "GET";
    let body: string | undefined;

    // Build request based on operation type
    switch (operation) {
      case "create":
        method = "POST";
        body = data;
        break;

      case "update":
        method = "PUT";
        endpoint = `${endpoint}/${recordId}`;
        body = data;
        break;

      case "delete":
        method = "DELETE";
        endpoint = `${endpoint}/${recordId}`;
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    // Make the API request
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        // Add authentication headers here if needed
        // "Authorization": `Bearer ${getAuthToken()}`,
      },
      body,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    // Handle response if needed
    if (operation === "create" && response.ok) {
      const responseData = await response.json();
      // Could update local record with server-generated ID if needed
      console.log("Create response:", responseData);
    }
  }

  // Manual sync trigger
  static async forcSync(): Promise<boolean> {
    try {
      await this.syncWhenOnline();
      return true;
    } catch (error) {
      console.error("Force sync failed:", error);
      return false;
    }
  }

  // Get sync status
  static async getSyncStatus(): Promise<{
    pendingCount: number;
    failedCount: number;
    lastSyncAttempt?: Date;
  }> {
    const allItems = await db.syncQueue.toArray();
    const pending = allItems.filter((item) => !item.synced);
    const failed = allItems.filter(
      (item) => (item.retryCount || 0) >= this.config.maxRetries
    );

    return {
      pendingCount: pending.length,
      failedCount: failed.length,
      lastSyncAttempt:
        pending.length > 0
          ? new Date(
              Math.max(...pending.map((item) => item.timestamp.getTime()))
            )
          : undefined,
    };
  }

  // Clear successful sync records (cleanup)
  static async cleanupSyncQueue(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep 7 days of history

    await db.syncQueue
      .filter((item) => item.synced)
      .and((item) => item.timestamp < cutoffDate)
      .delete();
  }

  // Retry failed items
  static async retryFailedItems(): Promise<void> {
    // ✅ Use filter for numeric comparison (works better)
    const failedItems = await db.syncQueue
      .filter((item) => (item.retryCount || 0) >= this.config.maxRetries)
      .toArray();

    for (const item of failedItems) {
      await db.syncQueue.update(item.id, { retryCount: 0 });
    }

    await this.syncWhenOnline();
  }

  // Configure sync service
  static configure(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Check if device is online and setup event listeners
  static setupSyncListeners(): void {
    // Sync when coming back online
    window.addEventListener("online", () => {
      console.log("Device back online - starting sync");
      this.syncWhenOnline();
    });

    // Periodic sync while online (every 5 minutes)
    setInterval(() => {
      if (navigator.onLine) {
        this.syncWhenOnline();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Initialize sync service
  static initialize(config?: Partial<SyncConfig>): void {
    if (config) {
      this.configure(config);
    }

    this.setupSyncListeners();

    // Initial sync if online
    if (navigator.onLine) {
      this.syncWhenOnline();
    }
  }
}

// Export for use in app initialization
export const initializeSync = (config?: Partial<SyncConfig>) => {
  SyncService.initialize(config);
};
