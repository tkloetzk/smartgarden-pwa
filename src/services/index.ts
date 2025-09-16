/**
 * Service Exports
 * 
 * Central export point for all business logic services.
 * Services are exported directly for clean imports throughout the application.
 */

// Core business logic services
export { PlantRegistrationService } from "./PlantRegistrationService";
export { ProtocolTranspilerService } from "./ProtocolTranspilerService";
export { CareSchedulingService } from "./careSchedulingService";
export { DynamicSchedulingService } from "./dynamicSchedulingService";
export { TaskManagementService } from "./TaskManagementService";
export { StageManagementService } from "./StageManagementService";

// Specialized services
export { CatchUpAnalysisService } from "./CatchUpAnalysisService";
export { GrowthRateService } from "./GrowthRateService";
export { PartialWateringService } from "./partialWateringService";
export { BulkActivityService } from "./bulkActivityService";
export { SmartDefaultsService } from "./smartDefaultsService";

// Firebase services
export { FirebasePlantService } from "./firebase/plantService";
export { FirebaseScheduledTaskService } from "./firebase/scheduledTaskService";

// Service interfaces and types
export type * from "./interfaces";

// Task types
export type { ScheduledTask } from "./ProtocolTranspilerService";

// Database services (re-exported from types for convenience)
export { plantService, varietyService, careService } from "@/types/database";
