import GoogleProvider from "next-auth/providers/google";
import { isManagerEmail, MANAGER_LOGIN_PATH } from "./auth/shared";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: MANAGER_LOGIN_PATH,
    error: MANAGER_LOGIN_PATH,
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ profile, user }) {
      const email = profile?.email || user?.email;
      return isManagerEmail(email);
    },
    async jwt({ token }) {
      token.isManager = isManagerEmail(token.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isManager = Boolean(token.isManager);
      }

      return session;
    },
  },
};
