// src/jest.polyfills.ts
import { TextDecoder, TextEncoder } from "util";
import "fake-indexeddb/auto";

Object.assign(global, { TextDecoder, TextEncoder });

// Mock import.meta properly for Vite
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
