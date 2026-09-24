"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { normalizeEmail, MAX_RAW_EMAIL_LENGTH, MAX_RAW_PASSWORD_LENGTH } from "@/lib/auth/utils";

export interface SignInState {
  error: string | null;
}

const GENERIC_INVALID_CREDENTIALS = "Invalid email or password.";

export async function signInAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const emailInput = formData.get("email");
  const passwordInput = formData.get("password");

  // Server-side validation, independent of whatever the <input> attributes
  // enforced client-side.
  if (typeof emailInput !== "string" || typeof passwordInput !== "string") {
    return { error: "Enter your email and password." };
  }
  // Reject oversized raw input before ANY operation that traverses or
  // transforms it -- including .trim() itself, which is why this check
  // runs before the empty/whitespace check below, not after. Never
  // truncate to make it fit. authorize() (src/auth.ts) enforces the same
  // limits independently, since it's reachable on its own without going
  // through this action.
  if (emailInput.length > MAX_RAW_EMAIL_LENGTH || passwordInput.length > MAX_RAW_PASSWORD_LENGTH) {
    return { error: GENERIC_INVALID_CREDENTIALS };
  }
  if (!emailInput.trim() || !passwordInput) {
    return { error: "Enter your email and password." };
  }

  const email = normalizeEmail(emailInput);

  try {
    // redirect: false means signIn() returns instead of calling Next's
    // redirect() internally on success -- so the only redirect-control-
    // flow exception in this function is the hardcoded one below, thrown
    // outside this try/catch. On failure, @auth/core rethrows AuthError/
    // CredentialsSignin as a real exception regardless of this option
    // (verified against the installed next-auth/@auth/core source, not
    // assumed), so it's still caught here.
    //
    // Password normalization happens inside authorize() itself, not here
    // -- this action never touches bcrypt directly.
    await signIn("credentials", {
      email,
      password: passwordInput,
      redirect: false,
    });
  } catch {
    // Every Auth.js failure (unknown email, deactivated account, wrong
    // password) and every infrastructure failure (e.g. a database error)
    // alike map to this one generic message -- nothing about the
    // underlying cause is ever exposed to the client.
    return { error: GENERIC_INVALID_CREDENTIALS };
  }

  // Hardcoded target only -- never derived from client input or from
  // whatever signIn() itself returned.
  redirect("/account");
}
