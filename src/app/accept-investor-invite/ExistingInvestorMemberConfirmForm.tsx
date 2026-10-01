"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
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
      <Button type="submit" disabled={isPending}>
        {isPending ? "Joining..." : `Join ${investorName}`}
      </Button>
    </form>
  );
}
