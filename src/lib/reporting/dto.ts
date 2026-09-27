import "server-only";
import type { SubmissionStatus } from "@/generated/prisma/client";

/**
 * Minimal, server-shaped view of a CompanySubmission -- never the raw
 * Prisma row. No internal ids beyond what the client genuinely needs to
 * act on it, no other companies' data, no metric values themselves (out
 * of scope for this slice -- see submissions.ts's own header comment).
 *
 * hasApplicableMetrics/requiredMetricsComplete/canSubmit are UI HINTS
 * ONLY, computed the same way the enforcement check inside
 * submitCompanySubmission() computes them, from the same schema
 * relationships -- but they are never the authoritative gate. The Server
 * Action re-derives and re-checks completeness itself, fresh, at
 * mutation time, regardless of what this DTO says.
 */
export interface SubmissionDTO {
  id: string;
  companyId: string;
  status: SubmissionStatus;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  currentDeadline: Date;
  /** false when the owning ReportingTemplate has zero active
   * MetricDefinition rows -- a Falak configuration gap, not something
   * the company can fix by entering data. */
  hasApplicableMetrics: boolean;
  /** Only meaningful when hasApplicableMetrics is true: whether every
   * active, required MetricDefinition has a valid SubmissionMetricValue
   * for this submission. */
  requiredMetricsComplete: boolean;
  /** status is a submittable source status AND hasApplicableMetrics AND
   * requiredMetricsComplete -- the single flag the UI uses to decide
   * whether to render a functional Submit control at all. */
  canSubmit: boolean;
}
