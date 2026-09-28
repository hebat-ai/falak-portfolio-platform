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
      <p className="text-xs text-muted-foreground">
        No password needed -- after you accept, sign in anytime with a one-time link sent to your email.
      </p>
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
        {isPending ? "Joining..." : "Accept invitation"}
      </button>
    </form>
  );
}
