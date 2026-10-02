import "server-only";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/authorization";

export interface InvestorDocumentAttachmentDTO {
  id: string;
  fileName: string;
}

export interface InvestorDocumentDTO {
  companySlug: string;
  companyNameEn: string;
  companyNameAr: string;
  periodLabel: string;
  publishedAt: string | null;
  attachments: InvestorDocumentAttachmentDTO[];
}

/**
 * Every published COMPANY-scope report version this user's own (non-
 * revoked, non-archived) investor memberships hold a non-revoked
 * ReportAccessGrant for -- the same grant primitive
 * getInvestorPortfolioData reads, just projected into "documents" (the
 * formatted report itself, plus whatever Falak staff attached to that
 * version) instead of KPI rows. Scoped from this exact user's own
 * memberships only, never a client-supplied investor id.
 */
export async function getInvestorDocuments(): Promise<InvestorDocumentDTO[]> {
  const user = await requireCurrentUser();

  const investorIds = (
    await db.investorMembership.findMany({
      where: { userId: user.id, revokedAt: null, investor: { archivedAt: null } },
      select: { investorId: true },
    })
  ).map((m) => m.investorId);

  if (investorIds.length === 0) return [];

  const grants = await db.reportAccessGrant.findMany({
    where: {
      investorId: { in: investorIds },
      revokedAt: null,
      reportVersion: { report: { scope: "COMPANY", company: { archivedAt: null } } },
    },
    select: {
      reportVersion: {
        select: {
          id: true,
          versionNo: true,
          publishedAt: true,
          report: {
            select: {
              id: true,
              periodLabel: true,
              company: { select: { slug: true, nameEn: true, nameAr: true } },
            },
          },
          attachments: { select: { id: true, fileName: true } },
        },
      },
    },
  });

  // Same "highest versionNo wins per real report" dedup
  // getInvestorPortfolioData already applies -- a report can have more
  // than one non-revoked grant across corrected publishes.
  const bestByReportId = new Map<string, (typeof grants)[number]>();
  for (const grant of grants) {
    const reportId = grant.reportVersion.report.id;
    const existing = bestByReportId.get(reportId);
    if (!existing || grant.reportVersion.versionNo > existing.reportVersion.versionNo) {
      bestByReportId.set(reportId, grant);
    }
  }

  const documents: InvestorDocumentDTO[] = [];
  for (const grant of bestByReportId.values()) {
    const { report, publishedAt, attachments } = grant.reportVersion;
    // Report.company is nullable in the schema (a non-COMPANY-scope
    // report has none) -- the query's own `where: {scope: "COMPANY"}`
    // guarantees it's set here, but a future scope-leakage bug should
    // skip the row, not crash the page, same defensive guard
    // publish-workflow.ts's own resolveInvestorExposure comment follows.
    if (!report.company) continue;
    documents.push({
      companySlug: report.company.slug,
      companyNameEn: report.company.nameEn,
      companyNameAr: report.company.nameAr,
      periodLabel: report.periodLabel,
      publishedAt: publishedAt ? publishedAt.toISOString() : null,
      attachments,
    });
  }

  return documents.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}
