"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { completeExistingMemberAction, type AcceptInviteState } from "./actions";

const initialState: AcceptInviteState = { error: null };

export function ExistingMemberConfirmForm({ token, companyName }: { token: string; companyName: string }) {
  const boundAction = async () => completeExistingMemberAction(token);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You&apos;re signed in with the account this invitation was sent to. Join{" "}
        <strong className="text-foreground">{companyName}</strong>?
      </p>
      {state.error ? (
        <p role="alert" className="text-xs font-semibold text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Joining..." : `Join ${companyName}`}
      </Button>
    </form>
  );
}
