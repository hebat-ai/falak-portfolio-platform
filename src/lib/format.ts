import type { Currency } from "./mock/types";

export type AppLocale = "en" | "ar";

/**
 * Fixed synthetic snapshot date for this prototype -- "Data as of
 * September 9, 2026". Deliberately NOT derived from the live system
 * clock, so every overdue/last-updated calculation shown in the UI stays
 * reproducible regardless of when this prototype is actually opened.
 */
export const DASHBOARD_SNAPSHOT_DATE = new Date("2026-09-09T00:00:00Z");

// The prototype currently uses Western digits in both languages for
// consistent financial comparison across English and Arabic views.
// This is a configurable presentation decision, not a rule derived
// from any reference company report.
const NUMERAL_EXTENSION = "-u-nu-latn";

function intlLocale(locale: AppLocale): string {
  return locale === "ar" ? `ar-SA${NUMERAL_EXTENSION}` : "en-US";
}

export function formatCurrency(amount: number, currency: Currency, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function daysBetween(later: Date, earlier: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((later.getTime() - earlier.getTime()) / msPerDay);
}
