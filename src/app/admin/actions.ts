"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";
import { requireFalakRoleWithDepartmentScope } from "@/lib/auth/department-scope";
import {
  validateCompany,
  validateVehicle,
  validateInvestor,
  FIX_HIGHLIGHTED,
  type FieldErrors,
  type FormValues,
} from "@/lib/admin/entity-validation";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/authorization-errors";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { normalizeEmail, MAX_RAW_EMAIL_LENGTH } from "@/lib/auth/utils";
import { isAuthError, GENERIC_ACCESS_DENIED } from "@/lib/auth/action-error";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";
import { convertToDisplay, type DisplayCurrency } from "@/lib/currency/convert";
import { requestSignInLink } from "@/lib/auth/request-sign-in";
import { hashPassword, MIN_PASSWORD_LENGTH, MAX_RAW_PASSWORD_LENGTH } from "@/lib/auth/password";
import type {
  Currency,
  MetricDataType,
  CompanyValuationType,
  InvestorCapitalTransactionType,
  Department,
  PlatformRole,
} from "@/generated/prisma/client";

export interface ActionState {
  error: string | null;
  success?: boolean;
  // Per-field messages, keyed by input name -- the form highlights exactly these.
  fieldErrors?: FieldErrors;
  // What was submitted, so a rejected form keeps everything the user typed.
  values?: FormValues;
}

export interface InviteActionState {
  error: string | null;
  inviteUrl?: string | null;
}

const GENERIC_ERROR = "Something went wrong. Check your input and try again.";
const MAX_NAME_LENGTH = 200;
const CURRENCIES: Currency[] = ["SAR", "USD"];
const METRIC_DATA_TYPES: MetricDataType[] = ["Currency", "Percent", "Number", "Text", "Boolean"];
// Bumped from 20 -- a comprehensive template (financial + health +
// customer + qualitative fields, matching a real investor-reporting
// spreadsheet) comfortably exceeds the old cap.
const MAX_METRIC_ROWS = 40;
const VALUATION_TYPES: CompanyValuationType[] = ["LastRound", "InternalMark", "ThirdPartyMark", "Exit", "WrittenOff"];
const AMOUNT_PATTERN = /^\d+(\.\d{1,4})?$/;
const MAX_SOURCE_LENGTH = 200;
const DEPARTMENTS: Department[] = ["VentureBuilder", "InvestmentDepartment"];
const MIN_VINTAGE_YEAR = 1990;
const MAX_VINTAGE_YEAR = 2100;

function readString(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : null;
}

/** Same as readString, but also strips thousands-separator commas -- every amount field should read through this, not readString. */
function readAmount(formData: FormData, field: string): string | null {
  const value = readString(formData, field);
  return value === null ? null : value.replace(/,/g, "");
}

// Staff below Admin may only touch records in their own department.
// departments === null means unscoped (Admin).
const OUT_OF_DEPARTMENT = "You can only manage records in your own department.";

function inDepartment(departments: Department[] | null, department: Department | null | undefined): boolean {
  return departments === null || (department != null && departments.includes(department));
}

async function companyInDepartment(departments: Department[] | null, companyId: string): Promise<boolean> {
  if (departments === null) return true;
  const company = await db.company.findUnique({ where: { id: companyId }, select: { department: true } });
  return inDepartment(departments, company?.department);
}

async function vehicleInDepartment(departments: Department[] | null, vehicleId: string): Promise<boolean> {
  if (departments === null) return true;
  const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId }, select: { department: true } });
  return inDepartment(departments, vehicle?.department);
}

async function investorInDepartment(departments: Department[] | null, investorId: string): Promise<boolean> {
  if (departments === null) return true;
  const investor = await db.investor.findUnique({ where: { id: investorId }, select: { department: true } });
  return inDepartment(departments, investor?.department);
}

function isValidName(value: string | null): value is string {
  return value !== null && value.length > 0 && value.length <= MAX_NAME_LENGTH;
}

// ============================================================
// Company
// ============================================================

