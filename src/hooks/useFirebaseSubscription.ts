import { useState, useEffect } from "react";
import { useFirebaseAuth } from "./useFirebaseAuth";

type SubscriptionCallback<T> = (data: T[]) => void;
type UnsubscribeFunction = () => void;

interface UseFirebaseSubscriptionOptions<T, P> {
  serviceName: string;
  subscribeFunction: (
    params: P,
    callback: SubscriptionCallback<T>
  ) => UnsubscribeFunction;
  validateParams: (params: P, userUid: string | undefined) => boolean;
  getDependencies: (params: P, userUid: string | undefined) => unknown[];
  params: P;
}

export function useFirebaseSubscription<T, P>({
  serviceName,
  subscribeFunction,
  validateParams,
  getDependencies,
  params,
}: UseFirebaseSubscriptionOptions<T, P>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebaseAuth();

  useEffect(() => {
    if (!validateParams(params, user?.uid)) {
      setData([]);
      setLoading(false);
      return;
    }

    console.log(`🔍 Setting up ${serviceName} subscription:`, {
      params,
      userId: user?.uid,
    });

    const unsubscribe = subscribeFunction(params, (updatedData) => {
      setData(updatedData);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, getDependencies(params, user?.uid));

  const handleError = (err: unknown, operation: string): never => {
    const errorMessage =
      err instanceof Error ? err.message : `Failed to ${operation}`;
    setError(errorMessage);
    throw new Error(errorMessage);
  };

  return {
    data,
    loading,
    error,
    handleError,
  };
}
