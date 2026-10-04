import "server-only";
import { db } from "@/lib/db";
import { requireCompanyMembership } from "@/lib/auth/authorization";
import { SUBMITTABLE_FROM_STATUSES } from "@/lib/reporting/submission-status";
import { uploadAttachment } from "@/lib/storage/blob";

const GENERIC_ERROR = "Something went wrong. Check your file and try again.";
const LOCKED_ERROR = "This report can no longer be edited.";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
]);

export interface UploadAttachmentResult {
  error: string | null;
  success: boolean;
}

/**
 * Re-verifies company membership AND the editable-status gate before
 * writing anything -- same discipline as saveMetricValues. Rejects an
 * oversized or wrong-type file outright rather than storing it; the
 * allowlist covers the realistic set of financials/decks a company would
 * actually attach, not arbitrary file types.
 */
export async function uploadSubmissionAttachment(
  companyId: string,
  submissionId: string,
  file: File,
  isAuditedFinancials = false
): Promise<UploadAttachmentResult> {
  const { user } = await requireCompanyMembership(companyId, "MEMBER");

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

  if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return { error: GENERIC_ERROR, success: false };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: GENERIC_ERROR, success: false };
  }

  try {
    const uploaded = await uploadAttachment(`submissions/${submissionId}/${file.name}`, file, file.type);
    await db.attachment.create({
      data: {
        ownerType: "SUBMISSION",
        kind: isAuditedFinancials ? "AuditedFinancials" : "General",
        submissionId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: uploaded.size,
        storageProvider: "vercel-blob",
        storageKey: uploaded.pathname,
        uploadedById: user.id,
      },
    });
  } catch {
    return { error: GENERIC_ERROR, success: false };
  }

  return { error: null, success: true };
}

export interface SubmissionAttachmentDTO {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  isAuditedFinancials: boolean;
}

/**
 * No auth of its own -- the caller (the /submit/[slug] page, already
 * having called getCurrentSubmissionForCompanyMember) has already
 * verified access to this exact submissionId before reaching here, same
 * "auth happens once, at the real entry point" discipline as
 * fetchSubmissionMetricFields.
 */
export async function listSubmissionAttachments(submissionId: string): Promise<SubmissionAttachmentDTO[]> {
  const rows = await db.attachment.findMany({
    where: { submissionId, ownerType: "SUBMISSION" },
    orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true, kind: true },
  });
  return rows.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    createdAt: r.createdAt.toISOString(),
    isAuditedFinancials: r.kind === "AuditedFinancials",
  }));
}
