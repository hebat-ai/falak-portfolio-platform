"use server";

import { consumePasswordResetToken } from "@/lib/auth/password-reset";
import { MAX_RAW_PASSWORD_LENGTH } from "@/lib/auth/password";

export interface ConfirmResetState {
  error: string | null;
  success: boolean;
}

const GENERIC_ERROR = "This reset link is invalid or has expired. Request a new one.";
const MISMATCH_ERROR = "Passwords don't match.";

export async function confirmPasswordResetAction(_prevState: ConfirmResetState, formData: FormData): Promise<ConfirmResetState> {
  const token = formData.get("token");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof token !== "string" || !token) {
    return { error: GENERIC_ERROR, success: false };
  }
  if (typeof password !== "string" || typeof confirmPassword !== "string" || password.length > MAX_RAW_PASSWORD_LENGTH) {
    return { error: GENERIC_ERROR, success: false };
  }
  if (password !== confirmPassword) {
    return { error: MISMATCH_ERROR, success: false };
  }

  const result = await consumePasswordResetToken(token, password);
  if (!result.success) {
    return { error: result.error, success: false };
  }

  return { error: null, success: true };
}
