"use server";

import { signOut } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  setPassword,
  GENERIC_ERROR,
  WRONG_CURRENT_PASSWORD,
  TOO_SHORT,
  MISMATCH,
  type SetPasswordResult,
} from "@/lib/auth/set-password";

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

export type SetPasswordState = SetPasswordResult & { fieldErrors?: Record<string, string> };

// Which input each known message belongs to.
const FIELD_FOR_ERROR: Record<string, string> = {
  [WRONG_CURRENT_PASSWORD]: "currentPassword",
  [TOO_SHORT]: "newPassword",
  [MISMATCH]: "confirmPassword",
};

export async function setPasswordAction(_prevState: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: GENERIC_ERROR, success: false };
  }

  const result = await setPassword(user.id, {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  const field = result.error ? FIELD_FOR_ERROR[result.error] : undefined;
  return field ? { ...result, fieldErrors: { [field]: result.error! } } : result;
}
