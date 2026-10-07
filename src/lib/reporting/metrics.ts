import "server-only";
import type { Prisma, MetricDataType, SubmissionStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireCompanyMembership, requireFalakRole } from "@/lib/auth/authorization";
import { SUBMITTABLE_FROM_STATUSES } from "@/lib/reporting/submission-status";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";
import type { SubmissionMetricFieldDTO } from "@/lib/reporting/dto";

/**
 * Every active MetricDefinition for `templateId`, each paired with
 * whatever SubmissionMetricValue (if any) exists for `submissionId` --
 * shared by submissions.ts's getCurrentSubmissionForCompanyMember/
 * listSubmissionsForFalakReview (read path) and saveMetricValues below
 * (to know which fields are even valid to write to). No auth of its own
 * -- callers have already verified access to submissionId/templateId
 * before reaching here, same "auth happens once, at the real entry
 * point" discipline as checkMetricCompleteness in submissions.ts.
 */
export async function fetchSubmissionMetricFields(
  client: Prisma.TransactionClient | typeof db,
  submissionId: string,
  templateId: string
): Promise<SubmissionMetricFieldDTO[]> {
  const definitions = await client.metricDefinition.findMany({
    where: { templateId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, key: true, labelEn: true, labelAr: true, dataType: true, required: true, sortOrder: true },
  });

  const values = await client.submissionMetricValue.findMany({
    where: { submissionId, metricDefinitionId: { in: definitions.map((d) => d.id) } },
    select: { metricDefinitionId: true, numericValue: true, textValue: true, isNa: true },
  });
  const valueByDefinitionId = new Map(values.map((v) => [v.metricDefinitionId, v]));

  return definitions.map((d) => {
    const existing = valueByDefinitionId.get(d.id);
    const value =
      !existing || existing.isNa
        ? null
        : d.dataType === "Text" || d.dataType === "Boolean"
          ? existing.textValue
          : (existing.numericValue?.toNumber() ?? null)?.toString() ?? null;

    return {
      metricDefinitionId: d.id,
      key: d.key,
      labelEn: d.labelEn,
      labelAr: d.labelAr,
      dataType: d.dataType,
      required: d.required,
      sortOrder: d.sortOrder,
      value,
      isNa: existing?.isNa ?? false,
    };
  });
}

export interface MetricValueInput {
  metricDefinitionId: string;
  rawValue: string;
  isNa: boolean;
}

export interface SaveMetricValuesResult {
  error: string | null;
  // Per field, keyed by the form input name `value_<metricDefinitionId>`.
  fieldErrors?: Record<string, string>;
  success: boolean;
}

const GENERIC_ERROR = "Something went wrong. Check your input and try again.";
const LOCKED_ERROR = "This report can no longer be edited.";
const MAX_RAW_VALUE_LENGTH = 4000;
const FIX_FIELDS_ERROR = "Fix the highlighted fields and try again. Nothing was saved.";

const INVALID_MESSAGE: Record<MetricDataType, string> = {
  Currency: "Enter a number, e.g. 250,000 or 1250.50.",
  Number: "Enter a number, e.g. 1,200.",
  Percent: "Enter a percentage, e.g. 12.5.",
  Boolean: "Choose Yes or No.",
  Text: `Up to ${MAX_RAW_VALUE_LENGTH} characters.`,
};

/**
 * Every submitted value that can't be stored, keyed by its input name.
 * Checked before anything is written, so a save either stores everything
 * or nothing -- a bad value is never silently dropped.
 */
function invalidMetricFields(values: MetricValueInput[], definitionsById: Map<string, MetricDataType>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of values) {
    const dataType = definitionsById.get(field.metricDefinitionId);
    if (!dataType) continue;
    if (field.rawValue.length > MAX_RAW_VALUE_LENGTH || toStoredValue(field, dataType) === "invalid") {
      errors[`value_${field.metricDefinitionId}`] =
        field.rawValue.length > MAX_RAW_VALUE_LENGTH ? `Up to ${MAX_RAW_VALUE_LENGTH} characters.` : INVALID_MESSAGE[dataType];
    }
  }
  return errors;
}

/**
 * Re-verifies company membership AND that the submission is still in an
 * editable status (SUBMITTABLE_FROM_STATUSES -- the exact same set
 * submitCompanySubmission itself requires, imported not duplicated)
 * before writing anything. Never trusts the page's own rendering
 * decision -- same discipline as every other mutation in this codebase.
 * Each field is validated by its OWN dataType (never the client's
 * claim), then upserted by the (submissionId, metricDefinitionId)
 * unique key.
 */
export async function saveMetricValues(
  companyId: string,
  submissionId: string,
  values: MetricValueInput[]
): Promise<SaveMetricValuesResult> {
  // No audit event: this is a draft-value save, not a workflow
  // transition -- this codebase only audits real transitions
  // (submission.submitted, review decisions, ...), not every keystroke
  // of in-progress editing.
  await requireCompanyMembership(companyId, "MEMBER");

  const submission = await db.companySubmission.findFirst({
    where: { id: submissionId, cycle: { companyId, company: { archivedAt: null } } },
    select: { id: true, status: true },
  });
  if (!submission) {
    return { error: GENERIC_ERROR, success: false };
  }
  if (!SUBMITTABLE_FROM_STATUSES.includes(submission.status)) {
    return { error: LOCKED_ERROR, success: false };
  }

  // dataType is looked up fresh here, never trusted from the client --
  // same "re-derive, don't trust the form's own claim" discipline as
  // every other validation in this codebase.
  const definitionsById = new Map(
    (
      await db.metricDefinition.findMany({
        where: { id: { in: values.map((v) => v.metricDefinitionId) } },
        select: { id: true, dataType: true },
      })
    ).map((d) => [d.id, d.dataType] as const)
  );

  const fieldErrors = invalidMetricFields(values, definitionsById);
  if (Object.keys(fieldErrors).length > 0) {
    return { error: FIX_FIELDS_ERROR, fieldErrors, success: false };
  }

  try {
    await db.$transaction(async (tx) => {
      await writeMetricValues(tx, submissionId, values, definitionsById);
    });
  } catch {
    return { error: GENERIC_ERROR, success: false };
  }

  return { error: null, success: true };
}

