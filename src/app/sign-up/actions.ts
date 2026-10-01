"use server";

import { submitAccessRequest } from "@/lib/auth/access-request";
import { MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";
import type { AccessRequestedRole } from "@/generated/prisma/client";

export interface SignUpState {
  error: string | null;
  sent: boolean;
}

const VALID_ROLES: AccessRequestedRole[] = ["MANAGEMENT", "INVESTMENT_PROFESSIONAL", "INVESTOR"];
const GENERIC_ENTER_EMAIL = "Enter your email.";
const GENERIC_INFRA_ERROR = "Something went wrong. Try again in a moment.";
const MAX_RAW_ORG_LENGTH = 200;
const MAX_RAW_MESSAGE_LENGTH = 2000;

function isValidRole(value: FormDataEntryValue | null): value is AccessRequestedRole {
  return typeof value === "string" && (VALID_ROLES as string[]).includes(value);
}

export async function submitAccessRequestAction(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
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