export async function createCompanyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const { values, errors, input } = validateCompany(formData, departments);
  if (!input) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: errors, values };
  }
  if (await db.company.findUnique({ where: { slug: input.slug } })) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: { slug: "That slug is already used by another company." }, values };
  }

  try {
    await db.$transaction(async (tx) => {
      const company = await tx.company.create({ data: input });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "company.created",
        targetType: "Company",
        targetId: company.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR, values };
  }

  return { error: null, success: true };
}

export async function updateCompanyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyId = readString(formData, "companyId");
  if (!companyId || !(await companyInDepartment(departments, companyId))) {
    return { error: OUT_OF_DEPARTMENT };
  }

  const { values, errors, input } = validateCompany(formData, departments);
  if (!input) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: errors, values };
  }
  const slugOwner = await db.company.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== companyId) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: { slug: "That slug is already used by another company." }, values };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.company.update({ where: { id: companyId }, data: input });
      await writeAuditEvent(tx, { actorId: user.id, action: "company.updated", targetType: "Company", targetId: companyId });
    });
  } catch {
    return { error: GENERIC_ERROR, values };
  }

  return { error: null, success: true, values };
}

// Plain (formData) => void signature -- used directly as a <form
// action={archiveCompanyAction}> per table row, not through
// useActionState. Next.js refreshes the current route's Server Components
// after any Server Action submitted via a <form> completes, so /admin's
// server-fetched data re-runs and the row disappears/updates without a
// manual redirect or revalidatePath call.
export async function archiveCompanyAction(formData: FormData): Promise<void> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
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
  if (!companyId || !(await companyInDepartment(departments, companyId))) return;
  await db.$transaction(async (tx) => {
    await tx.company.update({ where: { id: companyId }, data: { archivedAt: new Date() } });
    await writeAuditEvent(tx, { actorId: user.id, action: "company.archived", targetType: "Company", targetId: companyId });
  });
}

// Reclassifies an EXISTING company's department -- the create form only
// sets this going forward; every company created before this field
// existed needs it set once via this separate action instead of a full
// edit form for the other (rarely-changing) company fields.
export async function setCompanyDepartmentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyId = readString(formData, "companyId");
  const department = readString(formData, "department");
  if (!companyId || !department || !DEPARTMENTS.includes(department as Department)) {
    return { error: "Fill in every field with a valid value." };
  }
  // A scoped user can neither move a company out of their department nor pull one in.
  if (!inDepartment(departments, department as Department) || !(await companyInDepartment(departments, companyId))) {
    return { error: OUT_OF_DEPARTMENT };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.company.update({ where: { id: companyId }, data: { department: department as Department } });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "company.department_changed",
        targetType: "Company",
        targetId: companyId,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

// ============================================================
// Vehicle
// ============================================================

export async function createVehicleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const { values, errors, input } = validateVehicle(formData, departments);
  if (!input) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: errors, values };
  }
  if (await db.vehicle.findUnique({ where: { slug: input.slug } })) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: { slug: "That slug is already used by another vehicle." }, values };
  }

  try {
    await db.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({ data: input });
      await writeAuditEvent(tx, { actorId: user.id, action: "vehicle.created", targetType: "Vehicle", targetId: vehicle.id });
    });
  } catch {
    return { error: GENERIC_ERROR, values };
  }

  return { error: null, success: true };
}

export async function updateVehicleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const vehicleId = readString(formData, "vehicleId");
  if (!vehicleId || !(await vehicleInDepartment(departments, vehicleId))) {
    return { error: OUT_OF_DEPARTMENT };
  }

  const { values, errors, input } = validateVehicle(formData, departments);
  if (!input) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: errors, values };
  }
  const slugOwner = await db.vehicle.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== vehicleId) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: { slug: "That slug is already used by another vehicle." }, values };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.vehicle.update({ where: { id: vehicleId }, data: input });
      await writeAuditEvent(tx, { actorId: user.id, action: "vehicle.updated", targetType: "Vehicle", targetId: vehicleId });
    });
  } catch {
    return { error: GENERIC_ERROR, values };
  }

  return { error: null, success: true, values };
}

