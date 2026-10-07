import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashInviteToken } from "@/lib/auth/invite-token";
import { normalizeEmail } from "@/lib/auth/utils";
import { writeAuditEvent } from "@/lib/audit/write-audit-event";
import { sendReportRequestEmail } from "@/lib/email/send-email";

const INVITE_EXPIRY_DAYS = 14;

export interface ReportRequestNotifyResult {
  emailed: string[];
  invited: string[];
  noContact: string[];
  failed: string[];
}

/**
 * Emails a report request to each startup: to its active users, or -- when
 * it has none yet -- to its founder email as an invitation that grants
 * access and leads to the form. Startups with neither are reported back
 * so staff know to add a contact. Never throws for a failed send; the
 * request itself already exists and a reminder or "Email again" can retry.
 */
export async function notifyReportRequest(
  companyIds: string[],
  request: { periodLabel: string; deadline: Date },
  actorId: string
): Promise<ReportRequestNotifyResult> {
  const result: ReportRequestNotifyResult = { emailed: [], invited: [], noContact: [], failed: [] };
  const baseUrl = process.env.APP_BASE_URL;
  const deadline = request.deadline.toISOString().slice(0, 10);

  let companies;
  try {
    if (!baseUrl) throw new Error("APP_BASE_URL is not configured");
    companies = await db.company.findMany({
      where: { id: { in: companyIds }, archivedAt: null },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        founderEmail: true,
        memberships: {
          where: { revokedAt: null, user: { deactivatedAt: null } },
          select: { user: { select: { email: true } } },
        },
      },
    });
  } catch (error) {
    // The requests already exist; report delivery as failed rather than break.
    console.error("Report request emails could not be prepared:", error);
    return { ...result, failed: [`${companyIds.length} startup(s)`] };
  }

  for (const company of companies) {
    const memberEmails = [...new Set(company.memberships.map((m) => m.user.email))];
    try {
      if (memberEmails.length > 0) {
        for (const to of memberEmails) {
          await sendReportRequestEmail(to, {
            companyName: company.nameEn,
            periodLabel: request.periodLabel,
            deadline,
            url: `${baseUrl!}/submit/${company.slug}`,
            isInvite: false,
          });
        }
        result.emailed.push(company.nameEn);
      } else if (company.founderEmail) {
        const email = normalizeEmail(company.founderEmail);
        const rawToken = randomBytes(32).toString("hex");
        await db.$transaction(async (tx) => {
          const invite = await tx.companyInvite.create({
            data: {
              companyId: company.id,
              email,
              tokenHash: hashInviteToken(rawToken),
              invitedById: actorId,
              expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
            },
          });
          await writeAuditEvent(tx, { actorId, action: "invite.created", targetType: "CompanyInvite", targetId: invite.id });
        });
        await sendReportRequestEmail(email, {
          companyName: company.nameEn,
          periodLabel: request.periodLabel,
          deadline,
          url: `${baseUrl!}/accept-invite?token=${rawToken}`,
          isInvite: true,
        });
        result.invited.push(company.nameEn);
      } else {
        result.noContact.push(company.nameEn);
      }
    } catch (error) {
      console.error(`Report request email failed for ${company.nameEn}:`, error);
      result.failed.push(company.nameEn);
    }
  }
  return result;
}

/** One line for staff, e.g. "Emailed: A, B. Invited founder: C. No contact on file: D (add a founder email or invite a user)." */
export function describeNotifyResult(r: ReportRequestNotifyResult): string {
  const parts: string[] = [];
  if (r.emailed.length) parts.push(`Emailed: ${r.emailed.join(", ")}.`);
  if (r.invited.length) parts.push(`Invited founder by email: ${r.invited.join(", ")}.`);
  if (r.noContact.length) parts.push(`No contact on file, not emailed: ${r.noContact.join(", ")} (add a founder email or invite a user).`);
  if (r.failed.length) parts.push(`Email failed for: ${r.failed.join(", ")} (try "Email again").`);
  return parts.join(" ");
}
