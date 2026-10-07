"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useListView, byText, byValue } from "@/components/lists/useListView";

interface Template {
  id: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  updatedAt: string;
}

export function TemplateList({ templates }: { templates: Template[] }) {
  const { t, lang } = useLanguage();
  const name = (tpl: Template) => (lang === "ar" ? tpl.nameAr : tpl.nameEn);
  const { visible, controls, empty } = useListView(templates, {
    id: "templates",
    searchText: (tpl) => `${tpl.nameEn} ${tpl.nameAr}`,
    sorts: [
      byValue("recent", t.lists.recentlyUpdated, (tpl) => tpl.updatedAt, true),
      byText("nameAsc", t.lists.nameAsc, name),
      byText("nameDesc", t.lists.nameDesc, name, true),
      byValue("oldest", t.lists.oldestFirst, (tpl) => tpl.updatedAt),
    ],
  });

  if (templates.length === 0) {
    return <p className="text-xs text-muted-foreground">{t.admin.emptyState}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {controls}
      {empty}
      <ul className="chamfer-br-md divide-y divide-border-subtle shadow-[var(--inner-line)]">
        {visible.map((tpl) => (
          <li key={tpl.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-sm text-foreground">
              {name(tpl)}
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
    </div>
  );
}
