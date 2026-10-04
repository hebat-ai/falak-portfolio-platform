import "server-only";
import type { Department } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireFalakRole, type FalakRole } from "@/lib/auth/authorization";

export interface DepartmentScope {
  role: FalakRole;
  // null = unscoped (FALAK_ADMIN only): every admin query that reads
  // this must treat null as "no department filter," never as "filter to
  // a department literally named null." A non-null array is always
  // meant to be passed straight to Prisma as `department: { in: ... }`:
  // one real Department value for a configured FALAK_MANAGEMENT/
  // FALAK_OPERATIONS user, or an EMPTY array for one with no department
  // assigned yet -- `{ in: [] }` safely matches zero rows (a valid,
  // well-defined Prisma query), so a not-yet-configured staff account
  // sees nothing instead of crashing or silently seeing everything.
  departments: Department[] | null;
}

/**
 * Falak-role check PLUS department scope in one call -- every admin
 * query that lists/aggregates companies, vehicles, or investors should
 * call this instead of requireFalakRole directly, then spread
 * `...(scope.departments ? { department: { in: scope.departments } } : {})`
 * into that query's WHERE clause.
 */
export async function requireFalakRoleWithDepartmentScope(requiredRole: FalakRole): Promise<DepartmentScope> {
  const { user, role } = await requireFalakRole(requiredRole);

  if (role === "FALAK_ADMIN") {
    return { role, departments: null };
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { department: true } });
  return { role, departments: dbUser?.department ? [dbUser.department] : [] };
}
