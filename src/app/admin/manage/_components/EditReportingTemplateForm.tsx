"use client";

import { useState } from "react";
import { useForm } from "@/components/forms/useForm";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { updateReportingTemplateAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { TemplateForEdit } from "@/lib/admin/template-edit";

const METRIC_DATA_TYPES = ["Currency", "Percent", "Number", "Text", "Boolean"] as const;

export function EditReportingTemplateForm({ template }: { template: TemplateForEdit }) {
  const { t } = useLanguage();
  const { state, isPending, errorFor, formProps } = useForm(updateReportingTemplateAction, initialActionState, {
    resetOnSuccess: false,
  });
  const [newRows, setNewRows] = useState(0);

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="templateId" value={template.id} />
      {template.cycleCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t.admin.manage.templateInUseNote.replace("{count}", String(template.cycleCount))}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={fieldClass}>
          <label className={labelClass} htmlFor="tpl-nameEn">{t.admin.manage.nameEnLabel}</label>
          <Input id="tpl-nameEn" name="nameEn" required defaultValue={template.nameEn} />
          {errorFor("nameEn")}
        </div>
        <div className={fieldClass}>
          <label className={labelClass} htmlFor="tpl-nameAr">{t.admin.manage.nameArLabel}</label>
          <Input id="tpl-nameAr" name="nameAr" dir="rtl" required defaultValue={template.nameAr} />
          {errorFor("nameAr")}
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="templateActive" defaultChecked={template.isActive} />
        {t.admin.manage.templateActiveLabel}
      </label>

      <div className="flex flex-col gap-3">
        {template.metrics.map((m) => (
          <div key={m.id} className="chamfer-br-sm flex flex-col gap-2 p-3 shadow-[var(--inner-line)]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_10rem_5rem]">
              <div className="flex flex-col gap-1">
                <Input aria-label={t.admin.manage.metricKeyLabel} name={`key_${m.id}`} defaultValue={m.key} disabled={m.hasValues} />
                {errorFor(`key_${m.id}`)}
              </div>
              <div className="flex flex-col gap-1">
                <Input aria-label={t.admin.manage.metricLabelEnLabel} name={`labelEn_${m.id}`} defaultValue={m.labelEn} />
                {errorFor(`labelEn_${m.id}`)}
              </div>
              <div className="flex flex-col gap-1">
                <Input aria-label={t.admin.manage.metricLabelArLabel} name={`labelAr_${m.id}`} dir="rtl" defaultValue={m.labelAr} />
                {errorFor(`labelAr_${m.id}`)}
              </div>
              <div className="flex flex-col gap-1">
                <Select
                  aria-label={t.admin.manage.metricDataTypeLabel}
                  name={`dataType_${m.id}`}
                  defaultValue={m.dataType}
                  disabled={m.hasValues}
                >
                  {METRIC_DATA_TYPES.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </Select>
                {errorFor(`dataType_${m.id}`)}
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  aria-label={t.admin.manage.metricOrderLabel}
                  name={`sortOrder_${m.id}`}
                  type="number"
                  step={1}
                  defaultValue={String(m.sortOrder)}
                />
                {errorFor(`sortOrder_${m.id}`)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <label className="inline-flex items-center gap-1.5 text-foreground">
                <input type="checkbox" name={`required_${m.id}`} defaultChecked={m.required} />
                {t.admin.manage.metricRequiredLabel}
              </label>
              <label className="inline-flex items-center gap-1.5 text-foreground">
                <input type="checkbox" name={`isActive_${m.id}`} defaultChecked={m.isActive} />
                {t.admin.manage.metricActiveLabel}
              </label>
              {m.hasValues ? <span>{t.admin.manage.metricLockedNote}</span> : null}
            </div>
          </div>
        ))}

        {Array.from({ length: newRows }, (_, i) => (
          <div key={`new-${i}`} className="chamfer-br-sm grid grid-cols-1 gap-2 p-3 shadow-[var(--inner-line)] sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <Input name={`newKey_${i}`} placeholder={t.admin.manage.metricKeyOptionalLabel} />
              {errorFor(`newKey_${i}`)}
            </div>
            <div className="flex flex-col gap-1">
              <Input name={`newLabelEn_${i}`} placeholder={t.admin.manage.metricLabelEnLabel} />
              {errorFor(`newLabelEn_${i}`)}
            </div>
            <div className="flex flex-col gap-1">
              <Input name={`newLabelAr_${i}`} dir="rtl" placeholder={t.admin.manage.metricLabelArLabel} />
              {errorFor(`newLabelAr_${i}`)}
            </div>
            <div className="flex flex-col gap-1">
              <Select name={`newDataType_${i}`} defaultValue="">
                <option value="" disabled>{t.admin.manage.metricDataTypeLabel}</option>
                {METRIC_DATA_TYPES.map((dt) => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </Select>
              {errorFor(`newDataType_${i}`)}
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="w-fit" onClick={() => setNewRows((n) => n + 1)}>
        {t.admin.manage.addMetricAction}
      </Button>

      <FormMessage state={state} />
      <Button type="submit" disabled={isPending} className="w-fit">
        {t.admin.manage.saveChangesLabel}
      </Button>
    </form>
  );
}
