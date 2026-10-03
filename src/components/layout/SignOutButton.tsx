"use client";

import { LogOut } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { signOutAction } from "@/app/account/actions";

// Same server action the /account page's own sign-out button already
// uses (src/app/account/actions.ts) -- a Server Action can be used as a
// <form action={...}> target directly from a Client Component, so this
// needs no client-side signOut() call of its own. Placed in the global
// TopHeader (via AppShell) so it's reachable from every authenticated
// page, not just /account.
export function SignOutButton({ className = "" }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <form action={signOutAction}>
      <button
        type="submit"
        aria-label={t.nav.signOut}
        title={t.nav.signOut}
        className={`chamfer-br-sm inline-flex items-center justify-center bg-surface p-1.5 text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${className}`}
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
      </button>
    </form>
  );
}
