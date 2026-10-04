import type { Department } from "@/generated/prisma/client";
import { convertToDisplay, type DisplayCurrency } from "@/lib/currency/convert";
import { computeMoic } from "@/lib/finance/irr";
import type { PortfolioOverviewRaw } from "./portfolio-overview";

// Deliberately NOT server-only -- a pure function over the already-
// fetched PortfolioOverviewRaw DTO (same split as valuation-totals.ts
// vs valuations.ts), so the client can re-aggregate instantly whenever
// the USD/SAR display toggle flips, with no server round-trip.

const DEPARTMENTS: Department[] = ["VentureBuilder", "InvestmentDepartment"];

function yearOf(dateStr: string): number {
  return Number(dateStr.slice(0, 4));
}

function emptyByDepartment(): Record<Department, number> {
  return { VentureBuilder: 0, InvestmentDepartment: 0 };
}

function yearRange(minYear: number, maxYear: number): number[] {
  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear) || minYear > maxYear) return [];
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  return years;
}

interface Attribution {
  companyDept: Map<string, Department>;
  // position -> company/vehicle it belongs to
  positionCompany: Map<string, string>;
  positionVehicle: Map<string, string>;
}

function buildAttribution(raw: PortfolioOverviewRaw): Attribution {
  const companyDept = new Map(raw.companies.map((c) => [c.id, c.department]));
  const positionCompany = new Map(raw.ownershipPositions.map((p) => [p.id, p.companyId]));
  const positionVehicle = new Map<string, string>();
  for (const p of raw.ownershipPositions) {
    if (p.vehicleId) positionVehicle.set(p.id, p.vehicleId);
  }
  return { companyDept, positionCompany, positionVehicle };
}

// ============================================================
// Chart 1 -- No. of portfolio startups, time series annually
// ============================================================

export interface StartupCountPoint {
  year: number;
  total: number;
  byVehicle: Record<string, number>;
  byDepartment: Record<Department, number>;
}

export function getStartupCountSeries(raw: PortfolioOverviewRaw): StartupCountPoint[] {
  const { companyDept, positionCompany, positionVehicle } = buildAttribution(raw);

  // Earliest signedDate year per company (any position), and per
  // (company, vehicle) pair -- a company with no recorded agreement
  // anywhere can't be placed on this timeline and is excluded, same
  // "don't coerce missing data into a guess" discipline as everywhere
  // else in this codebase.
  const companyEntryYear = new Map<string, number>();
  const vehicleEntryYear = new Map<string, number>(); // key: `${vehicleId}:${companyId}`

  for (const a of raw.agreements) {
    const companyId = positionCompany.get(a.ownershipPositionId);
    if (!companyId) continue;
    const year = yearOf(a.signedDate);
    const prevCompany = companyEntryYear.get(companyId);
    if (prevCompany === undefined || year < prevCompany) companyEntryYear.set(companyId, year);

    const vehicleId = positionVehicle.get(a.ownershipPositionId);
    if (vehicleId) {
      const key = `${vehicleId}:${companyId}`;
      const prev = vehicleEntryYear.get(key);
      if (prev === undefined || year < prev) vehicleEntryYear.set(key, year);
    }
  }

  if (companyEntryYear.size === 0) return [];

  const minYear = Math.min(...companyEntryYear.values());
  const years = yearRange(minYear, raw.asOfYear);

  return years.map((year) => {
    const byDepartment = emptyByDepartment();
    let total = 0;
    for (const [companyId, entryYear] of companyEntryYear) {
      if (entryYear > year) continue;
      total += 1;
      const dept = companyDept.get(companyId);
      if (dept) byDepartment[dept] += 1;
    }

    const byVehicle: Record<string, number> = {};
    for (const [key, entryYear] of vehicleEntryYear) {
      if (entryYear > year) continue;
      const [vehicleId] = key.split(":");
      byVehicle[vehicleId] = (byVehicle[vehicleId] ?? 0) + 1;
    }

    return { year, total, byVehicle, byDepartment };
  });
}

// ============================================================
// Chart 2 -- Total Invested Capital, time series annually (cumulative)
// ============================================================

export interface InvestedCapitalPoint {
  year: number;
  total: number;
  byVehicle: Record<string, number>;
  byDepartment: Record<Department, number>;
}

/**
 * Also used internally by getNavSeries to derive each vehicle's
 * department split for NAV allocation (NAV has no per-company
 * breakdown of its own -- see that function's own comment).
 */