/**
 * The actual per-field validate-and-upsert loop, shared by
 * saveMetricValues (company member, draft/changes_requested only) and
 * adminUpdateSubmissionMetricValues below (Falak admin, submitted/
 * under_review only) -- the two callers differ only in who's allowed to
 * call them and which statuses are editable, never in how a raw value
 * actually gets validated and stored.
 */
async function writeMetricValues(
  tx: Prisma.TransactionClient,
  submissionId: string,
  values: MetricValueInput[],
  definitionsById: Map<string, MetricDataType>
): Promise<void> {
  for (const field of values) {
    // Never trust a metricDefinitionId the form didn't actually receive
    // from the server -- silently skipped, not an error, since a
    // stale/tampered field here changes nothing about the fields that
    // ARE valid.
    const dataType = definitionsById.get(field.metricDefinitionId);
    if (!dataType) continue;
    if (field.rawValue.length > MAX_RAW_VALUE_LENGTH) continue;

    const data = toStoredValue(field, dataType);
    if (data === "invalid") continue;

    await tx.submissionMetricValue.upsert({
      where: { submissionId_metricDefinitionId: { submissionId, metricDefinitionId: field.metricDefinitionId } },
      update: data,
      create: { submissionId, metricDefinitionId: field.metricDefinitionId, ...data },
    });
  }
}

const ADMIN_EDITABLE_STATUSES: SubmissionStatus[] = ["submitted", "under_review"];

/**
 * Falak-admin counterpart to saveMetricValues -- lets staff correct a
 * company's reported values directly while a submission is under
 * review (submitted or under_review only; never draft/changes_requested,
 * which are the company's own editable window, and never approved/
 * published, which must stay an immutable historical record once
 * finalized). Always audited (unlike the company-member save path,
 * which is a draft-keystroke save, not a workflow transition) -- this
 * is Falak overwriting what the company itself reported, so it must
 * leave a trail.
 */
export async function adminUpdateSubmissionMetricValues(
  submissionId: string,
  values: MetricValueInput[]
): Promise<SaveMetricValuesResult> {
  const { user } = await requireFalakRole("FALAK_ADMIN");

  const submission = await db.companySubmission.findFirst({
    where: { id: submissionId, cycle: { company: { archivedAt: null } } },
    select: { id: true, status: true },
  });
  if (!submission) {
    return { error: GENERIC_ERROR, success: false };
  }
  if (!ADMIN_EDITABLE_STATUSES.includes(submission.status)) {
    return { error: LOCKED_ERROR, success: false };
  }

  const definitionsById = new Map(
    (
      await db.metricDefinition.findMany({
        where: { id: { in: values.map((v) => v.metricDefinitionId) } },
        select: { id: true, dataType: true },
      })
    ).map((d) => [d.id, d.dataType] as const)
  );

  const fieldErrors = invalidMetricFields(values, definitionsById);
  if (Object.keys(fieldErrors).length > 0) {
    return { error: FIX_FIELDS_ERROR, fieldErrors, success: false };
  }

  try {
    await db.$transaction(async (tx) => {
      await writeMetricValues(tx, submissionId, values, definitionsById);
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "submission.values_corrected_by_staff",
        targetType: "CompanySubmission",
        targetId: submissionId,
      });
    });
  } catch {
    return { error: GENERIC_ERROR, success: false };
  }

  return { error: null, success: true };
}

interface StoredValueData {
  numericValue: string | null;
  textValue: string | null;
  isNa: boolean;
}

function toStoredValue(field: MetricValueInput, dataType: MetricDataType): StoredValueData | "invalid" {
  if (field.isNa) {
    return { numericValue: null, textValue: null, isNa: true };
  }

  const trimmed = field.rawValue.trim();
  if (trimmed.length === 0) {
    return { numericValue: null, textValue: null, isNa: false };
  }

  switch (dataType) {
    case "Currency":
    case "Percent":
    case "Number": {
      // Accept "1,250,000", "1 250 000" and (for percentages) "12.5%".
      const normalised = trimmed.replace(/[,\s]/g, "").replace(/%$/, "");
      if (!/^-?\d+(\.\d+)?$/.test(normalised)) return "invalid";
      return { numericValue: normalised, textValue: null, isNa: false };
    }
    case "Boolean": {
      if (trimmed !== "Yes" && trimmed !== "No") return "invalid";
      return { numericValue: null, textValue: trimmed, isNa: false };
    }
    case "Text":
      return { numericValue: null, textValue: trimmed, isNa: false };
    default: {
      const exhaustiveCheck: never = dataType;
      throw new Error(`Unhandled MetricDataType: ${String(exhaustiveCheck)}`);
    }
  }
}
