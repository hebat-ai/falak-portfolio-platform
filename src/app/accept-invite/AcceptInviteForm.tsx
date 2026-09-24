"use client";

import { useActionState } from "react";
import { acceptInviteAction, type AcceptInviteState } from "./actions";

const initialState: AcceptInviteState = { error: null };

interface AcceptInviteFormProps {
  token: string;
  email: string;
  companyName: string;
}

export function AcceptInviteForm({ token, email, companyName }: AcceptInviteFormProps) {
  const boundAction = acceptInviteAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Joining <strong className="text-foreground">{companyName}</strong> as <strong className="text-foreground">{email}</strong>
      </p>
      <div className="space-y-1">
        <label htmlFor="accept-invite-password" className="text-xs font-medium text-muted-foreground">
          Choose a password
        </label>
        <input
          id="accept-invite-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-md border border-control-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="accept-invite-confirm-password" className="text-xs font-medium text-muted-foreground">
          Confirm password
        </label>
        <input
          id="accept-invite-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
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
        {isPending ? "Joining..." : "Set password and join"}
      </button>
    </form>
  );
}
