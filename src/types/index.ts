// Core types
export * from "./core";
export * from "./protocols";
export * from "./database";
export * from "./scheduling";
export * from "./firebase";
export * from "./user";

// Re-export services explicitly to ensure they're available
export { plantService, varietyService, careService, db } from "./database";

// Convenience aliases
export type {
  PlantRecord as Plant,
  VarietyRecord as Variety,
  CareActivityRecord as CareActivity,
} from "./database";
