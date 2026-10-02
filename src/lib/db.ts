import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// One PrismaClient (and its connection pool) per process. Next.js dev-mode
// hot-reloading would otherwise create a new client -- and a new pool --
// on every file save, eventually exhausting database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * NOT YET WIRED INTO ANY CALLER. RLS was briefly enabled on 8 tables
 * (prisma/migrations/20261002164959_add_row_level_security) and then
 * disabled again (.../20261002170500_disable_row_level_security_pending_redesign)
 * after it broke production: with `app.current_user_id` unset, the
 * helper SQL functions (app_is_falak_staff/app_can_read_cycle/
 * app_can_read_report) can never return true, so EVERY query against
 * those tables that doesn't go through this function -- which, at the
 * time, was most of the codebase -- silently saw zero rows. Confirmed
 * directly against app_runtime (SET ROLE app_runtime; SELECT count(*)
 * FROM reporting_cycles; → 0 with RLS on, real rows with it off).
 *
 * Re-enabling RLS safely requires migrating EVERY read/write path that
 * touches those 8 tables to use this function in the same pass -- not a
 * bounded subset -- plus verifying each one against a live app_runtime
 * connection before flipping RLS back on. Until that happens, this
 * function has no effect (RLS is off), and the policies/helper SQL
 * functions in the first migration above are inert.
 *
 * When that redesign happens: runs `fn` inside a transaction with
 * `app.current_user_id` set for its duration via `set_config(...,
 * true)` (a genuine bound parameter, not string-interpolated SQL; the
 * `true` third argument scopes it to the current transaction, required
 * because the pooled DATABASE_URL runs in transaction-pooling mode,
 * where a bare session-level `SET` would not reliably survive to the
 * next statement on a reused connection). Always a backstop on top of
 * the real requireCompanyMembership/requireInvestorMembership/
 * requireFalakRole check, never a replacement for it. Has real effect
 * only for a role without BYPASSRLS (app_runtime) -- neondb_owner
 * (BYPASSRLS=true, used only by migrations/admin tooling, never by the
 * running app) sees every row regardless.
 */
export async function withRlsContext<T>(userId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return fn(tx);
  });
}
