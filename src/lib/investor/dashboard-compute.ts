import { convertToDisplay, type DisplayCurrency } from "@/lib/currency/convert";
import type { InvestorVehicleExposureDTO } from "./dto";

// Client-safe (no db import) -- recomputed instantly on org/currency change.

export interface SectorSlice {
  key: string;
  labelEn: string;
  labelAr: string;
  count: number;
}

/** Distinct startups across the org's vehicles, counted per sector. */
export function computeSectorDistribution(exposures: InvestorVehicleExposureDTO[]): SectorSlice[] {
  const seen = new Set<string>();
  const bySector = new Map<string, SectorSlice>();
  for (const vehicle of exposures) {
    for (const company of vehicle.linkedCompanies) {
      if (seen.has(company.id)) continue;
      seen.add(company.id);
      const slice = bySector.get(company.sectorEn) ?? {
        key: company.sectorEn,
        labelEn: company.sectorEn,
        labelAr: company.sectorAr,
        count: 0,
      };
      slice.count += 1;
      bySector.set(company.sectorEn, slice);
    }
  }
  return [...bySector.values()].sort((a, b) => b.count - a.count);
}

export function computeInvestedCapital(exposures: InvestorVehicleExposureDTO[], display: DisplayCurrency): number {
  return exposures
    .flatMap((v) => v.contributions)
    .reduce((sum, c) => sum + convertToDisplay(c.amount, c.currency, display), 0);
}

export interface InvestorNavSeriesPoint {
  asOfDate: string;
  value: number;
}

/**
 * The org's attributable NAV over time: at each date any of its vehicles
 * was marked, the sum over vehicles of (ownership share x that vehicle's
 * latest NAV on or before that date). A vehicle not yet marked by a date
 * contributes nothing to it.
 */
export function computeInvestorNavSeries(
  exposures: InvestorVehicleExposureDTO[],
  display: DisplayCurrency
): InvestorNavSeriesPoint[] {
  const vehicles = exposures.filter((v) => v.ownershipShare !== null && v.navHistory.length > 0);
  const dates = [...new Set(vehicles.flatMap((v) => v.navHistory.map((n) => n.asOfDate)))].sort();

  return dates.map((date) => ({
    asOfDate: date,
    value: vehicles.reduce((sum, v) => {
      const latest = v.navHistory.filter((n) => n.asOfDate <= date).at(-1);
      if (!latest) return sum;
      return sum + v.ownershipShare! * convertToDisplay(latest.amount, latest.currency, display);
    }, 0),
  }));
}
