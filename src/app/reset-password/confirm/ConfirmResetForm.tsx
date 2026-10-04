"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { confirmPasswordResetAction, type ConfirmResetState } from "./actions";

const initialState: ConfirmResetState = { error: null, success: false };

export function ConfirmResetForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(confirmPasswordResetAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-3">
        <p role="status" className="text-sm text-foreground">
          Password set. You can now sign in with your new password.
        </p>
        <Link href="/sign-in" className="text-sm text-link-foreground underline-offset-2 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1">
        <label htmlFor="confirm-reset-password" className="text-xs font-medium text-muted-foreground">
          New password
        </label>
        <Input id="confirm-reset-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirm-reset-confirm-password" className="text-xs font-medium text-muted-foreground">
          Confirm new password
        </label>
        <Input id="confirm-reset-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error ? (
        <p role="alert" className="text-xs font-medium text-foreground">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Set password"}
      </Button>
    </form>
  );
}
