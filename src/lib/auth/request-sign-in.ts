import "server-only";
import { db } from "@/lib/db";
import { generateRawToken, hashSignInToken } from "@/lib/auth/token";
import { normalizeEmail } from "@/lib/auth/utils";
import { sendSignInEmail } from "@/lib/email/send-email";

const TOKEN_EXPIRY_MINUTES = 15;

/**
 * Always resolves the same way regardless of whether `rawEmail` belongs to
 * a real, active account -- the calling Server Action shows one generic
 * "check your email" message either way (the same enumeration-safety
 * discipline as sign-in and invite acceptance), so this function must
 * never let the two cases differ observably other than in timing. Never
 * throws for "no such user" or "deactivated" -- only for a genuine
 * infrastructure failure once a real send is actually attempted.
 */
export async function requestSignInLink(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, deactivatedAt: true },
  });

  if (!user || user.deactivatedAt) {
    return;
  }

  const rawToken = generateRawToken();
  const tokenHash = hashSignInToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await db.emailVerificationToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is not set.");
  }
  const verifyUrl = `${baseUrl}/api/sign-in/verify?token=${rawToken}`;

  await sendSignInEmail(email, verifyUrl);
}