export function getInvestedCapitalSeries(raw: PortfolioOverviewRaw, display: DisplayCurrency): InvestedCapitalPoint[] {
  const { companyDept, positionCompany, positionVehicle } = buildAttribution(raw);
  if (raw.agreements.length === 0) return [];

  const minYear = Math.min(...raw.agreements.map((a) => yearOf(a.signedDate)));
  const years = yearRange(minYear, raw.asOfYear);

  return years.map((year) => {
    const byDepartment = emptyByDepartment();
    const byVehicle: Record<string, number> = {};
    let total = 0;

    for (const a of raw.agreements) {
      if (yearOf(a.signedDate) > year) continue;
      const amount = convertToDisplay(a.investedAmount, a.currency, display);
      total += amount;

      const companyId = positionCompany.get(a.ownershipPositionId);
      const dept = companyId ? companyDept.get(companyId) : undefined;
      if (dept) byDepartment[dept] += amount;

      const vehicleId = positionVehicle.get(a.ownershipPositionId);
      if (vehicleId) byVehicle[vehicleId] = (byVehicle[vehicleId] ?? 0) + amount;
    }

    return { year, total, byVehicle, byDepartment };
  });
}

// ============================================================
// Chart 3 -- NAV, time series annually
// ============================================================

export interface NavPoint {
  year: number;
  total: number;
  byVehicle: Record<string, number>;
  byDepartment: Record<Department, number>;
}

/**
 * NAV is only ever recorded at the VEHICLE level (VehicleNavSnapshot
 * has no per-company breakdown), so a department-level NAV figure is
 * necessarily an allocation, not a direct sum. This allocates each
 * vehicle's NAV at year Y across departments in proportion to that
 * vehicle's own invested-capital split across departments at year Y
 * (from getInvestedCapitalSeries) -- a documented approximation, not a
 * ledger fact. A vehicle with zero invested capital recorded for a year
 * contributes nothing to any department that year (never divides by
 * zero, never guesses a split).
 */
export function getNavSeries(raw: PortfolioOverviewRaw, display: DisplayCurrency): NavPoint[] {
  if (raw.vehicleNavs.length === 0) return [];

  const minYear = Math.min(...raw.vehicleNavs.map((n) => yearOf(n.asOfDate)));
  const years = yearRange(minYear, raw.asOfYear);
  const investedSeries = getInvestedCapitalSeries(raw, display);
  const investedByYear = new Map(investedSeries.map((p) => [p.year, p]));

  // Latest NAV snapshot per vehicle at or before a given year.
  function latestNavAt(vehicleId: string, year: number): number | null {
    let best: { asOfDate: string; amount: number; currency: typeof raw.vehicleNavs[number]["currency"] } | null = null;
    for (const n of raw.vehicleNavs) {
      if (n.vehicleId !== vehicleId || yearOf(n.asOfDate) > year) continue;
      if (!best || n.asOfDate > best.asOfDate) best = n;
    }
    return best ? convertToDisplay(best.amount, best.currency, display) : null;
  }

  return years.map((year) => {
    const byDepartment = emptyByDepartment();
    const byVehicle: Record<string, number> = {};
    let total = 0;
    const investedPoint = investedByYear.get(year);

    for (const vehicle of raw.vehicles) {
      const nav = latestNavAt(vehicle.id, year);
      if (nav === null) continue;
      total += nav;
      byVehicle[vehicle.id] = nav;

      const vehicleInvestedTotal = investedPoint?.byVehicle[vehicle.id] ?? 0;
      if (vehicleInvestedTotal <= 0) continue;
      for (const dept of DEPARTMENTS) {
        const deptInvested = investedPoint ? investedCapitalForVehicleDept(raw, display, vehicle.id, dept, year) : 0;
        byDepartment[dept] += nav * (deptInvested / vehicleInvestedTotal);
      }
    }

    return { year, total, byVehicle, byDepartment };
  });
}

function investedCapitalForVehicleDept(
  raw: PortfolioOverviewRaw,
  display: DisplayCurrency,
  vehicleId: string,
  dept: Department,
  year: number
): number {
  const { companyDept, positionCompany, positionVehicle } = buildAttribution(raw);
  let sum = 0;
  for (const a of raw.agreements) {
    if (yearOf(a.signedDate) > year) continue;
    if (positionVehicle.get(a.ownershipPositionId) !== vehicleId) continue;
    const companyId = positionCompany.get(a.ownershipPositionId);
    if (!companyId || companyDept.get(companyId) !== dept) continue;
    sum += convertToDisplay(a.investedAmount, a.currency, display);
  }
  return sum;
}

