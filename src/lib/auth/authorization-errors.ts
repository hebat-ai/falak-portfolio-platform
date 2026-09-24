import "server-only";

/**
 * No currently valid user: either no session at all, or a session whose
 * user no longer exists / has been deactivated (getCurrentUser() already
 * collapses both into `null` -- this layer does not, and must not,
 * distinguish a deactivated identity from an absent/invalid session; see
 * the doc comment on requireCurrentUser() in authorization.ts).
 */
export class UnauthenticatedError extends Error {}

/**
 * A currently valid user exists, but lacks the specific role or
 * membership a require*() call demanded -- including a missing/revoked
 * UserRoleAssignment, a missing/revoked CompanyMembership/
 * InvestorMembership, an insufficient role, or the related Company/
 * Investor being archived.
 */
export class ForbiddenError extends Error {}
