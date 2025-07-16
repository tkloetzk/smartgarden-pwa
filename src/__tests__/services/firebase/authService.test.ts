import { FirebaseAuthService } from "@/services/firebase/authService";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { auth } from "@/services/firebase/config";

// Mock Firebase Auth functions
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// Mock the auth config
jest.mock("@/services/firebase/config", () => ({
  auth: {
    currentUser: null,
  },
}));

const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockSendPasswordResetEmail = sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>;
const mockAuth = auth as jest.Mocked<typeof auth>;

describe("FirebaseAuthService", () => {
  const mockUser: Partial<User> = {
    uid: "user-123",
    email: "test@example.com",
    displayName: "Test User",
  };

  const mockUserCredential = {
    user: mockUser as User,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signIn", () => {
    it("successfully signs in a user with email and password", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const result = await FirebaseAuthService.signIn("test@example.com", "password123");

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@example.com",
        "password123"
      );
      expect(result).toBe(mockUser);
    });

    it("throws error when sign in fails", async () => {
      const signInError = new Error("Invalid credentials");
      mockSignInWithEmailAndPassword.mockRejectedValue(signInError);

      await expect(
        FirebaseAuthService.signIn("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@example.com",
        "wrongpassword"
      );
    });

    it("handles network errors gracefully", async () => {
      const networkError = new Error("Network error");
      mockSignInWithEmailAndPassword.mockRejectedValue(networkError);

      await expect(
        FirebaseAuthService.signIn("test@example.com", "password123")
      ).rejects.toThrow("Network error");
    });
  });

  describe("signUp", () => {
    it("successfully creates a new user account", async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const result = await FirebaseAuthService.signUp("newuser@example.com", "password123");

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "newuser@example.com",
        "password123"
      );
      expect(result).toBe(mockUser);
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("creates user and updates profile with display name", async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);
      mockUpdateProfile.mockResolvedValue();

      const result = await FirebaseAuthService.signUp(
        "newuser@example.com",
        "password123",
        "New User"
      );

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "newuser@example.com",
        "password123"
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: "New User",
      });
      expect(result).toBe(mockUser);
    });

    it("throws error when user creation fails", async () => {
      const createError = new Error("Email already in use");
      mockCreateUserWithEmailAndPassword.mockRejectedValue(createError);

      await expect(
        FirebaseAuthService.signUp("existing@example.com", "password123")
      ).rejects.toThrow("Email already in use");

      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("handles profile update failure after successful user creation", async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);
      const profileError = new Error("Failed to update profile");
      mockUpdateProfile.mockRejectedValue(profileError);

      await expect(
        FirebaseAuthService.signUp("newuser@example.com", "password123", "New User")
      ).rejects.toThrow("Failed to update profile");

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
  });

  describe("signOut", () => {
    it("successfully signs out the current user", async () => {
      mockSignOut.mockResolvedValue();

      await FirebaseAuthService.signOut();

      expect(mockSignOut).toHaveBeenCalledWith(auth);
    });

    it("throws error when sign out fails", async () => {
      const signOutError = new Error("Sign out failed");
      mockSignOut.mockRejectedValue(signOutError);

      await expect(FirebaseAuthService.signOut()).rejects.toThrow("Sign out failed");
    });
  });

  describe("resetPassword", () => {
    it("successfully sends password reset email", async () => {
      mockSendPasswordResetEmail.mockResolvedValue();

      await FirebaseAuthService.resetPassword("test@example.com");

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(auth, "test@example.com");
    });

    it("throws error when password reset fails", async () => {
      const resetError = new Error("User not found");
      mockSendPasswordResetEmail.mockRejectedValue(resetError);

      await expect(
        FirebaseAuthService.resetPassword("nonexistent@example.com")
      ).rejects.toThrow("User not found");
    });

    it("handles invalid email format", async () => {
      const invalidEmailError = new Error("Invalid email format");
      mockSendPasswordResetEmail.mockRejectedValue(invalidEmailError);

      await expect(
        FirebaseAuthService.resetPassword("invalid-email")
      ).rejects.toThrow("Invalid email format");
    });
  });

  describe("onAuthStateChanged", () => {
    it("sets up auth state change listener", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const unsubscribe = FirebaseAuthService.onAuthStateChanged(mockCallback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(auth, mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it("calls callback with user on auth state change", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      // Mock onAuthStateChanged to immediately call the callback
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser as User);
        return mockUnsubscribe;
      });

      FirebaseAuthService.onAuthStateChanged(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(mockUser);
    });

    it("calls callback with null when user signs out", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      // Mock onAuthStateChanged to call callback with null (signed out)
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      FirebaseAuthService.onAuthStateChanged(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });

  describe("getCurrentUser", () => {
    it("returns current user when authenticated", () => {
      mockAuth.currentUser = mockUser as User;

      const currentUser = FirebaseAuthService.getCurrentUser();

      expect(currentUser).toBe(mockUser);
    });

    it("returns null when not authenticated", () => {
      mockAuth.currentUser = null;

      const currentUser = FirebaseAuthService.getCurrentUser();

      expect(currentUser).toBeNull();
    });
  });

  describe("error handling", () => {
    it("handles Firebase auth/user-not-found error", async () => {
      const authError = {
        code: "auth/user-not-found",
        message: "User not found",
      };
      mockSignInWithEmailAndPassword.mockRejectedValue(authError);

      await expect(
        FirebaseAuthService.signIn("nonexistent@example.com", "password")
      ).rejects.toMatchObject(authError);
    });

    it("handles Firebase auth/wrong-password error", async () => {
      const authError = {
        code: "auth/wrong-password",
        message: "Wrong password",
      };
      mockSignInWithEmailAndPassword.mockRejectedValue(authError);

      await expect(
        FirebaseAuthService.signIn("test@example.com", "wrongpassword")
      ).rejects.toMatchObject(authError);
    });

    it("handles Firebase auth/email-already-in-use error", async () => {
      const authError = {
        code: "auth/email-already-in-use",
        message: "Email already in use",
      };
      mockCreateUserWithEmailAndPassword.mockRejectedValue(authError);

      await expect(
        FirebaseAuthService.signUp("existing@example.com", "password")
      ).rejects.toMatchObject(authError);
    });

    it("handles Firebase auth/weak-password error", async () => {
      const authError = {
        code: "auth/weak-password",
        message: "Password is too weak",
      };
      mockCreateUserWithEmailAndPassword.mockRejectedValue(authError);

      await expect(
        FirebaseAuthService.signUp("test@example.com", "123")
      ).rejects.toMatchObject(authError);
    });
  });

  describe("integration scenarios", () => {
    it("handles complete sign up and sign in flow", async () => {
      // Sign up
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);
      mockUpdateProfile.mockResolvedValue();

      const newUser = await FirebaseAuthService.signUp(
        "newuser@example.com",
        "password123",
        "New User"
      );

      expect(newUser).toBe(mockUser);

      // Clear mocks for sign in
      jest.clearAllMocks();

      // Sign in
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);

      const signedInUser = await FirebaseAuthService.signIn(
        "newuser@example.com",
        "password123"
      );

      expect(signedInUser).toBe(mockUser);
    });

    it("handles sign in, sign out, and auth state changes", async () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      // Set up auth state listener
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);
      const unsubscribe = FirebaseAuthService.onAuthStateChanged(mockCallback);

      // Sign in
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential as any);
      await FirebaseAuthService.signIn("test@example.com", "password123");

      // Sign out
      mockSignOut.mockResolvedValue();
      await FirebaseAuthService.signOut();

      // Clean up listener
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});