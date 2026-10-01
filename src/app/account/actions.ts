"use server";

import { signOut } from "@/auth";
import { getCurrentUser } from "@/lib/auth/current-user";
import { setPassword, GENERIC_ERROR, type SetPasswordResult } from "@/lib/auth/set-password";

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

export type SetPasswordState = SetPasswordResult;

export async function setPasswordAction(_prevState: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: GENERIC_ERROR, success: false };
  }

  return setPassword(user.id, {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
}
