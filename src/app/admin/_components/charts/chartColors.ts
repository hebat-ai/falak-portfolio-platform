import type { SubmissionStatus } from "@/generated/prisma/client";

// One color per SubmissionStatus, shared by the bar chart's stacking and
// the pie chart's segments so the two views agree with each other. Reads
// the fixed (non theme-flipping) --chart-* tokens from globals.css --
// Recharts takes plain color strings as props, not CSS classes, so this
// resolves the custom properties once at module load rather than
// threading Tailwind classes through SVG props.
function cssVar(name: string): string {
  if (typeof window === "undefined") return "transparent";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getStatusColors(): Record<SubmissionStatus, string> {
  return {
    draft: cssVar("--chart-draft"),
    submitted: cssVar("--chart-submitted"),
    under_review: cssVar("--chart-under-review"),
    changes_requested: cssVar("--chart-changes-requested"),
    approved: cssVar("--chart-approved"),
  };
}

export const STATUS_ORDER: SubmissionStatus[] = ["draft", "submitted", "under_review", "changes_requested", "approved"];
