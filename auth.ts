import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          const admin = getFirebaseAdmin();
          const decodedToken = await admin.auth().verifyIdToken(credentials.idToken as string);
          
          return {
            id: decodedToken.uid,
            email: decodedToken.email,
            image: decodedToken.picture || null,
            name: decodedToken.name || null,
          };
        } catch (error) {
          console.error("Firebase Admin Error in NextAuth Authorize:", error);
          return null;
        }
      },
    }),
  ],
});