// ============================================================
// Chart 4 -- Market Cap, current, per vehicle and per department
// ============================================================

export interface MarketCapBreakdown {
  total: number;
  byVehicle: Record<string, number>;
  byDepartment: Record<Department, number>;
}

function latestValuationByCompany(raw: PortfolioOverviewRaw, display: DisplayCurrency, asOfYear?: number): Map<string, number> {
  const byCompany = new Map<string, { asOfDate: string; value: number }>();
  for (const v of raw.companyValuations) {
    if (asOfYear !== undefined && yearOf(v.asOfDate) > asOfYear) continue;
    const prev = byCompany.get(v.companyId);
    if (!prev || v.asOfDate > prev.asOfDate) {
      byCompany.set(v.companyId, { asOfDate: v.asOfDate, value: convertToDisplay(v.amount, v.currency, display) });
    }
  }
  return new Map([...byCompany.entries()].map(([id, v]) => [id, v.value]));
}

export function getMarketCapCurrent(raw: PortfolioOverviewRaw, display: DisplayCurrency): MarketCapBreakdown {
  const { companyDept } = buildAttribution(raw);
  const valuationByCompany = latestValuationByCompany(raw, display);

  const byDepartment = emptyByDepartment();
  let total = 0;
  for (const [companyId, value] of valuationByCompany) {
    total += value;
    const dept = companyDept.get(companyId);
    if (dept) byDepartment[dept] += value;
  }

  const byVehicle: Record<string, number> = {};
  for (const p of raw.ownershipPositions) {
    if (!p.vehicleId) continue;
    const value = valuationByCompany.get(p.companyId);
    if (value === undefined) continue;
    byVehicle[p.vehicleId] = (byVehicle[p.vehicleId] ?? 0) + value;
  }

  return { total, byVehicle, byDepartment };
}

// ============================================================
// Chart 5 -- Market Cap per year, per startup (stacked), time series
// ============================================================

export interface MarketCapCompanyMeta {
  id: string;
  nameEn: string;
  nameAr: string;
  department: Department;
  vehicleIds: string[];
}

export interface MarketCapSeries {
  years: number[];
  companies: MarketCapCompanyMeta[];
  // seriesByCompany[companyId][year] = market cap value (display currency), omitted key = no mark that year
  seriesByCompany: Record<string, Record<number, number>>;
}

export function getMarketCapSeriesByCompany(raw: PortfolioOverviewRaw, display: DisplayCurrency): MarketCapSeries {
  if (raw.companyValuations.length === 0) {
    return { years: [], companies: [], seriesByCompany: {} };
  }

  const minYear = Math.min(...raw.companyValuations.map((v) => yearOf(v.asOfDate)));
  const years = yearRange(minYear, raw.asOfYear);

  const vehiclesByCompany = new Map<string, string[]>();
  for (const p of raw.ownershipPositions) {
    if (!p.vehicleId) continue;
    const list = vehiclesByCompany.get(p.companyId) ?? [];
    list.push(p.vehicleId);
    vehiclesByCompany.set(p.companyId, list);
  }

  const companies: MarketCapCompanyMeta[] = raw.companies
    .filter((c) => raw.companyValuations.some((v) => v.companyId === c.id))
    .map((c) => ({ id: c.id, nameEn: c.nameEn, nameAr: c.nameAr, department: c.department, vehicleIds: vehiclesByCompany.get(c.id) ?? [] }));

  const seriesByCompany: Record<string, Record<number, number>> = {};
  for (const company of companies) {
    const perYear: Record<number, number> = {};
    for (const year of years) {
      const valuationByCompany = latestValuationByCompany(raw, display, year);
      const value = valuationByCompany.get(company.id);
      if (value !== undefined) perYear[year] = value;
    }
    seriesByCompany[company.id] = perYear;
  }

  return { years, companies, seriesByCompany };
}

// ============================================================
// Chart 6 -- Fund vintage year vs. startup investment year
// ============================================================

export interface VintageVsInvestmentPoint {
  year: number;
  fundsFormed: number;
  startupsInvested: number;
}

