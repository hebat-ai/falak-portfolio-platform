"use client";

import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/Table";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatNumber, formatPercent } from "@/lib/format";
import type { CompanyBenchmark } from "@/lib/admin/benchmarking";

interface BenchmarksViewProps {
  benchmarks: CompanyBenchmark[];
}

export function BenchmarksView({ benchmarks }: BenchmarksViewProps) {
  const { t, lang } = useLanguage();
  const metricColumns = new Map<string, { labelEn: string; labelAr: string }>();
  for (const b of benchmarks) {
    for (const m of b.metrics) {
      if (!metricColumns.has(m.key)) metricColumns.set(m.key, { labelEn: m.labelEn, labelAr: m.labelAr });
    }
  }
  const metricKeys = [...metricColumns.keys()];

  return (
    <Table caption={t.admin.charts.benchmarksViewLabel}>
      <THead>
        <Tr>
          <Th>{t.admin.table.companyColumn}</Th>
          {metricKeys.map((key) => (
            <Th key={key} className="text-end">
              {lang === "ar" ? metricColumns.get(key)!.labelAr : metricColumns.get(key)!.labelEn}
            </Th>
          ))}
        </Tr>
      </THead>
      <TBody>
        {benchmarks.map((benchmark) => (
          <Tr key={benchmark.companyId}>
            <Td className="font-medium">{lang === "ar" ? benchmark.companyNameAr : benchmark.companyNameEn}</Td>
            {metricKeys.map((key) => {
              const metric = benchmark.metrics.find((m) => m.key === key);
              if (!metric) return <Td key={key} className="text-end text-muted-foreground">—</Td>;
              return (
                <Td key={key} className="text-end">
                  <Num>{formatNumber(metric.value, lang)}</Num>
                  {metric.percentile === null ? (
                    <span className="ms-1.5 text-xs text-muted-foreground">({t.admin.charts.notEnoughPeersLabel})</span>
                  ) : (
                    <span className="ms-1.5 text-xs text-muted-foreground">
                      (<Num>{formatPercent(metric.percentile / 100, lang)}</Num> {t.admin.charts.percentileLabel})
                    </span>
                  )}
                </Td>
              );
            })}
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}
