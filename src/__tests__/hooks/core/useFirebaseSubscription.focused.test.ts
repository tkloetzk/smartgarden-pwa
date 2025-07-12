/**
 * Tests for useFirebaseSubscription focused hook
 * Tests subscription lifecycle management in isolation
 */

import { renderHook, act } from "@testing-library/react";
import { useFirebaseSubscription } from "@/hooks/core/useFirebaseSubscription.focused";

describe("useFirebaseSubscription", () => {
  let mockUnsubscribe: jest.Mock;
  let mockSubscriptionFunction: jest.Mock;
  let mockOnData: jest.Mock;
  let mockOnError: jest.Mock;


  let defaultConfig: {
    serviceName: string;
    isEnabled: boolean;
    onData: jest.Mock;
    onError: jest.Mock;
  };

  beforeEach(() => {
    mockUnsubscribe = jest.fn();
    mockSubscriptionFunction = jest.fn().mockReturnValue(mockUnsubscribe);
    mockOnData = jest.fn();
    mockOnError = jest.fn();
    
    defaultConfig = {
      serviceName: "test-service",
      isEnabled: true,
      onData: mockOnData,
      onError: mockOnError,
    };
  });

  it("should initialize with unsubscribed state", () => {
    const { result } = renderHook(() =>
      useFirebaseSubscription(mockSubscriptionFunction, defaultConfig)
    );

    expect(result.current.isSubscribed).toBe(false);
    expect(mockSubscriptionFunction).not.toHaveBeenCalled();
  });

  it("should subscribe when subscribe is called", () => {
    const { result } = renderHook(() =>
      useFirebaseSubscription(mockSubscriptionFunction, defaultConfig)
    );

    act(() => {
      result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(mockSubscriptionFunction).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should not subscribe if already subscribed", () => {
    const { result } = renderHook(() =>
      useFirebaseSubscription(mockSubscriptionFunction, defaultConfig)
    );

    act(() => {
      result.current.subscribe();
    });

    expect(mockSubscriptionFunction).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.subscribe();
    });

    // Should not call subscription function again
    expect(mockSubscriptionFunction).toHaveBeenCalledTimes(1);
  });

  it("should not subscribe if disabled", () => {
    const disabledConfig = {
      serviceName: "test-service",
      isEnabled: false,
      onData: mockOnData,
      onError: mockOnError,
    };

    const { result } = renderHook(() =>
      useFirebaseSubscription(mockSubscriptionFunction, disabledConfig)
    );

    act(() => {
      result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(mockSubscriptionFunction).not.toHaveBeenCalled();
  });

  it("should call onData when subscription receives data", () => {
    const { result } = renderHook(() =>
      useFirebaseSubscription(mockSubscriptionFunction, defaultConfig)
    );

    act(() => {
      result.current.subscribe();
    });

    // Get the callback function passed to the subscription
    const subscriptionCallback = mockSubscriptionFunction.mock.calls[0][0];
    const testData = [{ id: "1", name: "test" }];

    act(() => {
      subscriptionCallback(testData);
    });

    expect(mockOnData).toHaveBeenCalledWith(testData);
  });

  it("should unsubscribe and update state", () => {
    const { result } = renderHook(() =>
      useFirebaseSubscription(mockSubscriptionFunction, defaultConfig)
    );

    act(() => {
      result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(true);

    act(() => {
      result.current.unsubscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("should handle unsubscribe when not subscribed", () => {
    const { result } = renderHook(() =>
      useFirebaseSubscription(mockSubscriptionFunction, defaultConfig)
    );

    // Should not throw error
    act(() => {
      result.current.unsubscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it("should handle subscription errors", () => {
    const subscriptionError = new Error("Subscription failed");
    const errorSubscriptionFunction = jest.fn().mockImplementation(() => {
      throw subscriptionError;
    });

    const { result } = renderHook(() =>
      useFirebaseSubscription(errorSubscriptionFunction, defaultConfig)
    );

    act(() => {
      result.current.subscribe();
    });

    expect(mockOnError).toHaveBeenCalledWith("Subscription failed");
    expect(result.current.isSubscribed).toBe(false);
  });

  it("should handle non-Error subscription errors", () => {
    const errorSubscriptionFunction = jest.fn().mockImplementation(() => {
      throw "String error";
    });

    const { result } = renderHook(() =>
      useFirebaseSubscription(errorSubscriptionFunction, defaultConfig)
    );

    act(() => {
      result.current.subscribe();
    });

    expect(mockOnError).toHaveBeenCalledWith("Subscription failed");
    expect(result.current.isSubscribed).toBe(false);
  });

  it("should cleanup subscription on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useFirebaseSubscription(mockSubscriptionFunction, defaultConfig)
    );

    act(() => {
      result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(true);

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("should update subscription when function changes", () => {
    const newMockUnsubscribe = jest.fn();
    const newMockSubscriptionFunction = jest.fn().mockReturnValue(newMockUnsubscribe);
    
    const { result, rerender } = renderHook(
      ({ subscriptionFunction }) =>
        useFirebaseSubscription(subscriptionFunction, defaultConfig),
      {
        initialProps: { subscriptionFunction: mockSubscriptionFunction },
      }
    );

    act(() => {
      result.current.subscribe();
    });

    expect(mockSubscriptionFunction).toHaveBeenCalledTimes(1);

    // Unsubscribe first
    act(() => {
      result.current.unsubscribe();
    });

    // Change the subscription function
    rerender({ subscriptionFunction: newMockSubscriptionFunction });

    act(() => {
      result.current.subscribe();
    });

    // Should call the new subscription function
    expect(newMockSubscriptionFunction).toHaveBeenCalledTimes(1);
  });
});