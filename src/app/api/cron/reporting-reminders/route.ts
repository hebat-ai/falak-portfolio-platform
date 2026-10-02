import { NextResponse, type NextRequest } from "next/server";
import { sendDueReminders } from "@/lib/reporting/reminders";

// Vercel Cron calls this on the schedule in vercel.json, authenticating
// itself with the standard `Authorization: Bearer $CRON_SECRET` header
// (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
// A constant-length comparison isn't needed here the way it is for
// user-facing tokens -- CRON_SECRET is a server-to-server deployment
// secret never exposed to a browser, so there's no realistic timing-attack
// surface, just "is this Vercel's own cron, not a stray public request."
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await sendDueReminders();
  return NextResponse.json({ sent: results.length, results });
}
