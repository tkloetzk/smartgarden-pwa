/**
 * SmartGarden Type Definitions - Organized Entry Point
 * 
 * This is the main entry point for all type definitions in the SmartGarden app.
 * Types are organized by feature domain for better maintainability.
 */

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================
// Fundamental domain concepts and base types
export * from "./core";

// ============================================================================
// PROTOCOL AND GROWTH MANAGEMENT TYPES  
// ============================================================================
// Growth protocols, fertilization schedules, environmental requirements
export * from "./protocols";

// ============================================================================
// DATABASE RECORD TYPES
// ============================================================================
// Database entities, user records, and data models
export type {
  // Base types
  BaseRecord,
  
  // Plant and variety records
  PlantRecord,
  VarietyRecord,
  BedRecord,
  
  // Care activity records
  CareActivityRecord,
  CareActivityDetails,
  
  // Task management records
  TaskBypassRecord,
  TaskCompletionRecord,
  ScheduledTask,
  
  // User types
  UserSettings,
  UserProfile,
  
  // Legacy aliases
  CareRecord,
  BypassLogRecord,
  FertilizationMethod,
  Plant,
  Variety,
  CareActivity,
} from "./records";

// ============================================================================
// SERVICE INTERFACE TYPES
// ============================================================================
// Service contracts, analysis patterns, and business logic interfaces
export type {
  // Analysis and pattern types
  CompletionPattern,
  SchedulingAdjustment,
  MissedOpportunity,
  PartialWateringAnalysis,
  BulkActivityData,
  
  // Grouping types
  SectionPlants,
  SectionApplyOption,
  BulkCareResult,
  GroupedCareActivity,
  CareActivityDisplayItem,
  ContainerGroup,
  PlantGroup,
  
  // Utility service types
  QuickCompletionValues,
  SmartDefaults,
  GrowthStageInfo,
  ServiceResult,
  ServiceError,
  ParsedDilution,
  ParsedAmount,
  
  // Service interfaces
  ICareSchedulingService,
  IDynamicSchedulingService,
  IPlantService,
  ICareService,
  IVarietyService,
  TaskGenerationOptions,
  ITaskManagementService,
} from "./services";

// ============================================================================
// UI AND HOOK TYPES
// ============================================================================
// React components, hooks, forms, and user interface state
export * from "./ui";

// ============================================================================
// FIREBASE INTEGRATION TYPES
// ============================================================================
// Firebase-specific types and conversion utilities
export type {
  // Firebase document types
  FirebasePlantRecord,
  FirebaseCareRecord,
  FirebaseVarietyRecord,
  FirebaseScheduledTask,
  FirebaseUserProfile,
  
  // Query and config types
  FirebaseQueryConfig,
  FirebaseSubscriptionOptions,
  FirebaseConverter,
} from "./firebase";

// Conversion utilities - export as values
export {
  convertPlantToFirebase,
  convertPlantFromFirebase,
  convertCareActivityToFirebase,
  convertCareActivityFromFirebase,
  convertVarietyToFirebase,
  convertVarietyFromFirebase,
  convertScheduledTaskToFirebase,
  convertScheduledTaskFromFirebase,
  convertUserProfileToFirebase,
  convertUserProfileFromFirebase,
} from "./firebase";

// ============================================================================
// DATABASE SERVICES
// ============================================================================
// Re-export database services for backward compatibility
// These are actual service implementations, not types
export { 
  plantService, 
  varietyService, 
  careService, 
  bedService, 
  db 
} from "./database";
