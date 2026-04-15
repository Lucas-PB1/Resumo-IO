import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updatePassword,
  UserCredential
} from "firebase/auth";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { auth } from "@/lib/firebase/config";
import { RegisterFormData, LoginFormData, ForgotPasswordFormData } from "../schemas";
import { userService } from "@/features/user/services/user.service";

export const authService = {
  async login(data: LoginFormData) {
    const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
    await this.syncNextAuth(cred);
    return cred.user;
  },

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    
    // Ensure user profile exists (or create a partial one if it doesn't)
    const profile = await userService.getUserProfile(cred.user.uid);
    if (!profile) {
      const names = cred.user.displayName?.split(" ") || ["", ""];
      await userService.createUserProfile(cred.user.uid, {
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        email: cred.user.email || "",
        birthDate: "",
        gender: "",
        photoURL: cred.user.photoURL || "",
      });
    }

    await this.syncNextAuth(cred);
    return cred.user;
  },

  async register(data: RegisterFormData) {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    // Save complementary profile data
    await userService.createUserProfile(cred.user.uid, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      birthDate: data.birthDate,
      gender: data.gender,
      photoURL: "", // Inicialmente vazio
    });

    await this.syncNextAuth(cred);
    return cred.user;
  },

  async resetPassword(data: ForgotPasswordFormData) {
    await sendPasswordResetEmail(auth, data.email);
  },

  async changePassword(newPassword: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    await updatePassword(user, newPassword);
  },

  async logout() {
    await firebaseSignOut(auth);
    await nextAuthSignOut({ redirect: false });
  },

  /**
   * Pega o token atual do Firebase e manda pro NextAuth assumir a sessão no Server
   */
  async syncNextAuth(cred: UserCredential) {
    const idToken = await cred.user.getIdToken();
    const res = await nextAuthSignIn("credentials", { 
      idToken, 
      redirect: false 
    });
    
    if (res?.error) {
       throw new Error("Falha ao criar sessão NextAuth");
    }
  }
};
