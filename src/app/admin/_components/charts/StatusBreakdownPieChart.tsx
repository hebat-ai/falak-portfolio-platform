"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getStatusColors, STATUS_ORDER } from "./chartColors";
import type { AdminCompanyDTO } from "@/lib/admin/dto";

interface StatusBreakdownPieChartProps {
  companies: AdminCompanyDTO[];
  periodKey: string;
}

export function StatusBreakdownPieChart({ companies, periodKey }: StatusBreakdownPieChartProps) {
  const { t } = useLanguage();
  const colors = useMemo(() => getStatusColors(), []);

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of STATUS_ORDER) counts[status] = 0;
    for (const company of companies) {
      const status = company.periods[periodKey]?.status ?? "draft";
      counts[status] += 1;
    }
    return STATUS_ORDER.map((status) => ({ status, label: t.status[status].label, value: counts[status] }));
  }, [companies, periodKey, t]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} label>
            {data.map((entry) => (
              <Cell key={entry.status} fill={colors[entry.status as keyof typeof colors]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
