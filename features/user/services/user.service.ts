import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface UserProfileData {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  gender: string;
  photoURL?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const userService = {
  /**
   * Initialize a new user document in Firestore after Firebase Auth signup.
   */
  async createUserProfile(uid: string, data: Omit<UserProfileData, "uid">) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },

  /**
   * Get the complete user profile from Firestore.
   */
  async getUserProfile(uid: string): Promise<UserProfileData | null> {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return { uid, ...snap.data() } as UserProfileData;
  },

  /**
   * Update existing user profile in Firestore.
   */
  async updateUserProfile(uid: string, data: Partial<UserProfileData>) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: Date.now(),
    });
  }
};