// Sets an EXISTING vehicle's vintage year -- same "new field, old rows
// need a one-off setter rather than a full edit form" rationale as
// setCompanyDepartmentAction above.
export async function setVehicleVintageYearAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const vehicleId = readString(formData, "vehicleId");
  const vintageYearRaw = readString(formData, "vintageYear");
  const vintageYear = vintageYearRaw ? Number(vintageYearRaw) : null;
  if (
    !vehicleId ||
    !vintageYearRaw ||
    !Number.isInteger(vintageYear) ||
    vintageYear! < MIN_VINTAGE_YEAR ||
    vintageYear! > MAX_VINTAGE_YEAR
  ) {
    return { error: "Fill in every field with a valid value." };
  }
  if (!(await vehicleInDepartment(departments, vehicleId))) {
    return { error: OUT_OF_DEPARTMENT };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.vehicle.update({ where: { id: vehicleId }, data: { vintageYear } });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "vehicle.vintage_year_set",
        targetType: "Vehicle",
        targetId: vehicleId,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

export async function archiveVehicleAction(formData: FormData): Promise<void> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
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
  if (!vehicleId || !(await vehicleInDepartment(departments, vehicleId))) return;
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
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const { values, errors, input } = validateInvestor(formData, departments);
  if (!input) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: errors, values };
  }

  try {
    await db.$transaction(async (tx) => {
      const investor = await tx.investor.create({ data: input });
      await writeAuditEvent(tx, { actorId: user.id, action: "investor.created", targetType: "Investor", targetId: investor.id });
    });
  } catch {
    return { error: GENERIC_ERROR, values };
  }

  return { error: null, success: true };
}

export async function updateInvestorAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const investorId = readString(formData, "investorId");
  if (!investorId || !(await investorInDepartment(departments, investorId))) {
    return { error: OUT_OF_DEPARTMENT };
  }

  const { values, errors, input } = validateInvestor(formData, departments);
  if (!input) {
    return { error: FIX_HIGHLIGHTED, fieldErrors: errors, values };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.investor.update({ where: { id: investorId }, data: input });
      await writeAuditEvent(tx, { actorId: user.id, action: "investor.updated", targetType: "Investor", targetId: investorId });
    });
  } catch {
    return { error: GENERIC_ERROR, values };
  }

  return { error: null, success: true, values };
}

