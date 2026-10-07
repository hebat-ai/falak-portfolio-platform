"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { updateReportingTemplateAction, type ActionState } from "../../actions";
import { labelClass, fieldClass, FormMessage, useEntityForm } from "./shared";
import type { TemplateForEdit } from "@/lib/admin/template-edit";

const METRIC_DATA_TYPES = ["Currency", "Percent", "Number", "Text", "Boolean"] as const;

export function EditReportingTemplateForm({ template }: { template: TemplateForEdit }) {
  const { state, formAction, isPending, formRef, formKey } = useEntityForm(updateReportingTemplateAction);
  // Kept outside the remounting form, so added rows survive a rejected save.
  const [newRows, setNewRows] = useState(0);
  return (
    <TemplateFields
      key={formKey}
      state={state}
      template={template}
      formAction={formAction}
      formRef={formRef}
      isPending={isPending}
      newRows={newRows}
      addRow={() => setNewRows((n) => n + 1)}
    />
  );
}

function TemplateFields({
  state,
  template,
  formAction,
  formRef,
  isPending,
  newRows,
  addRow,
}: {
  state: ActionState;
  template: TemplateForEdit;
  formAction: (formData: FormData) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  isPending: boolean;
  newRows: number;
  addRow: () => void;
}) {
  const { t } = useLanguage();
  // After a rejected save, show what was submitted; otherwise the saved template.
  const text = (name: string, saved: string) => (state.values ? String(state.values[name] ?? "") : saved);
  const checked = (name: string, saved: boolean) => (state.values ? state.values[name] === "on" : saved);

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="templateId" value={template.id} />
      {template.cycleCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t.admin.manage.templateInUseNote.replace("{count}", String(template.cycleCount))}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={fieldClass}>
          <label className={labelClass} htmlFor="tpl-nameEn">{t.admin.manage.nameEnLabel}</label>
          <Input id="tpl-nameEn" name="nameEn" required defaultValue={text("nameEn", template.nameEn)} />
        </div>
        <div className={fieldClass}>
          <label className={labelClass} htmlFor="tpl-nameAr">{t.admin.manage.nameArLabel}</label>
          <Input id="tpl-nameAr" name="nameAr" dir="rtl" required defaultValue={text("nameAr", template.nameAr)} />
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="templateActive" defaultChecked={checked("templateActive", template.isActive)} />
        {t.admin.manage.templateActiveLabel}
      </label>

      <div className="flex flex-col gap-3">
        {template.metrics.map((m) => (
          <div key={m.id} className="chamfer-br-sm flex flex-col gap-2 p-3 shadow-[var(--inner-line)]">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_10rem_5rem]">
              <Input
                aria-label={t.admin.manage.metricKeyLabel}
                name={`key_${m.id}`}
                defaultValue={text(`key_${m.id}`, m.key)}
                disabled={m.hasValues}
              />
              <Input
                aria-label={t.admin.manage.metricLabelEnLabel}
                name={`labelEn_${m.id}`}
                defaultValue={text(`labelEn_${m.id}`, m.labelEn)}
              />
              <Input
                aria-label={t.admin.manage.metricLabelArLabel}
                name={`labelAr_${m.id}`}
                dir="rtl"
                defaultValue={text(`labelAr_${m.id}`, m.labelAr)}
              />
              <Select
                aria-label={t.admin.manage.metricDataTypeLabel}
                name={`dataType_${m.id}`}
                defaultValue={text(`dataType_${m.id}`, m.dataType)}
                disabled={m.hasValues}
              >
                {METRIC_DATA_TYPES.map((dt) => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </Select>
              <Input
                aria-label={t.admin.manage.metricOrderLabel}
                name={`sortOrder_${m.id}`}
                type="number"
                step={1}
                defaultValue={text(`sortOrder_${m.id}`, String(m.sortOrder))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <label className="inline-flex items-center gap-1.5 text-foreground">
                <input type="checkbox" name={`required_${m.id}`} defaultChecked={checked(`required_${m.id}`, m.required)} />
                {t.admin.manage.metricRequiredLabel}
              </label>
              <label className="inline-flex items-center gap-1.5 text-foreground">
                <input type="checkbox" name={`isActive_${m.id}`} defaultChecked={checked(`isActive_${m.id}`, m.isActive)} />
                {t.admin.manage.metricActiveLabel}
              </label>
              {m.hasValues ? <span>{t.admin.manage.metricLockedNote}</span> : null}
            </div>
          </div>
        ))}

        {Array.from({ length: newRows }, (_, i) => (
          <div key={`new-${i}`} className="chamfer-br-sm grid grid-cols-1 gap-2 p-3 shadow-[var(--inner-line)] sm:grid-cols-4">
            <Input name={`newKey_${i}`} placeholder={t.admin.manage.metricKeyOptionalLabel} defaultValue={text(`newKey_${i}`, "")} />
            <Input name={`newLabelEn_${i}`} placeholder={t.admin.manage.metricLabelEnLabel} defaultValue={text(`newLabelEn_${i}`, "")} />
            <Input
              name={`newLabelAr_${i}`}
              dir="rtl"
              placeholder={t.admin.manage.metricLabelArLabel}
              defaultValue={text(`newLabelAr_${i}`, "")}
            />
            <Select name={`newDataType_${i}`} defaultValue={text(`newDataType_${i}`, "")}>
              <option value="" disabled>{t.admin.manage.metricDataTypeLabel}</option>
              {METRIC_DATA_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </Select>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="w-fit" onClick={addRow}>
        {t.admin.manage.addMetricAction}
      </Button>

      <FormMessage state={state} />
      <Button type="submit" disabled={isPending} className="w-fit">
        {t.admin.manage.saveChangesLabel}
      </Button>
    </form>
  );
}
