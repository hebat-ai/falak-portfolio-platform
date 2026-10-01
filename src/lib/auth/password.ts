import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

// Raw, pre-processing input caps -- reject anything outside these BEFORE
// scrypt (a deliberately slow KDF) ever touches the input, same ordering
// discipline as utils.ts's MAX_RAW_EMAIL_LENGTH.
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_RAW_PASSWORD_LENGTH = 200;

/**
 * scrypt, not sha256 -- this codebase's other hashing (token.ts's
 * hashSignInToken) is correctly sha256 because it hashes already-
 * high-entropy random tokens, but a human-chosen password needs a
 * deliberately slow, purpose-built KDF to resist offline brute-force.
 * Stored as "saltHex:keyHex" in User.passwordHash.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

/**
 * Re-derives with the stored salt and compares with timingSafeEqual --
 * restores the timing-attack discipline authorize-sign-in-token.ts's own
 * comment says this project deliberately dropped when passwords were
 * removed the first time around ("none of that file's bcrypt
 * timing-safety machinery carries forward"). A malformed stored value
 * (wrong shape, truncated) is treated as a non-match, never thrown.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;

  const storedKey = Buffer.from(keyHex, "hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  if (storedKey.length !== derived.length) return false;

  return timingSafeEqual(derived, storedKey);
}
