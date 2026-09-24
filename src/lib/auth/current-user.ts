import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export interface CurrentUser {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The one source of truth for "who is making this request" on the server.
 * Reads the Auth.js session, extracts only the immutable user id from the
 * JWT, then re-queries the database for that user -- rejecting a session
 * whose user no longer exists or has since been deactivated. Deliberately
 * excludes passwordHash from the returned shape so it can never leak into
 * a component prop or action response by accident.
 *
 * Call this from every protected server page, route handler, and server
 * action. proxy.ts is navigation convenience only and must never be
 * treated as a substitute for calling this.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (typeof userId !== "string" || !userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, deactivatedAt: true, createdAt: true, updatedAt: true },
  });

  if (!user || user.deactivatedAt) {
    return null;
  }

  return { id: user.id, email: user.email, createdAt: user.createdAt, updatedAt: user.updatedAt };
}
