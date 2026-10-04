"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requestSignInLinkAction, type SignInState } from "./actions";

const initialState: SignInState = { error: null, sent: false };

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(requestSignInLinkAction, initialState);

  if (state.sent) {
    return (
      <p role="status" className="text-sm text-foreground">
        If an account exists for that email, we&apos;ve sent a sign-in link. Check your inbox.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="sign-in-email" className="text-xs font-medium text-muted-foreground">
          Email
        </label>
        <Input id="sign-in-email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.error ? (
        <p role="alert" className="text-xs font-semibold text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send sign-in link"}
      </Button>
    </form>
  );
}
