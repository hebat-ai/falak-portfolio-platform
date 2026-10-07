"use server";

import { requestPasswordReset } from "@/lib/auth/password-reset";
import { MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";

export interface RequestResetState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  sent: boolean;
}

const GENERIC_INFRA_ERROR = "Something went wrong. Try again in a moment.";

export async function requestPasswordResetAction(_prevState: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const emailInput = formData.get("email");

  if (typeof emailInput !== "string" || !emailInput.trim()) {
    return { error: "Enter your email.", fieldErrors: { email: "Enter your email." }, sent: false };
  }
  if (emailInput.length > MAX_RAW_EMAIL_LENGTH) {
    return { error: "Enter your email.", fieldErrors: { email: "Enter your email." }, sent: false };
  }

  try {
    await requestPasswordReset(emailInput);
  } catch {
    return { error: GENERIC_INFRA_ERROR, sent: false };
  }

  return { error: null, sent: true };
}
