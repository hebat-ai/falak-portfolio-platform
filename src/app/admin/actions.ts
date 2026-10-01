"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/authorization-errors";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { normalizeEmail, MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";
import { isAuthError, GENERIC_ACCESS_DENIED } from "@/lib/auth/action-error";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";
import type {
  Currency,
  CustomerModel,
  RevenueModel,
  FundingStage,
  VehicleType,
  InvestorType,
  MetricDataType,
  CompanyValuationType,
} from "@/generated/prisma/client";

export interface ActionState {
  error: string | null;
  success?: boolean;
}

export interface InviteActionState {
  error: string | null;
  inviteUrl?: string | null;
}

const GENERIC_ERROR = "Something went wrong. Check your input and try again.";
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 200;
const MAX_SLUG_LENGTH = 80;
const CURRENCIES: Currency[] = ["SAR", "USD"];
const CUSTOMER_MODELS: CustomerModel[] = ["B2B", "B2C", "B2B_B2C"];
const REVENUE_MODELS: RevenueModel[] = ["SaaS", "Marketplace", "ECommerce", "TransactionBased", "Subscription", "Other"];
const FUNDING_STAGES: FundingStage[] = ["PreSeed", "Seed", "SeriesA", "SeriesB", "Later"];
const VEHICLE_TYPES: VehicleType[] = ["Fund", "SPV"];
const INVESTOR_TYPES: InvestorType[] = ["Institutional", "FamilyOffice", "Individual"];
const METRIC_DATA_TYPES: MetricDataType[] = ["Currency", "Percent", "Number", "Text", "Boolean"];
const MAX_METRIC_ROWS = 20;
const VALUATION_TYPES: CompanyValuationType[] = ["LastRound", "InternalMark", "ThirdPartyMark", "Exit", "WrittenOff"];
const AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;
const MAX_SOURCE_LENGTH = 200;

function readString(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : null;
}

function isValidName(value: string | null): value is string {
  return value !== null && value.length > 0 && value.length <= MAX_NAME_LENGTH;
}

function isValidSlug(value: string | null): value is string {
  return value !== null && value.length > 0 && value.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(value);
}

// ============================================================
// Company
// ============================================================

export async function createCompanyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const slug = readString(formData, "slug");
  const nameEn = readString(formData, "nameEn");
  const nameAr = readString(formData, "nameAr");
  const sectorEn = readString(formData, "sectorEn");
  const sectorAr = readString(formData, "sectorAr");
  const customerModel = readString(formData, "customerModel");
  const currency = readString(formData, "currency");
  const entryStage = readString(formData, "entryStage");
  const currentStage = readString(formData, "currentStage");
  const revenueModels = formData.getAll("revenueModels").filter((v): v is string => typeof v === "string");

  if (
    !isValidSlug(slug) ||
    !isValidName(nameEn) ||
    !isValidName(nameAr) ||
    !isValidName(sectorEn) ||
    !isValidName(sectorAr) ||
    !customerModel ||
    !CUSTOMER_MODELS.includes(customerModel as CustomerModel) ||
    !currency ||
    !CURRENCIES.includes(currency as Currency) ||
    !entryStage ||
    !FUNDING_STAGES.includes(entryStage as FundingStage) ||
    !currentStage ||
    !FUNDING_STAGES.includes(currentStage as FundingStage) ||
    revenueModels.some((m) => !REVENUE_MODELS.includes(m as RevenueModel))
  ) {
    return { error: "Fill in every field with a valid value." };
  }

  const existing = await db.company.findUnique({ where: { slug } });
  if (existing) {
    return { error: "That slug is already in use by another company." };
  }

  try {
    await db.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          slug,
          nameEn,
          nameAr,
          sectorEn,
          sectorAr,
          customerModel: customerModel as CustomerModel,
          revenueModels: revenueModels as RevenueModel[],
          currency: currency as Currency,
          entryStage: entryStage as FundingStage,
          currentStage: currentStage as FundingStage,
        },
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "company.created",
        targetType: "Company",
        targetId: company.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

// Plain (formData) => void signature -- used directly as a <form
// action={archiveCompanyAction}> per table row, not through
// useActionState. Next.js refreshes the current route's Server Components
// after any Server Action submitted via a <form> completes, so /admin's
// server-fetched data re-runs and the row disappears/updates without a
// manual redirect or revalidatePath call.
export async function archiveCompanyAction(formData: FormData): Promise<void> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    if (error instanceof ForbiddenError) {
      return;
    }
    throw error;
  }
  const companyId = readString(formData, "companyId");
  if (!companyId) return;
  await db.$transaction(async (tx) => {
    await tx.company.update({ where: { id: companyId }, data: { archivedAt: new Date() } });
    await writeAuditEvent(tx, { actorId: user.id, action: "company.archived", targetType: "Company", targetId: companyId });
  });
}

