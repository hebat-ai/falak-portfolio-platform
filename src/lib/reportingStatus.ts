import type { SubmissionStatus } from "@/generated/prisma/client";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Overdue-day count for one period's submission, evaluated against the
 * live clock. Applies only to "draft" submissions past their deadline;
 * returns null otherwise, so callers test `!== null` instead of a separate
 * boolean. Single source of truth for every page that shows overdue days,
 * so /admin, /review, /company, /vehicle and /submit can never disagree.
 */
export function getOverdueDays(status: SubmissionStatus, deadlineIso: string): number | null {
  if (status !== "draft") return null;
  const deadline = new Date(`${deadlineIso}T00:00:00Z`);
  const now = new Date();
  if (now <= deadline) return null;
  return Math.round((now.getTime() - deadline.getTime()) / MS_PER_DAY);
}
