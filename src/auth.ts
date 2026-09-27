import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/lib/auth/authorize-credentials";

declare module "next-auth" {
  interface Session {
    user: {
      /** The immutable user id -- the ONLY identity claim this app trusts
       * from the JWT. Never populated with role/membership data. */
      id: string;
    };
  }
}

// Deliberately short: this is a financial-reporting platform, and there is
// no sliding-session/refresh mechanism built in this step, so this is a
// hard cutoff, not an idle timeout. 15 minutes was chosen as a
// conservative starting value; revisit alongside real usage patterns once
// the app is actually used, and consider adding refresh/renewal UX before
// treating 15 minutes as final product behavior.
const SESSION_MAX_AGE_SECONDS = 15 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      // The actual credential-checking decision lives in
      // src/lib/auth/authorize-credentials.ts -- kept out of this file so
      // it never pulls in next-auth's own request-handling machinery
      // (which imports next/server, resolvable only inside Next.js's
      // bundler), and so it's independently importable and testable.
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.sub === "string") {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
