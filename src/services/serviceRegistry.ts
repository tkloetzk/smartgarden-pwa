// src/services/serviceRegistry.ts - Central service registration and configuration
import { container, SERVICE_KEYS, ICareSchedulingService, IDynamicSchedulingService, IPlantService, ICareService, IVarietyService } from "./interfaces";
import { CareSchedulingService } from "./careSchedulingService.new";
import { DynamicSchedulingService } from "./dynamicSchedulingService.new";
import { plantService, careService, varietyService } from "@/types/database";
import { Logger } from "@/utils/logger";

/**
 * Service Registry - Handles registration and bootstrapping of all services
 * This provides a centralized way to configure dependency injection
 */
export class ServiceRegistry {
  private static isBootstrapped = false;

  /**
   * Bootstrap all services - should be called once at application startup
   */
  static bootstrap(): void {
    if (ServiceRegistry.isBootstrapped) {
      Logger.warn("ServiceRegistry already bootstrapped, skipping...");
      return;
    }

    Logger.info("Bootstrapping service registry...");

    try {
      // Register database services as singletons (they're already singletons)
      container.registerSingleton(SERVICE_KEYS.PLANT_SERVICE, plantService);
      container.registerSingleton(SERVICE_KEYS.CARE_SERVICE, careService);
      container.registerSingleton(SERVICE_KEYS.VARIETY_SERVICE, varietyService);

      // Register dynamic scheduling service as singleton
      container.register(SERVICE_KEYS.DYNAMIC_SCHEDULING, () => {
        return new DynamicSchedulingService();
      });

      // Register care scheduling service with dependencies
      container.register(SERVICE_KEYS.CARE_SCHEDULING, () => {
        const plantSvc = container.get(SERVICE_KEYS.PLANT_SERVICE);
        const careSvc = container.get(SERVICE_KEYS.CARE_SERVICE);
        const varietySvc = container.get(SERVICE_KEYS.VARIETY_SERVICE);
        const dynamicSvc = container.getSingleton(SERVICE_KEYS.DYNAMIC_SCHEDULING);

        return new CareSchedulingService(
          plantSvc as IPlantService, 
          careSvc as ICareService, 
          varietySvc as IVarietyService, 
          dynamicSvc as IDynamicSchedulingService
        );
      });

      ServiceRegistry.isBootstrapped = true;
      Logger.info("Service registry bootstrapped successfully");
    } catch (error) {
      Logger.error("Failed to bootstrap service registry", error);
      throw error;
    }
  }

  /**
   * Get a service instance by key
   */
  static getService<T>(serviceKey: string): T {
    if (!ServiceRegistry.isBootstrapped) {
      ServiceRegistry.bootstrap();
    }
    return container.get<T>(serviceKey);
  }

  /**
   * Get a singleton service instance by key
   */
  static getSingleton<T>(serviceKey: string): T {
    if (!ServiceRegistry.isBootstrapped) {
      ServiceRegistry.bootstrap();
    }
    return container.getSingleton<T>(serviceKey);
  }

  /**
   * Reset the registry (useful for testing)
   */
  static reset(): void {
    container.clear();
    ServiceRegistry.isBootstrapped = false;
    Logger.debug("Service registry reset");
  }

  /**
   * Check if a service is registered
   */
  static hasService(serviceKey: string): boolean {
    return container.has(serviceKey);
  }

  /**
   * Register a custom service (useful for testing or extending functionality)
   */
  static registerCustomService<T>(serviceKey: string, factory: () => T): void {
    container.register(serviceKey, factory);
    Logger.debug("Custom service registered", { serviceKey });
  }

  /**
   * Register a custom singleton service
   */
  static registerCustomSingleton<T>(serviceKey: string, instance: T): void {
    container.registerSingleton(serviceKey, instance);
    Logger.debug("Custom singleton service registered", { serviceKey });
  }
}

// Convenience functions for common service access patterns
export const getSchedulingService = () => 
  ServiceRegistry.getService<ICareSchedulingService>(SERVICE_KEYS.CARE_SCHEDULING);

export const getDynamicSchedulingService = () => 
  ServiceRegistry.getSingleton<IDynamicSchedulingService>(SERVICE_KEYS.DYNAMIC_SCHEDULING);

export const getPlantService = () => 
  ServiceRegistry.getSingleton(SERVICE_KEYS.PLANT_SERVICE);

export const getCareService = () => 
  ServiceRegistry.getSingleton(SERVICE_KEYS.CARE_SERVICE);

export const getVarietyService = () => 
  ServiceRegistry.getSingleton(SERVICE_KEYS.VARIETY_SERVICE);

// Auto-bootstrap in non-test environments
if (process.env.NODE_ENV !== 'test') {
  ServiceRegistry.bootstrap();
}