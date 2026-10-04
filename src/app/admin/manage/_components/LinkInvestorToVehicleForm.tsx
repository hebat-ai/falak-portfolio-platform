"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { linkInvestorToVehicleAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { AdminInvestorDTO, AdminVehicleDTO } from "@/lib/admin/dto";

export function LinkInvestorToVehicleForm({ investors, vehicles }: { investors: AdminInvestorDTO[]; vehicles: AdminVehicleDTO[] }) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(linkInvestorToVehicleAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="iv-investor">{t.admin.manage.investorLabel}</label>
        <Select id="iv-investor" name="investorId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {investors.map((i) => (
            <option key={i.id} value={i.id}>{lang === "ar" ? i.nameAr : i.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="iv-vehicle">{t.admin.manage.vehicleLabel}</label>
        <Select id="iv-vehicle" name="vehicleId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{lang === "ar" ? v.nameAr : v.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="iv-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="iv-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="iv-effectiveFrom">{t.admin.manage.effectiveFromLabel}</label>
        <Input id="iv-effectiveFrom" name="effectiveFrom" type="date" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="iv-commitment">{t.admin.manage.commitmentAmountLabel}</label>
        <Input id="iv-commitment" name="commitmentAmount" inputMode="decimal" pattern="\d+(\.\d{1,4})?" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="iv-pct">{t.admin.manage.ownershipPctLabel}</label>
        <Input id="iv-pct" name="ownershipPct" inputMode="decimal" pattern="\d+(\.\d{1,4})?" />
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
