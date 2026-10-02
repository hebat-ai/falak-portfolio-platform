import "server-only";
import { db } from "@/lib/db";
import { requireFalakRole } from "@/lib/auth/authorization";

const PAGE_SIZE = 50;

export interface AuditEventDTO {
  id: string;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export interface AuditEventPage {
  events: AuditEventDTO[];
  hasMore: boolean;
  actions: string[];
}

/**
 * FALAK_ADMIN-only -- deliberately stricter than the FALAK_OPERATIONS
 * floor every other /admin/manage subsection uses, since this exposes
 * every actor's activity across the whole platform, not one resource at
 * a time. `action` filters to an exact match (one of the real, distinct
 * action strings already in the table -- never a client-invented one,
 * though an unknown value simply matches nothing rather than erroring).
 * Append-only table (see AuditEvent's own schema comment and
 * app_runtime_grants.sql) -- this is a read-only view, no mutation UI.
 */
export async function getAuditEvents(page: number = 1, action?: string): Promise<AuditEventPage> {
  await requireFalakRole("FALAK_ADMIN");

  const skip = (Math.max(page, 1) - 1) * PAGE_SIZE;

  const [rows, distinctActions] = await Promise.all([
    db.auditEvent.findMany({
      where: action ? { action } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE + 1,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        createdAt: true,
        actor: { select: { email: true } },
      },
    }),
    db.auditEvent.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const events: AuditEventDTO[] = rows.slice(0, PAGE_SIZE).map((r) => ({
    id: r.id,
    actorEmail: r.actor?.email ?? null,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    createdAt: r.createdAt.toISOString(),
  }));

  return { events, hasMore, actions: distinctActions.map((a) => a.action) };
}
