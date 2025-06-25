// src/__tests__/setup/mockFirebase.ts
export const mockFirebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id",
};

export const mockDb = {};
export const mockAuth = {};
export const mockStorage = {};

export const mockFirebaseFunctions = {
  initializeApp: jest.fn(() => ({})),
  getFirestore: jest.fn(() => mockDb),
  getAuth: jest.fn(() => mockAuth),
  getStorage: jest.fn(() => mockStorage),
  enableNetwork: jest.fn(),
  disableNetwork: jest.fn(),
};

// Add a dummy test to prevent Jest from failing
describe("MockFirebase Setup", () => {
  it("should export mock Firebase functions", () => {
    expect(mockFirebaseFunctions.initializeApp).toBeDefined();
    expect(mockFirebaseFunctions.getFirestore).toBeDefined();
    expect(mockFirebaseFunctions.getAuth).toBeDefined();
    expect(mockFirebaseFunctions.getStorage).toBeDefined();
  });
});
