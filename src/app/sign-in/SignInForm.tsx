"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="sign-in-email" className="text-xs font-medium text-muted-foreground">
          Email
        </label>
        <input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="sign-in-password" className="text-xs font-medium text-muted-foreground">
          Password
        </label>
        <input
          id="sign-in-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-xs font-medium text-foreground">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
