"use client";

import { FileText, Send, Search, MessageSquareWarning, CheckCircle2, type LucideIcon } from "lucide-react";
import type { SubmissionStatus } from "@/generated/prisma/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const STATUS_ICON: Record<SubmissionStatus, LucideIcon> = {
  draft: FileText,
  submitted: Send,
  under_review: Search,
  changes_requested: MessageSquareWarning,
  approved: CheckCircle2,
};

// All badges share one background (bg-surface-muted, which flips
// correctly per theme) -- status differentiation is icon SHAPE (primary)
// plus a small set of theme-safe icon colors (secondary reinforcement),
// never the badge background. This also fixes a dark-mode bug: the old
// per-status tinted backgrounds (dark-nebula/5, dark-nebula/10) would
// have been nearly invisible against an already-dark page.
const STATUS_ICON_COLOR: Record<SubmissionStatus, string> = {
  draft: "text-muted-foreground",
  submitted: "text-nebula-aqua",
  under_review: "text-foreground",
  changes_requested: "text-foreground",
  approved: "text-nebula-aqua",
};

interface StatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { t } = useLanguage();
  const Icon = STATUS_ICON[status];
  const iconColor = STATUS_ICON_COLOR[status];
  const { label, description } = t.status[status];

  // rounded-full is intentional and NOT part of the chamfer-corner sweep --
  // the Falak Ventures design system explicitly exempts status pills (and
  // avatars/switch tracks) from the chamfer rule; radius stays at 0
  // everywhere else. Icons stay lucide-react here too: this status set's
  // shape is the primary signal (see STATUS_ICON_COLOR's comment above),
  // and the brand's 39-icon set has no equivalent for "submitted" or
  // "changes_requested" -- mixing brand + lucide icons within one
  // tightly-coupled set would read as more inconsistent than uniformly
  // lucide, so this badge is deliberately left out of the brand-icon swap.
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground ${className}`}
    >
      <Icon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
      <span>{label}</span>
      <span className="sr-only"> — {description}</span>
    </span>
  );
}
