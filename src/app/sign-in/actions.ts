"use server";

import { requestSignInLink } from "@/lib/auth/request-sign-in";
import { MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";

export interface SignInState {
  error: string | null;
  sent: boolean;
}

const GENERIC_INFRA_ERROR = "Something went wrong. Try again in a moment.";

export async function requestSignInLinkAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const emailInput = formData.get("email");

  if (typeof emailInput !== "string") {
    return { error: "Enter your email.", sent: false };
  }
  // Reject oversized raw input before ANY operation that traverses or
  // transforms it -- same ordering discipline as the former password flow.
  if (emailInput.length > MAX_RAW_EMAIL_LENGTH) {
    return { error: "Enter your email.", sent: false };
  }
  if (!emailInput.trim()) {
    return { error: "Enter your email.", sent: false };
  }

  try {
    await requestSignInLink(emailInput);
  } catch {
    // A genuine infrastructure failure (e.g. the email provider is down)
    // is a real, distinct error -- unlike "no such user," which
    // requestSignInLink already resolves normally/silently, this is never
    // hidden behind the generic success message.
    return { error: GENERIC_INFRA_ERROR, sent: false };
  }

  return { error: null, sent: true };
}
