import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeSignInToken } from "@/lib/auth/authorize-sign-in-token";
import { authorizePassword } from "@/lib/auth/authorize-password";

declare module "next-auth" {
  interface Session {
    user: {
      /** The immutable user id -- the ONLY identity claim this app trusts
       * from the JWT. Never populated with role/membership data. */
      id: string;
    };
  }
}

// Deliberately long-lived: explicitly requested by the project owner --
// stay signed in indefinitely rather than be cut off after a short
// window. Implemented as a 10-year hard cutoff rather than a literal
// unbounded session, since NextAuth's JWT strategy requires a concrete
// maxAge; in practice this is "forever" for any real session.
//
// Security tradeoff, stated plainly (this replaces the previous
// deliberately-short-15-minutes rationale, which this change is the
// explicit revisit of): a session cookie, once issued, now stays valid
// far longer than before -- a shared or compromised device/browser
// profile has a correspondingly larger access window. Accepted as a
// deliberate choice for this platform, not a default.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10;

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
    Credentials({
      // A second, optional sign-in path alongside the magic link above,
      // not a replacement -- an approved user can set a password from
      // /account (src/app/account/SetPasswordForm.tsx) and use either
      // path from then on. Explicit id so it never collides with the
      // token provider's default id ("credentials"), which
      // /api/sign-in/verify/route.ts's signIn("credentials", ...) call
      // depends on staying unchanged.
      id: "password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizePassword,
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
