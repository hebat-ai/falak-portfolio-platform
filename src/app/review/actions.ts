"use server";

import { startReview, requestChanges, approveSubmission } from "@/lib/reporting/review-workflow";
import { InvalidTransitionError } from "@/lib/reporting/submission-errors";

export interface ReviewActionState {
  error: string | null;
}

const GENERIC_ERROR = "That action isn't available for this submission right now.";
const MAX_COMMENT_LENGTH = 4000;

function readSubmissionId(formData: FormData): string | null {
  const value = formData.get("submissionId");
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function startReviewAction(_prevState: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const submissionId = readSubmissionId(formData);
  if (!submissionId) {
    return { error: GENERIC_ERROR };
  }

  try {
    await startReview(submissionId);
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return { error: GENERIC_ERROR };
    }
    throw error;
  }

  return { error: null };
}

export async function requestChangesAction(_prevState: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const submissionId = readSubmissionId(formData);
  const commentInput = formData.get("comment");

  if (!submissionId || typeof commentInput !== "string") {
    return { error: GENERIC_ERROR };
  }
  // Reject oversized raw input before it's stored -- same discipline as
  // every other free-text field in this codebase.
  if (commentInput.length > MAX_COMMENT_LENGTH) {
    return { error: "Comment is too long." };
  }
  const comment = commentInput.trim();
  if (!comment) {
    return { error: "Explain what needs to change before sending this back." };
  }

  try {
    await requestChanges(submissionId, comment);
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return { error: GENERIC_ERROR };
    }
    throw error;
  }

  return { error: null };
}

export async function approveSubmissionAction(_prevState: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const submissionId = readSubmissionId(formData);
  if (!submissionId) {
    return { error: GENERIC_ERROR };
  }

  try {
    await approveSubmission(submissionId);
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return { error: GENERIC_ERROR };
    }
    throw error;
  }

  return { error: null };
}
