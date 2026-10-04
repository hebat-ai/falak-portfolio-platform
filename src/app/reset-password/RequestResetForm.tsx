"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requestPasswordResetAction, type RequestResetState } from "./actions";

const initialState: RequestResetState = { error: null, sent: false };

export function RequestResetForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  if (state.sent) {
    return (
      <p role="status" className="text-sm text-foreground">
        If an account exists for that email, we&apos;ve sent a password reset link. Check your inbox.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="reset-email" className="text-xs font-medium text-muted-foreground">
          Email
        </label>
        <Input id="reset-email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.error ? (
        <p role="alert" className="text-xs font-medium text-foreground">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send reset link"}
      </Button>
      <p className="text-xs text-muted-foreground">
        <Link href="/sign-in" className="text-link-foreground underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
