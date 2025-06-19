// src/types/index.ts
// Core types
export * from "./core";
export type { CategoryMoistureDefaults, MoistureProtocolInfo } from "./core";

// Database types
export * from "./database";

// Legacy compatibility - can be removed after migration
export type {
  PlantRecord as PlantInstance,
  VarietyRecord as PlantVariety,
  CareRecord as CareActivity,
} from "./database";

// Scheduling types
export * from "./scheduling";

// User settings
export * from "./user";
