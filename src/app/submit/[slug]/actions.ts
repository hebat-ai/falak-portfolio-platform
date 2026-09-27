"use server";

import { revalidatePath } from "next/cache";
import { submitCompanySubmission } from "@/lib/reporting/submissions";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/authorization-errors";
import { InvalidTransitionError } from "@/lib/reporting/submission-errors";

export interface SubmitReportState {
  error: string | null;
  success: boolean;
}

const GENERIC_ACCESS_DENIED = "You do not have access to submit this report.";
const GENERIC_CANNOT_SUBMIT = "This report cannot be submitted right now.";

/**
 * companyId and submissionId identify WHICH resource is being acted on
 * only -- they are never treated as proof of authorization on their own.
 * submitCompanySubmission() re-verifies the caller's real, current
 * CompanyMembership for companyId, and re-scopes submissionId to that
 * exact company, fresh, at call time. slug is used only to revalidate
 * the page's own cached path after a real status change -- not a
 * security-relevant value.
 */
export async function submitReportAction(
  companyId: string,
  submissionId: string,
  slug: string
): Promise<SubmitReportState> {
  try {
    await submitCompanySubmission(companyId, submissionId);
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof ForbiddenError) {
      // Same generic message for both -- never reveals whether the
      // company/submission exists or merely that this session can't
      // access it.
      return { error: GENERIC_ACCESS_DENIED, success: false };
    }
    if (error instanceof InvalidTransitionError) {
      // Never reveals the submission's actual current status.
      return { error: GENERIC_CANNOT_SUBMIT, success: false };
    }
    // Unexpected/infrastructure error -- never converted into a denial
    // message; let it propagate.
    throw error;
  }

  revalidatePath(`/submit/${slug}`);
  return { error: null, success: true };
}
