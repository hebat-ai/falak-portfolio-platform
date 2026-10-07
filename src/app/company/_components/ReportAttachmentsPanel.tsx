"use client";

import { useForm } from "@/components/forms/useForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { uploadReportAttachmentAction, type UploadReportAttachmentState } from "../[slug]/report/actions";

const initialState: UploadReportAttachmentState = { error: null, success: false };

interface ReportAttachmentsPanelProps {
  reportVersionId: string;
  companySlug: string;
  periodLabel: string;
  attachments: { id: string; fileName: string }[];
  canManage: boolean;
}

export function ReportAttachmentsPanel({ reportVersionId, companySlug, periodLabel, attachments, canManage }: ReportAttachmentsPanelProps) {
  const { t } = useLanguage();
  const boundAction = uploadReportAttachmentAction.bind(null, reportVersionId, companySlug, periodLabel);
  const { state, isPending, formProps } = useForm(boundAction, initialState);

  if (attachments.length === 0 && !canManage) return null;

  return (
    <Card className="min-w-0 no-print">
      <h2 className="font-heading text-sm font-semibold text-foreground">{t.investorDashboard.attachmentsLabel}</h2>

      {attachments.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.submitReport.noAttachmentsMessage}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {attachments.map((a) => (
            <li key={a.id}>
              <a
                href={`/api/attachments/${a.id}`}
                className="chamfer-br-sm text-sm text-link-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
              >
                {a.fileName}
              </a>
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form {...formProps} className="mt-3 flex flex-wrap items-center gap-3">
          <input type="file" name="file" required className="text-sm text-foreground" />
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            {isPending ? t.submitReport.uploading : t.submitReport.uploadAction}
          </Button>
        </form>
      ) : null}

      {state.error ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-danger">
          {state.error}
        </p>
      ) : null}
    </Card>
  );
}
