import "server-only";
import type { SubmissionStatus, MetricDataType } from "@/generated/prisma/client";

/**
 * One MetricDefinition's current value (if any) for a given submission,
 * shaped identically for the submit form and the company report page's
 * read-only breakdown. `key` drives section grouping by prefix (fin_/
 * health_/cust_/qual_, plus the reused revenue_b2b) -- a convention, not
 * a schema column, so no migration was needed to add the 30 real fields.
 * `value` is always a string here (the raw numericValue already
 * .toNumber()'d-and-stringified or the raw textValue) -- the form parses
 * it back per dataType itself; this DTO never leaks a Prisma Decimal.
 */
export interface SubmissionMetricFieldDTO {
  metricDefinitionId: string;
  key: string;
  labelEn: string;
  labelAr: string;
  dataType: MetricDataType;
  required: boolean;
  sortOrder: number;
  value: string | null;
  isNa: boolean;
}

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
  /** Every active MetricDefinition for this submission's template, with
   * whatever value (if any) has been saved so far -- the real form data,
   * not just the completeness hints above. */
  metrics: SubmissionMetricFieldDTO[];
}
