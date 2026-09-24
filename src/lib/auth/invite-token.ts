import "server-only";
import { createHash } from "node:crypto";

/**
 * Deterministic hash of a raw invite token, for looking up and comparing
 * against CompanyInvite.tokenHash. Never store or log the raw token
 * itself -- only this hash ever touches the database or a log line.
 */
export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
