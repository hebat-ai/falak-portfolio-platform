import "server-only";
import { UnauthenticatedError, ForbiddenError } from "@/lib/auth/authorization-errors";

// Same generic message for both an expired session and a genuine role/
// membership mismatch -- never reveals which occurred, the same
// enumeration-safety discipline submitReportAction (Step 6) already
// established for this exact pair. "Sign in again" is safe, actionable
// guidance either way: a truly-forbidden user just lands back here on
// retry, an expired-session user is fixed by it.
export const GENERIC_ACCESS_DENIED = "You don't have permission to do that, or your session has expired. Sign in again and retry.";

/**
 * Call from a Server Action's catch block, after handling any
 * domain-specific error, to collapse an expired session or a role/
 * membership mismatch into one generic {error} state instead of letting
 * either crash the request with a raw, unhandled error (requireCurrentUser/
 * requireFalakRole/requireCompanyMembership/requireInvestorMembership all
 * throw these two classes, and none of it is caught by anything upstream
 * of the action itself).
 */
export function isAuthError(error: unknown): error is UnauthenticatedError | ForbiddenError {
  return error instanceof UnauthenticatedError || error instanceof ForbiddenError;
}
