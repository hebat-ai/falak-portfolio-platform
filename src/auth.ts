import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeSignInToken } from "@/lib/auth/authorize-sign-in-token";

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
      // No password field -- sign-in is a one-time token emailed via a
      // verification link (see src/lib/auth/request-sign-in.ts and
      // src/app/api/sign-in/verify/route.ts), not a persistent credential.
      credentials: {
        token: { label: "Token", type: "text" },
      },
      // The actual token-checking decision lives in
      // src/lib/auth/authorize-sign-in-token.ts -- kept out of this file so
      // it never pulls in next-auth's own request-handling machinery
      // (which imports next/server, resolvable only inside Next.js's
      // bundler), and so it's independently importable and testable.
      authorize: authorizeSignInToken,
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
