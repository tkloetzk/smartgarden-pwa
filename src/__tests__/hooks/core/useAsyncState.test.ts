/**
 * Tests for useAsyncState focused hook
 * Tests async state management in isolation
 */

import { renderHook, act } from "@testing-library/react";
import { useAsyncState } from "@/hooks/core/useAsyncState";

describe("useAsyncState", () => {
  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useAsyncState<string>());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should initialize with custom initial data", () => {
    const initialData = "test data";
    const { result } = renderHook(() => useAsyncState(initialData));

    expect(result.current.data).toBe(initialData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should update data and clear error/loading", () => {
    const { result } = renderHook(() => useAsyncState<string>());

    act(() => {
      result.current.setError("test error");
    });

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull(); // Error cleared when loading starts

    act(() => {
      result.current.setData("new data");
    });

    expect(result.current.data).toBe("new data");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle loading state correctly", () => {
    const { result } = renderHook(() => useAsyncState<string>());

    act(() => {
      result.current.setError("existing error");
    });

    expect(result.current.error).toBe("existing error");

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull(); // Should clear error when loading starts
  });

  it("should handle error state correctly", () => {
    const { result } = renderHook(() => useAsyncState<string>());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setError("test error");
    });

    expect(result.current.error).toBe("test error");
    expect(result.current.loading).toBe(false); // Should stop loading when error occurs
  });

  it("should clear error", () => {
    const { result } = renderHook(() => useAsyncState<string>());

    act(() => {
      result.current.setError("test error");
    });

    expect(result.current.error).toBe("test error");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should reset to initial state", () => {
    const initialData = "initial";
    const { result } = renderHook(() => useAsyncState(initialData));

    // Modify state
    act(() => {
      result.current.setData("modified");
    });

    act(() => {
      result.current.setError("error");
    });

    expect(result.current.data).toBe("modified");
    expect(result.current.loading).toBe(false); // setError sets loading to false
    expect(result.current.error).toBe("error");

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe(initialData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe("handleAsyncOperation", () => {
    it("should handle successful async operation", async () => {
      const { result } = renderHook(() => useAsyncState<string>());
      const mockOperation = jest.fn().mockResolvedValue("success result");
      const mockOnSuccess = jest.fn();

      let operationResult: string | null = null;

      await act(async () => {
        operationResult = await result.current.handleAsyncOperation(
          mockOperation,
          mockOnSuccess
        );
      });

      expect(mockOperation).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith("success result");
      expect(operationResult).toBe("success result");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle failed async operation", async () => {
      const { result } = renderHook(() => useAsyncState<string>());
      const mockError = new Error("Operation failed");
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      const mockOnError = jest.fn();

      let operationResult: string | null = "not null";

      await act(async () => {
        operationResult = await result.current.handleAsyncOperation(
          mockOperation,
          undefined,
          mockOnError
        );
      });

      expect(mockOperation).toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith(mockError);
      expect(operationResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Operation failed");
    });

    it("should set loading state during operation", async () => {
      const { result } = renderHook(() => useAsyncState<string>());
      let promiseResolve: (value: string) => void;
      const mockOperation = jest.fn(
        () => new Promise<string>((resolve) => {
          promiseResolve = resolve;
        })
      );

      // Start the operation
      act(() => {
        result.current.handleAsyncOperation(mockOperation);
      });

      // Should be loading initially
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        promiseResolve("test result");
        // Small delay to allow promise to resolve
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should not be loading after completion
      expect(result.current.loading).toBe(false);
    });

    it("should handle non-Error rejections", async () => {
      const { result } = renderHook(() => useAsyncState<string>());
      const mockOperation = jest.fn().mockRejectedValue("string error");

      await act(async () => {
        await result.current.handleAsyncOperation(mockOperation);
      });

      expect(result.current.error).toBe("string error");
      expect(result.current.loading).toBe(false);
    });
  });
});