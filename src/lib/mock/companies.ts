import type { Company, ReportingCycleInfo, ReportingPeriod } from "./types";

export const REPORTING_CYCLES: Record<ReportingPeriod, ReportingCycleInfo> = {
  Q1_2026: {
    periodStart: "2026-01-01",
    periodEnd: "2026-03-31",
    deadline: "2026-04-30",
    labelEn: "Q1 2026",
    labelAr: "الربع الأول 2026",
  },
  Q2_2026: {
    periodStart: "2026-04-01",
    periodEnd: "2026-06-30",
    deadline: "2026-07-30",
    labelEn: "Q2 2026",
    labelAr: "الربع الثاني 2026",
  },
};

/**
 * Chronological order of reporting periods, oldest first -- the single
 * source of truth for "previous period" lookups (revenue growth) and
 * "newest first" display ordering (reporting history), so a future
 * period is never hand-ordered in more than one place.
 */
export const REPORTING_PERIODS_ORDER = ["Q1_2026", "Q2_2026"] as const satisfies readonly ReportingPeriod[];

/**
 * Reporting status (draft / overdue / etc.) reflects submission compliance
 * only -- it is never used in this app as a signal of company performance.
 * Zahra Health's overdue Q2 submission, for example, says nothing about
 * how the business itself is doing; see PROTOTYPE_NOTES.md.
 */
export const companies: Company[] = [
  {
    id: "c1",
    slug: "waslah-logistics",
    nameEn: "Waslah Logistics",
    nameAr: "وصلة للخدمات اللوجستية",
    sectorEn: "Logistics & Warehouse Management",
    sectorAr: "الخدمات اللوجستية وإدارة المستودعات",
    customerModel: "B2B",
    revenueModels: ["SaaS"],
    currency: "SAR",
    entryStage: "Seed",
    currentStage: "SeriesA",
    periods: {
      Q1_2026: { status: "published", revenue: 850000, lastUpdated: "2026-05-10" },
      Q2_2026: { status: "published", revenue: 1020000, lastUpdated: "2026-08-05" },
    },
  },
  {
    id: "c2",
    slug: "nawras-fintech",
    nameEn: "Nawras Fintech",
    nameAr: "نورس للتقنية المالية",
    sectorEn: "Financial Technology",
    sectorAr: "التقنية المالية",
    customerModel: "B2B",
    revenueModels: ["SaaS", "TransactionBased"],
    currency: "USD",
    entryStage: "SeriesA",
    currentStage: "SeriesB",
    periods: {
      Q1_2026: { status: "published", revenue: 175000, lastUpdated: "2026-05-10" },
      Q2_2026: { status: "approved", revenue: 210000, lastUpdated: "2026-08-20" },
    },
  },
  {
    id: "c3",
    slug: "tadween-saas",
    nameEn: "Tadween SaaS",
    nameAr: "تدوين للبرمجيات كخدمة",
    sectorEn: "Productivity Software",
    sectorAr: "برمجيات الإنتاجية",
    customerModel: "B2B",
    revenueModels: ["SaaS", "Subscription"],
    currency: "USD",
    entryStage: "Seed",
    currentStage: "Seed",
    periods: {
      Q1_2026: { status: "published", revenue: 52000, lastUpdated: "2026-05-10" },
      Q2_2026: { status: "submitted", revenue: 68000, lastUpdated: "2026-07-25" },
    },
  },
  {
    id: "c4",
    slug: "marasi-marketplace",
    nameEn: "Marasi Marketplace",
    nameAr: "مراسي ماركت بليس",
    sectorEn: "B2B & B2C Marketplace",
    sectorAr: "سوق إلكتروني للأعمال والمستهلكين",
    customerModel: "B2B_B2C",
    revenueModels: ["Marketplace", "TransactionBased"],
    currency: "USD",
    entryStage: "SeriesA",
    currentStage: "SeriesA",
    periods: {
      Q1_2026: { status: "published", revenue: 290000, lastUpdated: "2026-05-10" },
      Q2_2026: { status: "changes_requested", revenue: 340000, lastUpdated: "2026-08-12" },
    },
  },
  {
    id: "c5",
    slug: "suhail-retail",
    nameEn: "Suhail Retail",
    nameAr: "سهيل للتجزئة",
    sectorEn: "E-commerce Retail",
    sectorAr: "التجارة الإلكترونية",
    customerModel: "B2C",
    revenueModels: ["ECommerce"],
    currency: "SAR",
    entryStage: "PreSeed",
    currentStage: "Seed",
    periods: {
      Q1_2026: { status: "published", revenue: 410000, lastUpdated: "2026-05-10" },
      Q2_2026: { status: "under_review", revenue: 465000, lastUpdated: "2026-08-01" },
    },
  },
  {
    id: "c6",
    slug: "zahra-health",
    nameEn: "Zahra Health",
    nameAr: "زهرة للرعاية الصحية",
    sectorEn: "Consumer Health & Wellness",
    sectorAr: "الصحة والعافية للمستهلك",
    customerModel: "B2C",
    revenueModels: ["Subscription", "ECommerce"],
    currency: "SAR",
    entryStage: "PreSeed",
    currentStage: "PreSeed",
    periods: {
      // Remains at PreSeed; Q2 reporting submission is overdue. This
      // reflects submission compliance only, not company performance.
      Q1_2026: { status: "published", revenue: 190000, lastUpdated: "2026-05-10" },
      Q2_2026: { status: "draft", revenue: null, lastUpdated: null },
    },
  },
];
