import "server-only";
import { db } from "@/lib/db";
import { verifyPassword, MAX_RAW_PASSWORD_LENGTH } from "@/lib/auth/password";
import { normalizeEmail, MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";

/**
 * Kept in its own file, deliberately free of any `next-auth` import, same
 * reasoning as authorize-sign-in-token.ts: independently importable and
 * testable under a plain Node test runner. src/auth.ts's second
 * Credentials provider (id: "password") references this exact function.
 *
 * One generic denial (`null`) for every failure case -- unknown email,
 * deactivated account, no password ever set for this account, or a
 * genuinely wrong password -- so this path can never be used to probe
 * which of those is true, the same enumeration-safety discipline
 * request-sign-in.ts's own comment establishes for the magic-link path.
 */
export async function authorizePassword(
  credentials: Partial<Record<"email" | "password", unknown>> | undefined
): Promise<{ id: string } | null> {
  const emailInput = credentials?.email;
  const passwordInput = credentials?.password;

  if (typeof emailInput !== "string" || typeof passwordInput !== "string") {
    return null;
  }
  // Reject oversized raw input before any normalization, lookup, or the
  // deliberately slow scrypt derivation -- same ordering discipline as
  // every other raw-input check in this auth module.
  if (emailInput.length === 0 || emailInput.length > MAX_RAW_EMAIL_LENGTH) {
    return null;
  }
  if (passwordInput.length === 0 || passwordInput.length > MAX_RAW_PASSWORD_LENGTH) {
    return null;
  }

  const email = normalizeEmail(emailInput);
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, deactivatedAt: true },
  });

  if (!user || user.deactivatedAt || !user.passwordHash) {
    return null;
  }

  const valid = await verifyPassword(passwordInput, user.passwordHash);
  if (!valid) {
    return null;
  }

  // Only the immutable id crosses into the JWT -- same rule as
  // authorizeSignInToken.
  return { id: user.id };
}
