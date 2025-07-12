/**
 * Focused hook for Firebase CRUD operations
 * Single responsibility: Handle Create, Read, Update, Delete operations
 */

import { useCallback } from "react";
import { User } from "firebase/auth";
import { useFirebaseAuth } from "../useFirebaseAuth";
import { useAsyncState } from "./useAsyncState";
import { Logger } from "@/utils/logger";

export interface CrudConfig<ServiceType> {
  serviceName: string;
  service: ServiceType;
}

export interface CrudOperations {
  create?: <TData, TResult = string>(
    data: TData,
    options?: { transform?: (data: TData, user: User) => unknown[] }
  ) => Promise<TResult | null>;
  
  update?: <TData>(
    id: string,
    data: TData,
    options?: { transform?: (id: string, data: TData, user: User) => unknown[] }
  ) => Promise<void>;
  
  delete?: (
    id: string,
    options?: { transform?: (id: string, user: User) => unknown[] }
  ) => Promise<void>;
}

export function useFirebaseCrud<ServiceType extends Record<string, unknown>>(
  config: CrudConfig<ServiceType>,
  operations: {
    createMethod?: keyof ServiceType;
    updateMethod?: keyof ServiceType;
    deleteMethod?: keyof ServiceType;
  }
): CrudOperations & { isLoading: boolean; error: string | null } {
  const { user } = useFirebaseAuth();
  const asyncState = useAsyncState(null, config.serviceName);

  const executeOperation = useCallback(async <T,>(
    methodKey: keyof ServiceType,
    operationName: string,
    args: unknown[]
  ): Promise<T | null> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const method = config.service[methodKey];
    if (typeof method !== "function") {
      throw new Error(`Method ${String(methodKey)} not found on ${config.serviceName}`);
    }

    Logger.service(config.serviceName, `Executing ${operationName}`, args);
    return method.apply(config.service, args) as T;
  }, [config.service, config.serviceName, user]);

  const create = useCallback(async <TData, TResult = string>(
    data: TData,
    options?: { transform?: (data: TData, user: User) => unknown[] }
  ): Promise<TResult | null> => {
    if (!operations.createMethod) {
      throw new Error(`Create method not configured for ${config.serviceName}`);
    }

    return asyncState.handleAsyncOperation(async () => {
      const args = options?.transform 
        ? options.transform(data, user!)
        : [data, user!.uid];
      
      return executeOperation<TResult>(operations.createMethod!, "create", args);
    });
  }, [operations.createMethod, config.serviceName, asyncState, executeOperation, user]);

  const update = useCallback(async <TData>(
    id: string,
    data: TData,
    options?: { transform?: (id: string, data: TData, user: User) => unknown[] }
  ): Promise<void> => {
    if (!operations.updateMethod) {
      throw new Error(`Update method not configured for ${config.serviceName}`);
    }

    await asyncState.handleAsyncOperation(async () => {
      const args = options?.transform 
        ? options.transform(id, data, user!)
        : [id, data];
      
      return executeOperation<void>(operations.updateMethod!, "update", args);
    });
  }, [operations.updateMethod, config.serviceName, asyncState, executeOperation, user]);

  const deleteResource = useCallback(async (
    id: string,
    options?: { transform?: (id: string, user: User) => unknown[] }
  ): Promise<void> => {
    if (!operations.deleteMethod) {
      throw new Error(`Delete method not configured for ${config.serviceName}`);
    }

    await asyncState.handleAsyncOperation(async () => {
      const args = options?.transform 
        ? options.transform(id, user!)
        : [id];
      
      return executeOperation<void>(operations.deleteMethod!, "delete", args);
    });
  }, [operations.deleteMethod, config.serviceName, asyncState, executeOperation, user]);

  return {
    create: operations.createMethod ? create : undefined,
    update: operations.updateMethod ? update : undefined,
    delete: operations.deleteMethod ? deleteResource : undefined,
    isLoading: asyncState.loading,
    error: asyncState.error,
  };
}