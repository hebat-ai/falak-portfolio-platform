import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  normalizeEmail,
  normalizePassword,
  BCRYPT_COST_FACTOR,
  MAX_RAW_EMAIL_LENGTH,
  MAX_RAW_PASSWORD_LENGTH,
} from "@/lib/auth/utils";

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

// A fixed, non-secret candidate/hash pair used only so authorize() always
// performs exactly one bcrypt.compare at the real cost factor, regardless
// of whether a matching user exists or the submitted password was within
// bcrypt's 72-byte limit -- so response timing can't be used to enumerate
// registered emails or overlong-password submissions. Neither value is a
// real user's password or hash.
//
// Generated once, offline, via:
//   bcrypt.hashSync("not-a-real-password", 12)
// then confirmed offline (never at runtime):
//   bcrypt.compareSync("not-a-real-password", hash) === true
//   bcrypt.getRounds(hash) === 12  (matches BCRYPT_COST_FACTOR)
// Computing this at module load with a fresh random salt on every cold
// start would add needless bcrypt work for no benefit -- the hash's own
// value is not secret, only its role (never a real credential) matters.
const DUMMY_PASSWORD_FOR_TIMING_SAFETY = "not-a-real-password";
const DUMMY_HASH_FOR_TIMING_SAFETY = "$2b$12$TCCYf8T07rg.qHhgNbgCguIZdd/o3./JWViiGB.daxL6clbRB.joW";

if (bcrypt.getRounds(DUMMY_HASH_FOR_TIMING_SAFETY) !== BCRYPT_COST_FACTOR) {
  throw new Error("DUMMY_HASH_FOR_TIMING_SAFETY was generated at a different cost factor than BCRYPT_COST_FACTOR");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailInput = credentials?.email;
        const passwordInput = credentials?.password;
        if (typeof emailInput !== "string" || typeof passwordInput !== "string") {
          return null;
        }
        // Reject oversized raw input before ANY operation that traverses
        // or transforms it -- including .trim() itself, which is why this
        // check runs before the empty/whitespace check below, not after.
        // Independent of whatever the custom sign-in action already
        // checked, since this callback is directly reachable on its own
        // via /api/auth/callback/credentials.
        if (emailInput.length > MAX_RAW_EMAIL_LENGTH || passwordInput.length > MAX_RAW_PASSWORD_LENGTH) {
          return null;
        }
        if (!emailInput.trim() || !passwordInput) {
          return null;
        }

        const email = normalizeEmail(emailInput);
        const password = normalizePassword(passwordInput);
        const passwordWithinBcryptLimit = !bcrypt.truncates(password);

        const user = await db.user.findUnique({
          where: { email },
          select: { id: true, passwordHash: true, deactivatedAt: true },
        });

        // Guard against a row with a missing/empty passwordHash: without
        // this, such a row would fall through to the dummy-hash branch
        // below and become authenticatable with the dummy password.
        const hasStoredPasswordHash = typeof user?.passwordHash === "string" && user.passwordHash.length > 0;

        // Always run exactly one bcrypt.compare, against SOME hash and
        // SOME candidate. The real candidate password is NEVER compared
        // against the real hash when it's over the bcrypt limit -- bcrypt
        // only ever "sees" the first 72 bytes of its candidate input, so
        // an overlong attempt whose first 72 bytes happen to match a real
        // (<=72-byte) stored password would otherwise authenticate
        // successfully on a wrong password that merely shares that
        // prefix, worst case when the real password is exactly 72 bytes.
        const hashToCompare = hasStoredPasswordHash ? user.passwordHash : DUMMY_HASH_FOR_TIMING_SAFETY;
        const candidatePassword = passwordWithinBcryptLimit ? password : DUMMY_PASSWORD_FOR_TIMING_SAFETY;

        const bcryptMatches = await bcrypt.compare(candidatePassword, hashToCompare);
        const passwordMatches = hasStoredPasswordHash && passwordWithinBcryptLimit && bcryptMatches;

        // Every rejection reason -- no such user, missing password hash,
        // deactivated account, password over the bcrypt limit, or a
        // genuine mismatch -- collapses to the same `null`, which the
        // sign-in action turns into one generic message.
        if (!user || !passwordMatches || user.deactivatedAt) {
          return null;
        }

        // Only the immutable id crosses into the JWT. Role assignments and
        // memberships are read fresh from the database by the (later)
        // authorization layer, never cached in the token.
        return { id: user.id };
      },
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
