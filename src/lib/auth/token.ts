import "server-only";
import { randomBytes, createHash } from "node:crypto";

const RAW_TOKEN_BYTES = 32;

/**
 * A fresh, unpredictable raw token for any single-use, hashed-at-rest flow
 * (invite links, sign-in verification links). Only ever handed to the
 * caller to embed in a URL or hash immediately -- never itself persisted.
 */
export function generateRawToken(): string {
  return randomBytes(RAW_TOKEN_BYTES).toString("hex");
}

/**
 * Deterministic hash of a raw sign-in token, for looking up and comparing
 * against EmailVerificationToken.tokenHash. Never store or log the raw
 * token itself -- only this hash ever touches the database or a log line.
 * Same SHA-256 technique as invite-token.ts's hashInviteToken, kept as its
 * own function since the two token families (company invites vs. sign-in
 * links) are otherwise deliberately unrelated.
 */
export function hashSignInToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
