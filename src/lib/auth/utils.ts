import "server-only";

// Shared, server-only helpers used across the auth flows -- kept in one
// place so normalization can never drift between them.

/**
 * Trim and lowercase an email before every lookup or storage. Applied
 * consistently so "Alice@Example.com" and "alice@example.com " always
 * resolve to the same row.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Raw, pre-processing input caps -- reject anything over these BEFORE any
// normalization, hashing, code-point iteration, or database lookup.
// Measured in plain UTF-16 code units (`.length`), matching what an
// attacker actually controls in the raw request body/query string. A
// value rejected here is never truncated or otherwise modified to make it
// fit -- it's simply refused, with the same generic public error every
// other rejection in its flow already uses.
export const MAX_RAW_EMAIL_LENGTH = 320; // RFC 5321's own maximum mailbox length
export const MAX_RAW_INVITE_TOKEN_LENGTH = 512;
