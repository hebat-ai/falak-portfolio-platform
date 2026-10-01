"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ManageSubNav } from "./ManageSubNav";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface ManageSubsectionShellProps {
  titleKey: keyof Dictionary["admin"]["manage"];
  children: ReactNode;
}

// Shared page frame for every /admin/manage/* subsection: AppShell +
// ManageSubNav, with the page's own title sourced from the same
// manage.* dictionary object ManageSubNav's labels already come from, so
// a subsection's page title and its own nav link always say the same
// thing. `children` is passed in from each subsection's server-component
// page.tsx (which does its own auth gate + data fetch, same pattern as
// every other admin page) -- this component only owns translation and
// layout, never data fetching.
export function ManageSubsectionShell({ titleKey, children }: ManageSubsectionShellProps) {
  const { t } = useLanguage();

  return (
    <AppShell title={t.admin.manage[titleKey]} subtitle={t.admin.manage.sectionTitle}>
      <div className="space-y-4">
        <ManageSubNav />
        {children}
      </div>
    </AppShell>
  );
}
