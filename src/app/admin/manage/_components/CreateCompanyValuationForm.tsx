"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createCompanyValuationAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { AdminCompanyDTO } from "@/lib/admin/dto";

const VALUATION_TYPES = ["LastRound", "InternalMark", "ThirdPartyMark", "Exit", "WrittenOff"] as const;

export function CreateCompanyValuationForm({ companies }: { companies: AdminCompanyDTO[] }) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(createCompanyValuationAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cv-company">{t.admin.manage.companyLabel}</label>
        <Select id="cv-company" name="companyId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{lang === "ar" ? c.nameAr : c.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cv-date">{t.admin.manage.asOfDateLabel}</label>
        <Input id="cv-date" name="asOfDate" type="date" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cv-amount">{t.admin.manage.valuationAmountLabel}</label>
        <Input id="cv-amount" name="valuationAmount" inputMode="decimal" pattern="\d+(\.\d{1,4})?" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cv-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="cv-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cv-type">{t.admin.manage.valuationTypeLabel}</label>
        <Select id="cv-type" name="valuationType" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {VALUATION_TYPES.map((vt) => (
            <option key={vt} value={vt}>{t.valuationTypes[vt]}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cv-source">{t.admin.manage.sourceLabel}</label>
        <Input id="cv-source" name="source" type="text" />
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