export function getVintageVsInvestmentYearSeries(raw: PortfolioOverviewRaw): VintageVsInvestmentPoint[] {
  const { positionCompany } = buildAttribution(raw);

  const companyFirstYear = new Map<string, number>();
  for (const a of raw.agreements) {
    const companyId = positionCompany.get(a.ownershipPositionId);
    if (!companyId) continue;
    const year = yearOf(a.signedDate);
    const prev = companyFirstYear.get(companyId);
    if (prev === undefined || year < prev) companyFirstYear.set(companyId, year);
  }

  const vintageYears = raw.vehicles.map((v) => v.vintageYear).filter((y): y is number => y !== null);
  const investmentYears = [...companyFirstYear.values()];
  const allYears = [...vintageYears, ...investmentYears];
  if (allYears.length === 0) return [];

  const years = yearRange(Math.min(...allYears), Math.max(Math.max(...allYears), raw.asOfYear));

  return years.map((year) => ({
    year,
    fundsFormed: vintageYears.filter((y) => y === year).length,
    startupsInvested: investmentYears.filter((y) => y === year).length,
  }));
}

// ============================================================
// Chart 7 -- Startup reporting: submitted vs not, audited vs not
// ============================================================

export interface ReportingPeriodPoint {
  periodLabel: string;
  periodStart: string;
  total: number;
  submittedCount: number;
  notSubmittedCount: number;
  auditedCount: number;
  notAuditedCount: number;
}

export function getReportingSeries(raw: PortfolioOverviewRaw): ReportingPeriodPoint[] {
  const byPeriod = new Map<string, { periodStart: string; submitted: number; audited: number; total: number }>();

  for (const p of raw.reportingPeriods) {
    const entry = byPeriod.get(p.periodLabel) ?? { periodStart: p.periodStart, submitted: 0, audited: 0, total: 0 };
    entry.total += 1;
    if (p.submitted) entry.submitted += 1;
    if (p.audited) entry.audited += 1;
    if (p.periodStart < entry.periodStart) entry.periodStart = p.periodStart;
    byPeriod.set(p.periodLabel, entry);
  }

  return [...byPeriod.entries()]
    .map(([periodLabel, e]) => ({
      periodLabel,
      periodStart: e.periodStart,
      total: e.total,
      submittedCount: e.submitted,
      notSubmittedCount: e.total - e.submitted,
      auditedCount: e.audited,
      notAuditedCount: e.total - e.audited,
    }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
}

// ============================================================
// Fund List table
// ============================================================

export interface FundListRow {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  vintageYear: number | null;
  investedCapital: number;
  nav: number;
  moic: number | null;
  numberOfInvestors: number;
}

export function getFundListRows(raw: PortfolioOverviewRaw, display: DisplayCurrency): FundListRow[] {
  const { positionVehicle } = buildAttribution(raw);

  return raw.vehicles.map((vehicle) => {
    let investedCapital = 0;
    for (const a of raw.agreements) {
      if (positionVehicle.get(a.ownershipPositionId) !== vehicle.id) continue;
      investedCapital += convertToDisplay(a.investedAmount, a.currency, display);
    }

    let distributed = 0;
    for (const d of raw.distributions) {
      if (positionVehicle.get(d.ownershipPositionId) !== vehicle.id) continue;
      distributed += convertToDisplay(d.amount, d.currency, display);
    }

    const navSnapshotsForVehicle = raw.vehicleNavs.filter((n) => n.vehicleId === vehicle.id);
    const latestNav = navSnapshotsForVehicle.reduce<{ asOfDate: string; amount: number; currency: typeof navSnapshotsForVehicle[number]["currency"] } | null>(
      (best, n) => (!best || n.asOfDate > best.asOfDate ? n : best),
      null
    );
    const nav = latestNav ? convertToDisplay(latestNav.amount, latestNav.currency, display) : 0;

    const numberOfInvestors = new Set(
      raw.investorVehiclePositions.filter((p) => p.vehicleId === vehicle.id).map((p) => p.investorId)
    ).size;

    return {
      id: vehicle.id,
      slug: vehicle.slug,
      nameEn: vehicle.nameEn,
      nameAr: vehicle.nameAr,
      vintageYear: vehicle.vintageYear,
      investedCapital,
      nav,
      moic: computeMoic(investedCapital, distributed, nav),
      numberOfInvestors,
    };
  });
}
