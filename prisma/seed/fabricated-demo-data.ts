// One-time, manually-run seed script. NOT wired into `next build`, `npm run
// build`, `prisma db seed`, or any deploy step. Run it yourself, once,
// after Step 8's bootstrap admin SQL:
//
//   node prisma/seed/fabricated-demo-data.ts
//
// Populates the database with the SAME fabricated companies/vehicles/
// investors already defined in src/lib/mock/* -- the original frontend-only
// prototype's fixture data, explicitly documented there as "Fictional,
// privacy-safe, aggregate-only demo investor records," never real Falak/
// investor/company data. Reusing the exact same slugs/names means the admin
// UI and dashboards built in later steps can be exercised against real rows
// that look identical to what the mock UI already shows.
//
// Idempotent by construction: every entity is looked up by its natural key
// first and skipped if it already exists -- never upserted. Safe to re-run.
//
// Connects via DATABASE_URL_UNPOOLED (the direct/owner connection), never
// DATABASE_URL (the pooled connection the app runtime uses) -- the
// established convention in this repo for one-off administrative scripts
// (see prisma7.config.ts).
//
// Only a representative subset of the product plan's full metric data
// dictionary (six generic keys) is seeded here, enough to exercise the
// submission/review workflow end to end -- the complete field set is an
// admin-template-builder concern (Step 9+), not this script's job.

import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"], quiet: true });

import { PrismaClient } from "../../src/generated/prisma/client.ts";
import type { SubmissionStatus } from "../../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { companies as mockCompanies, REPORTING_CYCLES } from "../../src/lib/mock/companies.ts";
import { vehicles as mockVehicles, vehicleCompanyLinks } from "../../src/lib/mock/vehicles.ts";
import { investors as mockInvestors, investorVehicleExposures } from "../../src/lib/mock/investors.ts";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED is not set -- run `vercel env pull` first, or set it in .env.local.");
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Maps the prototype's mock reporting status onto the real
// CompanySubmission.status enum. "published" has no equivalent submission
// status in the real schema -- publishing is a separate act on
// Report/ReportVersion (Step 11 of the implementation plan), not modeled
// here -- collapsed to "approved" as the closest real state.
const STATUS_MAP: Record<string, SubmissionStatus> = {
  draft: "draft",
  submitted: "submitted",
  under_review: "under_review",
  changes_requested: "changes_requested",
  approved: "approved",
  published: "approved",
};

const METRICS = [
  { key: "revenue_b2b", labelEn: "B2B Revenue", labelAr: "إيرادات الأعمال (B2B)", dataType: "Currency", sortOrder: 1 },
  { key: "expenses_total", labelEn: "Expenses", labelAr: "المصروفات", dataType: "Currency", sortOrder: 2 },
  { key: "cash_balance_current", labelEn: "Current Cash Balance", labelAr: "الرصيد النقدي الحالي", dataType: "Currency", sortOrder: 3 },
  { key: "customers_active", labelEn: "Active Customers", labelAr: "العملاء النشطون", dataType: "Number", sortOrder: 4 },
  { key: "churn_rate_pct", labelEn: "Churn Rate %", labelAr: "معدل تسرب العملاء", dataType: "Percent", sortOrder: 5 },
  { key: "is_profitable", labelEn: "Are you profitable?", labelAr: "هل الشركة مربحة؟", dataType: "Boolean", sortOrder: 6 },
] as const;

