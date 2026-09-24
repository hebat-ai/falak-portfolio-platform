import "server-only";
import type { PlatformRole, CompanyMembershipRole, InvestorMembershipRole } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/authorization-errors";

/**
 * Falak-staff-only slice of PlatformRole. INVESTOR is deliberately
 * excluded: its product purpose is not yet defined anywhere in this
 * codebase, so it must not be accepted as proof of Falak-staff access.
 * Real investor-organization access is derived exclusively from
 * InvestorMembership (requireInvestorMembership below), never from this
 * platform-level enum value. The enum member itself is left untouched in
 * the schema for compatibility -- only its use here is restricted.
 */
export type FalakRole = Exclude<PlatformRole, "INVESTOR">;

function isFalakRole(role: PlatformRole): role is FalakRole {
  return role === "FALAK_ADMIN" || role === "FALAK_OPERATIONS";
}

/**
 * ADMIN is a strict superset of MEMBER for the Falak roles (carried
 * forward from this project's own original permissions-matrix decision:
 * "Admin = strict superset with override power over Operations") -- a
 * FALAK_OPERATIONS requirement accepts either FALAK_ADMIN or
 * FALAK_OPERATIONS; a FALAK_ADMIN requirement accepts FALAK_ADMIN only.
 * Exhaustive over FalakRole's two members -- if a third FalakRole value
 * is ever introduced, the `never` assignment below fails to compile until
 * this switch is updated, rather than silently under-covering it.
 */
function acceptableFalakRoles(requiredRole: FalakRole): FalakRole[] {
  switch (requiredRole) {
    case "FALAK_ADMIN":
      return ["FALAK_ADMIN"];
    case "FALAK_OPERATIONS":
      return ["FALAK_ADMIN", "FALAK_OPERATIONS"];
    default: {
      const exhaustiveCheck: never = requiredRole;
      throw new Error(`Unhandled FalakRole: ${String(exhaustiveCheck)}`);
    }
  }
}

/** Same ADMIN-is-a-superset-of-MEMBER rule, for CompanyMembershipRole. */
function acceptableCompanyRoles(requiredRole: CompanyMembershipRole): CompanyMembershipRole[] {
  switch (requiredRole) {
    case "ADMIN":
      return ["ADMIN"];
    case "MEMBER":
      return ["ADMIN", "MEMBER"];
    default: {
      const exhaustiveCheck: never = requiredRole;
      throw new Error(`Unhandled CompanyMembershipRole: ${String(exhaustiveCheck)}`);
    }
  }
}

