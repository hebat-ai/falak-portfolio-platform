"use client";

import { useActionState, useEffect } from "react";
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

  // Missing required fields live in the reporting form above this button:
  // outline them there and jump to the first one.
  useEffect(() => {
    let first: HTMLElement | null = null;
    for (const name of Object.keys(state.fieldErrors ?? {})) {
      document.querySelectorAll<HTMLElement>(`[name="${CSS.escape(name)}"]`).forEach((el) => {
        el.setAttribute("aria-invalid", "true");
        el.setAttribute("data-field-invalid", "");
        first ??= el;
      });
    }
    const target = first as HTMLElement | null;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  }, [state]);

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
        <p role="alert" className="text-xs font-semibold text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit report"}
      </Button>
    </form>
  );
}
