"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
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
      <Button type="submit" disabled={isPending}>
        {isPending ? "Joining..." : "Accept invitation"}
      </Button>
    </form>
  );
}
