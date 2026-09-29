"use client";

import { useActionState } from "react";
import { completeExistingInvestorMemberAction, type AcceptInvestorInviteState } from "./actions";

const initialState: AcceptInvestorInviteState = { error: null };

export function ExistingInvestorMemberConfirmForm({ token, investorName }: { token: string; investorName: string }) {
  const boundAction = async () => completeExistingInvestorMemberAction(token);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You&apos;re signed in with the account this invitation was sent to. Join{" "}
        <strong className="text-foreground">{investorName}</strong>?
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
        {isPending ? "Joining..." : `Join ${investorName}`}
      </button>
    </form>
  );
}
