"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createVehicleNavAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { AdminVehicleDTO } from "@/lib/admin/dto";

export function CreateVehicleValuationForm({ vehicles }: { vehicles: AdminVehicleDTO[] }) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(createVehicleNavAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="vv-vehicle">{t.admin.manage.vehicleLabel}</label>
        <Select id="vv-vehicle" name="vehicleId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{lang === "ar" ? v.nameAr : v.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="vv-date">{t.admin.manage.asOfDateLabel}</label>
        <Input id="vv-date" name="asOfDate" type="date" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="vv-amount">{t.admin.manage.navAmountLabel}</label>
        <Input id="vv-amount" name="navAmount" inputMode="decimal" pattern="\d+(\.\d{1,4})?" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="vv-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="vv-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="vv-source">{t.admin.manage.sourceLabel}</label>
        <Input id="vv-source" name="source" type="text" />
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
