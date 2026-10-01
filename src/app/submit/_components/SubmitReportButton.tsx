"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { submitReportAction, type SubmitReportState } from "../[slug]/actions";

const initialState: SubmitReportState = { error: null, success: false };

interface SubmitReportButtonProps {
  companyId: string;
  submissionId: string;
  slug: string;
}

export function SubmitReportButton({ companyId, submissionId, slug }: SubmitReportButtonProps) {
  const boundAction = submitReportAction.bind(null, companyId, submissionId, slug);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <p role="status" className="text-sm font-medium text-foreground">
        Report submitted.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      {state.error ? (
        <p role="alert" className="text-xs font-medium text-foreground">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit report"}
      </Button>
    </form>
  );
}
