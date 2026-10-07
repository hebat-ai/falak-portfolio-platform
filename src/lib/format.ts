import type { Currency } from "@/generated/prisma/client";

export type AppLocale = "en" | "ar";

// Western digits in both languages, for consistent financial comparison
// across English and Arabic views -- a configurable presentation decision,
// not a rule derived from any reference company report.
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

/** Short form for chart axes and tight spaces, e.g. "$1.2M", "SAR 950K". */
export function formatCompactCurrency(amount: number, currency: Currency, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Short form for chart axes, e.g. "1.2K". */
export function formatCompactNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale(locale), { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number, locale: AppLocale, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}

export function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 1,
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
