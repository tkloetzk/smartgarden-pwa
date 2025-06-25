import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { TextEncoder, TextDecoder } from "util";

/**
 * -----------------------------------------------------------------------------
 * Date Mocking Utilities for Jest
 * -----------------------------------------------------------------------------
 * This section provides utilities for mocking the global `Date` object in tests.
 * This is crucial for tests that are sensitive to the current time, ensuring
 * they produce consistent and predictable results regardless of when they are run.
 */

// Store the original Date object to be restored later.
const RealDate = Date;

/**
 * Mocks the Date object to return a fixed date.
 * This affects `new Date()` and `Date.now()`.
 * @param isoDate - The ISO string for the date to be mocked. e.g., "2024-01-10T12:00:00Z"
 */
export function mockDate(isoDate: string) {
  // Overwrite the global Date object with our mock implementation.
  // @ts-expect-error idk
  global.Date = class extends RealDate {
    // The constructor will be called when `new Date()` is used.
    constructor(date?: string | number | Date) {
      // If a date is passed to the constructor (e.g., new Date('2023-05-01')), use it.
      // This allows creating specific dates within tests even when the global Date is mocked.
      if (date) {
        super(date);
      } else {
        super(isoDate);
      }
    }

    // Mock static methods like Date.now() as well to ensure consistency.
    static now() {
      return new RealDate(isoDate).getTime();
    }
  };
}

/**
 * Restores the original global Date object.
 * This should be called in an `afterEach` or `afterAll` block to clean up mocks
 * and ensure test isolation.
 */
export const restoreDate = () => {
  global.Date = RealDate;
};

// --- End of Date Mocking Utilities ---

jest.mock("@/services/firebase/config", () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Mock import.meta for Jest
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: {
        VITE_FIREBASE_API_KEY: "test-api-key",
        VITE_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
        VITE_FIREBASE_PROJECT_ID: "test-project",
        VITE_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
        VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
        VITE_FIREBASE_APP_ID: "test-app-id",
      },
    },
  },
});

// Rest of your existing setupTests.ts content...
Object.defineProperty(global, "import.meta", {
  value: {
    env: {
      VITE_FIREBASE_API_KEY: "mock-api-key",
      VITE_FIREBASE_AUTH_DOMAIN: "mock-auth-domain.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "mock-project-id",
      VITE_FIREBASE_STORAGE_BUCKET: "mock-project-id.appspot.com",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "mock-sender-id",
      VITE_FIREBASE_APP_ID: "mock-app-id",
    },
  },
});

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ============================================================================
 * FIX for ReferenceError: structuredClone is not defined
 * ----------------------------------------------------------------------------
 * JSDOM, the environment Jest uses to simulate a browser, doesn't always have
 * the `structuredClone` function available. This polyfill provides a simple
 * implementation that handles the most common data types (including Dates),
 * allowing libraries like Dexie.js to function correctly in tests.
 * ESLint is disabled for this block as it's a special case polyfill.
 * ============================================================================
 */
if (typeof global.structuredClone === "undefined") {
  global.structuredClone = <T>(val: T): T => {
    const deepClone = (obj: any): any => {
      if (obj === null) return null;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (typeof obj !== "object") return obj;
      if (Array.isArray(obj)) {
        return obj.map((item: any) => deepClone(item));
      }
      const cloned: { [key: string]: any } = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = deepClone(obj[key]);
        }
      }
      return cloned;
    };
    return deepClone(val);
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

if (!global.crypto) {
  global.crypto = {
    randomUUID: () =>
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" as `${string}-${string}-${string}-${string}-${string}`,
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => array,
    subtle: {} as SubtleCrypto,
  } as unknown as Crypto;
}

if (!global.crypto.randomUUID) {
  global.crypto.randomUUID =
    (): `${string}-${string}-${string}-${string}-${string}` => {
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

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((_, callback) => {
    callback(null);
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  Timestamp: {
    now: jest.fn(() => new Date()),
    fromDate: jest.fn((date) => date),
  },
  writeBatch: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({})),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
