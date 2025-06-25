// src/hooks/useAppInitialization.ts
import { useEffect } from "react";
import { initializeDatabase } from "@/db/seedData";

export function useAppInitialization() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🌱 Initializing database...");
        await initializeDatabase();
        console.log("✅ Database initialization complete");
      } catch (error) {
        console.error("❌ Error during app initialization:", error);
      }
    };

    initializeApp();
  }, []);
}
