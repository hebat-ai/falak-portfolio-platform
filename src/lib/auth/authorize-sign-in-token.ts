import "server-only";
import { db } from "@/lib/db";
import { consumeSignInToken, InvalidSignInTokenError } from "@/lib/auth/verify-sign-in";
import { MAX_RAW_INVITE_TOKEN_LENGTH } from "@/lib/auth/utils";

/**
 * Kept in its own file, deliberately free of any `next-auth` import: the
 * pure token-checking decision, importable and testable on its own
 * (including under a plain Node test runner) without pulling in
 * next-auth's request-handling machinery (which itself imports
 * `next/server`, resolvable only inside Next.js's own bundler, never
 * under plain Node). src/auth.ts's first Credentials provider (default
 * id "credentials") references this exact function; a second provider
 * (id "password", see authorize-password.ts) now also exists alongside
 * it for users who've set a password from /account -- the two are
 * independent, optional sign-in paths, not a replacement of one by the
 * other. consumeSignInToken's own atomic claim is the real security
 * boundary for this path specifically.
 */
export async function authorizeSignInToken(
  credentials: Partial<Record<"token", unknown>> | undefined
): Promise<{ id: string } | null> {
  const tokenInput = credentials?.token;
  if (typeof tokenInput !== "string") {
    return null;
  }
  // Reject oversized/empty raw input before it's hashed or looked up.
  // Independent of whatever the verify route already checked, since this
  // callback is directly reachable on its own via
  // /api/auth/callback/credentials.
  if (tokenInput.length === 0 || tokenInput.length > MAX_RAW_INVITE_TOKEN_LENGTH) {
    return null;
  }

  let userId: string;
  try {
    ({ userId } = await consumeSignInToken(tokenInput));
  } catch (error) {
    if (error instanceof InvalidSignInTokenError) {
      return null;
    }
    throw error;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, deactivatedAt: true },
  });

  // A token claimed for a now-deactivated user is simply not usable --
  // the token is already consumed either way (single-use), so there's no
  // reason to leave it valid for a second attempt.
  if (!user || user.deactivatedAt) {
    return null;
  }

  // Only the immutable id crosses into the JWT. Role assignments and
  // memberships are read fresh from the database by the authorization
  // layer, never cached in the token.
  return { id: user.id };
}
