"use client";

import { FileText, Send, Search, MessageSquareWarning, CheckCircle2, Globe2, type LucideIcon } from "lucide-react";
import type { ReportingStatus } from "@/lib/mock/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const STATUS_ICON: Record<ReportingStatus, LucideIcon> = {
  draft: FileText,
  submitted: Send,
  under_review: Search,
  changes_requested: MessageSquareWarning,
  approved: CheckCircle2,
  published: Globe2,
};

// All badges share one background (bg-surface-muted, which flips
// correctly per theme) -- status differentiation is icon SHAPE (primary)
// plus a small set of theme-safe icon colors (secondary reinforcement),
// never the badge background. This also fixes a dark-mode bug: the old
// per-status tinted backgrounds (dark-nebula/5, dark-nebula/10) would
// have been nearly invisible against an already-dark page.
const STATUS_ICON_COLOR: Record<ReportingStatus, string> = {
  draft: "text-muted-foreground",
  submitted: "text-nebula-aqua",
  under_review: "text-foreground",
  changes_requested: "text-foreground",
  approved: "text-nebula-aqua",
  published: "text-nebula-aqua",
};

interface StatusBadgeProps {
  status: ReportingStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { t } = useLanguage();
  const Icon = STATUS_ICON[status];
  const iconColor = STATUS_ICON_COLOR[status];
  const { label, description } = t.status[status];

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
