"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { uploadAttachmentAction, type SaveMetricsState } from "../[slug]/actions";
import type { SubmissionAttachmentDTO } from "@/lib/reporting/attachments";

const initialState: SaveMetricsState = { error: null, success: false };

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentsPanelProps {
  companyId: string;
  submissionId: string;
  slug: string;
  attachments: SubmissionAttachmentDTO[];
  editable: boolean;
}

export function AttachmentsPanel({ companyId, submissionId, slug, attachments, editable }: AttachmentsPanelProps) {
  const { t, lang } = useLanguage();
  const boundAction = uploadAttachmentAction.bind(null, companyId, submissionId, slug);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{t.submitReport.attachmentsTitle}</h3>

      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t.submitReport.noAttachmentsMessage}</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <a
                href={`/api/attachments/${a.id}`}
                className="chamfer-br-sm min-w-0 truncate text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
              >
                {a.fileName}
              </a>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatFileSize(a.sizeBytes)} &middot; {formatDate(a.createdAt.slice(0, 10), lang)}
                {a.isAuditedFinancials ? (
                  <>
                    {" "}
                    &middot; <span className="font-medium text-foreground">{t.submitReport.auditedFinancialsBadge}</span>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {editable ? (
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            required
            className="text-sm text-foreground file:me-3 file:chamfer-br-sm file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" name="isAuditedFinancials" className="size-3.5" />
            {t.submitReport.auditedFinancialsCheckboxLabel}
          </label>
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            {isPending ? t.submitReport.uploading : t.submitReport.uploadAction}
          </Button>
        </form>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-xs font-medium text-foreground">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
