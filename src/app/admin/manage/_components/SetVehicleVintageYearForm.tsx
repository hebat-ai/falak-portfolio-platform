"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { setVehicleVintageYearAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { AdminVehicleDTO } from "@/lib/admin/dto";

export function SetVehicleVintageYearForm({ vehicles }: { vehicles: AdminVehicleDTO[] }) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(setVehicleVintageYearAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="sv-vehicle">{t.admin.manage.vehicleLabel}</label>
        <Select id="sv-vehicle" name="vehicleId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{lang === "ar" ? v.nameAr : v.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="sv-vintageYear">{t.admin.manage.vintageYearLabel}</label>
        <Input id="sv-vintageYear" name="vintageYear" type="number" min={1990} max={2100} step={1} required />
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
