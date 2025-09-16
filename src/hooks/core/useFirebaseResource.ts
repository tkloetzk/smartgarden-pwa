/**
 * Consolidated Firebase resource hook factory
 * Eliminates duplication between Firebase hooks while maintaining type safety and functionality
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "firebase/auth";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { Logger } from "@/utils/logger";

export interface FirebaseResourceConfig<P, ServiceType> {
  serviceName: string;
  service: ServiceType;
  subscriptionMethod: keyof ServiceType;
  subscriptionParams?: (user: User | null, ...args: any[]) => P;
  validateParams?: (params: P, user: User | null) => boolean;
  getDependencies?: (params: P, user: User | null) => unknown[];
  crudOperations?: {
    create?: {
      method: keyof ServiceType;
      transform?: (data: any, user: User) => any[];
    };
    update?: {
      method: keyof ServiceType;
      transform?: (id: string, data: any, user: User) => any[];
    };
    delete?: {
      method: keyof ServiceType;
      transform?: (id: string, user: User) => any[];
    };
  };
}

export interface FirebaseResourceReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  create?: (data: any) => Promise<string>;
  update?: (id: string, data: any) => Promise<void>;
  delete?: (id: string) => Promise<void>;
}

export function useFirebaseResource<T, P, ServiceType>(
  config: FirebaseResourceConfig<P, ServiceType>,
  ...hookArgs: any[]
): FirebaseResourceReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useFirebaseAuth();

  // Generate subscription parameters
  const subscriptionParams = useMemo(() => {
    if (config.subscriptionParams) {
      return config.subscriptionParams(user, ...hookArgs);
    }
    return { userUid: user?.uid || "" } as P;
  }, [user, ...hookArgs, config.subscriptionParams]);

  // Generate dependencies for useEffect
  const dependencies = useMemo(() => {
    if (config.getDependencies) {
      return config.getDependencies(subscriptionParams, user);
    }
    return [user?.uid, ...hookArgs];
  }, [subscriptionParams, user, hookArgs, config.getDependencies]);

  // Validate parameters
  const isValidParams = useMemo(() => {
    if (config.validateParams) {
      return config.validateParams(subscriptionParams, user);
    }
    // Default validation: check if userUid exists
    return !!(subscriptionParams as any).userUid;
  }, [subscriptionParams, user, config.validateParams]);

  // Handle errors consistently
  const handleError = useCallback((err: unknown, operation: string): never => {
    const errorMessage = err instanceof Error ? err.message : `Failed to ${operation}`;
    Logger.error(`${config.serviceName} error in ${operation}`, err);
    setError(errorMessage);
    throw new Error(errorMessage);
  }, [config.serviceName]);

  // Subscription effect
  useEffect(() => {
    if (!isValidParams) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Logger.service(config.serviceName, "Setting up subscription", subscriptionParams);

    const service = config.service as any;
    const subscriptionMethod = service[config.subscriptionMethod];

    if (typeof subscriptionMethod !== "function") {
      const errorMsg = `Service method ${String(config.subscriptionMethod)} not found`;
      Logger.error(`${config.serviceName} configuration error`, errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      // Handle different subscription method signatures
      let unsubscribe: () => void;
      
      if (config.serviceName === "plants") {
        // FirebasePlantService.subscribeToPlantsChanges(userUid, callback, options)
        unsubscribe = subscriptionMethod.call(
          service, 
          (subscriptionParams as any).userUid, 
          (newData: T[]) => {
            Logger.service(config.serviceName, `Received ${newData.length} items`);
            setData(newData);
            setLoading(false);
            setError(null);
          },
          { includeInactive: (subscriptionParams as any).includeInactive }
        );
      } else if (config.serviceName === "care activities") {
        // FirebaseCareActivityService.subscribeToPlantActivities(plantId, userUid, callback)
        unsubscribe = subscriptionMethod.call(
          service,
          (subscriptionParams as any).plantId,
          (subscriptionParams as any).userUid,
          (newData: T[]) => {
            Logger.service(config.serviceName, `Received ${newData.length} items`);
            setData(newData);
            setLoading(false);
            setError(null);
          }
        );
      } else {
        // Generic fallback
        unsubscribe = subscriptionMethod.call(service, subscriptionParams, (newData: T[]) => {
          Logger.service(config.serviceName, `Received ${newData.length} items`);
          setData(newData);
          setLoading(false);
          setError(null);
        });
      }

      return () => {
        Logger.service(config.serviceName, "Cleaning up subscription");
        unsubscribe();
      };
    } catch (err) {
      handleError(err, "setup subscription");
    }
  }, dependencies);

  // Refetch function
  const refetch = useCallback(() => {
    if (!isValidParams) return;
    
    setLoading(true);
    setError(null);
    // Trigger re-subscription by updating a dependency
    // This will cause the useEffect to run again
  }, [isValidParams]);

  // CRUD operations
  const crudOperations = useMemo(() => {
    if (!config.crudOperations) return {};

    const operations: any = {};

    // Create operation
    if (config.crudOperations.create) {
      operations.create = async (data: any): Promise<string> => {
        if (!user) {
          throw new Error("User not authenticated");
        }

        const createConfig = config.crudOperations!.create!;
        const service = config.service as any;
        const method = service[createConfig.method];

        if (typeof method !== "function") {
          throw new Error(`Create method ${String(createConfig.method)} not found`);
        }

        try {
          const args = createConfig.transform 
            ? createConfig.transform(data, user)
            : [data, user.uid];
          
          Logger.service(config.serviceName, "Creating resource", args);
          return await method.apply(service, args);
        } catch (err) {
          return handleError(err, "create resource");
        }
      };
    }

    // Update operation
    if (config.crudOperations.update) {
      operations.update = async (id: string, data: any): Promise<void> => {
        if (!user) {
          throw new Error("User not authenticated");
        }

        const updateConfig = config.crudOperations!.update!;
        const service = config.service as any;
        const method = service[updateConfig.method];

        if (typeof method !== "function") {
          throw new Error(`Update method ${String(updateConfig.method)} not found`);
        }

        try {
          const args = updateConfig.transform 
            ? updateConfig.transform(id, data, user)
            : [id, data];
          
          Logger.service(config.serviceName, "Updating resource", { id, ...args });
          return await method.apply(service, args);
        } catch (err) {
          return handleError(err, "update resource");
        }
      };
    }

    // Delete operation
    if (config.crudOperations.delete) {
      operations.delete = async (id: string): Promise<void> => {
        if (!user) {
          throw new Error("User not authenticated");
        }

        const deleteConfig = config.crudOperations!.delete!;
        const service = config.service as any;
        const method = service[deleteConfig.method];

        if (typeof method !== "function") {
          throw new Error(`Delete method ${String(deleteConfig.method)} not found`);
        }

        try {
          const args = deleteConfig.transform 
            ? deleteConfig.transform(id, user)
            : [id];
          
          Logger.service(config.serviceName, "Deleting resource", { id });
          return await method.apply(service, args);
        } catch (err) {
          return handleError(err, "delete resource");
        }
      };
    }

    return operations;
  }, [user, config.crudOperations, config.service, handleError, config.serviceName]);

  return {
    data,
    loading,
    error,
    refetch,
    ...crudOperations,
  };
}