import "server-only";
import { Resend } from "resend";

// Resend's shared sandbox sender -- works immediately with no domain
// verification. Switch to a verified @falak.sa address here once Falak's
// own domain is verified in Resend; nothing else in the app needs to
// change.
const FROM_ADDRESS = "Falak Portfolio Platform <onboarding@resend.dev>";

let client: Resend | null = null;

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.");
  }
  client ??= new Resend(apiKey);
  return client;
}

/**
 * The one real network I/O boundary for outbound email in this app --
 * every caller goes through this exact function, so it's the single place
 * tests/support/mock-loader.mjs needs to stub to keep the whole test suite
 * network-free. Never throws for the caller to catch-and-hide: a failed
 * send should surface as a real error, since request-sign-in.ts's
 * enumeration-safety guarantee is about the RESPONSE shape, not about
 * silently swallowing a genuine delivery failure.
 */
export async function sendSignInEmail(to: string, verifyUrl: string): Promise<void> {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Sign in to Falak Portfolio Platform",
    html: `<p>Click the link below to sign in. This link expires in 15 minutes and can only be used once.</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    text: `Click the link below to sign in. This link expires in 15 minutes and can only be used once.\n\n${verifyUrl}`,
  });
  if (error) {
    throw new Error(`Failed to send sign-in email: ${error.message}`);
  }
}
