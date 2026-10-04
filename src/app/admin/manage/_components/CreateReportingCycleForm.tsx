"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createReportingCycleAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { AdminCompanyDTO, AdminReportingTemplateDTO } from "@/lib/admin/dto";

export function CreateReportingCycleForm({
  companies,
  templates,
}: {
  companies: AdminCompanyDTO[];
  templates: AdminReportingTemplateDTO[];
}) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(createReportingCycleAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className={labelClass}>{t.admin.manage.companiesLabel}</legend>
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {companies.map((c) => (
            <label key={c.id} className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <input type="checkbox" name="companyIds" value={c.id} />
              {lang === "ar" ? c.nameAr : c.nameEn}
            </label>
          ))}
        </div>
      </fieldset>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-template">{t.admin.manage.templateLabel}</label>
        <Select id="cy-template" name="templateId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>{lang === "ar" ? tpl.nameAr : tpl.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-label">{t.admin.manage.periodLabelLabel}</label>
        <Input id="cy-label" name="periodLabel" required />
      </div>
      <div />
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-start">{t.admin.manage.periodStartLabel}</label>
        <Input id="cy-start" name="periodStart" type="date" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-end">{t.admin.manage.periodEndLabel}</label>
        <Input id="cy-end" name="periodEnd" type="date" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-deadline">{t.admin.manage.deadlineLabel}</label>
        <Input id="cy-deadline" name="deadline" type="date" required />
      </div>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <Button type="submit" disabled={isPending} className="sm:col-span-2 sm:w-fit">
        {t.admin.manage.submitLabel}
      </Button>
    </form>
  );
}
