// All types are now consolidated in a single file
export * from "./consolidated";

// Re-export services from database.ts (keeping database.ts for services only)
export { plantService, varietyService, careService, bedService, db } from "./database";