// Q2 metric values per mock company slug. Boolean metrics are stored as
// numericValue 1/0 -- SubmissionMetricValue has no dedicated boolean column
// yet, so this is a seed-time convention Step 9's metric-entry UI will need
// to formalize. Omitted entirely for companies still in "draft" (no data
// submitted yet, per the mock fixture's own "revenue: null" convention).
const METRIC_VALUES: Record<string, Record<string, number>> = {
  "waslah-logistics": { revenue_b2b: 1020000, expenses_total: 850000, cash_balance_current: 1500000, customers_active: 140, churn_rate_pct: 0.03, is_profitable: 1 },
  "nawras-fintech": { revenue_b2b: 210000, expenses_total: 180000, cash_balance_current: 900000, customers_active: 65, churn_rate_pct: 0.02, is_profitable: 1 },
  "tadween-saas": { revenue_b2b: 68000, expenses_total: 75000, cash_balance_current: 210000, customers_active: 310, churn_rate_pct: 0.05, is_profitable: 0 },
  "marasi-marketplace": { revenue_b2b: 340000, expenses_total: 310000, cash_balance_current: 650000, customers_active: 980, churn_rate_pct: 0.06, is_profitable: 0 },
  "suhail-retail": { revenue_b2b: 465000, expenses_total: 420000, cash_balance_current: 380000, customers_active: 5200, churn_rate_pct: 0.08, is_profitable: 0 },
};

// The exact draft -> ... -> final transition chain to seed as
// SubmissionWorkflowEvent rows, so the audit trail looks like something the
// real Server Actions (Steps 10-11) would have produced. Draft has none --
// it's the initial state, no transition has happened yet.
const TRANSITION_CHAINS: Record<SubmissionStatus, { from: SubmissionStatus | null; to: SubmissionStatus }[]> = {
  draft: [],
  submitted: [{ from: "draft", to: "submitted" }],
  under_review: [
    { from: "draft", to: "submitted" },
    { from: "submitted", to: "under_review" },
  ],
  changes_requested: [
    { from: "draft", to: "submitted" },
    { from: "submitted", to: "under_review" },
    { from: "under_review", to: "changes_requested" },
  ],
  approved: [
    { from: "draft", to: "submitted" },
    { from: "submitted", to: "under_review" },
    { from: "under_review", to: "approved" },
  ],
};

async function ensureCompany(mock: (typeof mockCompanies)[number]) {
  const existing = await db.company.findUnique({ where: { slug: mock.slug } });
  if (existing) {
    console.log(`  skip company ${mock.slug} (exists)`);
    return existing;
  }
  const created = await db.company.create({
    data: {
      slug: mock.slug,
      nameEn: mock.nameEn,
      nameAr: mock.nameAr,
      sectorEn: mock.sectorEn,
      sectorAr: mock.sectorAr,
      customerModel: mock.customerModel,
      revenueModels: mock.revenueModels,
      currency: mock.currency,
      entryStage: mock.entryStage,
      currentStage: mock.currentStage,
    },
  });
  console.log(`  created company ${mock.slug}`);
  return created;
}

async function ensureVehicle(mock: (typeof mockVehicles)[number]) {
  const existing = await db.vehicle.findUnique({ where: { slug: mock.slug } });
  if (existing) {
    console.log(`  skip vehicle ${mock.slug} (exists)`);
    return existing;
  }
  const created = await db.vehicle.create({
    data: { slug: mock.slug, nameEn: mock.nameEn, nameAr: mock.nameAr, type: mock.type, currency: mock.currency },
  });
  console.log(`  created vehicle ${mock.slug}`);
  return created;
}

async function ensureInvestor(mock: (typeof mockInvestors)[number]) {
  const existing = await db.investor.findFirst({ where: { nameEn: mock.nameEn } });
  if (existing) {
    console.log(`  skip investor ${mock.nameEn} (exists)`);
    return existing;
  }
  const created = await db.investor.create({
    data: { nameEn: mock.nameEn, nameAr: mock.nameAr, type: mock.type },
  });
  console.log(`  created investor ${mock.nameEn}`);
  return created;
}

async function ensureOwnershipPosition(companyId: string, vehicleId: string) {
  const existing = await db.ownershipPosition.findFirst({ where: { companyId, vehicleId, holderType: "VEHICLE" } });
  if (existing) return existing;
  return db.ownershipPosition.create({ data: { companyId, vehicleId, holderType: "VEHICLE" } });
}

async function ensureInvestmentAgreement(ownershipPositionId: string, agreementNumber: string, currency: "SAR" | "USD") {
  const existing = await db.investmentAgreement.findUnique({ where: { agreementNumber } });
  if (existing) return existing;
  return db.investmentAgreement.create({
    data: {
      agreementNumber,
      ownershipPositionId,
      roundLabel: "Seed",
      signedDate: new Date("2024-06-01"),
      effectiveFrom: new Date("2024-06-01"),
      investedAmount: "500000.0000",
      currency,
      ownershipPct: "0.1000",
      status: "Active",
    },
  });
}