// ============================================================
// Vehicle
// ============================================================

export async function createVehicleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const slug = readString(formData, "slug");
  const nameEn = readString(formData, "nameEn");
  const nameAr = readString(formData, "nameAr");
  const type = readString(formData, "type");
  const currency = readString(formData, "currency");

  if (
    !isValidSlug(slug) ||
    !isValidName(nameEn) ||
    !isValidName(nameAr) ||
    !type ||
    !VEHICLE_TYPES.includes(type as VehicleType) ||
    !currency ||
    !CURRENCIES.includes(currency as Currency)
  ) {
    return { error: "Fill in every field with a valid value." };
  }

  const existing = await db.vehicle.findUnique({ where: { slug } });
  if (existing) {
    return { error: "That slug is already in use by another vehicle." };
  }

  try {
    await db.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: { slug, nameEn, nameAr, type: type as VehicleType, currency: currency as Currency },
      });
      await writeAuditEvent(tx, { actorId: user.id, action: "vehicle.created", targetType: "Vehicle", targetId: vehicle.id });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

export async function archiveVehicleAction(formData: FormData): Promise<void> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    if (error instanceof ForbiddenError) {
      return;
    }
    throw error;
  }
  const vehicleId = readString(formData, "vehicleId");
  if (!vehicleId) return;
  await db.$transaction(async (tx) => {
    await tx.vehicle.update({ where: { id: vehicleId }, data: { archivedAt: new Date() } });
    await writeAuditEvent(tx, { actorId: user.id, action: "vehicle.archived", targetType: "Vehicle", targetId: vehicleId });
  });
}

// ============================================================
// Investor
// ============================================================

