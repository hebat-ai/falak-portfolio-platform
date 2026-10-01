"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setPasswordAction, type SetPasswordState } from "./actions";

const initialState: SetPasswordState = { error: null, success: false };

// Deliberately not localized, matching this page's and SignInForm's own
// established convention (account/sign-in are pre-authentication/
// account-management utility pages, kept bare-bones rather than wired
// into the dictionary like the rest of the app).
export function SetPasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, isPending] = useActionState(setPasswordAction, initialState);
  const router = useRouter();

  // Re-fetches the page's hasPassword prop after a successful set/change
  // so a first-time set immediately flips the form into "change password"
  // shape (with the current-password field) -- without this, submitting
  // a second time in the same session would still render the no-current-
  // password form while the server now has one on file.
  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <h2 className="text-sm font-semibold text-foreground">{hasPassword ? "Change password" : "Set a password"}</h2>
      <p className="text-xs text-muted-foreground">
        {hasPassword
          ? "Change your password below. You can still sign in with an emailed link at any time."
          : "Set a password to sign in directly next time, without waiting for an emailed link. The email link will still work either way."}
      </p>

      {hasPassword ? (
        <div className="space-y-1">
          <label htmlFor="currentPassword" className="text-xs font-medium text-muted-foreground">
            Current password
          </label>
          <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="newPassword" className="text-xs font-medium text-muted-foreground">
          New password
        </label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">
          Confirm new password
        </label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>

      {state.error ? (
        <p role="alert" className="text-xs font-medium text-foreground">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-xs font-medium text-nebula-aqua">
          {hasPassword ? "Password changed." : "Password set. You can now sign in with your email and password."}
        </p>
      ) : null}

      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Saving..." : hasPassword ? "Change password" : "Set password"}
      </Button>
    </form>
  );
}
