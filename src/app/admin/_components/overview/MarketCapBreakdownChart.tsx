"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getSeriesColor } from "@/lib/admin/chart-palette";
import type { MarketCapBreakdown } from "@/lib/admin/portfolio-overview-compute";
import type { Department } from "@/generated/prisma/client";

interface NameableEntity {
  id: string;
  nameEn: string;
  nameAr: string;
}

type Grouping = "vehicle" | "department";

interface MarketCapBreakdownChartProps {
  title: string;
  data: MarketCapBreakdown;
  vehicles: NameableEntity[];
  valueFormatter: (value: number) => string;
  byVehicleLabel: string;
  byDepartmentLabel: string;
  emptyMessage: string;
}

const DEPARTMENTS: Department[] = ["VentureBuilder", "InvestmentDepartment"];

// Chart 4 -- a single point-in-time snapshot (unlike charts 1-3, which
// are annual time series), so a grouped bar chart fits better than a
// line: one bar per vehicle or per department, toggled, with the
// portfolio total called out separately above the chart.
export function MarketCapBreakdownChart({
  title,
  data,
  vehicles,
  valueFormatter,
  byVehicleLabel,
  byDepartmentLabel,
  emptyMessage,
}: MarketCapBreakdownChartProps) {
  const { t, lang } = useLanguage();
  const [grouping, setGrouping] = useState<Grouping>("vehicle");

  const chartData = useMemo(() => {
    if (grouping === "vehicle") {
      return vehicles.map((v) => ({ key: v.id, name: lang === "ar" ? v.nameAr : v.nameEn, value: data.byVehicle[v.id] ?? 0 }));
    }
    return DEPARTMENTS.map((d) => ({ key: d, name: t.departments[d], value: data.byDepartment[d] ?? 0 }));
  }, [grouping, vehicles, data, lang, t]);

  if (data.total === 0) {
    return (
      <Card className="min-w-0">
        <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-lg font-semibold text-foreground">{valueFormatter(data.total)}</p>
        </div>
        <SegmentedToggle
          value={grouping}
          onChange={setGrouping}
          ariaLabel={title}
          options={[
            { value: "vehicle", label: byVehicleLabel },
            { value: "department", label: byDepartmentLabel },
          ]}
        />
      </div>
      <div className="mt-3 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={valueFormatter} width={80} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
              formatter={(value) => valueFormatter(Number(value))}
            />
            <Bar dataKey="value">
              {chartData.map((entry, i) => (
                <Cell key={entry.key} fill={getSeriesColor(i)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