export async function createInvestorAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const nameEn = readString(formData, "nameEn");
  const nameAr = readString(formData, "nameAr");
  const type = readString(formData, "type");

  if (!isValidName(nameEn) || !isValidName(nameAr) || !type || !INVESTOR_TYPES.includes(type as InvestorType)) {
    return { error: "Fill in every field with a valid value." };
  }

  try {
    await db.$transaction(async (tx) => {
      const investor = await tx.investor.create({ data: { nameEn, nameAr, type: type as InvestorType } });
      await writeAuditEvent(tx, { actorId: user.id, action: "investor.created", targetType: "Investor", targetId: investor.id });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

export async function archiveInvestorAction(formData: FormData): Promise<void> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    if (error instanceof ForbiddenError) {
      return;
    }
    throw error;
  }
  const investorId = readString(formData, "investorId");
  if (!investorId) return;
  await db.$transaction(async (tx) => {
    await tx.investor.update({ where: { id: investorId }, data: { archivedAt: new Date() } });
    await writeAuditEvent(tx, { actorId: user.id, action: "investor.archived", targetType: "Investor", targetId: investorId });
  });
}

// ============================================================
// Vehicle <-> company ownership link
// ============================================================

export async function linkVehicleToCompanyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyId = readString(formData, "companyId");
  const vehicleId = readString(formData, "vehicleId");
  const investedAmount = readString(formData, "investedAmount");
  const currency = readString(formData, "currency");
  const ownershipPct = readString(formData, "ownershipPct");
  const signedDateRaw = readString(formData, "signedDate");

  if (
    !companyId ||
    !vehicleId ||
    !investedAmount ||
    !/^\d+(\.\d{1,4})?$/.test(investedAmount) ||
    !currency ||
    !CURRENCIES.includes(currency as Currency) ||
    !ownershipPct ||
    !/^\d+(\.\d{1,4})?$/.test(ownershipPct) ||
    !signedDateRaw
  ) {
    return { error: "Fill in every field with a valid value." };
  }

  const signedDate = new Date(signedDateRaw);
  if (Number.isNaN(signedDate.getTime())) {
    return { error: "Enter a valid date." };
  }

  const [company, vehicle] = await Promise.all([
    db.company.findUnique({ where: { id: companyId } }),
    db.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);
  if (!company || !vehicle) {
    return { error: GENERIC_ERROR };
  }

  try {
    await db.$transaction(async (tx) => {
      const position =
        (await tx.ownershipPosition.findFirst({ where: { companyId, vehicleId, holderType: "VEHICLE" } })) ??
        (await tx.ownershipPosition.create({ data: { companyId, vehicleId, holderType: "VEHICLE" } }));

      await tx.investmentAgreement.create({
        data: {
          agreementNumber: `${company.slug}-${vehicle.slug}-${Date.now()}`,
          ownershipPositionId: position.id,
          signedDate,
          effectiveFrom: signedDate,
          investedAmount,
          currency: currency as Currency,
          ownershipPct,
          status: "Active",
        },
      });

      await tx.ownershipSnapshot.create({
        data: { ownershipPositionId: position.id, asOfDate: signedDate, ownershipPct, source: "admin" },
      });

      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "ownership_position.linked",
        targetType: "OwnershipPosition",
        targetId: position.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

// ============================================================
// Reporting template + metric definitions
// ============================================================

export async function createReportingTemplateAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const nameEn = readString(formData, "nameEn");
  const nameAr = readString(formData, "nameAr");
  if (!isValidName(nameEn) || !isValidName(nameAr)) {
    return { error: "Fill in every field with a valid value." };
  }

  const metrics: { key: string; labelEn: string; labelAr: string; dataType: MetricDataType; sortOrder: number }[] = [];
  for (let i = 0; i < MAX_METRIC_ROWS; i++) {
    const key = readString(formData, `metricKey_${i}`);
    if (!key) continue;
    const labelEn = readString(formData, `metricLabelEn_${i}`);
    const labelAr = readString(formData, `metricLabelAr_${i}`);
    const dataType = readString(formData, `metricDataType_${i}`);
    if (
      !/^[a-z][a-z0-9_]*$/.test(key) ||
      !isValidName(labelEn) ||
      !isValidName(labelAr) ||
      !dataType ||
      !METRIC_DATA_TYPES.includes(dataType as MetricDataType)
    ) {
      return { error: "Every metric row needs a valid key, both labels, and a data type." };
    }
    metrics.push({ key, labelEn, labelAr, dataType: dataType as MetricDataType, sortOrder: metrics.length + 1 });
  }
  if (metrics.length === 0) {
    return { error: "Add at least one metric." };
  }
  const uniqueKeys = new Set(metrics.map((m) => m.key));
  if (uniqueKeys.size !== metrics.length) {
    return { error: "Metric keys must be unique within a template." };
  }

  try {
    await db.$transaction(async (tx) => {
      const template = await tx.reportingTemplate.create({ data: { nameEn, nameAr } });
      await tx.metricDefinition.createMany({
        data: metrics.map((m) => ({ ...m, templateId: template.id, required: true })),
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "reporting_template.created",
        targetType: "ReportingTemplate",
        targetId: template.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

// ============================================================
// Reporting cycle (auto-creates its 1:1 CompanySubmission)
// ============================================================

export async function createReportingCycleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyId = readString(formData, "companyId");
  const templateId = readString(formData, "templateId");
  const periodLabel = readString(formData, "periodLabel");
  const periodStartRaw = readString(formData, "periodStart");
  const periodEndRaw = readString(formData, "periodEnd");
  const deadlineRaw = readString(formData, "deadline");

  if (!companyId || !templateId || !isValidName(periodLabel) || !periodStartRaw || !periodEndRaw || !deadlineRaw) {
    return { error: "Fill in every field with a valid value." };
  }

  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);
  const deadline = new Date(deadlineRaw);
  if ([periodStart, periodEnd, deadline].some((d) => Number.isNaN(d.getTime())) || periodEnd < periodStart) {
    return { error: "Enter valid, consistent dates." };
  }

  const existing = await db.reportingCycle.findUnique({
    where: { companyId_templateId_periodStart_periodEnd: { companyId, templateId, periodStart, periodEnd } },
  });
  if (existing) {
    return { error: "A cycle already exists for this company, template, and period." };
  }

  try {
    await db.$transaction(async (tx) => {
      const cycle = await tx.reportingCycle.create({
        data: {
          companyId,
          templateId,
          periodLabel,
          periodStart,
          periodEnd,
          originalDeadline: deadline,
          currentDeadline: deadline,
          status: "Open",
        },
      });
      await tx.companySubmission.create({ data: { cycleId: cycle.id, status: "draft" } });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "reporting_cycle.created",
        targetType: "ReportingCycle",
        targetId: cycle.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

// ============================================================
// Company invite
// ============================================================

const INVITE_EXPIRY_DAYS = 7;

export async function createCompanyInviteAction(_prevState: InviteActionState, formData: FormData): Promise<InviteActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyId = readString(formData, "companyId");
  const emailInput = formData.get("email");

  if (!companyId || typeof emailInput !== "string") {
    return { error: "Fill in every field with a valid value." };
  }
  if (emailInput.length > MAX_RAW_EMAIL_LENGTH || !emailInput.trim()) {
    return { error: "Enter a valid email address." };
  }
  const email = normalizeEmail(emailInput);

  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return { error: GENERIC_ERROR };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  try {
    await db.$transaction(async (tx) => {
      const invite = await tx.companyInvite.create({
        data: { companyId, email, tokenHash, invitedById: user.id, expiresAt },
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "invite.created",
        targetType: "CompanyInvite",
        targetId: invite.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  // The raw token is returned exactly once, here, for the admin to copy --
  // it is never stored (only tokenHash is), never logged, and this
  // response is the only place it will ever appear again.
  return { error: null, inviteUrl: `/accept-invite?token=${rawToken}` };
}

// ============================================================
// Investor invite -- same shape as the company invite above, for an
// investor organization; accepted at /accept-investor-invite.
// ============================================================

export async function createInvestorInviteAction(_prevState: InviteActionState, formData: FormData): Promise<InviteActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const investorId = readString(formData, "investorId");
  const emailInput = formData.get("email");

  if (!investorId || typeof emailInput !== "string") {
    return { error: "Fill in every field with a valid value." };
  }
  if (emailInput.length > MAX_RAW_EMAIL_LENGTH || !emailInput.trim()) {
    return { error: "Enter a valid email address." };
  }
  const email = normalizeEmail(emailInput);

  const investor = await db.investor.findUnique({ where: { id: investorId } });
  if (!investor || investor.archivedAt) {
    return { error: GENERIC_ERROR };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  try {
    await db.$transaction(async (tx) => {
      const invite = await tx.investorInvite.create({
        data: { investorId, email, tokenHash, invitedById: user.id, expiresAt },
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "investor_invite.created",
        targetType: "InvestorInvite",
        targetId: invite.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  // Returned exactly once for the admin to copy; only the hash is stored.
  return { error: null, inviteUrl: `/accept-investor-invite?token=${rawToken}` };
}

// ============================================================
// Company valuation / vehicle NAV -- insert-only, same discipline as
// every other financial-ledger table in this schema (a correction is a
// new row, never an edit; app_runtime_grants.sql grants SELECT+INSERT
// only on both tables, no UPDATE).
// ============================================================

export async function createCompanyValuationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyId = readString(formData, "companyId");
  const asOfDateRaw = readString(formData, "asOfDate");
  const valuationAmount = readString(formData, "valuationAmount");
  const currency = readString(formData, "currency");
  const valuationType = readString(formData, "valuationType");
  const sourceInput = readString(formData, "source");

  if (
    !companyId ||
    !asOfDateRaw ||
    !valuationAmount ||
    !AMOUNT_PATTERN.test(valuationAmount) ||
    !currency ||
    !CURRENCIES.includes(currency as Currency) ||
    !valuationType ||
    !VALUATION_TYPES.includes(valuationType as CompanyValuationType)
  ) {
    return { error: "Fill in every field with a valid value." };
  }
  if (sourceInput && sourceInput.length > MAX_SOURCE_LENGTH) {
    return { error: "Fill in every field with a valid value." };
  }

  const asOfDate = new Date(asOfDateRaw);
  if (Number.isNaN(asOfDate.getTime())) {
    return { error: "Enter a valid date." };
  }

  try {
    await db.$transaction(async (tx) => {
      const snapshot = await tx.companyValuationSnapshot.create({
        data: {
          companyId,
          asOfDate,
          valuationAmount,
          currency: currency as Currency,
          valuationType: valuationType as CompanyValuationType,
          source: sourceInput || null,
          createdById: user.id,
        },
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "company_valuation.recorded",
        targetType: "CompanyValuationSnapshot",
        targetId: snapshot.id,
      });
    });
  } catch {
    // Covers the (companyId, asOfDate, valuationType) unique-constraint
    // collision alike with any other write failure -- one generic
    // message, never a raw Prisma error surfaced to the form.
    return { error: "A valuation for this company on this date and type already exists." };
  }

  return { error: null, success: true };
}

export async function createVehicleNavAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    ({ user } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const vehicleId = readString(formData, "vehicleId");
  const asOfDateRaw = readString(formData, "asOfDate");
  const navAmount = readString(formData, "navAmount");
  const currency = readString(formData, "currency");
  const sourceInput = readString(formData, "source");

  if (
    !vehicleId ||
    !asOfDateRaw ||
    !navAmount ||
    !AMOUNT_PATTERN.test(navAmount) ||
    !currency ||
    !CURRENCIES.includes(currency as Currency)
  ) {
    return { error: "Fill in every field with a valid value." };
  }
  if (sourceInput && sourceInput.length > MAX_SOURCE_LENGTH) {
    return { error: "Fill in every field with a valid value." };
  }

  const asOfDate = new Date(asOfDateRaw);
  if (Number.isNaN(asOfDate.getTime())) {
    return { error: "Enter a valid date." };
  }

  try {
    await db.$transaction(async (tx) => {
      const snapshot = await tx.vehicleNavSnapshot.create({
        data: {
          vehicleId,
          asOfDate,
          navAmount,
          currency: currency as Currency,
          source: sourceInput || null,
          createdById: user.id,
        },
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "vehicle_nav.recorded",
        targetType: "VehicleNavSnapshot",
        targetId: snapshot.id,
      });
    });
  } catch {
    // Covers the (vehicleId, asOfDate) unique-constraint collision alike
    // with any other write failure -- one generic message.
    return { error: "A NAV mark for this vehicle on this date already exists." };
  }

  return { error: null, success: true };
}
