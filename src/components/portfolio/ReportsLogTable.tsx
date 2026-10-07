"use client";

import { useState } from "react";
import { useForm, type FormState } from "@/components/forms/useForm";
import Link from "next/link";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import type { ReportingRequestRow } from "@/lib/admin/reporting-requests";

const COLUMN_COUNT = 9;

interface ReportsLogTableProps {
  rows: ReportingRequestRow[];
  // Shown only on the Review page -- jumps the row's company+period into
  // the review panel below. The vehicle page has no review panel, so it
  // omits this and the table drops the action column entirely.
  onSelectForReview?: (row: ReportingRequestRow) => void;
  extendDeadlineAction: (prevState: FormState, formData: FormData) => Promise<FormState>;
  resendAction: (prevState: FormState, formData: FormData) => Promise<FormState>;
}

function ReportLogRow({
  row,
  lang,
  onSelectForReview,
  extendDeadlineAction,
  resendAction,
}: {
  row: ReportingRequestRow;
  lang: "en" | "ar";
  onSelectForReview?: (row: ReportingRequestRow) => void;
  extendDeadlineAction: ReportsLogTableProps["extendDeadlineAction"];
  resendAction: ReportsLogTableProps["resendAction"];
}) {
  const { t } = useLanguage();
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const deadline = useForm(extendDeadlineAction, { error: null }, { resetOnSuccess: false });
  const resend = useForm(resendAction, { error: null });

  return (
    <Tr>
      <Td className="font-medium">
        <Link href={`/company/${row.companySlug}`} className="text-link-foreground underline-offset-2 hover:underline">
          {lang === "ar" ? row.companyNameAr : row.companyNameEn}
        </Link>
      </Td>
      <Td>
        {row.vehicles.length === 0 ? (
          <span className="text-muted-foreground">{t.admin.table.noVehicleValue}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {row.vehicles.map((v) => (
              <Link key={v.id} href={`/vehicle/${v.slug}`} className="text-link-foreground underline-offset-2 hover:underline">
                {lang === "ar" ? v.nameAr : v.nameEn}
              </Link>
            ))}
          </div>
        )}
      </Td>
      <Td>{row.periodLabel}</Td>
      <Td>{formatDate(row.requestedAt, lang)}</Td>
      <Td>
        {isEditingDeadline ? (
          <form {...deadline.formProps} className="flex items-center gap-1.5">
            <input type="hidden" name="cycleId" value={row.cycleId} />
            <Input type="date" name="newDeadline" defaultValue={row.currentDeadline} className="w-36" />
            <Button type="submit" size="sm" disabled={deadline.isPending}>{t.reviewWorkspace.saveDeadlineAction}</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingDeadline(false)}>
              {t.reviewWorkspace.cancelAction}
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <time dateTime={row.currentDeadline}>{formatDate(row.currentDeadline, lang)}</time>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingDeadline(true)}>
              {t.reviewWorkspace.editDeadlineAction}
            </Button>
          </div>
        )}
        {deadline.state.error ? <p role="alert" className="text-xs font-semibold text-danger">{deadline.state.error}</p> : null}
      </Td>
      <Td>{row.submissionStatus ? <StatusBadge status={row.submissionStatus} /> : t.admin.table.noDataValue}</Td>
      <Td>
        {row.isPublished ? (
          <Link
            href={`/company/${row.companySlug}/report?period=${encodeURIComponent(row.periodLabel)}`}
            className="text-link-foreground underline-offset-2 hover:underline"
          >
            {t.reviewWorkspace.downloadReportAction}
          </Link>
        ) : (
          <span className="text-muted-foreground">{t.reviewWorkspace.notPublishedValue}</span>
        )}
      </Td>
      <Td>
        {row.distribution ? (
          <span className="text-xs text-muted-foreground">
            <Num>{row.distribution.sent}</Num> {t.reviewWorkspace.sentCountLabel}
            {row.distribution.pending > 0 ? (
              <>
                {" "}· <Num>{row.distribution.pending}</Num> {t.reviewWorkspace.pendingCountLabel}
              </>
            ) : null}
            {row.distribution.failed > 0 ? (
              <>
                {" "}· <Num>{row.distribution.failed}</Num> {t.reviewWorkspace.failedCountLabel}
              </>
            ) : null}
          </span>
        ) : (
          <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
        )}
      </Td>
      <Td>
        <div className="flex flex-wrap gap-2">
          {onSelectForReview ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onSelectForReview(row)}>
              {t.reviewWorkspace.reviewAction}
            </Button>
          ) : null}
          {row.isPublished && row.reportVersionId ? (
            <form {...resend.formProps}>
              <input type="hidden" name="reportVersionId" value={row.reportVersionId} />
              <Button type="submit" variant="outline" size="sm" disabled={resend.isPending}>
                {resend.isPending ? t.reviewWorkspace.resendPending : t.reviewWorkspace.resendToInvestorsAction}
              </Button>
            </form>
          ) : null}
        </div>
        {resend.state.error ? <p role="alert" className="text-xs font-semibold text-danger">{resend.state.error}</p> : null}
      </Td>
    </Tr>
  );
}

export function ReportsLogTable({ rows, onSelectForReview, extendDeadlineAction, resendAction }: ReportsLogTableProps) {
  const { t, lang } = useLanguage();

  return (
    <Table caption={t.reviewWorkspace.reportsLogCaption}>
      <THead>
        <Tr>
          <Th>{t.admin.table.companyColumn}</Th>
          <Th>{t.admin.table.vehicleColumn}</Th>
          <Th>{t.companyRegister.periodColumnLabel}</Th>
          <Th>{t.reviewWorkspace.requestedColumn}</Th>
          <Th>{t.admin.reportingStatusPanel.deadlineColumn}</Th>
          <Th>{t.admin.table.statusColumn}</Th>
          <Th>{t.reviewWorkspace.publishedColumn}</Th>
          <Th>{t.reviewWorkspace.distributionColumn}</Th>
          <Th>
            <span className="sr-only">{t.reviewWorkspace.reviewAction}</span>
          </Th>
        </Tr>
      </THead>
      <TBody>
        {rows.length === 0 ? (
          <Tr>
            <Td colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
              {t.admin.emptyState}
            </Td>
          </Tr>
        ) : (
          rows.map((row) => (
            <ReportLogRow
              key={row.cycleId}
              row={row}
              lang={lang}
              onSelectForReview={onSelectForReview}
              extendDeadlineAction={extendDeadlineAction}
              resendAction={resendAction}
            />
          ))
        )}
      </TBody>
    </Table>
  );
}
