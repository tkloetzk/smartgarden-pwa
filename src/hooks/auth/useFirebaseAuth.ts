// src/hooks/useFirebaseAuth.ts
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { FirebaseAuthService } from "@/services/firebase/authService";

// Test mode user mock
const createMockUser = (): User =>
  ({
    uid: "test-user-123",
    email: "test@example.com",
    displayName: "Test User",
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    photoURL: null,
    providerId: "password",
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: "mock-refresh-token",
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => "mock-id-token",
    getIdTokenResult: async () => ({
      token: "mock-id-token",
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: "password",
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({
      uid: "test-user-123",
      email: "test@example.com",
      displayName: "Test User",
    }),
  } as User);

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're in test mode - multiple detection methods for reliability
    const isTestMode =
      import.meta.env.VITE_TEST_MODE === "true" ||
      (window as any).__TEST_MODE === true ||
      (window as any).__VITE_TEST_MODE === "true";

    if (isTestMode) {
      // In test mode, immediately set a mock user
      const mockUser = createMockUser();
      setUser(mockUser);
      setLoading(false);
      console.log("🔧 Test mode detected, using mock user:", mockUser.email);
      // Return a no-op unsubscribe function
      return () => {};
    }

    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await FirebaseAuthService.signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      setError(null);
      setLoading(true);
      await FirebaseAuthService.signUp(email, password, displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);

      // Check if we're in test mode
      const isTestMode = import.meta.env.VITE_TEST_MODE === "true";

      if (isTestMode) {
        // In test mode, just clear the user state
        setUser(null);
        return;
      }

      await FirebaseAuthService.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await FirebaseAuthService.resetPassword(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
