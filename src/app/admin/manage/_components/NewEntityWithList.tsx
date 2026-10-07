"use client";

import { Children, type ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface NewEntityWithListProps {
  listTitleKey: keyof Pick<Dictionary["admin"]["manage"], "vehiclesListTitle" | "investorsListTitle" | "companiesListTitle" | "templatesListTitle">;
  children: ReactNode;
}

// Pairs a create-form with its entity's ArchivableList below a small
// heading -- the same grouping ManagePanel.tsx used to render inline for
// vehicles/investors, now reused by the New Vehicle and New Investor
// subsection pages. Expects exactly two children: the form, then the list.
export function NewEntityWithList({ listTitleKey, children }: NewEntityWithListProps) {
  const { t } = useLanguage();
  const [form, list] = Children.toArray(children);

  return (
    <div className="flex flex-col gap-4">
      {form}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold text-muted-foreground">{t.admin.manage[listTitleKey]}</h4>
        {list}
      </div>
    </div>
  );
}
