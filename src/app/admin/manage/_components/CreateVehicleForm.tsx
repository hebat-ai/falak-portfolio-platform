"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createVehicleAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";

export function CreateVehicleForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(createVehicleAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-nameEn">{t.admin.manage.nameEnLabel}</label>
        <Input id="v-nameEn" name="nameEn" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-nameAr">{t.admin.manage.nameArLabel}</label>
        <Input id="v-nameAr" name="nameAr" dir="rtl" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-slug">{t.admin.manage.slugLabel}</label>
        <Input id="v-slug" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-type">{t.admin.manage.typeLabel}</label>
        <Select id="v-type" name="type" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="Fund">{t.vehicleTypes.Fund}</option>
          <option value="SPV">{t.vehicleTypes.SPV}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="v-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
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
