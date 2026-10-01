"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { linkVehicleToCompanyAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { AdminCompanyDTO, AdminVehicleDTO } from "@/lib/admin/dto";

export function LinkVehicleToCompanyForm({ companies, vehicles }: { companies: AdminCompanyDTO[]; vehicles: AdminVehicleDTO[] }) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(linkVehicleToCompanyAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-company">{t.admin.manage.companyLabel}</label>
        <Select id="l-company" name="companyId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{lang === "ar" ? c.nameAr : c.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-vehicle">{t.admin.manage.vehicleLabel}</label>
        <Select id="l-vehicle" name="vehicleId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{lang === "ar" ? v.nameAr : v.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-amount">{t.admin.manage.investedAmountLabel}</label>
        <Input id="l-amount" name="investedAmount" inputMode="decimal" pattern="\d+(\.\d{1,4})?" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="l-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-pct">{t.admin.manage.ownershipPctLabel}</label>
        <Input id="l-pct" name="ownershipPct" inputMode="decimal" pattern="\d+(\.\d{1,4})?" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-date">{t.admin.manage.signedDateLabel}</label>
        <Input id="l-date" name="signedDate" type="date" required />
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
