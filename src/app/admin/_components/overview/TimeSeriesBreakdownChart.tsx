"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { ChartCard, CompactTooltip, axisProps, chartMargin, gridProps, legendProps, Y_AXIS_WIDTH } from "@/components/charts/chart-kit";
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
  /** Full value, shown in the tooltip. */
  valueFormatter: (value: number) => string;
  /** Short value for axis ticks; defaults to valueFormatter. */
  axisFormatter?: (value: number) => string;
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
  axisFormatter = valueFormatter,
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

  return (
    <ChartCard
      title={title}
      isEmpty={data.length === 0}
      emptyMessage={emptyMessage}
      actions={
        <SegmentedToggle
          size="xs"
          value={breakdown}
          onChange={setBreakdown}
          ariaLabel={title}
          options={[
            { value: "total", label: totalLabel },
            { value: "vehicle", label: byVehicleLabel },
            { value: "department", label: byDepartmentLabel },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="year" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={axisFormatter} width={Y_AXIS_WIDTH} />
          <Tooltip content={(p) => <CompactTooltip active={p.active} payload={p.payload} label={p.label} format={valueFormatter} />} />
          {breakdown === "total" ? (
            <Line type="monotone" dataKey="total" name={totalLabel} stroke={getSeriesColor(0)} strokeWidth={1.5} dot={false} />
          ) : null}
          {breakdown === "vehicle" ? (
            <>
              <Legend {...legendProps} />
              {vehicles.map((v, i) => (
                <Line
                  key={v.id}
                  type="monotone"
                  dataKey={v.id}
                  name={lang === "ar" ? v.nameAr : v.nameEn}
                  stroke={getSeriesColor(i)}
                  strokeWidth={1.5}
                  dot={false}
                />
              ))}
            </>
          ) : null}
          {breakdown === "department" ? (
            <>
              <Legend {...legendProps} />
              {DEPARTMENTS.map((d, i) => (
                <Line key={d} type="monotone" dataKey={d} name={t.departments[d]} stroke={getSeriesColor(i)} strokeWidth={1.5} dot={false} />
              ))}
            </>
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
