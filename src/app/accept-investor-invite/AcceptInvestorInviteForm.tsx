"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
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
        <p role="alert" className="text-xs font-semibold text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Joining..." : "Accept invitation"}
      </Button>
    </form>
  );
}
