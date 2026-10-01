import "server-only";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH, MAX_RAW_PASSWORD_LENGTH } from "@/lib/auth/password";

export interface SetPasswordResult {
  error: string | null;
  success: boolean;
}

export const GENERIC_ERROR = "Something went wrong. Try again in a moment.";
export const WRONG_CURRENT_PASSWORD = "Current password is incorrect.";
export const TOO_SHORT = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
export const MISMATCH = "New passwords don't match.";

/**
 * Kept free of any `@/auth` import, same reasoning as
 * authorize-sign-in-token.ts/authorize-password.ts: `@/auth` itself
 * pulls in next-auth's request-handling machinery (next/server),
 * resolvable only inside Next's bundler, never under plain Node --
 * account/actions.ts's setPasswordAction is a thin wrapper that resolves
 * the current user (via getCurrentUser, itself `@/auth`-free) and
 * delegates here, so this function is independently testable.
 *
 * First-time set (no existing passwordHash) needs no current password;
 * a change requires and verifies the existing one first -- standard
 * change-password safeguard, re-derived fresh from the database here
 * rather than trusted from the caller.
 */
export async function setPassword(
  userId: string,
  input: { currentPassword: unknown; newPassword: unknown; confirmPassword: unknown }
): Promise<SetPasswordResult> {
  const { currentPassword: currentPasswordInput, newPassword: newPasswordInput, confirmPassword: confirmPasswordInput } = input;

  if (typeof newPasswordInput !== "string" || typeof confirmPasswordInput !== "string") {
    return { error: GENERIC_ERROR, success: false };
  }
  if (newPasswordInput.length > MAX_RAW_PASSWORD_LENGTH || confirmPasswordInput.length > MAX_RAW_PASSWORD_LENGTH) {
    return { error: GENERIC_ERROR, success: false };
  }
  if (newPasswordInput.length < MIN_PASSWORD_LENGTH) {
    return { error: TOO_SHORT, success: false };
  }
  if (newPasswordInput !== confirmPasswordInput) {
    return { error: MISMATCH, success: false };
  }

  const existing = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!existing) {
    return { error: GENERIC_ERROR, success: false };
  }

  if (existing.passwordHash) {
    if (typeof currentPasswordInput !== "string" || currentPasswordInput.length > MAX_RAW_PASSWORD_LENGTH) {
      return { error: WRONG_CURRENT_PASSWORD, success: false };
    }
    const currentOk = await verifyPassword(currentPasswordInput, existing.passwordHash);
    if (!currentOk) {
      return { error: WRONG_CURRENT_PASSWORD, success: false };
    }
  }

  const newHash = await hashPassword(newPasswordInput);
  await db.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  return { error: null, success: true };
}
