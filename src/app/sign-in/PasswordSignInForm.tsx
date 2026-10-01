"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signInWithPasswordAction, type PasswordSignInState } from "./actions";

const initialState: PasswordSignInState = { error: null };

export function PasswordSignInForm() {
  const [state, formAction, isPending] = useActionState(signInWithPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="password-sign-in-email" className="text-xs font-medium text-muted-foreground">
          Email
        </label>
        <Input id="password-sign-in-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1">
        <label htmlFor="password-sign-in-password" className="text-xs font-medium text-muted-foreground">
          Password
        </label>
        <Input id="password-sign-in-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error ? (
        <p role="alert" className="text-xs font-medium text-foreground">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
