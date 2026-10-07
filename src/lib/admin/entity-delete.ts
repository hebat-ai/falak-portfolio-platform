import "server-only";
import type { Prisma } from "@/generated/prisma/client";

// Permanent deletion of a startup or vehicle together with everything
// linked to it. Every relation in the schema is ON DELETE RESTRICT, so
// rows are removed children-first; callers run this inside one
// transaction so it is all-or-nothing. Returns the storage keys of
// deleted attachment files, to be removed from storage after commit.

type Tx = Prisma.TransactionClient;

/** Report versions (and the reports holding them) plus all their content. */
async function deleteReports(tx: Tx, reportWhere: Prisma.ReportWhereInput): Promise<string[]> {
  const versionWhere: Prisma.ReportVersionWhereInput = { report: reportWhere };
  const attachments = await tx.attachment.findMany({ where: { reportVersion: versionWhere }, select: { storageKey: true } });

  await tx.reviewComment.deleteMany({
    where: {
      OR: [{ narrativeSection: { reportVersion: versionWhere } }, { attachment: { reportVersion: versionWhere } }],
    },
  });
  await tx.attachment.deleteMany({ where: { reportVersion: versionWhere } });
  await tx.narrativeSection.deleteMany({ where: { reportVersion: versionWhere } });
  await tx.reportAccessGrant.deleteMany({ where: { reportVersion: versionWhere } });
  await tx.reportDistribution.deleteMany({ where: { reportVersion: versionWhere } });
  await tx.reportVersionSubmission.deleteMany({ where: { reportVersion: versionWhere } });
  await tx.reportVersion.deleteMany({ where: versionWhere });
  await tx.report.deleteMany({ where: reportWhere });
  return attachments.map((a) => a.storageKey);
}

/** Investment agreements plus their cash flows, obligations and linked capital transactions. */
async function deleteAgreements(tx: Tx, agreementWhere: Prisma.InvestmentAgreementWhereInput) {
  await tx.reportingCycleObligation.deleteMany({ where: { obligation: { agreement: agreementWhere } } });
  await tx.reportingObligation.deleteMany({ where: { agreement: agreementWhere } });
  await tx.agreementCashFlow.deleteMany({ where: { agreement: agreementWhere } });
  await tx.investorCapitalTransaction.deleteMany({ where: { agreement: agreementWhere } });
  // Agreements can point at the one they supersede; unlink first.
  await tx.investmentAgreement.updateMany({ where: agreementWhere, data: { supersedesAgreementId: null } });
  await tx.investmentAgreement.deleteMany({ where: agreementWhere });
}

async function deleteOwnershipPositions(tx: Tx, positionWhere: Prisma.OwnershipPositionWhereInput) {
  await deleteAgreements(tx, { ownershipPosition: positionWhere });
  await tx.ownershipSnapshot.deleteMany({ where: { ownershipPosition: positionWhere } });
  await tx.ownershipPosition.deleteMany({ where: positionWhere });
}

export async function deleteCompanyCascade(tx: Tx, companyId: string): Promise<string[]> {
  const submissionWhere: Prisma.CompanySubmissionWhereInput = { cycle: { companyId } };

  // Report content first: report versions reference this startup's submissions.
  const reportFiles = await deleteReports(tx, { companyId });

  const submissionFiles = await tx.attachment.findMany({ where: { submission: submissionWhere }, select: { storageKey: true } });
  await tx.reviewComment.deleteMany({
    where: {
      OR: [
        { submission: submissionWhere },
        { submissionMetricValue: { submission: submissionWhere } },
        { attachment: { submission: submissionWhere } },
      ],
    },
  });
  await tx.reportVersionSubmission.deleteMany({ where: { submission: submissionWhere } });
  await tx.attachment.deleteMany({ where: { submission: submissionWhere } });
  await tx.submissionVersionMetricValue.deleteMany({ where: { workflowEvent: { submission: submissionWhere } } });
  await tx.submissionWorkflowEvent.deleteMany({ where: { submission: submissionWhere } });
  await tx.submissionMetricValue.deleteMany({ where: { submission: submissionWhere } });
  await tx.companySubmission.deleteMany({ where: submissionWhere });

  await tx.reportingCycleDeadlineExtension.deleteMany({ where: { cycle: { companyId } } });
  await tx.reportingCycleObligation.deleteMany({ where: { cycle: { companyId } } });
  await tx.reportingCycle.deleteMany({ where: { companyId } });

  await deleteOwnershipPositions(tx, { companyId });
  await tx.companyValuationSnapshot.deleteMany({ where: { companyId } });
  await tx.companyInvite.deleteMany({ where: { companyId } });
  await tx.companyMembership.deleteMany({ where: { companyId } });
  await tx.company.delete({ where: { id: companyId } });

  return [...reportFiles, ...submissionFiles.map((a) => a.storageKey)];
}

/**
 * Deletes the vehicle, its holdings in startups (the investment records,
 * not the startups themselves), its investors' positions, NAV marks,
 * capital transactions and vehicle-level reports.
 */
export async function deleteVehicleCascade(tx: Tx, vehicleId: string): Promise<string[]> {
  const files = await deleteReports(tx, { vehicleId });
  await deleteOwnershipPositions(tx, { vehicleId });
  await tx.investorCapitalTransaction.deleteMany({ where: { vehicleId } });
  await tx.investorVehiclePosition.deleteMany({ where: { vehicleId } });
  await tx.vehicleNavSnapshot.deleteMany({ where: { vehicleId } });
  await tx.vehicle.delete({ where: { id: vehicleId } });
  return files;
}
