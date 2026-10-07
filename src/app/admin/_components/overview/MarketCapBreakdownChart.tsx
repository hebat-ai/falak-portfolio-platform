"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { ChartCard, axisProps, chartMargin, gridProps, tooltipProps } from "@/components/charts/chart-kit";
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
  axisFormatter?: (value: number) => string;
  byVehicleLabel: string;
  byDepartmentLabel: string;
  emptyMessage: string;
}

const DEPARTMENTS: Department[] = ["VentureBuilder", "InvestmentDepartment"];

// Chart 4 -- a single point-in-time snapshot (unlike charts 1-3, which
// are annual time series), so a bar chart fits better than a line: one
// bar per vehicle or per department, toggled, with the portfolio total
// called out above the chart. Horizontal bars so long vehicle names
// stay readable however many vehicles there are.
export function MarketCapBreakdownChart({
  title,
  data,
  vehicles,
  valueFormatter,
  axisFormatter = valueFormatter,
  byVehicleLabel,
  byDepartmentLabel,
  emptyMessage,
}: MarketCapBreakdownChartProps) {
  const { t, lang } = useLanguage();
  const [grouping, setGrouping] = useState<Grouping>("vehicle");

  const chartData = useMemo(() => {
    const rows =
      grouping === "vehicle"
        ? vehicles.map((v) => ({ key: v.id, name: lang === "ar" ? v.nameAr : v.nameEn, value: data.byVehicle[v.id] ?? 0 }))
        : DEPARTMENTS.map((d) => ({ key: d, name: t.departments[d], value: data.byDepartment[d] ?? 0 }));
    return rows.sort((a, b) => b.value - a.value);
  }, [grouping, vehicles, data, lang, t]);

  return (
    <ChartCard
      title={title}
      headline={data.total === 0 ? undefined : valueFormatter(data.total)}
      isEmpty={data.total === 0}
      emptyMessage={emptyMessage}
      actions={
        <SegmentedToggle
          size="xs"
          value={grouping}
          onChange={setGrouping}
          ariaLabel={title}
          options={[
            { value: "vehicle", label: byVehicleLabel },
            { value: "department", label: byDepartmentLabel },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={chartMargin}>
          <CartesianGrid {...gridProps} vertical horizontal={false} />
          <XAxis type="number" {...axisProps} tickFormatter={axisFormatter} />
          <YAxis type="category" dataKey="name" {...axisProps} width={96} interval={0} />
          <Tooltip {...tooltipProps} cursor={{ fill: "var(--surface-muted)" }} formatter={(value) => valueFormatter(Number(value))} />
          <Bar dataKey="value" maxBarSize={18}>
            {chartData.map((entry, i) => (
              <Cell key={entry.key} fill={getSeriesColor(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
