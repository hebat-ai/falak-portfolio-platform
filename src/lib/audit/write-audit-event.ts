import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export interface AuditEventInput {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}

/**
 * Appends one AuditEvent row. Always call this as the LAST statement
 * inside the same transaction as the mutation it records -- never as a
 * separate write -- so a failed audit insert rolls back the mutation too,
 * and a successful mutation can never silently skip its audit trail. The
 * table is append-only by design (see AuditEvent's own schema comment and
 * app_runtime_grants.sql, which grants SELECT/INSERT only, never UPDATE or
 * DELETE): this function has no update/delete counterpart, deliberately.
 */
export async function writeAuditEvent(tx: Prisma.TransactionClient, event: AuditEventInput): Promise<void> {
  await tx.auditEvent.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      meta: event.meta as Prisma.InputJsonValue | undefined,
    },
  });
}
