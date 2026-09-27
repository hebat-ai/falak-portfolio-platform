"use client";

import { useActionState } from "react";
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
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-nebula-aqua px-4 py-2 text-sm font-medium text-dark-green hover:bg-nebula-aqua/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit report"}
      </button>
    </form>
  );
}
