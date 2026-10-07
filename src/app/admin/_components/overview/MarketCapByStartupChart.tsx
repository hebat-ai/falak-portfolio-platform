"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select } from "@/components/ui/Select";
import { ChartCard, CompactTooltip, axisProps, chartMargin, gridProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getSeriesColor } from "@/lib/admin/chart-palette";
import type { MarketCapSeries } from "@/lib/admin/portfolio-overview-compute";
import type { Department } from "@/generated/prisma/client";

interface NameableEntity {
  id: string;
  nameEn: string;
  nameAr: string;
}

interface MarketCapByStartupChartProps {
  title: string;
  series: MarketCapSeries;
  vehicles: NameableEntity[];
  valueFormatter: (value: number) => string;
  axisFormatter?: (value: number) => string;
  allOption: string;
  byVehicleLabel: string;
  byDepartmentLabel: string;
  emptyMessage: string;
}

const DEPARTMENTS: Department[] = ["VentureBuilder", "InvestmentDepartment"];

// Chart 5 -- color-coded stacked bar, one segment per startup, one bar
// per year. A dropdown narrows the stack to a single vehicle or
// department's startups; "All" (the default) stacks every startup in the
// portfolio. The tooltip lists the largest startups only, so it stays
// readable with a large portfolio.
export function MarketCapByStartupChart({
  title,
  series,
  vehicles,
  valueFormatter,
  axisFormatter = valueFormatter,
  allOption,
  byVehicleLabel,
  byDepartmentLabel,
  emptyMessage,
}: MarketCapByStartupChartProps) {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState("all");

  const filteredCompanies = useMemo(() => {
    if (filter === "all") return series.companies;
    if (filter.startsWith("vehicle:")) {
      const vehicleId = filter.slice("vehicle:".length);
      return series.companies.filter((c) => c.vehicleIds.includes(vehicleId));
    }
    const dept = filter.slice("department:".length) as Department;
    return series.companies.filter((c) => c.department === dept);
  }, [filter, series.companies]);

  const chartData = useMemo(
    () =>
      series.years.map((year) => ({
        year,
        ...Object.fromEntries(filteredCompanies.map((c) => [c.id, series.seriesByCompany[c.id]?.[year] ?? 0])),
      })),
    [series, filteredCompanies]
  );

  return (
    <ChartCard
      title={title}
      isEmpty={series.years.length === 0}
      emptyMessage={emptyMessage}
      actions={
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={title} className="h-7 w-auto py-0 text-[11px]">
          <option value="all">{allOption}</option>
          <optgroup label={byVehicleLabel}>
            {vehicles.map((v) => (
              <option key={v.id} value={`vehicle:${v.id}`}>
                {lang === "ar" ? v.nameAr : v.nameEn}
              </option>
            ))}
          </optgroup>
          <optgroup label={byDepartmentLabel}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={`department:${d}`}>
                {t.departments[d]}
              </option>
            ))}
          </optgroup>
        </Select>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="year" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={axisFormatter} width={Y_AXIS_WIDTH} />
          <Tooltip
            cursor={{ fill: "var(--surface-muted)" }}
            content={(p) => <CompactTooltip active={p.active} payload={p.payload} label={p.label} format={valueFormatter} />}
          />
          {filteredCompanies.map((c, i) => (
            <Bar key={c.id} dataKey={c.id} name={lang === "ar" ? c.nameAr : c.nameEn} stackId="marketcap" fill={getSeriesColor(i)} maxBarSize={36} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
