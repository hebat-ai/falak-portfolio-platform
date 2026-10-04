import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getSectorDistribution,
  getStageDistribution,
  getVehicleDistribution,
  getInvestmentYearSeries,
} from "../src/lib/admin/company-list-compute.ts";
import type { CompanyListRow } from "../src/lib/admin/company-list.ts";

function row(overrides: Partial<CompanyListRow>): CompanyListRow {
  return {
    id: "co_1",
    slug: "co-1",
    nameEn: "Co 1",
    nameAr: "Co 1 AR",
    sectorEn: "SaaS",
    sectorAr: "برمجيات",
    customerModel: "B2B",
    currentStage: "Seed",
    department: "InvestmentDepartment",
    currency: "SAR",
    vehicles: [],
    investmentYear: null,
    lastReportedPeriodLabel: null,
    lastReportedRevenue: null,
    lastReportedGrossMargin: null,
    lastReportedCashBurn: null,
    lastReportedRunwayMonths: null,
    lastUpdated: null,
    ...overrides,
  };
}

test("sector distribution counts companies per sector", () => {
  const rows = [row({ id: "1", sectorEn: "SaaS" }), row({ id: "2", sectorEn: "SaaS" }), row({ id: "3", sectorEn: "FinTech" })];
  const result = getSectorDistribution(rows);
  assert.deepEqual(result, [
    { key: "SaaS", count: 2 },
    { key: "FinTech", count: 1 },
  ]);
});

test("stage distribution counts companies per current stage", () => {
  const rows = [row({ id: "1", currentStage: "Seed" }), row({ id: "2", currentStage: "SeriesA" })];
  const result = getStageDistribution(rows);
  assert.equal(result.length, 2);
  assert.ok(result.some((s) => s.key === "Seed" && s.count === 1));
});

test("vehicle distribution counts a company once per vehicle it's held through, and skips unlinked companies", () => {
  const rows = [
    row({ id: "1", vehicles: [{ id: "veh_1", slug: "v1", nameEn: "V1", nameAr: "V1" }] }),
    row({
      id: "2",
      vehicles: [
        { id: "veh_1", slug: "v1", nameEn: "V1", nameAr: "V1" },
        { id: "veh_2", slug: "v2", nameEn: "V2", nameAr: "V2" },
      ],
    }),
    row({ id: "3", vehicles: [] }),
  ];
  const result = getVehicleDistribution(rows);
  const veh1 = result.find((s) => s.key === "veh_1")!;
  const veh2 = result.find((s) => s.key === "veh_2")!;
  assert.equal(veh1.count, 2, "company 2 counts under veh_1 too");
  assert.equal(veh2.count, 1);
});

test("investment year series: new-investment count per year, zero-filled gaps included", () => {
  const rows = [row({ id: "1", investmentYear: 2022 }), row({ id: "2", investmentYear: 2024 }), row({ id: "3", investmentYear: null })];
  const result = getInvestmentYearSeries(rows);
  assert.deepEqual(result, [
    { year: 2022, count: 1 },
    { year: 2023, count: 0 },
    { year: 2024, count: 1 },
  ]);
});

test("investment year series is empty when no company has a recorded investment year", () => {
  assert.deepEqual(getInvestmentYearSeries([row({ investmentYear: null })]), []);
});
