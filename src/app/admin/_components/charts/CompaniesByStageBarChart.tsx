"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getStatusColors, STATUS_ORDER } from "./chartColors";
import type { AdminCompanyDTO } from "@/lib/admin/dto";

const STAGE_ORDER = ["PreSeed", "Seed", "SeriesA", "SeriesB", "Later"] as const;

interface CompaniesByStageBarChartProps {
  companies: AdminCompanyDTO[];
  periodKey: string;
}

export function CompaniesByStageBarChart({ companies, periodKey }: CompaniesByStageBarChartProps) {
  const { t } = useLanguage();
  const [stacked, setStacked] = useState(true);
  const colors = useMemo(() => getStatusColors(), []);

  const data = useMemo(
    () =>
      STAGE_ORDER.map((stage) => {
        const row: Record<string, string | number> = { stage: t.stages[stage] };
        for (const status of STATUS_ORDER) row[status] = 0;
        for (const company of companies) {
          if (company.currentStage !== stage) continue;
          const status = company.periods[periodKey]?.status ?? "draft";
          row[status] = (row[status] as number) + 1;
        }
        return row;
      }),
    [companies, periodKey, t]
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="inline-flex w-fit items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={stacked} onChange={(e) => setStacked(e.target.checked)} />
        {t.admin.charts.stackedToggleLabel}
      </label>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="stage" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }} />
            <Legend formatter={(value) => t.status[value as keyof typeof t.status]?.label ?? value} />
            {STATUS_ORDER.map((status) => (
              <Bar key={status} dataKey={status} stackId={stacked ? "status" : undefined} fill={colors[status]} name={status} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
