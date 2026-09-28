import type { SubmissionStatus } from "@/generated/prisma/client";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Overdue-day count for a single company's current-period submission,
 * evaluated against the real, live clock (unlike the mock prototype's
 * frozen DASHBOARD_SNAPSHOT_DATE) -- this is real data, so "overdue" has
 * to mean "overdue right now." Applies only to "draft" submissions past
 * their deadline; returns null otherwise, so callers test `!== null`
 * instead of a separate boolean.
 */
export function getOverdueDays(status: SubmissionStatus, deadlineIso: string): number | null {
  if (status !== "draft") return null;
  const deadline = new Date(`${deadlineIso}T00:00:00Z`);
  const now = new Date();
  if (now <= deadline) return null;
  return Math.round((now.getTime() - deadline.getTime()) / MS_PER_DAY);
}
