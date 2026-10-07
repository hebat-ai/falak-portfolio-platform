"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { requestSignInLink } from "@/lib/auth/request-sign-in";
import { MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";
import { MAX_RAW_PASSWORD_LENGTH } from "@/lib/auth/password";

export interface SignInState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  sent: boolean;
}

const GENERIC_INFRA_ERROR = "Something went wrong. Try again in a moment.";

export async function requestSignInLinkAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const emailInput = formData.get("email");

  // Reject oversized raw input before ANY operation that traverses or
  // transforms it -- same ordering discipline as the former password flow.
  if (typeof emailInput !== "string" || emailInput.length > MAX_RAW_EMAIL_LENGTH || !emailInput.trim()) {
    return { error: "Enter your email.", fieldErrors: { email: "Enter your email." }, sent: false };
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
  fieldErrors?: Record<string, string>;
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

  const emailOk = typeof emailInput === "string" && emailInput.length > 0 && emailInput.length <= MAX_RAW_EMAIL_LENGTH;
  const passwordOk =
    typeof passwordInput === "string" && passwordInput.length > 0 && passwordInput.length <= MAX_RAW_PASSWORD_LENGTH;
  if (!emailOk || !passwordOk) {
    return {
      error: INVALID_CREDENTIALS,
      fieldErrors: {
        ...(emailOk ? {} : { email: "Enter your email." }),
        ...(passwordOk ? {} : { password: "Enter your password." }),
      },
    };
  }

  try {
    await signIn("password", { email: emailInput, password: passwordInput, redirect: false });
  } catch {
    // Which of the two is wrong is deliberately not revealed.
    return { error: INVALID_CREDENTIALS, fieldErrors: { email: " ", password: INVALID_CREDENTIALS } };
  }

  redirect("/");
}
