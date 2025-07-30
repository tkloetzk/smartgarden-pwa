/**
 * Focused hook combining subscription management with data state
 * Single responsibility: Manage real-time data subscriptions with state
 */

import { useEffect, useMemo } from "react";
import { useAsyncState } from "./useAsyncState";
import { useFirebaseSubscription } from "./useFirebaseSubscription.focused";

export interface DataSubscriptionConfig<_T> {
  serviceName: string;
  isEnabled: boolean;
  dependencies?: unknown[];
}

export interface DataSubscriptionReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  isSubscribed: boolean;
  refetch: () => void;
}

export function useDataSubscription<T>(
  subscriptionFunction: (callback: (data: T[]) => void) => () => void,
  config: DataSubscriptionConfig<T>
): DataSubscriptionReturn<T> {
  const asyncState = useAsyncState<T[]>([], config.serviceName);

  // Memoize subscription function to prevent unnecessary re-subscriptions
  const memoizedSubscription = useMemo(() => {
    if (!config.isEnabled) {
      return () => () => {}; // Return empty unsubscribe function
    }
    return subscriptionFunction;
  }, [subscriptionFunction, config.isEnabled, ...(config.dependencies || [])]);

  const subscription = useFirebaseSubscription<T>(memoizedSubscription, {
    serviceName: config.serviceName,
    isEnabled: config.isEnabled,
    onData: (data: T[]) => {
      asyncState.setData(data);
    },
    onError: (error: string) => {
      asyncState.setError(error);
    },
  });

  // Auto-subscribe when enabled
  useEffect(() => {
    if (config.isEnabled) {
      asyncState.setLoading(true);
      subscription.subscribe();
    } else {
      subscription.unsubscribe();
      asyncState.reset();
    }
  }, [config.isEnabled, subscription.subscribe, subscription.unsubscribe, asyncState]);

  const refetch = () => {
    if (config.isEnabled) {
      asyncState.setLoading(true);
      subscription.unsubscribe();
      // Small delay to ensure cleanup before re-subscribing
      setTimeout(() => {
        subscription.subscribe();
      }, 10);
    }
  };

  return {
    data: asyncState.data || [],
    loading: asyncState.loading,
    error: asyncState.error,
    isSubscribed: subscription.isSubscribed,
    refetch,
  };
}