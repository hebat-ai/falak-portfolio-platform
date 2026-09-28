import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import type {
  AdminPortfolioData,
  AdminCompanyDTO,
  AdminCompanyPeriodData,
  AdminPeriodOption,
} from "./dto";

// The one metric this admin dashboard reads for its revenue KPI/columns --
// matches the key seeded in prisma/seed/fabricated-demo-data.ts. A company
// on a template without this key simply shows "no data" for revenue, same
// as a period it hasn't submitted for yet.
const REVENUE_METRIC_KEY = "revenue_b2b";

// The shared formatDate()/StatusBadge <time> helpers across this app
// expect a bare "YYYY-MM-DD" string (matching the mock fixtures' own
// convention) -- never a full ISO timestamp. Time-of-day is discarded here
// for the same reason the mock data never had it.
function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * One server-side fetch for the whole /admin overview page. Requires at
 * least FALAK_OPERATIONS (FALAK_ADMIN also satisfies it, per
 * requireFalakRole's existing superset semantics) -- this function is the
 * page's read gate; individual mutations in actions.ts each re-check
 * FALAK_ADMIN independently, never trusting that this call already ran.
 */
export async function getAdminPortfolioData(): Promise<AdminPortfolioData> {
  await requireFalakRole("FALAK_OPERATIONS");

  const [companies, vehicles, investors, ownershipPositions, cycles, templates] = await Promise.all([
    db.company.findMany({ orderBy: { nameEn: "asc" } }),
    db.vehicle.findMany({ orderBy: { nameEn: "asc" } }),
    db.investor.findMany({ orderBy: { nameEn: "asc" } }),
    db.ownershipPosition.findMany({
      where: { holderType: "VEHICLE" },
      select: { companyId: true, vehicleId: true },
    }),
    db.reportingCycle.findMany({
      select: {
        id: true,
        companyId: true,
        periodLabel: true,
        periodStart: true,
        periodEnd: true,
        currentDeadline: true,
        submission: {
          select: {
            id: true,
            status: true,
            updatedAt: true,
            metricValues: {
              where: { metricDefinition: { key: REVENUE_METRIC_KEY } },
              select: { numericValue: true, isNa: true },
            },
          },
        },
      },
    }),
    db.reportingTemplate.findMany({ orderBy: { nameEn: "asc" } }),
  ]);

  const periodMap = new Map<string, AdminPeriodOption>();
  for (const cycle of cycles) {
    if (!periodMap.has(cycle.periodLabel)) {
      periodMap.set(cycle.periodLabel, {
        key: cycle.periodLabel,
        label: cycle.periodLabel,
        periodStart: toDateOnly(cycle.periodStart),
        periodEnd: toDateOnly(cycle.periodEnd),
      });
    }
  }
  const periods = [...periodMap.values()].sort((a, b) => a.periodStart.localeCompare(b.periodStart));

  const companyDTOs: AdminCompanyDTO[] = companies.map((company) => {
    const periodsData: Record<string, AdminCompanyPeriodData> = {};
    for (const period of periods) {
      periodsData[period.key] = {
        status: "draft",
        revenue: null,
        lastUpdated: null,
        cycleId: null,
        submissionId: null,
        currentDeadline: null,
      };
    }
    for (const cycle of cycles) {
      if (cycle.companyId !== company.id) continue;
      const submission = cycle.submission;
      const revenueValue = submission?.metricValues[0];
      const revenue =
        revenueValue && !revenueValue.isNa && revenueValue.numericValue !== null
          ? revenueValue.numericValue.toNumber()
          : null;

      periodsData[cycle.periodLabel] = {
        status: submission?.status ?? "draft",
        revenue,
        lastUpdated: submission ? toDateOnly(submission.updatedAt) : null,
        cycleId: cycle.id,
        submissionId: submission?.id ?? null,
        currentDeadline: toDateOnly(cycle.currentDeadline),
      };
    }

    return {
      id: company.id,
      slug: company.slug,
      nameEn: company.nameEn,
      nameAr: company.nameAr,
      sectorEn: company.sectorEn,
      sectorAr: company.sectorAr,
      customerModel: company.customerModel,
      revenueModels: company.revenueModels,
      currency: company.currency,
      entryStage: company.entryStage,
      currentStage: company.currentStage,
      archivedAt: company.archivedAt?.toISOString() ?? null,
      periods: periodsData,
    };
  });

  return {
    companies: companyDTOs,
    vehicles: vehicles.map((v) => ({
      id: v.id,
      slug: v.slug,
      nameEn: v.nameEn,
      nameAr: v.nameAr,
      type: v.type,
      currency: v.currency,
      archivedAt: v.archivedAt?.toISOString() ?? null,
    })),
    investors: investors.map((i) => ({
      id: i.id,
      nameEn: i.nameEn,
      nameAr: i.nameAr,
      type: i.type,
      archivedAt: i.archivedAt?.toISOString() ?? null,
    })),
    ownershipLinks: ownershipPositions
      .filter((p): p is typeof p & { vehicleId: string } => p.vehicleId !== null)
      .map((p) => ({ vehicleId: p.vehicleId, companyId: p.companyId })),
    periods,
    templates: templates.map((t) => ({ id: t.id, nameEn: t.nameEn, nameAr: t.nameAr, isActive: t.isActive })),
  };
}
