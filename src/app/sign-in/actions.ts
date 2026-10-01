"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { requestSignInLink } from "@/lib/auth/request-sign-in";
import { MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";
import { MAX_RAW_PASSWORD_LENGTH } from "@/lib/auth/password";

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

export interface PasswordSignInState {
  error: string | null;
}

const INVALID_CREDENTIALS = "Invalid email or password.";

/**
 * One generic failure message for every reason signIn("password", ...)
 * can fail -- unknown email, no password ever set for that account, a
 * deactivated account, or a genuinely wrong password -- since
 * authorizePassword itself already collapses all of those to the same
 * `null`, and next-auth throws uniformly for any authorize() rejection
 * with redirect:false. Same enumeration-safety discipline as every other
 * auth flow in this codebase.
 */
export async function signInWithPasswordAction(
  _prevState: PasswordSignInState,
  formData: FormData
): Promise<PasswordSignInState> {
  const emailInput = formData.get("email");
  const passwordInput = formData.get("password");

  if (typeof emailInput !== "string" || typeof passwordInput !== "string") {
    return { error: INVALID_CREDENTIALS };
  }
  if (emailInput.length === 0 || emailInput.length > MAX_RAW_EMAIL_LENGTH) {
    return { error: INVALID_CREDENTIALS };
  }
  if (passwordInput.length === 0 || passwordInput.length > MAX_RAW_PASSWORD_LENGTH) {
    return { error: INVALID_CREDENTIALS };
  }

  try {
    await signIn("password", { email: emailInput, password: passwordInput, redirect: false });
  } catch {
    return { error: INVALID_CREDENTIALS };
  }

  redirect("/");
}
