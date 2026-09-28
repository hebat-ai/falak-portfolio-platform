import "server-only";
import { db } from "@/lib/db";
import type { Prisma, NarrativeKind } from "@/generated/prisma/client";
import { requireFalakRole } from "@/lib/auth/authorization";
import { InvalidTransitionError } from "@/lib/reporting/submission-errors";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";

export interface NarrativeInput {
  textEn: string;
  textAr: string;
}

export type NarrativeInputs = Partial<Record<NarrativeKind, NarrativeInput>>;

const NARRATIVE_KINDS: NarrativeKind[] = [
  "operational_update",
  "quarter_highlights",
  "investment_review_notes",
  "management_commentary",
];

/**
 * Every investor with real exposure to companyId, via either path the
 * schema actually models -- confirmed against the real field shapes, not
 * assumed:
 *   - Vehicle-mediated: OwnershipPosition (holderType VEHICLE) has no
 *     investor FK at all -- reaching investors on this path requires a
 *     second query into InvestorVehiclePosition (status "Active") keyed
 *     by vehicleId.
 *   - Direct: OwnershipPosition (holderType DIRECT_INVESTOR) carries
 *     investorId directly.
 * holderType DIRECT_FALAK rows are Falak's own stake and never produce
 * investor access. Returns distinct, non-archived investor ids only.
 */
async function resolveInvestorExposure(tx: Prisma.TransactionClient, companyId: string): Promise<string[]> {
  const [vehiclePositions, directPositions] = await Promise.all([
    tx.ownershipPosition.findMany({
      where: { companyId, holderType: "VEHICLE" },
      select: { vehicleId: true },
    }),
    tx.ownershipPosition.findMany({
      where: { companyId, holderType: "DIRECT_INVESTOR" },
      select: { investorId: true },
    }),
  ]);

  const vehicleIds = vehiclePositions.map((p) => p.vehicleId).filter((v): v is string => v !== null);
  const directInvestorIds = directPositions.map((p) => p.investorId).filter((v): v is string => v !== null);

  const vehicleInvestorPositions = vehicleIds.length
    ? await tx.investorVehiclePosition.findMany({
        where: { vehicleId: { in: vehicleIds }, status: "Active" },
        select: { investorId: true },
        distinct: ["investorId"],
      })
    : [];

  const candidateIds = [...new Set([...vehicleInvestorPositions.map((p) => p.investorId), ...directInvestorIds])];
  if (candidateIds.length === 0) return [];

  const activeInvestors = await tx.investor.findMany({
    where: { id: { in: candidateIds }, archivedAt: null },
    select: { id: true },
  });
  return activeInvestors.map((i) => i.id);
}

/**
 * Publishes an approved CompanySubmission: find-or-creates the
 * COMPANY-scope Report for its (companyId, periodStart, periodEnd) --
 * matching the real duplicate-report-prevention partial unique index,
 * which Prisma's schema can't express as a @@unique (NULL != NULL across
 * the nullable scope FKs) -- supersedes any existing version, creates the
 * new one, attaches this one submission, creates whichever narrative
 * sections have real text, and grants access to every investor currently
 * exposed to this company. Only legal from "approved"; never changes the
 * CompanySubmission's own status (there is no "published" value for it --
 * publishing is an act on Report/ReportVersion, not the submission).
 */
export async function publishSubmission(
  submissionId: string,
  narratives: NarrativeInputs
): Promise<{ reportId: string; versionNo: number }> {
  const { user } = await requireFalakRole("FALAK_ADMIN");

  return db.$transaction(async (tx) => {
    const submission = await tx.companySubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        cycle: {
          select: {
            companyId: true,
            periodLabel: true,
            periodStart: true,
            periodEnd: true,
            company: { select: { archivedAt: true } },
          },
        },
      },
    });

    if (!submission || submission.status !== "approved" || submission.cycle.company.archivedAt) {
      throw new InvalidTransitionError();
    }

    const { companyId, periodLabel, periodStart, periodEnd } = submission.cycle;

    let report = await tx.report.findFirst({
      where: { scope: "COMPANY", companyId, periodStart, periodEnd },
    });
    if (!report) {
      report = await tx.report.create({
        data: { scope: "COMPANY", companyId, periodLabel, periodStart, periodEnd, asOfDate: periodEnd, status: "published" },
      });
    } else {
      await tx.report.update({ where: { id: report.id }, data: { status: "published" } });
    }

    await tx.reportVersion.updateMany({
      where: { reportId: report.id, isSuperseded: false },
      data: { isSuperseded: true },
    });

    const priorVersionCount = await tx.reportVersion.count({ where: { reportId: report.id } });
    const version = await tx.reportVersion.create({
      data: {
        reportId: report.id,
        versionNo: priorVersionCount + 1,
        isSuperseded: false,
        publishedAt: new Date(),
        createdById: user.id,
      },
    });

    await tx.reportVersionSubmission.create({
      data: { reportVersionId: version.id, submissionId },
    });

    for (const kind of NARRATIVE_KINDS) {
      const input = narratives[kind];
      if (!input) continue;
      const textEn = input.textEn.trim();
      const textAr = input.textAr.trim();
      if (!textEn && !textAr) continue;
      await tx.narrativeSection.create({
        data: { reportVersionId: version.id, kind, textEn, textAr, authorId: user.id },
      });
    }

    const investorIds = await resolveInvestorExposure(tx, companyId);
    for (const investorId of investorIds) {
      await tx.reportAccessGrant.create({ data: { reportVersionId: version.id, investorId } });
    }

    await writeAuditEvent(tx, {
      actorId: user.id,
      action: "report.published",
      targetType: "ReportVersion",
      targetId: version.id,
    });

    return { reportId: report.id, versionNo: version.versionNo };
  });
}
