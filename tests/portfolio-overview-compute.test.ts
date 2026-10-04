import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getStartupCountSeries,
  getInvestedCapitalSeries,
  getNavSeries,
  getMarketCapCurrent,
  getMarketCapSeriesByCompany,
  getVintageVsInvestmentYearSeries,
  getReportingSeries,
  getFundListRows,
} from "../src/lib/admin/portfolio-overview-compute.ts";
import type { PortfolioOverviewRaw } from "../src/lib/admin/portfolio-overview.ts";

function baseRaw(overrides: Partial<PortfolioOverviewRaw> = {}): PortfolioOverviewRaw {
  return {
    asOfYear: 2026,
    companies: [],
    vehicles: [],
    ownershipPositions: [],
    agreements: [],
    companyValuations: [],
    vehicleNavs: [],
    distributions: [],
    investorVehiclePositions: [],
    reportingPeriods: [],
    ...overrides,
  };
}

// A small, realistic fixture: one VentureBuilder company and one
// InvestmentDepartment company, each held by its own vehicle.
const RAW = baseRaw({
  asOfYear: 2026,
  companies: [
    { id: "co_vb", nameEn: "VB Co", nameAr: "VB Co AR", slug: "vb-co", department: "VentureBuilder" },
    { id: "co_inv", nameEn: "Inv Co", nameAr: "Inv Co AR", slug: "inv-co", department: "InvestmentDepartment" },
  ],
  vehicles: [
    { id: "veh_1", nameEn: "Fund I", nameAr: "Fund I AR", slug: "fund-i", vintageYear: 2022 },
    { id: "veh_2", nameEn: "Fund II", nameAr: "Fund II AR", slug: "fund-ii", vintageYear: 2023 },
  ],
  ownershipPositions: [
    { id: "pos_1", companyId: "co_vb", vehicleId: "veh_1" },
    { id: "pos_2", companyId: "co_inv", vehicleId: "veh_2" },
  ],
  agreements: [
    { id: "agr_1", ownershipPositionId: "pos_1", investedAmount: 1000, currency: "SAR", signedDate: "2022-06-01" },
    { id: "agr_2", ownershipPositionId: "pos_2", investedAmount: 500, currency: "USD", signedDate: "2023-03-01" },
  ],
  companyValuations: [
    { companyId: "co_vb", asOfDate: "2022-12-31", amount: 2000, currency: "SAR" },
    { companyId: "co_vb", asOfDate: "2024-12-31", amount: 4000, currency: "SAR" },
    { companyId: "co_inv", asOfDate: "2023-12-31", amount: 1000, currency: "USD" },
  ],
  vehicleNavs: [
    { vehicleId: "veh_1", asOfDate: "2022-12-31", amount: 1500, currency: "SAR" },
    { vehicleId: "veh_1", asOfDate: "2024-12-31", amount: 3000, currency: "SAR" },
    { vehicleId: "veh_2", asOfDate: "2023-12-31", amount: 800, currency: "USD" },
  ],
  distributions: [{ ownershipPositionId: "pos_1", amount: 200, currency: "SAR" }],
  investorVehiclePositions: [
    { vehicleId: "veh_1", investorId: "inv_a" },
    { vehicleId: "veh_1", investorId: "inv_b" },
    { vehicleId: "veh_2", investorId: "inv_a" },
  ],
  reportingPeriods: [
    { companyId: "co_vb", periodLabel: "Q1 2026", periodStart: "2026-01-01", submitted: true, audited: true },
    { companyId: "co_inv", periodLabel: "Q1 2026", periodStart: "2026-01-01", submitted: false, audited: false },
  ],
});

test("startup count series: entry year per company/vehicle, cumulative presence", () => {
  const series = getStartupCountSeries(RAW);
  const y2022 = series.find((p) => p.year === 2022)!;
  const y2023 = series.find((p) => p.year === 2023)!;
  assert.equal(y2022.total, 1, "only co_vb has entered by 2022");
  assert.equal(y2023.total, 2, "co_inv enters in 2023");
  assert.equal(y2022.byDepartment.VentureBuilder, 1);
  assert.equal(y2022.byDepartment.InvestmentDepartment, 0);
  assert.equal(y2023.byVehicle.veh_2, 1);
});

