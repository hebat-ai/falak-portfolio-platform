"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
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
  allOption: string;
  byVehicleLabel: string;
  byDepartmentLabel: string;
  emptyMessage: string;
}

const DEPARTMENTS: Department[] = ["VentureBuilder", "InvestmentDepartment"];

// Chart 5 -- color-coded stacked bar, one segment per startup, one bar
// per year, exactly as asked. A dropdown narrows the stack to a single
// vehicle or department's startups; "All" (the default) stacks every
// startup in the portfolio.
export function MarketCapByStartupChart({
  title,
  series,
  vehicles,
  valueFormatter,
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

  if (series.years.length === 0) {
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
        <h2 className="font-heading text-sm font-semibold text-foreground">{title}</h2>
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-auto">
            <option value="all">{allOption}</option>
            <optgroup label={byVehicleLabel}>
              {vehicles.map((v) => (
                <option key={v.id} value={`vehicle:${v.id}`}>{lang === "ar" ? v.nameAr : v.nameEn}</option>
              ))}
            </optgroup>
            <optgroup label={byDepartmentLabel}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={`department:${d}`}>{t.departments[d]}</option>
              ))}
            </optgroup>
          </Select>
        </div>
      </div>
      <div className="mt-3 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={valueFormatter} width={80} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
              formatter={(value, name) => [valueFormatter(Number(value)), name]}
            />
            {filteredCompanies.map((c, i) => (
              <Bar key={c.id} dataKey={c.id} name={lang === "ar" ? c.nameAr : c.nameEn} stackId="marketcap" fill={getSeriesColor(i)} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
