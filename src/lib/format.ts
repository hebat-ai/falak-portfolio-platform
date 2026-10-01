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

export function formatPercent(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "percent",
    maximumFractionDigits: 0,
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
