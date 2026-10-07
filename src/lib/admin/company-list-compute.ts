import type { CompanyListRow } from "./company-list";

// Pure, deliberately dependency-free -- same split as
// portfolio-overview-compute.ts, so the Company List dashboard's three
// distribution charts and investment-year series can be recomputed
// instantly client-side whenever a filter changes, with no re-fetch.

export interface DistributionSlice {
  key: string;
  count: number;
}

/** Matching key for a free-text sector: case, spacing and punctuation ignored. */
export function normalizeSector(sector: string): string {
  return sector.trim().toLowerCase().replace(/[\s\-_]+/g, "");
}

/**
 * One slice per distinct sector. Spellings that differ only in case or
 * spacing count as one sector, labelled with the first spelling seen.
 */
export function getSectorDistribution(rows: CompanyListRow[]): DistributionSlice[] {
  const slices = new Map<string, DistributionSlice>();
  for (const row of rows) {
    const id = normalizeSector(row.sectorEn);
    const slice = slices.get(id) ?? { key: row.sectorEn.trim(), count: 0 };
    slice.count += 1;
    slices.set(id, slice);
  }
  return [...slices.values()].sort((a, b) => b.count - a.count);
}

/** One slice per distinct current stage. A company with no vehicle contributes to no slice (never a fabricated "none" bucket for the other two distributions, but stage/sector are always set, so this only matters for vehicle distribution below). */
export function getStageDistribution(rows: CompanyListRow[]): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.currentStage, (counts.get(row.currentStage) ?? 0) + 1);
  }
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

/**
 * One slice per vehicle -- a company held through more than one vehicle
 * counts once under each (same "no attribution weighting" choice as the
 * portfolio overview dashboard's per-vehicle market cap chart). A
 * company with no vehicle link at all (a direct holding) contributes to
 * no slice, so the slices can undercount total companies; that's
 * correct, not a bug -- this chart is about vehicle mix, not headcount.
 */
export function getVehicleDistribution(rows: CompanyListRow[]): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const vehicle of row.vehicles) {
      counts.set(vehicle.id, (counts.get(vehicle.id) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

export interface InvestmentYearPoint {
  year: number;
  count: number;
}

/**
 * Startups newly invested in per year (NOT cumulative headcount -- that
 * series already exists on the portfolio overview dashboard). A
 * company with no recorded agreement yet is excluded, same "can't place
 * it on a timeline" rule as everywhere else this first-investment-year
 * figure is derived.
 */
export function getInvestmentYearSeries(rows: CompanyListRow[]): InvestmentYearPoint[] {
  const withYear = rows.filter((r): r is CompanyListRow & { investmentYear: number } => r.investmentYear !== null);
  if (withYear.length === 0) return [];

  const counts = new Map<number, number>();
  for (const row of withYear) {
    counts.set(row.investmentYear, (counts.get(row.investmentYear) ?? 0) + 1);
  }

  const minYear = Math.min(...withYear.map((r) => r.investmentYear));
  const maxYear = Math.max(...withYear.map((r) => r.investmentYear));
  const years: InvestmentYearPoint[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    years.push({ year: y, count: counts.get(y) ?? 0 });
  }
  return years;
}
