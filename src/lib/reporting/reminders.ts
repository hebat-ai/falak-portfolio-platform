import "server-only";
import { db } from "@/lib/db";
import { sendDeadlineReminderEmail, sendOverdueReminderEmail } from "@/lib/email/send-email";

const UPCOMING_WINDOW_DAYS = 7;
// The cron sweep runs roughly once a day -- this cooldown just guards
// against a duplicate/retried run re-sending the same day's reminder, not
// against sending across different days.
const RESEND_COOLDOWN_HOURS = 20;

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface ReminderSendResult {
  cycleId: string;
  kind: "upcoming" | "overdue";
  recipientCount: number;
}

/**
 * Daily sweep: sends an "upcoming" reminder to a company's active members
 * once its reporting deadline is within UPCOMING_WINDOW_DAYS and the
 * submission isn't yet turned in, and switches to an "overdue" reminder
 * once the deadline has passed. At most one email per cycle per sweep run,
 * guarded by lastReminderSentAt's cooldown (not per-threshold dedup --
 * a company still mid-window just gets reminded again the next day, which
 * is the desired behavior, not a bug).
 *
 * `now` is injectable so tests can drive it with a fixed clock instead of
 * depending on the real one; production/cron use leaves it as the default.
 */
export async function sendDueReminders(now: Date = new Date()): Promise<ReminderSendResult[]> {
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is not set.");
  }

  const cycles = await db.reportingCycle.findMany({
    where: {
      status: "Open",
      company: { archivedAt: null },
      OR: [{ submission: null }, { submission: { status: { in: ["draft", "changes_requested"] } } }],
    },
    select: {
      id: true,
      periodLabel: true,
      currentDeadline: true,
      lastReminderSentAt: true,
      company: {
        select: {
          slug: true,
          nameEn: true,
          memberships: {
            where: { revokedAt: null },
            select: { user: { select: { email: true } } },
          },
        },
      },
    },
  });

  const results: ReminderSendResult[] = [];

  for (const cycle of cycles) {
    const daysUntilDeadline = Math.floor(
      (cycle.currentDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = cycle.currentDeadline.getTime() < now.getTime();
    const isUpcoming = !isOverdue && daysUntilDeadline <= UPCOMING_WINDOW_DAYS;
    if (!isOverdue && !isUpcoming) continue;

    if (cycle.lastReminderSentAt) {
      const hoursSinceLastReminder = (now.getTime() - cycle.lastReminderSentAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReminder < RESEND_COOLDOWN_HOURS) continue;
    }

    const recipients = cycle.company.memberships.map((m) => m.user.email);
    if (recipients.length === 0) continue;

    const kind: "upcoming" | "overdue" = isOverdue ? "overdue" : "upcoming";
    const formUrl = `${baseUrl}/submit/${cycle.company.slug}`;
    const deadlineLabel = toDateOnly(cycle.currentDeadline);

    for (const email of recipients) {
      if (kind === "overdue") {
        await sendOverdueReminderEmail(email, cycle.company.nameEn, cycle.periodLabel, deadlineLabel, formUrl);
      } else {
        await sendDeadlineReminderEmail(email, cycle.company.nameEn, cycle.periodLabel, deadlineLabel, formUrl);
      }
    }

    await db.reportingCycle.update({
      where: { id: cycle.id },
      data: { lastReminderSentAt: now, lastReminderKind: kind },
    });

    results.push({ cycleId: cycle.id, kind, recipientCount: recipients.length });
  }

  return results;
}
