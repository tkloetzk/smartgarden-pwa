// src/setupTests.ts
import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

// Add TextEncoder/TextDecoder polyfills
import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Polyfill crypto.randomUUID for Node.js test environment
if (!global.crypto) {
  global.crypto = {
    randomUUID: () =>
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" as `${string}-${string}-${string}-${string}-${string}`,
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => array,
    subtle: {} as SubtleCrypto,
  } as unknown as Crypto;
}

if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    ) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

// Mock PWA-specific APIs
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = "0px";
  thresholds: ReadonlyArray<number> = [0];

  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock navigator properties for PWA testing
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});

Object.defineProperty(navigator, "serviceWorker", {
  value: {
    register: jest.fn(() =>
      Promise.resolve({
        installing: null,
        waiting: null,
        active: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })
    ),
    ready: Promise.resolve({
      update: jest.fn(),
      unregister: jest.fn(),
      addEventListener: jest.fn(),
    }),
    controller: null,
    addEventListener: jest.fn(),
  },
});

// Mock Camera API for photo testing
Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: jest.fn(() =>
      Promise.resolve({
        getTracks: () => [{ stop: jest.fn() }],
      })
    ),
  },
});

// Mock file API
global.FileReader = class FileReader {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  result: string | ArrayBuffer | null = null;
  readyState: number = 0;
  error: DOMException | null = null;

  readAsDataURL = jest.fn();
  readAsText = jest.fn();
  readAsArrayBuffer = jest.fn();
  readAsBinaryString = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
  abort = jest.fn();

  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  onloadstart:
    | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
    | null = null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  onprogress:
    | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
    | null = null;
} as any;

if (!global.structuredClone) {
  global.structuredClone = <T>(obj: T): T => {
    // Simple deep clone implementation for test environment
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    if (obj instanceof Array) {
      return obj.map((item) => global.structuredClone(item)) as T;
    }

    if (typeof obj === "object") {
      const cloned: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
          cloned[key] = global.structuredClone(
            (obj as Record<string, unknown>)[key]
          );
        }
      }
      return cloned as T;
    }

    return obj;
  };
}

// Mock storage quota API
Object.defineProperty(navigator, "storage", {
  value: {
    estimate: jest.fn(() =>
      Promise.resolve({
        quota: 1000000000,
        usage: 100000,
      })
    ),
  },
});

// Time control utilities for testing
export const mockDate = (date: string): void => {
  const mockNow = new Date(date);
  jest.spyOn(Date, "now").mockReturnValue(mockNow.getTime());
  jest.spyOn(global, "Date").mockImplementation(() => mockNow);
};

export const restoreDate = (): void => {
  jest.restoreAllMocks();
};