test("invested capital series is cumulative and converts currencies to the display currency", () => {
  const seriesUsd = getInvestedCapitalSeries(RAW, "USD");
  const y2022 = seriesUsd.find((p) => p.year === 2022)!;
  const y2023 = seriesUsd.find((p) => p.year === 2023)!;
  assert.ok(Math.abs(y2022.total - 1000 / 3.75) < 1e-9, "2022: only the SAR agreement, converted to USD");
  assert.ok(Math.abs(y2023.total - (1000 / 3.75 + 500)) < 1e-9, "2023: cumulative, SAR converted + USD as-is");
  assert.equal(y2022.byDepartment.InvestmentDepartment, 0);
});

test("invested capital series in SAR display currency converts the USD agreement", () => {
  const seriesSar = getInvestedCapitalSeries(RAW, "SAR");
  const y2023 = seriesSar.find((p) => p.year === 2023)!;
  assert.ok(Math.abs(y2023.total - (1000 + 500 * 3.75)) < 1e-9);
});

test("NAV series allocates vehicle NAV to departments by that vehicle's invested-capital split", () => {
  const series = getNavSeries(RAW, "SAR");
  const y2022 = series.find((p) => p.year === 2022)!;
  // veh_1 is 100% VentureBuilder (only co_vb), so its whole NAV goes to VentureBuilder.
  assert.equal(y2022.byVehicle.veh_1, 1500);
  assert.equal(y2022.byDepartment.VentureBuilder, 1500);
  assert.equal(y2022.byDepartment.InvestmentDepartment, 0);
});

test("market cap current: sums each company's latest valuation, grouped by vehicle and department", () => {
  const result = getMarketCapCurrent(RAW, "SAR");
  // co_vb latest valuation is 4000 SAR (2024), co_inv latest is 1000 USD -> 3750 SAR.
  assert.ok(Math.abs(result.total - (4000 + 3750)) < 1e-6);
  assert.ok(Math.abs(result.byVehicle.veh_1 - 4000) < 1e-9);
  assert.ok(Math.abs(result.byDepartment.VentureBuilder - 4000) < 1e-9);
});

test("market cap time series by company: a company has no entry for a year before its first valuation mark", () => {
  const result = getMarketCapSeriesByCompany(RAW, "SAR");
  assert.ok(result.years.includes(2022));
  assert.equal(result.seriesByCompany.co_vb[2022], 2000);
  assert.equal(result.seriesByCompany.co_vb[2023], 2000, "carries forward the latest-known mark");
  assert.equal(result.seriesByCompany.co_inv[2022], undefined, "co_inv has no mark until 2023");
});

test("vintage vs. investment year: counts funds formed and startups first-invested per year", () => {
  const series = getVintageVsInvestmentYearSeries(RAW);
  const y2022 = series.find((p) => p.year === 2022)!;
  const y2023 = series.find((p) => p.year === 2023)!;
  assert.equal(y2022.fundsFormed, 1); // veh_1 vintage 2022
  assert.equal(y2022.startupsInvested, 1); // co_vb first invested 2022
  assert.equal(y2023.fundsFormed, 1); // veh_2 vintage 2023
  assert.equal(y2023.startupsInvested, 1); // co_inv first invested 2023
});

test("reporting series: submitted/not-submitted and audited/not-audited counts per period", () => {
  const series = getReportingSeries(RAW);
  assert.equal(series.length, 1);
  assert.equal(series[0].periodLabel, "Q1 2026");
  assert.equal(series[0].total, 2);
  assert.equal(series[0].submittedCount, 1);
  assert.equal(series[0].notSubmittedCount, 1);
  assert.equal(series[0].auditedCount, 1);
  assert.equal(series[0].notAuditedCount, 1);
});

test("fund list rows: invested capital, NAV, MOIC, and distinct investor count per vehicle", () => {
  const rows = getFundListRows(RAW, "SAR");
  const fund1 = rows.find((r) => r.id === "veh_1")!;
  assert.equal(fund1.investedCapital, 1000);
  assert.equal(fund1.nav, 3000, "latest NAV mark (2024), not the earlier 2022 one");
  assert.equal(fund1.moic, (200 + 3000) / 1000);
  assert.equal(fund1.numberOfInvestors, 2);
  assert.equal(fund1.vintageYear, 2022);
});

test("fund list rows: a vehicle with zero invested capital has a null MOIC, not Infinity/0", () => {
  const raw = baseRaw({
    vehicles: [{ id: "veh_empty", nameEn: "Empty", nameAr: "Empty AR", slug: "empty", vintageYear: null }],
  });
  const rows = getFundListRows(raw, "USD");
  assert.equal(rows[0].moic, null);
  assert.equal(rows[0].numberOfInvestors, 0);
});
