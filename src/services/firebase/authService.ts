// src/services/firebase/authService.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./config"; // Correctly points to the real config

export class FirebaseAuthService {
  static async signIn(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  static async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
      await updateProfile(result.user, { displayName });
    }

    return result.user;
  }

  static async signOut(): Promise<void> {
    await signOut(auth);
  }

  static async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
}
