"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import type { AuditEventPage } from "@/lib/admin/audit";

interface AuditLogClientProps {
  data: AuditEventPage;
  page: number;
  selectedAction: string;
}

function toDateTimeLabel(iso: string, lang: "en" | "ar"): string {
  const date = formatDate(iso.slice(0, 10), lang);
  const time = new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

export function AuditLogClient({ data, page, selectedAction }: AuditLogClientProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();

  function navigate(nextPage: number, nextAction: string) {
    const params = new URLSearchParams();
    if (nextAction) params.set("action", nextAction);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    router.push(`/admin/manage/audit-log${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <Card className="min-w-0">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-full flex-col gap-1 sm:w-auto">
            <label htmlFor="audit-action-filter" className="text-xs font-medium text-muted-foreground">
              {t.admin.manage.auditFilterLabel}
            </label>
            <Select
              id="audit-action-filter"
              value={selectedAction}
              onChange={(e) => navigate(1, e.target.value)}
            >
              <option value="">{t.admin.manage.auditAllActionsOption}</option>
              {data.actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {data.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.admin.manage.auditNoEventsMessage}</p>
      ) : (
        <Table caption={t.admin.manage.auditLogTitle}>
          <THead>
            <Tr>
              <Th>{t.admin.manage.auditWhenColumn}</Th>
              <Th>{t.admin.manage.auditActorColumn}</Th>
              <Th>{t.admin.manage.auditActionColumn}</Th>
              <Th>{t.admin.manage.auditTargetColumn}</Th>
            </Tr>
          </THead>
          <TBody>
            {data.events.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <time dateTime={e.createdAt}>{toDateTimeLabel(e.createdAt, lang)}</time>
                </Td>
                <Td>{e.actorEmail ?? "—"}</Td>
                <Td className="font-mono text-xs">{e.action}</Td>
                <Td className="font-mono text-xs">
                  {e.targetType}:{e.targetId}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => navigate(page - 1, selectedAction)}>
          {t.admin.manage.auditPreviousPageAction}
        </Button>
        <Button variant="outline" size="sm" disabled={!data.hasMore} onClick={() => navigate(page + 1, selectedAction)}>
          {t.admin.manage.auditNextPageAction}
        </Button>
      </div>
    </div>
  );
}
