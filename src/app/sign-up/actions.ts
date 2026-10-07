"use server";

import { submitAccessRequest } from "@/lib/auth/access-request";
import { MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";
import type { AccessRequestedRole } from "@/generated/prisma/client";

export interface SignUpState {
  error: string | null;
  sent: boolean;
}

// Staff roles are by invite only (Manage Staff) -- public requests are investors.
const VALID_ROLES: AccessRequestedRole[] = ["INVESTOR"];
// A person takes longer than this to fill in the form; a bot posting it
// straight away doesn't.
const MIN_FILL_MS = 3000;
const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;

function looksLikeBot(formData: FormData): boolean {
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") return true;
  const startedAt = Number(formData.get("formStartedAt"));
  if (!Number.isFinite(startedAt) || startedAt <= 0) return true;
  const elapsed = Date.now() - startedAt;
  return elapsed < MIN_FILL_MS || elapsed > MAX_FORM_AGE_MS;
}
const GENERIC_ENTER_EMAIL = "Enter your email.";
const GENERIC_INFRA_ERROR = "Something went wrong. Try again in a moment.";
const MAX_RAW_ORG_LENGTH = 200;
const MAX_RAW_MESSAGE_LENGTH = 2000;

function isValidRole(value: FormDataEntryValue | null): value is AccessRequestedRole {
  return typeof value === "string" && (VALID_ROLES as string[]).includes(value);
}

export async function submitAccessRequestAction(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  // Report success without saving anything, so a bot learns nothing.
  if (looksLikeBot(formData)) {
    return { error: null, sent: true };
  }

  const emailInput = formData.get("email");
  const roleInput = formData.get("requestedRole");
  const orgInput = formData.get("organizationName");
  const messageInput = formData.get("message");

  if (typeof emailInput !== "string" || emailInput.length > MAX_RAW_EMAIL_LENGTH || !emailInput.trim()) {
    return { error: GENERIC_ENTER_EMAIL, sent: false };
  }
  if (!isValidRole(roleInput)) {
    return { error: GENERIC_INFRA_ERROR, sent: false };
  }
  if (typeof orgInput === "string" && orgInput.length > MAX_RAW_ORG_LENGTH) {
    return { error: GENERIC_INFRA_ERROR, sent: false };
  }
  if (typeof messageInput === "string" && messageInput.length > MAX_RAW_MESSAGE_LENGTH) {
    return { error: GENERIC_INFRA_ERROR, sent: false };
  }

  try {
    const result = await submitAccessRequest({
      email: emailInput,
      requestedRole: roleInput,
      organizationName: typeof orgInput === "string" ? orgInput : undefined,
      message: typeof messageInput === "string" ? messageInput : undefined,
    });

    if (!result.ok) {
      const message = result.reason === "existing_account" ? "existing_account" : "already_pending";
      return { error: message, sent: false };
    }
  } catch {
    return { error: GENERIC_INFRA_ERROR, sent: false };
  }

  return { error: null, sent: true };
}
