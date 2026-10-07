import "server-only";
import type { SubmissionStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireFalakRoleWithDepartmentScope } from "@/lib/auth/department-scope";
import { ForbiddenError } from "@/lib/auth/authorization-errors";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";
import { SUBMITTABLE_FROM_STATUSES } from "@/lib/reporting/submission-status";
import {
  FIX_FIELDS_ERROR,
  fetchSubmissionMetricFields,
  invalidMetricFields,
  writeMetricValues,
  type MetricValueInput,
} from "@/lib/reporting/metrics";
import type { SubmissionMetricFieldDTO } from "@/lib/reporting/dto";
import type { Currency } from "@/generated/prisma/client";

// Staff entering a startup's figures themselves -- e.g. numbers received by
// email or in a meeting -- into the same submission the startup would
// fill in, so they flow into the startup page and, once approved and
// published through Review, into the quarterly report.

/** Approved and published reports are a fixed record; never edited here. */
const STAFF_EDITABLE_STATUSES: SubmissionStatus[] = ["draft", "changes_requested", "submitted", "under_review"];

const GENERIC_ERROR = "Something went wrong. Check your input and try again.";
const LOCKED_ERROR = "This report has been approved or published, so its figures can no longer be changed here.";

export interface StaffEntryCycle {
  cycleId: string;
  submissionId: string;
  status: SubmissionStatus;
  editable: boolean;
  /** Draft / changes requested: staff can also submit it on the startup's behalf. */
  canSubmit: boolean;
  periodLabel: string;
  templateNameEn: string;
  templateNameAr: string;
  currentDeadline: string;
  company: { id: string; slug: string; nameEn: string; nameAr: string; currency: Currency };
  request: { templateId: string; periodStart: string; periodEnd: string };
  metrics: SubmissionMetricFieldDTO[];
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function loadCycle(cycleId: string) {
  const { user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS");
  const cycle = await db.reportingCycle.findFirst({
    where: { id: cycleId, company: { archivedAt: null } },
    select: {
      id: true,
      templateId: true,
      periodLabel: true,
      periodStart: true,
      periodEnd: true,
      currentDeadline: true,
      template: { select: { nameEn: true, nameAr: true } },
      company: { select: { id: true, slug: true, nameEn: true, nameAr: true, currency: true, department: true } },
      submission: { select: { id: true, status: true } },
    },
  });
  if (!cycle) return null;
  if (departments && !departments.includes(cycle.company.department)) throw new ForbiddenError();
  return { user, cycle };
}

/** The cycle and its form fields, for the staff entry page. Null when it doesn't exist. */
export async function getStaffEntryCycle(cycleId: string): Promise<StaffEntryCycle | null> {
  const loaded = await loadCycle(cycleId);
  if (!loaded) return null;
  const { user, cycle } = loaded;

  // Every request is created with a draft submission; one made before that
  // rule gets its submission now.
  let submission = cycle.submission;
  if (!submission) {
    submission = await db.$transaction(async (tx) => {
      const created = await tx.companySubmission.create({ data: { cycleId: cycle.id, status: "draft" }, select: { id: true, status: true } });
      await writeAuditEvent(tx, { actorId: user.id, action: "submission.created_by_staff", targetType: "CompanySubmission", targetId: created.id });
      return created;
    });
  }

  return {
    cycleId: cycle.id,
    submissionId: submission.id,
    status: submission.status,
    editable: STAFF_EDITABLE_STATUSES.includes(submission.status),
    canSubmit: SUBMITTABLE_FROM_STATUSES.includes(submission.status),
    periodLabel: cycle.periodLabel,
    templateNameEn: cycle.template.nameEn,
    templateNameAr: cycle.template.nameAr,
    currentDeadline: toDateOnly(cycle.currentDeadline),
    company: {
      id: cycle.company.id,
      slug: cycle.company.slug,
      nameEn: cycle.company.nameEn,
      nameAr: cycle.company.nameAr,
      currency: cycle.company.currency,
    },
    request: { templateId: cycle.templateId, periodStart: toDateOnly(cycle.periodStart), periodEnd: toDateOnly(cycle.periodEnd) },
    metrics: await fetchSubmissionMetricFields(db, submission.id, cycle.templateId),
  };
}

export interface StaffEntryResult {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success: boolean;
  submitted?: boolean;
}

class MissingRequired extends Error {
  ids: string[];
  constructor(ids: string[]) {
    super("missing required");
    this.ids = ids;
  }
}

/**
 * Saves staff-entered figures for a cycle; with `submit`, also submits the
 * report on the startup's behalf (draft / changes requested only), which
 * puts it in the Review queue for approval and publishing. Saving and
 * submitting happen together or not at all. Always audited.
 */
export async function staffSaveCycleValues(cycleId: string, values: MetricValueInput[], submit: boolean): Promise<StaffEntryResult> {
  const loaded = await loadCycle(cycleId);
  if (!loaded?.cycle.submission) return { error: GENERIC_ERROR, success: false };
  const { user, cycle } = loaded;
  const submission = cycle.submission!;
  if (!STAFF_EDITABLE_STATUSES.includes(submission.status)) return { error: LOCKED_ERROR, success: false };
  const submitNow = submit && SUBMITTABLE_FROM_STATUSES.includes(submission.status);

  // Only this cycle's own template's fields can be written.
  const definitions = await db.metricDefinition.findMany({
    where: { templateId: cycle.templateId, isActive: true },
    select: { id: true, dataType: true, required: true },
  });
  const definitionsById = new Map(definitions.map((d) => [d.id, d.dataType] as const));

  const fieldErrors = invalidMetricFields(values, definitionsById);
  if (Object.keys(fieldErrors).length > 0) {
    return { error: FIX_FIELDS_ERROR, fieldErrors, success: false };
  }

  try {
    await db.$transaction(async (tx) => {
      await writeMetricValues(tx, submission.id, values, definitionsById);
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "submission.values_entered_by_staff",
        targetType: "CompanySubmission",
        targetId: submission.id,
      });
      if (!submitNow) return;

      const required = definitions.filter((d) => d.required).map((d) => d.id);
      const answered = await tx.submissionMetricValue.findMany({
        where: { submissionId: submission.id, metricDefinitionId: { in: required } },
        select: { metricDefinitionId: true, isNa: true, numericValue: true, textValue: true },
      });
      const done = new Set(
        answered
          .filter((v) => v.isNa || v.numericValue !== null || (v.textValue !== null && v.textValue.trim().length > 0))
          .map((v) => v.metricDefinitionId)
      );
      const missing = required.filter((id) => !done.has(id));
      if (missing.length > 0) throw new MissingRequired(missing);

      // Pinned to the status just read, so a concurrent change fails safely.
      const claim = await tx.companySubmission.updateMany({
        where: { id: submission.id, status: submission.status },
        data: { status: "submitted", submittedById: user.id },
      });
      if (claim.count !== 1) throw new Error("status changed");
      const priorEventCount = await tx.submissionWorkflowEvent.count({ where: { submissionId: submission.id } });
      await tx.submissionWorkflowEvent.create({
        data: {
          submissionId: submission.id,
          versionNo: priorEventCount + 1,
          actorId: user.id,
          fromStatus: submission.status,
          toStatus: "submitted",
          comment: "Figures entered and submitted by Falak staff on the startup's behalf.",
        },
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "submission.submitted_by_staff",
        targetType: "CompanySubmission",
        targetId: submission.id,
      });
    });
  } catch (error) {
    if (error instanceof MissingRequired) {
      return {
        error: `${error.ids.length} required field(s) are empty. Fill them in (or tick N/A) to submit. Nothing was saved.`,
        fieldErrors: Object.fromEntries(error.ids.map((id) => [`value_${id}`, "Required."])),
        success: false,
      };
    }
    console.error("Staff entry failed:", error);
    return { error: GENERIC_ERROR, success: false };
  }

  return { error: null, success: true, submitted: submitNow };
}
