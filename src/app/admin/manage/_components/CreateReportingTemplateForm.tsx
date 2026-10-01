"use client";

import { useActionState, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createReportingTemplateAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";

const METRIC_DATA_TYPES = ["Currency", "Percent", "Number", "Text", "Boolean"] as const;

export function CreateReportingTemplateForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(createReportingTemplateAction, initialActionState);
  const [metricRowCount, setMetricRowCount] = useState(3);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={fieldClass}>
          <label className={labelClass} htmlFor="tpl-nameEn">{t.admin.manage.nameEnLabel}</label>
          <Input id="tpl-nameEn" name="nameEn" required />
        </div>
        <div className={fieldClass}>
          <label className={labelClass} htmlFor="tpl-nameAr">{t.admin.manage.nameArLabel}</label>
          <Input id="tpl-nameAr" name="nameAr" dir="rtl" required />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: metricRowCount }, (_, i) => (
          <div key={i} className="chamfer-br-sm grid grid-cols-1 gap-2 p-3 shadow-[var(--inner-line)] sm:grid-cols-4">
            <Input name={`metricKey_${i}`} placeholder={t.admin.manage.metricKeyLabel} />
            <Input name={`metricLabelEn_${i}`} placeholder={t.admin.manage.metricLabelEnLabel} />
            <Input name={`metricLabelAr_${i}`} dir="rtl" placeholder={t.admin.manage.metricLabelArLabel} />
            <Select name={`metricDataType_${i}`} defaultValue="">
              <option value="" disabled>{t.admin.manage.metricDataTypeLabel}</option>
              {METRIC_DATA_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </Select>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="w-fit" onClick={() => setMetricRowCount((n) => n + 1)}>
        {t.admin.manage.addMetricAction}
      </Button>

      <FormMessage state={state} />
      <Button type="submit" disabled={isPending} className="w-fit">
        {t.admin.manage.submitLabel}
      </Button>
    </form>
  );
}
