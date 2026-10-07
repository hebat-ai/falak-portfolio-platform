"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { canGoBack, subscribe } from "@/lib/navigation-history";

const className =
  "chamfer-br-sm inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground";

/**
 * Returns to the previous page in the app. Hidden when there is no previous
 * in-app page (e.g. opened from an email) -- unless `fallbackHref` is given,
 * in which case it links there instead.
 */
export function BackButton({ fallbackHref, label }: { fallbackHref?: string; label?: string }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const hasHistory = useSyncExternalStore(subscribe, canGoBack, () => false);
  const Icon = lang === "ar" ? ArrowRight : ArrowLeft;
  const content = (
    <>
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label ?? t.nav.back}
    </>
  );

  if (hasHistory) {
    return (
      <button type="button" onClick={() => router.back()} className={className}>
        {content}
      </button>
    );
  }
  if (fallbackHref) {
    return (
      <Link href={fallbackHref} className={className}>
        {content}
      </Link>
    );
  }
  return null;
}
