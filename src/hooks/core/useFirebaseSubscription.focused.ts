/**
 * Focused hook for Firebase real-time subscriptions
 * Single responsibility: Handle Firebase real-time data subscriptions
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "firebase/auth";
import { Logger } from "@/utils/logger";

export interface SubscriptionConfig<T> {
  serviceName: string;
  isEnabled: boolean;
  onData: (data: T[]) => void;
  onError: (error: string) => void;
}

export interface FirebaseSubscription<T> {
  subscribe: () => void;
  unsubscribe: () => void;
  isSubscribed: boolean;
}

export function useFirebaseSubscription<T>(
  subscriptionFunction: (callback: (data: T[]) => void) => () => void,
  config: SubscriptionConfig<T>
): FirebaseSubscription<T> {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribe = useCallback(() => {
    if (!config.isEnabled || isSubscribed) {
      return;
    }

    try {
      Logger.service(config.serviceName, "Setting up subscription");
      
      const unsubscribe = subscriptionFunction((data: T[]) => {
        Logger.service(config.serviceName, `Received ${data.length} items`);
        config.onData(data);
      });

      unsubscribeRef.current = unsubscribe;
      setIsSubscribed(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Subscription failed";
      Logger.error(`${config.serviceName} subscription error`, error);
      config.onError(errorMessage);
    }
  }, [subscriptionFunction, config, isSubscribed]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      Logger.service(config.serviceName, "Cleaning up subscription");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsSubscribed(false);
    }
  }, [config.serviceName]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    subscribe,
    unsubscribe,
    isSubscribed,
  };
}