async function ensureOwnershipSnapshot(ownershipPositionId: string, asOfDate: Date) {
  const existing = await db.ownershipSnapshot.findUnique({
    where: { ownershipPositionId_asOfDate: { ownershipPositionId, asOfDate } },
  });
  if (existing) return existing;
  return db.ownershipSnapshot.create({
    data: { ownershipPositionId, asOfDate, ownershipPct: "0.1000", isFullyDiluted: false, source: "seed" },
  });
}

async function ensureInvestorVehiclePosition(investorId: string, vehicleId: string, currency: "SAR" | "USD") {
  const effectiveFrom = new Date("2024-01-01");
  const existing = await db.investorVehiclePosition.findUnique({
    where: { investorId_vehicleId_effectiveFrom: { investorId, vehicleId, effectiveFrom } },
  });
  if (existing) return existing;
  return db.investorVehiclePosition.create({
    data: {
      investorId,
      vehicleId,
      commitmentAmount: "1000000.0000",
      calledAmount: "600000.0000",
      ownershipPct: "0.0500",
      currency,
      effectiveFrom,
      status: "Active",
    },
  });
}

async function ensureTemplate() {
  const existing = await db.reportingTemplate.findFirst({ where: { nameEn: "Standard Quarterly Report" } });
  if (existing) return existing;
  return db.reportingTemplate.create({
    data: { nameEn: "Standard Quarterly Report", nameAr: "التقرير الفصلي القياسي", version: 1 },
  });
}

async function ensureMetricDefinitions(templateId: string) {
  const ids: Record<string, string> = {};
  for (const m of METRICS) {
    const existing = await db.metricDefinition.findUnique({ where: { templateId_key: { templateId, key: m.key } } });
    const row =
      existing ??
      (await db.metricDefinition.create({
        data: {
          templateId,
          key: m.key,
          labelEn: m.labelEn,
          labelAr: m.labelAr,
          dataType: m.dataType,
          required: true,
          sortOrder: m.sortOrder,
        },
      }));
    ids[m.key] = row.id;
  }
  return ids;
}

async function ensureObligation(agreementId: string, templateId: string) {
  const existing = await db.reportingObligation.findFirst({ where: { agreementId, templateId } });
  if (existing) return existing;
  return db.reportingObligation.create({
    data: { agreementId, templateId, frequency: "Quarterly", effectiveFrom: new Date("2024-06-01") },
  });
}

async function ensureCycleWithSubmission(
  companyId: string,
  templateId: string,
  obligationId: string,
  metricDefIds: Record<string, string>,
  finalStatus: SubmissionStatus,
  metricValues: Record<string, number> | undefined
) {
  const q2 = REPORTING_CYCLES.Q2_2026;
  const periodStart = new Date(q2.periodStart);
  const periodEnd = new Date(q2.periodEnd);
  const deadline = new Date(q2.deadline);

  let cycle = await db.reportingCycle.findUnique({
    where: { companyId_templateId_periodStart_periodEnd: { companyId, templateId, periodStart, periodEnd } },
  });
  if (!cycle) {
    cycle = await db.reportingCycle.create({
      data: {
        companyId,
        templateId,
        periodLabel: q2.labelEn,
        periodStart,
        periodEnd,
        originalDeadline: deadline,
        currentDeadline: deadline,
        status: "Open",
      },
    });
    console.log(`    created cycle ${q2.labelEn} for company ${companyId}`);
  }

  const existingLink = await db.reportingCycleObligation.findUnique({
    where: { cycleId_obligationId: { cycleId: cycle.id, obligationId } },
  });
  if (!existingLink) {
    await db.reportingCycleObligation.create({ data: { cycleId: cycle.id, obligationId } });
  }

  let submission = await db.companySubmission.findUnique({ where: { cycleId: cycle.id } });
  if (!submission) {
    submission = await db.companySubmission.create({ data: { cycleId: cycle.id, status: finalStatus } });
    console.log(`    created submission (${finalStatus}) for cycle ${cycle.id}`);

    if (metricValues) {
      for (const [key, value] of Object.entries(metricValues)) {
        await db.submissionMetricValue.create({
          data: { submissionId: submission.id, metricDefinitionId: metricDefIds[key], numericValue: String(value) },
        });
      }
    }

    let versionNo = 1;
    for (const transition of TRANSITION_CHAINS[finalStatus]) {
      await db.submissionWorkflowEvent.create({
        data: {
          submissionId: submission.id,
          versionNo: versionNo++,
          fromStatus: transition.from ?? undefined,
          toStatus: transition.to,
        },
      });
    }
  } else {
    console.log(`    skip submission for cycle ${cycle.id} (exists)`);
  }

  return { cycle, submission };
}

