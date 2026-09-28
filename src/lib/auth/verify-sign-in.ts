import "server-only";
import { db } from "@/lib/db";
import { hashSignInToken } from "@/lib/auth/token";

/**
 * Thrown for every invalid-token reason alike -- not found, expired,
 * already consumed, or a genuine hash mismatch. Callers must map this to
 * one generic "invalid or expired" message, the same discipline as
 * InviteClaimFailedError, so the response never reveals which case
 * occurred.
 */
export class InvalidSignInTokenError extends Error {}

/**
 * Atomically claims one EmailVerificationToken by its raw value and
 * returns the userId it belonged to. The conditional updateMany's WHERE
 * clause re-enforces every acceptability condition (tokenHash match,
 * unconsumed, unexpired) AT WRITE TIME, inside one statement -- not a
 * separate read-then-write -- so two concurrent claims of the same link
 * can never both succeed: exactly one write can ever affect a row, the
 * same reasoning as claimInvite's atomic updateMany.
 */
export async function consumeSignInToken(rawToken: string): Promise<{ userId: string }> {
  const tokenHash = hashSignInToken(rawToken);
  const consumedAt = new Date();

  const result = await db.emailVerificationToken.updateMany({
    where: { tokenHash, consumedAt: null, expiresAt: { gt: consumedAt } },
    data: { consumedAt },
  });

  if (result.count !== 1) {
    throw new InvalidSignInTokenError();
  }

  // The updateMany above doesn't return the row itself -- re-read by the
  // now-unique tokenHash to get the userId. Safe: only the row this call
  // just claimed can possibly match (tokenHash is unique), and it's
  // already marked consumed, so this is a pure read, not a second claim
  // attempt.
  const claimed = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });
  if (!claimed) {
    throw new InvalidSignInTokenError();
  }

  return { userId: claimed.userId };
}