export async function archiveInvestorAction(formData: FormData): Promise<void> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
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
  if (!investorId || !(await investorInDepartment(departments, investorId))) return;
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
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyId = readString(formData, "companyId");
  const vehicleId = readString(formData, "vehicleId");
  const investedAmount = readAmount(formData, "investedAmount");
  const currency = readString(formData, "currency");
  const ownershipPct = readAmount(formData, "ownershipPct");
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
  if (!inDepartment(departments, company.department) || !inDepartment(departments, vehicle.department)) {
    return { error: OUT_OF_DEPARTMENT };
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
// Investor <-> vehicle assignment
// ============================================================

/**
 * Creates the InvestorVehiclePosition row that IS "this investor is
 * assigned to this vehicle" -- the model already existed (vehicle NAV/
 * capital summaries and investor returns already read it), but nothing
 * in the app ever wrote one; Falak had no way to actually assign an
 * investor to a vehicle. A status: "Active" row here is also exactly
 * what resolveInvestorExposure (src/lib/reporting/publish-workflow.ts)
 * checks before granting report access and emailing a published
 * report, so assigning an investor here is what makes them start
 * receiving reports for every startup that vehicle holds.
 */
export async function linkInvestorToVehicleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const investorId = readString(formData, "investorId");
  const vehicleId = readString(formData, "vehicleId");
  const currency = readString(formData, "currency");
  const effectiveFromRaw = readString(formData, "effectiveFrom");
  const commitmentAmount = readAmount(formData, "commitmentAmount");
  const calledAmount = readAmount(formData, "calledAmount");

  if (
    !investorId ||
    !vehicleId ||
    !currency ||
    !CURRENCIES.includes(currency as Currency) ||
    !effectiveFromRaw ||
    (commitmentAmount && !AMOUNT_PATTERN.test(commitmentAmount)) ||
    (calledAmount && !AMOUNT_PATTERN.test(calledAmount))
  ) {
    return { error: "Fill in every required field with a valid value." };
  }

  const effectiveFrom = new Date(effectiveFromRaw);
  if (Number.isNaN(effectiveFrom.getTime())) {
    return { error: "Enter a valid date." };
  }

  const [investor, vehicle] = await Promise.all([
    db.investor.findUnique({ where: { id: investorId } }),
    db.vehicle.findUnique({ where: { id: vehicleId } }),
  ]);
  if (!investor || !vehicle) {
    return { error: GENERIC_ERROR };
  }
  if (!inDepartment(departments, investor.department) || !inDepartment(departments, vehicle.department)) {
    return { error: OUT_OF_DEPARTMENT };
  }

  const existing = await db.investorVehiclePosition.findUnique({
    where: { investorId_vehicleId_effectiveFrom: { investorId, vehicleId, effectiveFrom } },
  });
  if (existing) {
    return { error: "This investor is already assigned to this vehicle as of that date." };
  }

  // Ownership % is never typed in by hand -- it's this investor's
  // contribution (net invested) divided by the vehicle's own total
  // invested capital (every Active/Superseded InvestmentAgreement
  // under it, converted to this position's currency via the same
  // fixed 3.75 rate the portfolio overview dashboard uses), so it
  // always reflects a real share of real deployed capital rather than
  // a number Falak could type inconsistently with the rest of the
  // vehicle's cap table.
  const vehicleAgreements = await db.investmentAgreement.findMany({
    where: {
      status: { in: ["Active", "Superseded"] },
      ownershipPosition: { vehicleId },
    },
    select: { investedAmount: true, currency: true },
  });
  const vehicleInvestedCapital = vehicleAgreements.reduce((sum, a) => {
    if (a.investedAmount === null || a.currency === null) return sum;
    return sum + convertToDisplay(a.investedAmount.toNumber(), a.currency, currency as DisplayCurrency);
  }, 0);
  const ownershipPct =
    commitmentAmount && vehicleInvestedCapital > 0 ? Number(commitmentAmount) / vehicleInvestedCapital : null;

  try {
    await db.$transaction(async (tx) => {
      const position = await tx.investorVehiclePosition.create({
        data: {
          investorId,
          vehicleId,
          currency: currency as Currency,
          effectiveFrom,
          commitmentAmount: commitmentAmount || null,
          calledAmount: calledAmount || null,
          ownershipPct,
          status: "Active",
        },
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "investor_vehicle_position.linked",
        targetType: "InvestorVehiclePosition",
        targetId: position.id,
      });

      // Backfill: grant this investor access to every ALREADY-PUBLISHED
      // report for a company this vehicle holds -- resolveInvestorExposure
      // only runs at the moment of a NEW publish, so without this an
      // investor assigned today would see nothing on their dashboard
      // until the next quarter's report, even though they're now
      // genuinely exposed to this vehicle's existing startups. No email
      // is (re-)sent for these backfilled grants -- "Resend to Investors"
      // on the Reports Log covers that separately, per report, if Falak
      // wants to notify by email too.
      const vehicleCompanies = await tx.ownershipPosition.findMany({
        where: { vehicleId, holderType: "VEHICLE" },
        select: { companyId: true },
      });
      const companyIds = [...new Set(vehicleCompanies.map((p) => p.companyId))];
      if (companyIds.length > 0) {
        const latestVersions = await tx.reportVersion.findMany({
          where: { isSuperseded: false, report: { scope: "COMPANY", companyId: { in: companyIds } } },
          select: { id: true },
        });
        for (const version of latestVersions) {
          await tx.reportAccessGrant.upsert({
            where: { reportVersionId_investorId: { reportVersionId: version.id, investorId } },
            update: {},
            create: { reportVersionId: version.id, investorId },
          });
        }
      }
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

export async function unassignInvestorFromVehicleAction(formData: FormData): Promise<void> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    if (error instanceof ForbiddenError) {
      return;
    }
    throw error;
  }
  const positionId = readString(formData, "positionId");
  if (!positionId) return;
  if (departments !== null) {
    const position = await db.investorVehiclePosition.findUnique({
      where: { id: positionId },
      select: { investor: { select: { department: true } }, vehicle: { select: { department: true } } },
    });
    if (!position || !inDepartment(departments, position.investor.department) || !inDepartment(departments, position.vehicle.department)) {
      return;
    }
  }
  await db.$transaction(async (tx) => {
    await tx.investorVehiclePosition.update({ where: { id: positionId }, data: { status: "Exited", effectiveTo: new Date() } });
    await writeAuditEvent(tx, {
      actorId: user.id,
      action: "investor_vehicle_position.unassigned",
      targetType: "InvestorVehiclePosition",
      targetId: positionId,
    });
  });
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
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyIds = formData.getAll("companyIds").filter((v): v is string => typeof v === "string" && v.length > 0);
  const templateId = readString(formData, "templateId");
  const periodLabel = readString(formData, "periodLabel");
  const periodStartRaw = readString(formData, "periodStart");
  const periodEndRaw = readString(formData, "periodEnd");
  const deadlineRaw = readString(formData, "deadline");

  if (companyIds.length === 0 || !templateId || !isValidName(periodLabel) || !periodStartRaw || !periodEndRaw || !deadlineRaw) {
    return { error: "Select at least one company and fill in every field with a valid value." };
  }

  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);
  const deadline = new Date(deadlineRaw);
  if ([periodStart, periodEnd, deadline].some((d) => Number.isNaN(d.getTime())) || periodEnd < periodStart) {
    return { error: "Enter valid, consistent dates." };
  }
  if (departments !== null) {
    const inScopeCount = await db.company.count({
      where: { id: { in: companyIds }, department: { in: departments } },
    });
    if (inScopeCount !== new Set(companyIds).size) {
      return { error: OUT_OF_DEPARTMENT };
    }
  }

  // One reporting cycle (the "request" being logged) per selected
  // company, all sharing the same template/period/deadline -- a
  // company that already has a cycle for this exact
  // (templateId, periodStart, periodEnd) is silently skipped rather
  // than failing the whole batch, since "request this quarter from
  // everyone except the two who already have it" is the normal case,
  // not an error.
  let createdCount = 0;
  try {
    await db.$transaction(async (tx) => {
      for (const companyId of companyIds) {
        const existing = await tx.reportingCycle.findUnique({
          where: { companyId_templateId_periodStart_periodEnd: { companyId, templateId, periodStart, periodEnd } },
        });
        if (existing) continue;

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
        createdCount += 1;
      }
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  if (createdCount === 0) {
    return { error: "Every selected company already has a cycle for this exact template and period." };
  }

  return { error: null, success: true };
}

// ============================================================
// Company invite
// ============================================================

const INVITE_EXPIRY_DAYS = 7;

export async function createCompanyInviteAction(_prevState: InviteActionState, formData: FormData): Promise<InviteActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
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
  if (!inDepartment(departments, company.department)) {
    return { error: OUT_OF_DEPARTMENT };
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
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
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
  if (!inDepartment(departments, investor.department)) {
    return { error: OUT_OF_DEPARTMENT };
  }

  // Investors get exactly one user per account -- block a second invite
  // outright while either an active membership or a still-live,
  // unaccepted invite already exists for this investor. Falak must
  // revoke the first (membership or invite) before inviting a
  // replacement.
  const [activeMembership, pendingInvite] = await Promise.all([
    db.investorMembership.findFirst({ where: { investorId, revokedAt: null } }),
    db.investorInvite.findFirst({
      where: { investorId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);
  if (activeMembership || pendingInvite) {
    return { error: "This investor already has a user. Revoke their access before inviting a replacement." };
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
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const companyId = readString(formData, "companyId");
  const asOfDateRaw = readString(formData, "asOfDate");
  const valuationAmount = readAmount(formData, "valuationAmount");
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
  if (!(await companyInDepartment(departments, companyId))) {
    return { error: OUT_OF_DEPARTMENT };
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
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const vehicleId = readString(formData, "vehicleId");
  const asOfDateRaw = readString(formData, "asOfDate");
  const navAmount = readAmount(formData, "navAmount");
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
  if (!(await vehicleInDepartment(departments, vehicleId))) {
    return { error: OUT_OF_DEPARTMENT };
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

// ============================================================
// Investor capital transactions (capital calls, contributions,
// distributions, management fees) -- backfills the dated cash-flow
// history getInvestorReturns' IRR/MOIC calculation needs. Insert-only,
// same discipline as every other financial ledger in this schema (a
// correction is a new row, never an edit; app_runtime_grants.sql grants
// SELECT+INSERT only, no UPDATE).
// ============================================================

const CAPITAL_TRANSACTION_TYPES: InvestorCapitalTransactionType[] = ["CapitalCall", "Contribution", "Distribution", "ManagementFee"];
const MAX_DESCRIPTION_LENGTH = 500;

export async function recordInvestorCapitalTransactionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  let departments: Department[] | null = null;
  try {
    ({ user, departments } = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const investorId = readString(formData, "investorId");
  const vehicleIdInput = readString(formData, "vehicleId");
  const type = readString(formData, "type");
  const amount = readAmount(formData, "amount");
  const currency = readString(formData, "currency");
  const transactionDateRaw = readString(formData, "transactionDate");
  const descriptionInput = readString(formData, "description");

  if (
    !investorId ||
    !type ||
    !CAPITAL_TRANSACTION_TYPES.includes(type as InvestorCapitalTransactionType) ||
    !amount ||
    !AMOUNT_PATTERN.test(amount) ||
    !currency ||
    !CURRENCIES.includes(currency as Currency) ||
    !transactionDateRaw
  ) {
    return { error: "Fill in every field with a valid value." };
  }
  if (descriptionInput && descriptionInput.length > MAX_DESCRIPTION_LENGTH) {
    return { error: "Fill in every field with a valid value." };
  }

  const transactionDate = new Date(transactionDateRaw);
  if (Number.isNaN(transactionDate.getTime())) {
    return { error: "Enter a valid date." };
  }
  if (
    !(await investorInDepartment(departments, investorId)) ||
    (vehicleIdInput && !(await vehicleInDepartment(departments, vehicleIdInput)))
  ) {
    return { error: OUT_OF_DEPARTMENT };
  }

  try {
    await db.$transaction(async (tx) => {
      const transaction = await tx.investorCapitalTransaction.create({
        data: {
          investorId,
          vehicleId: vehicleIdInput || null,
          type: type as InvestorCapitalTransactionType,
          amount,
          currency: currency as Currency,
          transactionDate,
          description: descriptionInput || null,
          createdById: user.id,
        },
      });
      await writeAuditEvent(tx, {
        actorId: user.id,
        action: "investor_capital_transaction.recorded",
        targetType: "InvestorCapitalTransaction",
        targetId: transaction.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

// ============================================================
// Staff management (invite, department, password, revoke)
// ============================================================

// FALAK_ADMIN is deliberately never an option here -- granting the
// platform-owner tier stays a manual, out-of-band action (not exposed
// through self-service UI, to prevent privilege escalation via this
// form), same reasoning AccessRequestedRole's own self-serve sign-up
// never offers it either.
const INVITABLE_STAFF_ROLES = ["FALAK_MANAGEMENT", "FALAK_OPERATIONS"] as const;
type InvitableStaffRole = (typeof INVITABLE_STAFF_ROLES)[number];

/**
 * Admin-only: directly provisions a Falak-staff account (find-or-create
 * the User by email, grant the role, set the department) and sends them
 * a sign-in link for their first login -- staff accounts are Falak-
 * provisioned, not self-service, so there is no separate invite-token/
 * accept-page flow the way company/investor invites have; the user row
 * and the role grant are created in the same step an invite would
 * otherwise just prepare.
 */
export async function inviteStaffUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    ({ user: actor } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const emailInput = formData.get("email");
  const role = readString(formData, "role");
  const department = readString(formData, "department");

  if (
    typeof emailInput !== "string" ||
    !emailInput.trim() ||
    emailInput.length > MAX_RAW_EMAIL_LENGTH ||
    !role ||
    !(INVITABLE_STAFF_ROLES as readonly string[]).includes(role) ||
    !department ||
    !DEPARTMENTS.includes(department as Department)
  ) {
    return { error: "Fill in every field with a valid value." };
  }
  const email = normalizeEmail(emailInput);

  try {
    await db.$transaction(async (tx) => {
      const staffUser = await tx.user.upsert({
        where: { email },
        update: { department: department as Department },
        create: { email, department: department as Department },
      });

      const existingActiveRole = await tx.userRoleAssignment.findFirst({
        where: { userId: staffUser.id, role: role as InvitableStaffRole, revokedAt: null },
      });
      if (!existingActiveRole) {
        await tx.userRoleAssignment.create({ data: { userId: staffUser.id, role: role as InvitableStaffRole } });
      }

      await writeAuditEvent(tx, {
        actorId: actor.id,
        action: "staff_user.invited",
        targetType: "User",
        targetId: staffUser.id,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  // Outside the transaction, same "never let a slow/failed email
  // provider call hold open or roll back a real write" discipline as
  // publish-workflow.ts's own sendPublishNotifications.
  try {
    await requestSignInLink(email);
  } catch {
    return { error: "Staff access was granted, but the sign-in email failed to send. Ask them to use \"Forgot password\" instead." };
  }

  return { error: null, success: true };
}

export async function adminSetStaffDepartmentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    ({ user: actor } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const userId = readString(formData, "userId");
  const department = readString(formData, "department");
  if (!userId || !department || !DEPARTMENTS.includes(department as Department)) {
    return { error: "Fill in every field with a valid value." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { department: department as Department } });
      await writeAuditEvent(tx, {
        actorId: actor.id,
        action: "staff_user.department_changed",
        targetType: "User",
        targetId: userId,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

/**
 * Admin-only password override -- unlike /account's own change-password
 * flow, this never requires or checks the user's OLD password: Admin is
 * setting it directly on their behalf (e.g. because they're locked out),
 * not proving they already know it.
 */
export async function adminSetUserPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    ({ user: actor } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (isAuthError(error)) {
      return { error: GENERIC_ACCESS_DENIED };
    }
    throw error;
  }

  const userId = readString(formData, "userId");
  const newPassword = formData.get("newPassword");
  if (
    !userId ||
    typeof newPassword !== "string" ||
    newPassword.length < MIN_PASSWORD_LENGTH ||
    newPassword.length > MAX_RAW_PASSWORD_LENGTH
  ) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const passwordHash = await hashPassword(newPassword);

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { passwordHash } });
      await writeAuditEvent(tx, {
        actorId: actor.id,
        action: "staff_user.password_reset_by_admin",
        targetType: "User",
        targetId: userId,
      });
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  return { error: null, success: true };
}

export async function revokeStaffRoleAction(formData: FormData): Promise<void> {
  let actor;
  try {
    ({ user: actor } = await requireFalakRole("FALAK_ADMIN"));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    if (error instanceof ForbiddenError) {
      return;
    }
    throw error;
  }

  const userId = readString(formData, "userId");
  const role = readString(formData, "role");
  if (!userId || !role) return;

  await db.$transaction(async (tx) => {
    await tx.userRoleAssignment.updateMany({
      where: { userId, role: role as PlatformRole, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await writeAuditEvent(tx, {
      actorId: actor.id,
      action: "staff_user.role_revoked",
      targetType: "User",
      targetId: userId,
    });
  });
}
