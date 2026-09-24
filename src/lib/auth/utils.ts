import "server-only";

// Shared, server-only helpers used by both the credentials sign-in flow
// and the invite-acceptance flow -- kept in one place so normalization and
// password policy can never drift between the two.

/**
 * Trim and lowercase an email before every lookup or storage. Applied
 * consistently so "Alice@Example.com" and "alice@example.com " always
 * resolve to the same row.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * NFC-normalize a password before validation, hashing (invite acceptance),
 * and bcryptjs.compare (sign-in) -- applied consistently in all three
 * places so the same logical password always produces the same bytes,
 * regardless of which Unicode normalization form the user's keyboard/IME
 * happened to produce. Never trims, lowercases, or otherwise alters the
 * password -- whitespace and case are part of the password itself.
 */
export function normalizePassword(password: string): string {
  return password.normalize("NFC");
}

// bcrypt (and bcryptjs) is limited to 72 BYTES of input -- this is a
// bcrypt implementation constraint, not a chosen strength policy. A
// password over this limit is rejected outright, never truncated: silent
// truncation would make two different long passwords silently "the same"
// password.
export const MAX_PASSWORD_BYTES = 72;
export const MIN_PASSWORD_LENGTH = 15;

// Centralized so invite-acceptance hashing and the sign-in flow's timing-
// safety dummy hash (see src/auth.ts) can never silently diverge onto
// different cost factors.
export const BCRYPT_COST_FACTOR = 12;

// Raw, pre-processing input caps -- reject anything over these BEFORE any
// normalization, hashing, code-point iteration, or database lookup.
// Measured in plain UTF-16 code units (`.length`), matching what an
// attacker actually controls in the raw request body/query string. These
// are DoS-prevention bounds on the *input*, distinct from
// MIN_PASSWORD_LENGTH/MAX_PASSWORD_BYTES above, which are the *policy* for
// an acceptable password after normalization. A value rejected here is
// never truncated or otherwise modified to make it fit -- it's simply
// refused, with the same generic public error every other rejection in
// its flow already uses.
export const MAX_RAW_EMAIL_LENGTH = 320; // RFC 5321's own maximum mailbox length
export const MAX_RAW_PASSWORD_LENGTH = 256;
export const MAX_RAW_INVITE_TOKEN_LENGTH = 512;

/**
 * Returns a user-facing error string, or null if the password is
 * acceptable. Length is measured in Unicode code points after NFC
 * normalization, not JavaScript UTF-16 code units. Each remaining code
 * point counts once; some combining sequences may still contain multiple
 * code points when NFC does not compose them into a single character.
 * Deliberately no composition rules (uppercase/digit/symbol requirements)
 * -- those push users toward predictable patterns without materially
 * improving security.
 *
 * NOT implemented here, and required before any public production launch:
 * - checking the password against a breached/common-password blocklist
 * - rate limiting login/password-set attempts
 * Both are out of scope for this step; do not treat this policy as
 * production-complete without them.
 */
export function validatePassword(password: string): string | null {
  const normalizedPassword = normalizePassword(password);
  const characterCount = Array.from(normalizedPassword).length;

  if (characterCount < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (Buffer.byteLength(normalizedPassword, "utf8") > MAX_PASSWORD_BYTES) {
    return "Password is too long.";
  }
  return null;
}
