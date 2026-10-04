import "server-only";
import { db } from "@/lib/db";
import { generateRawToken, hashSignInToken } from "@/lib/auth/token";
import { normalizeEmail } from "@/lib/auth/utils";
import { hashPassword, MIN_PASSWORD_LENGTH, MAX_RAW_PASSWORD_LENGTH } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/email/send-email";

const TOKEN_EXPIRY_MINUTES = 30;

/**
 * Always resolves the same way regardless of whether `rawEmail` belongs
 * to a real, active account -- same enumeration-safety discipline as
 * requestSignInLink. Never throws for "no such user" or "deactivated."
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, deactivatedAt: true },
  });

  if (!user || user.deactivatedAt) {
    return;
  }

  const rawToken = generateRawToken();
  const tokenHash = hashSignInToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is not set.");
  }
  const resetUrl = `${baseUrl}/reset-password/confirm?token=${rawToken}`;

  await sendPasswordResetEmail(email, resetUrl);
}

export interface ConsumePasswordResetResult {
  error: string | null;
  success: boolean;
}

const GENERIC_ERROR = "This reset link is invalid or has expired. Request a new one.";
const WEAK_PASSWORD_ERROR = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

/**
 * Atomically claims one PasswordResetToken by its raw value (same
 * conditional-updateMany-as-the-claim pattern as consumeSignInToken --
 * two concurrent claims of the same link can never both succeed), then
 * sets a brand NEW passwordHash directly -- deliberately never checks
 * or requires the OLD password, since proving control of the email
 * inbox (by holding this token at all) is the whole point of a reset
 * flow, unlike src/app/account/actions.ts's changePassword path, which
 * is for a user who still remembers their current password.
 */
export async function consumePasswordResetToken(rawToken: string, newPassword: string): Promise<ConsumePasswordResetResult> {
  if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_RAW_PASSWORD_LENGTH) {
    return { error: WEAK_PASSWORD_ERROR, success: false };
  }

  const tokenHash = hashSignInToken(rawToken);
  const consumedAt = new Date();

  const result = await db.passwordResetToken.updateMany({
    where: { tokenHash, consumedAt: null, expiresAt: { gt: consumedAt } },
    data: { consumedAt },
  });
  if (result.count !== 1) {
    return { error: GENERIC_ERROR, success: false };
  }

  const claimed = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });
  if (!claimed) {
    return { error: GENERIC_ERROR, success: false };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({ where: { id: claimed.userId }, data: { passwordHash } });

  return { error: null, success: true };
}
