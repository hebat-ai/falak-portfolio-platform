"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function TemplateList({ templates }: { templates: { id: string; nameEn: string; nameAr: string; isActive: boolean }[] }) {
  const { t, lang } = useLanguage();

  if (templates.length === 0) {
    return <p className="text-xs text-muted-foreground">{t.admin.emptyState}</p>;
  }

  return (
    <ul className="chamfer-br-md divide-y divide-border-subtle shadow-[var(--inner-line)]">
      {templates.map((tpl) => (
        <li key={tpl.id} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-sm text-foreground">
            {lang === "ar" ? tpl.nameAr : tpl.nameEn}
            {!tpl.isActive ? <span className="ms-2 text-xs text-muted-foreground">({t.admin.manage.templateInactiveLabel})</span> : null}
          </span>
          <Link
            href={`/admin/manage/edit-reporting-template/${tpl.id}`}
            className="chamfer-br-sm inline-flex items-center px-2 py-1 text-xs font-bold text-link-foreground shadow-[inset_0_0_0_2px_var(--brand-dark-nebula)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
          >
            {t.admin.manage.editAction}
          </Link>
        </li>
      ))}
    </ul>
  );
}
