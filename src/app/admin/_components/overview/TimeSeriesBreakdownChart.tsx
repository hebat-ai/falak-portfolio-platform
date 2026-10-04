"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getSeriesColor } from "@/lib/admin/chart-palette";
import type { Department } from "@/generated/prisma/client";

export interface BreakdownPoint {
  year: number;
  total: number;
  byVehicle: Record<string, number>;
  byDepartment: Record<Department, number>;
}

interface NameableEntity {
  id: string;
  nameEn: string;
  nameAr: string;
}

type Breakdown = "total" | "vehicle" | "department";

interface TimeSeriesBreakdownChartProps {
  title: string;
  data: BreakdownPoint[];
  vehicles: NameableEntity[];
  valueFormatter: (value: number) => string;
  emptyMessage: string;
  totalLabel: string;
  byVehicleLabel: string;
  byDepartmentLabel: string;
}

const DEPARTMENTS: Department[] = ["VentureBuilder", "InvestmentDepartment"];

// Shared by charts 1 (startup count), 2 (invested capital) and 3 (NAV)
// -- all three are an annual time series that can be sliced the same
// three ways (portfolio total, per vehicle, per department), so this is
// one component parameterized by title/formatter/data rather than three
// near-identical copies.
export function TimeSeriesBreakdownChart({
  title,
  data,
  vehicles,
  valueFormatter,
  emptyMessage,
  totalLabel,
  byVehicleLabel,
  byDepartmentLabel,
}: TimeSeriesBreakdownChartProps) {
  const { t, lang } = useLanguage();
  const [breakdown, setBreakdown] = useState<Breakdown>("total");

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        year: point.year,
        total: point.total,
        ...Object.fromEntries(vehicles.map((v) => [v.id, point.byVehicle[v.id] ?? 0])),
        ...Object.fromEntries(DEPARTMENTS.map((d) => [d, point.byDepartment[d] ?? 0])),
      })),
    [data, vehicles]
  );

  if (data.length === 0) {
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
        <SegmentedToggle
          value={breakdown}
          onChange={setBreakdown}
          ariaLabel={title}
          options={[
            { value: "total", label: totalLabel },
            { value: "vehicle", label: byVehicleLabel },
            { value: "department", label: byDepartmentLabel },
          ]}
        />
      </div>
      <div className="mt-3 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={valueFormatter} width={80} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--foreground)" }}
              formatter={(value) => valueFormatter(Number(value))}
            />
            {breakdown === "total" ? (
              <Line type="monotone" dataKey="total" name={totalLabel} stroke={getSeriesColor(0)} strokeWidth={2} dot={false} />
            ) : null}
            {breakdown === "vehicle" ? (
              <>
                <Legend />
                {vehicles.map((v, i) => (
                  <Line
                    key={v.id}
                    type="monotone"
                    dataKey={v.id}
                    name={lang === "ar" ? v.nameAr : v.nameEn}
                    stroke={getSeriesColor(i)}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </>
            ) : null}
            {breakdown === "department" ? (
              <>
                <Legend />
                {DEPARTMENTS.map((d, i) => (
                  <Line key={d} type="monotone" dataKey={d} name={t.departments[d]} stroke={getSeriesColor(i)} strokeWidth={2} dot={false} />
                ))}
              </>
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
