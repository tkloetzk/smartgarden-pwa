/**
 * Focused hook for managing async state (loading, data, error)
 * Single responsibility: Manage async operation state
 */

import { useState, useCallback } from "react";
import { Logger } from "@/utils/logger";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface AsyncStateActions<T> {
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  handleAsyncOperation: <R>(
    operation: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: Error) => void
  ) => Promise<R | null>;
}

export function useAsyncState<T>(
  initialData: T | null = null,
  serviceName?: string
): AsyncState<T> & AsyncStateActions<T> {
  const [data, setDataState] = useState<T | null>(initialData);
  const [loading, setLoadingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const setData = useCallback((newData: T) => {
    setDataState(newData);
    setErrorState(null);
    setLoadingState(false);
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setLoadingState(isLoading);
    if (isLoading) {
      setErrorState(null);
    }
  }, []);

  const setError = useCallback((errorMessage: string | null) => {
    setErrorState(errorMessage);
    setLoadingState(false);
    if (serviceName && errorMessage) {
      Logger.error(`${serviceName} error`, errorMessage);
    }
  }, [serviceName]);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const reset = useCallback(() => {
    setDataState(initialData);
    setLoadingState(false);
    setErrorState(null);
  }, [initialData]);

  const handleAsyncOperation = useCallback(async <R,>(
    operation: () => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: Error) => void
  ): Promise<R | null> => {
    setLoading(true);
    
    try {
      const result = await operation();
      setLoading(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      
      if (onError) {
        onError(error);
      }
      
      return null;
    }
  }, [setLoading, setError]);

  return {
    data,
    loading,
    error,
    setData,
    setLoading,
    setError,
    clearError,
    reset,
    handleAsyncOperation,
  };
}