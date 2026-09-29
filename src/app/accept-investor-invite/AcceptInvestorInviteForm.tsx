"use client";

import { useActionState } from "react";
import { acceptInvestorInviteAction, type AcceptInvestorInviteState } from "./actions";

const initialState: AcceptInvestorInviteState = { error: null };

interface AcceptInvestorInviteFormProps {
  token: string;
  email: string;
  investorName: string;
}

export function AcceptInvestorInviteForm({ token, email, investorName }: AcceptInvestorInviteFormProps) {
  const boundAction = acceptInvestorInviteAction.bind(null, token);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Joining <strong className="text-foreground">{investorName}</strong> as <strong className="text-foreground">{email}</strong>
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
