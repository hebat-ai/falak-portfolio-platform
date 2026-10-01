"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createInvestorAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";

export function CreateInvestorForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(createInvestorAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="i-nameEn">{t.admin.manage.nameEnLabel}</label>
        <Input id="i-nameEn" name="nameEn" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="i-nameAr">{t.admin.manage.nameArLabel}</label>
        <Input id="i-nameAr" name="nameAr" dir="rtl" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="i-type">{t.admin.manage.typeLabel}</label>
        <Select id="i-type" name="type" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="Institutional">{t.investorTypes.Institutional}</option>
          <option value="FamilyOffice">{t.investorTypes.FamilyOffice}</option>
          <option value="Individual">{t.investorTypes.Individual}</option>
        </Select>
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
