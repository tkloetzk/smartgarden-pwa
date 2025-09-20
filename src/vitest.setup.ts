// src/vitest.setup.ts
import "@testing-library/jest-dom/vitest";
import { beforeAll, afterEach, afterAll } from "vitest";

// Enable MSW server for all tests
import { server } from "./test/mocks/server";

// Setup MSW for all tests
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Firebase modules BEFORE they get imported
import { vi } from "vitest";

// Mock environment variables first
vi.mock("import.meta", () => ({
  env: {
    VITE_FIREBASE_API_KEY: "mock-api-key",
    VITE_FIREBASE_AUTH_DOMAIN: "mock-project.firebaseapp.com",
    VITE_FIREBASE_PROJECT_ID: "mock-project",
    VITE_FIREBASE_STORAGE_BUCKET: "mock-project.appspot.com",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
    VITE_FIREBASE_APP_ID: "1:123456789:web:abcdef",
    DEV: false,
  },
}));

// Create proper mock Firebase database
const mockDb = {
  collection: vi.fn(() => mockDb),
  doc: vi.fn(() => mockDb),
  where: vi.fn(() => mockDb),
  orderBy: vi.fn(() => mockDb),
  limit: vi.fn(() => mockDb),
  startAfter: vi.fn(() => mockDb),
};

vi.mock("@/services/firebase/config", () => ({
  db: mockDb,
  auth: {},
  storage: {},
}));

// Also mock any Firebase SDK modules that might be imported
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((_, callback) => {
    callback(null);
    return vi.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => mockDb),
  collection: vi.fn((db, path) => mockDb),
  doc: vi.fn((db, path) => mockDb),
  addDoc: vi.fn(() => Promise.resolve({ id: "mock-doc-id" })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() =>
    Promise.resolve({
      empty: true,
      docs: [],
      forEach: vi.fn(),
      size: 0,
    })
  ),
  onSnapshot: vi.fn((_, callback) => {
    // Mock onSnapshot to immediately call callback with empty data
    setTimeout(
      () =>
        callback({
          empty: true,
          docs: [],
          forEach: vi.fn(),
          size: 0,
        }),
      0
    );
    // Return unsubscribe function
    return vi.fn();
  }),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => ({ toDate: () => date })),
  },
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(() => Promise.resolve({ metadata: {} })),
  getDownloadURL: vi.fn(() => Promise.resolve("mock-url")),
}));

// Dashboard hooks are mocked individually by each test file as needed

// Keep only non-Firebase mocks
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

if (!global.structuredClone) {
  global.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}

// Mock import.meta for Vite environment
Object.defineProperty(global, "import", {
  value: {
    meta: {
      env: {
        VITE_FIREBASE_API_KEY: "test-api-key",
        VITE_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
        VITE_FIREBASE_PROJECT_ID: "test-project",
        VITE_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
        VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
        VITE_FIREBASE_APP_ID: "test-app-id",
        DEV: false,
      },
    },
  },
  configurable: true,
});
