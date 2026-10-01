import type { SubmissionStatus } from "@/generated/prisma/client";

// Statuses a CompanySubmission may be submitted FROM -- also the exact
// set its metric VALUES may still be edited in (see metrics.ts's
// saveMetricValues). Its own file so submissions.ts and metrics.ts can
// both import it without a circular dependency between them (metrics.ts
// needs this constant; submissions.ts needs metrics.ts's
// fetchSubmissionMetricFields).
export const SUBMITTABLE_FROM_STATUSES: SubmissionStatus[] = ["draft", "changes_requested"];