async function main() {
  console.log("Companies:");
  const companyIds: Record<string, string> = {};
  for (const mock of mockCompanies) {
    companyIds[mock.id] = (await ensureCompany(mock)).id;
  }

  console.log("Vehicles:");
  const vehicleIds: Record<string, string> = {};
  for (const mock of mockVehicles) {
    vehicleIds[mock.id] = (await ensureVehicle(mock)).id;
  }

  console.log("Investors:");
  const investorIds: Record<string, string> = {};
  for (const mock of mockInvestors) {
    investorIds[mock.id] = (await ensureInvestor(mock)).id;
  }

  console.log("Ownership positions + investment agreements:");
  // One agreement/obligation per (vehicle, company) link -- reused as the
  // company's single ReportingObligation source below. A company under two
  // vehicles (Tadween SaaS) gets two agreements, but only the first link's
  // obligation is attached to its one seeded cycle (a cycle covers exactly
  // one template/obligation combination -- see ReportingCycleObligation's
  // schema comment).
  const obligationIdByCompanyMockId: Record<string, string> = {};
  const template = await ensureTemplate();
  const metricDefIds = await ensureMetricDefinitions(template.id);

  for (const link of vehicleCompanyLinks) {
    const companyId = companyIds[link.companyId];
    const vehicleId = vehicleIds[link.vehicleId];
    const mockVehicle = mockVehicles.find((v) => v.id === link.vehicleId)!;
    const mockCompany = mockCompanies.find((c) => c.id === link.companyId)!;

    const position = await ensureOwnershipPosition(companyId, vehicleId);
    const agreement = await ensureInvestmentAgreement(
      position.id,
      `SEED-${mockCompany.slug}-${mockVehicle.slug}`,
      mockCompany.currency
    );
    await ensureOwnershipSnapshot(position.id, new Date(REPORTING_CYCLES.Q2_2026.periodEnd));

    const obligation = await ensureObligation(agreement.id, template.id);
    if (!obligationIdByCompanyMockId[link.companyId]) {
      obligationIdByCompanyMockId[link.companyId] = obligation.id;
    }
  }

  console.log("Investor <-> vehicle positions:");
  for (const exposure of investorVehicleExposures) {
    const mockVehicle = mockVehicles.find((v) => v.id === exposure.vehicleId)!;
    await ensureInvestorVehiclePosition(investorIds[exposure.investorId], vehicleIds[exposure.vehicleId], mockVehicle.currency);
  }

  console.log("Reporting cycles + submissions (Q2 2026 only):");
  for (const mock of mockCompanies) {
    const companyId = companyIds[mock.id];
    const obligationId = obligationIdByCompanyMockId[mock.id];
    if (!obligationId) {
      console.log(`  skip ${mock.slug} -- not linked to any vehicle in vehicleCompanyLinks`);
      continue;
    }
    const mockStatus = mock.periods.Q2_2026.status;
    const finalStatus = STATUS_MAP[mockStatus];
    await ensureCycleWithSubmission(
      companyId,
      template.id,
      obligationId,
      metricDefIds,
      finalStatus,
      METRIC_VALUES[mock.slug]
    );
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
