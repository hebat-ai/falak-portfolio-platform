import { DASHBOARD_SNAPSHOT_DATE, daysBetween } from "./format";
import type { ReportingStatus } from "./mock/types";

/**
 * Overdue-day count for a single reporting-period status, evaluated
 * against the fixed DASHBOARD_SNAPSHOT_DATE (never the live clock).
 * Applies only to "draft" reports past their deadline; returns null
 * otherwise, so callers test `!== null` instead of a separate boolean.
 * Single source of truth -- the Admin panel and the Company report both
 * call this so the two can never disagree on what counts as overdue.
 */
export function getOverdueDays(status: ReportingStatus, deadlineIso: string): number | null {
  if (status !== "draft") return null;
  const deadline = new Date(`${deadlineIso}T00:00:00Z`);
  if (DASHBOARD_SNAPSHOT_DATE <= deadline) return null;
  return daysBetween(DASHBOARD_SNAPSHOT_DATE, deadline);
}
