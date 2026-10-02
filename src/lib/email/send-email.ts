import "server-only";
import { Resend } from "resend";

const FROM_ADDRESS = "Falak Portfolio Platform <noreply@falakinvestments.space>";

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

/**
 * Sent once, right after an admin approves an AccessRequest -- same
 * network I/O boundary and never-swallow-a-real-failure discipline as
 * sendSignInEmail above. Points at /sign-in rather than carrying a token
 * itself: approval only grants access, it does not authenticate the
 * person, so they still go through the normal passwordless sign-in flow.
 */
export async function sendAccessApprovedEmail(to: string): Promise<void> {
  const resend = getClient();
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is not set.");
  }
  const signInUrl = `${baseUrl}/sign-in`;
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Your Falak Portfolio Platform access has been approved",
    html: `<p>Your access request has been approved. Sign in below to get started.</p><p><a href="${signInUrl}">${signInUrl}</a></p>`,
    text: `Your access request has been approved. Sign in to get started.\n\n${signInUrl}`,
  });
  if (error) {
    throw new Error(`Failed to send access-approved email: ${error.message}`);
  }
}

/**
 * Sent by the daily reminder sweep (src/lib/reporting/reminders.ts) to a
 * company member while a reporting deadline is still upcoming. Same
 * network I/O boundary and never-swallow-a-real-failure discipline as
 * every other function here.
 */
export async function sendDeadlineReminderEmail(
  to: string,
  companyName: string,
  periodLabel: string,
  deadline: string,
  formUrl: string
): Promise<void> {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Reminder: ${periodLabel} report due ${deadline} -- ${companyName}`,
    html: `<p>Your ${periodLabel} report for ${companyName} is due on ${deadline}.</p><p><a href="${formUrl}">${formUrl}</a></p>`,
    text: `Your ${periodLabel} report for ${companyName} is due on ${deadline}.\n\n${formUrl}`,
  });
  if (error) {
    throw new Error(`Failed to send deadline-reminder email: ${error.message}`);
  }
}

/**
 * Sent once a reporting deadline has already passed without a submission.
 * Distinct subject/tone from the upcoming reminder so an inbox can tell
 * the two apart at a glance.
 */
export async function sendOverdueReminderEmail(
  to: string,
  companyName: string,
  periodLabel: string,
  deadline: string,
  formUrl: string
): Promise<void> {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Overdue: ${periodLabel} report -- ${companyName}`,
    html: `<p>The ${periodLabel} report for ${companyName} was due on ${deadline} and has not yet been submitted.</p><p><a href="${formUrl}">${formUrl}</a></p>`,
    text: `The ${periodLabel} report for ${companyName} was due on ${deadline} and has not yet been submitted.\n\n${formUrl}`,
  });
  if (error) {
    throw new Error(`Failed to send overdue-reminder email: ${error.message}`);
  }
}

/**
 * Sent to an investor once a company's report is published and they've
 * been granted access to it -- fired from the review action AFTER
 * publishSubmission's transaction commits, never from inside it (see
 * publish-workflow.ts's own comment on why).
 */
export async function sendReportPublishedEmail(
  to: string,
  companyName: string,
  periodLabel: string,
  reportUrl: string
): Promise<void> {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `New report available: ${companyName} -- ${periodLabel}`,
    html: `<p>A new ${periodLabel} report for ${companyName} has been published and is available for you to view.</p><p><a href="${reportUrl}">${reportUrl}</a></p>`,
    text: `A new ${periodLabel} report for ${companyName} has been published and is available for you to view.\n\n${reportUrl}`,
  });
  if (error) {
    throw new Error(`Failed to send report-published email: ${error.message}`);
  }
}
