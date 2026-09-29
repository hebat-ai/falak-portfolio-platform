import "server-only";
import { db } from "@/lib/db";
import { requireCurrentUser, requireFalakRole, requireCompanyMembership } from "@/lib/auth/authorization";
import { ForbiddenError } from "@/lib/auth/authorization-errors";
import type {
  CompanyReportData,
  CompanyReportDTO,
  CompanyReportPeriodData,
  CompanyReportPeriodOption,
  CompanyReportVehicleDTO,
  CompanyReportViewerRole,
} from "./dto";

// Matches the key seeded in prisma/seed/fabricated-demo-data.ts -- same
// constant src/lib/admin/queries.ts reads for its own revenue KPI/column.
const REVENUE_METRIC_KEY = "revenue_b2b";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Falak staff (any company) OR that one company's own member (their own
 * company only) -- nothing else. No other page in this codebase needs this
 * OR-composition yet, so it stays local/private here rather than becoming
 * a generic export on authorization.ts.
 */
async function requireCompanyReportViewer(companyId: string): Promise<{ viewerRole: CompanyReportViewerRole }> {
  try {
    await requireFalakRole("FALAK_OPERATIONS");
    return { viewerRole: "FALAK_STAFF" };
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
  }
  await requireCompanyMembership(companyId, "MEMBER");
  return { viewerRole: "COMPANY_MEMBER" };
}

/**
 * One company's full report: every reporting period it has a real cycle
 * for, each period's live submission status/revenue (never just the
 * published snapshot -- a company member needs to track their own
 * in-progress draft, same as Falak staff does), and whichever periods
 * have a currently-published (isSuperseded: false) ReportVersion's
 * narrative sections attached.
 *
 * Returns null for an unknown slug -- the caller (the page) must call
 * notFound() for that AND for a ForbiddenError alike, never a redirect
 * for one and a 404 for the other, so this page never reveals which real
 * company slugs exist to a visitor who isn't authorized to see them (same
 * discipline as /submit/[slug]).
 */
export async function getCompanyReportData(slug: string): Promise<CompanyReportData | null> {
  await requireCurrentUser();

  const company = await db.company.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      sectorEn: true,
      sectorAr: true,
      customerModel: true,
      revenueModels: true,
      currency: true,
      entryStage: true,
      currentStage: true,
      archivedAt: true,
      cycles: {
        select: {
          id: true,
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
      },
      reports: {
        where: { scope: "COMPANY" },
        select: {
          periodStart: true,
          periodEnd: true,
          versions: {
            where: { isSuperseded: false },
            select: { narratives: { select: { kind: true, textEn: true, textAr: true } } },
          },
        },
      },
      ownershipPositions: {
        where: { holderType: "VEHICLE", vehicle: { archivedAt: null } },
        select: {
          vehicle: {
            select: { id: true, slug: true, nameEn: true, nameAr: true, type: true, currency: true },
          },
        },
      },
    },
  });

  if (!company) return null;

  const { viewerRole } = await requireCompanyReportViewer(company.id);

  const periods: CompanyReportPeriodOption[] = company.cycles
    .map((cycle) => ({
      key: cycle.periodLabel,
      label: cycle.periodLabel,
      periodStart: toDateOnly(cycle.periodStart),
      periodEnd: toDateOnly(cycle.periodEnd),
    }))
    .sort((a, b) => a.periodStart.localeCompare(b.periodStart));

  const periodsData: Record<string, CompanyReportPeriodData> = {};
  for (const cycle of company.cycles) {
    const submission = cycle.submission;
    const revenueValue = submission?.metricValues[0];
    const revenue =
      revenueValue && !revenueValue.isNa && revenueValue.numericValue !== null
        ? revenueValue.numericValue.toNumber()
        : null;

    const matchingReport = company.reports.find(
      (r) => toDateOnly(r.periodStart) === toDateOnly(cycle.periodStart) && toDateOnly(r.periodEnd) === toDateOnly(cycle.periodEnd)
    );

    periodsData[cycle.periodLabel] = {
      status: submission?.status ?? "draft",
      revenue,
      lastUpdated: submission ? toDateOnly(submission.updatedAt) : null,
      cycleId: cycle.id,
      submissionId: submission?.id ?? null,
      currentDeadline: toDateOnly(cycle.currentDeadline),
      narratives: matchingReport?.versions[0]?.narratives ?? [],
    };
  }

  const linkedVehicles: CompanyReportVehicleDTO[] = company.ownershipPositions
    .filter((p): p is typeof p & { vehicle: NonNullable<(typeof p)["vehicle"]> } => p.vehicle !== null)
    .map((p) => p.vehicle);

  const companyDTO: CompanyReportDTO = {
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

  return { company: companyDTO, periods, linkedVehicles, viewerRole };
}