/** Same ADMIN-is-a-superset-of-MEMBER rule, for InvestorMembershipRole. */
function acceptableInvestorRoles(requiredRole: InvestorMembershipRole): InvestorMembershipRole[] {
  switch (requiredRole) {
    case "ADMIN":
      return ["ADMIN"];
    case "MEMBER":
      return ["ADMIN", "MEMBER"];
    default: {
      const exhaustiveCheck: never = requiredRole;
      throw new Error(`Unhandled InvestorMembershipRole: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * The base identity check every other require*() function in this module
 * builds on. Throws UnauthenticatedError when there is no currently valid
 * user -- which, by design, is the SAME outcome whether there was no
 * session at all or the session belonged to a since-deactivated account
 * (getCurrentUser(), from Step 4, already collapses both cases to `null`
 * before this function ever sees them). This module does not, and must
 * not, re-derive or duplicate that deactivation check to tell the two
 * cases apart -- doing so would let a caller distinguish "deactivated"
 * from "never existed," which is exactly the distinction the existing
 * secure external behavior is designed to hide.
 *
 * Does NOT catch errors thrown by getCurrentUser() itself (e.g. a
 * database failure) -- those propagate as-is, never converted into
 * UnauthenticatedError, so an operational failure is never misreported as
 * an authorization decision.
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }
  return user;
}

/**
 * Requires the current user to hold an active (non-revoked)
 * UserRoleAssignment at or above `requiredRole`, checked fresh against
 * the database on every call -- never cached, never read from the JWT.
 *
 * The database permits at most one ACTIVE row per (userId, role) --
 * never per userId alone -- so a single user can genuinely hold both an
 * active FALAK_ADMIN row and an active FALAK_OPERATIONS row at the same
 * time. For an Operations-level requirement, both rows independently
 * authorize access, but the *effective role returned* must be
 * deterministic rather than whichever row an unordered query happens to
 * return first. One scoped query (findMany, bounded by the same
 * WHERE predicate a findFirst would have used) fetches every currently
 * active row matching the acceptable set; the effective role is then
 * resolved explicitly in application code below, never left to
 * findFirst()'s unspecified ordering or to PostgreSQL enum ordering:
 * FALAK_ADMIN wins whenever an active FALAK_ADMIN row exists, since
 * ADMIN is the strict superset (see acceptableFalakRoles above);
 * otherwise FALAK_OPERATIONS, if that row exists instead.
 *
 * WHERE predicate (the one query): userId = the authenticated user's own
 * id (never a client-supplied value) AND role IN (the exhaustive
 * acceptable-role set for requiredRole) AND revokedAt IS NULL.
 */
export async function requireFalakRole(requiredRole: FalakRole): Promise<{ user: CurrentUser; role: FalakRole }> {
  const user = await requireCurrentUser();

  const roleRows = await db.userRoleAssignment.findMany({
    where: {
      userId: user.id,
      role: { in: acceptableFalakRoles(requiredRole) },
      revokedAt: null,
    },
    select: { role: true },
  });

  // isFalakRole is a type guard, not a cast: the query already only ever
  // matches FalakRole values (INVESTOR is never in acceptableFalakRoles'
  // result), but Prisma's generated return type is the full PlatformRole
  // -- this narrows it without an unchecked `as`.
  const matchedRoles = new Set(roleRows.map((row) => row.role).filter(isFalakRole));

  const effectiveRole: FalakRole | null = matchedRoles.has("FALAK_ADMIN")
    ? "FALAK_ADMIN"
    : matchedRoles.has("FALAK_OPERATIONS")
      ? "FALAK_OPERATIONS"
      : null;

  if (!effectiveRole) {
    throw new ForbiddenError();
  }

  return { user, role: effectiveRole };
}

/**
 * Requires the current user to hold an active (non-revoked)
 * CompanyMembership on the exact `companyId` given, at or above
 * `requiredRole`, with the company itself not archived -- checked fresh
 * against the database on every call.
 *
 * WHERE predicate (single query): userId = the authenticated user's own
 * id AND companyId = the exact resource id passed in (never a client-
 * supplied id used as proof on its own) AND role IN (the exhaustive
 * acceptable-role set for requiredRole) AND revokedAt IS NULL AND the
 * related company's archivedAt IS NULL (relation filter, same query --
 * per this step's decision, an archived company blocks ordinary
 * membership access regardless of role or revocation state; Falak
 * override behavior is deliberately NOT combined into this function).
 */
export async function requireCompanyMembership(
  companyId: string,
  requiredRole: CompanyMembershipRole
): Promise<{ user: CurrentUser; role: CompanyMembershipRole }> {
  const user = await requireCurrentUser();

  const membership = await db.companyMembership.findFirst({
    where: {
      userId: user.id,
      companyId,
      role: { in: acceptableCompanyRoles(requiredRole) },
      revokedAt: null,
      company: { archivedAt: null },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new ForbiddenError();
  }

  return { user, role: membership.role };
}

/**
 * Requires the current user to hold an active (non-revoked)
 * InvestorMembership on the exact `investorId` given, at or above
 * `requiredRole`, with the investor itself not archived -- checked fresh
 * against the database on every call.
 *
 * WHERE predicate (single query): userId = the authenticated user's own
 * id AND investorId = the exact resource id passed in AND role IN (the
 * exhaustive acceptable-role set for requiredRole) AND revokedAt IS NULL
 * AND the related investor's archivedAt IS NULL (relation filter, same
 * query -- same archived-blocks-access decision as requireCompanyMembership
 * above; no Falak override combined in here either).
 */
export async function requireInvestorMembership(
  investorId: string,
  requiredRole: InvestorMembershipRole
): Promise<{ user: CurrentUser; role: InvestorMembershipRole }> {
  const user = await requireCurrentUser();

  const membership = await db.investorMembership.findFirst({
    where: {
      userId: user.id,
      investorId,
      role: { in: acceptableInvestorRoles(requiredRole) },
      revokedAt: null,
      investor: { archivedAt: null },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new ForbiddenError();
  }

  return { user, role: membership.role };
}
